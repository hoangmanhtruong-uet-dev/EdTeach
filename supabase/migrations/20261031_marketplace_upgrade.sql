-- ========================================================
-- EduTest AI - Chợ Đề Thi (Marketplace) Upgrade Migration
-- Sprint MP-1: Single Source of Truth DB, RLS Fixes & Atomic RPC
-- ========================================================

-- 1. SỬA RLS CHO MARKETPLACE_PURCHASES VÀ PAYOUT_REQUESTS
ALTER TABLE public.marketplace_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;

-- Cho phép người mua ghi nhận lượt mua của chính mình
CREATE POLICY "Buyers can insert their own purchases"
    ON public.marketplace_purchases FOR INSERT
    WITH CHECK (auth.uid() = buyer_id);

-- Cho phép cập nhật trạng thái yêu cầu rút tiền
CREATE POLICY "Users can update their own pending payouts"
    ON public.payout_requests FOR UPDATE
    USING (auth.uid() = user_id AND status = 'pending');

-- 2. HÀM ATOMIC PURCHASE TRANSACTION (Postgres RPC SECURITY DEFINER)
-- Thực hiện toàn bộ giao dịch mua bán đề thi trong 1 transaction an toàn
CREATE OR REPLACE FUNCTION public.marketplace_purchase_item(
    p_item_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_buyer_id UUID;
    v_item RECORD;
    v_buyer_wallet RECORD;
    v_seller_wallet RECORD;
    v_seller_tier TEXT;
    v_commission_rate NUMERIC(3,2);
    v_platform_fee INTEGER;
    v_seller_earnings INTEGER;
    v_existing_purchase RECORD;
    v_new_purchase_id UUID;
    v_buyer_new_balance INTEGER;
BEGIN
    -- 1. Xác thực người mua
    v_buyer_id := auth.uid();
    IF v_buyer_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'UNAUTHORIZED', 'message', 'Bạn cần đăng nhập để mua đề thi.');
    END IF;

    -- 2. Khóa và lấy thông tin đề thi
    SELECT * INTO v_item 
    FROM public.marketplace_items 
    WHERE id = p_item_id AND status = 'published'
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'ITEM_NOT_FOUND', 'message', 'Đề thi không tồn tại hoặc đã bị gỡ khỏi chợ.');
    END IF;

    -- 3. Kiểm tra người mua không phải là tác giả
    IF v_item.seller_id = v_buyer_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'CANNOT_BUY_OWN_ITEM', 'message', 'Thầy/Cô là tác giả của đề thi này, không cần mua.');
    END IF;

    -- 4. Kiểm tra xem đã sở hữu đề thi này chưa (Idempotent)
    SELECT * INTO v_existing_purchase
    FROM public.marketplace_purchases
    WHERE buyer_id = v_buyer_id AND item_id = p_item_id;

    IF FOUND THEN
        RETURN jsonb_build_object(
            'success', true, 
            'already_owned', true, 
            'message', 'Thầy/Cô đã sở hữu đề thi này trước đó.',
            'purchase_id', v_existing_purchase.id,
            'price_credits', v_existing_purchase.price_credits
        );
    END IF;

    -- 5. Xử lý theo giá bán
    IF v_item.price_credits = 0 THEN
        -- Đề thi Miễn phí (0 credits)
        INSERT INTO public.marketplace_purchases (
            buyer_id, item_id, price_credits, commission_rate, seller_earnings, platform_fee
        ) VALUES (
            v_buyer_id, p_item_id, 0, 0, 0, 0
        ) RETURNING id INTO v_new_purchase_id;

        -- Tăng số lượt tải
        UPDATE public.marketplace_items
        SET downloads_count = downloads_count + 1
        WHERE id = p_item_id;

        RETURN jsonb_build_object(
            'success', true,
            'already_owned', false,
            'message', 'Nhận đề thi miễn phí thành công!',
            'purchase_id', v_new_purchase_id,
            'price_credits', 0
        );
    ELSE
        -- Đề thi Trả phí (price_credits > 0)
        -- 5.1. Khóa ví người mua để kiểm tra số dư
        SELECT * INTO v_buyer_wallet
        FROM public.wallets
        WHERE user_id = v_buyer_id
        FOR UPDATE;

        IF NOT FOUND OR v_buyer_wallet.balance < v_item.price_credits THEN
            RETURN jsonb_build_object(
                'success', false, 
                'error', 'INSUFFICIENT_BALANCE', 
                'message', 'Số dư ví credits không đủ để mua đề thi.',
                'required', v_item.price_credits,
                'current_balance', COALESCE(v_buyer_wallet.balance, 0)
            );
        END IF;

        -- 5.2. Tính toán hoa hồng theo 3 bậc cấp bậc người bán (Sprint MP-1 Fix U7)
        v_seller_tier := LOWER(COALESCE(v_item.seller_tier, 'free'));
        IF v_seller_tier = 'max' THEN
            v_commission_rate := 0.05; -- MAX VIP: Sàn thu 5%, tác giả nhận 95%
        ELSIF v_seller_tier = 'pro' THEN
            v_commission_rate := 0.10; -- PRO: Sàn thu 10%, tác giả nhận 90%
        ELSE
            v_commission_rate := 0.20; -- FREE: Sàn thu 20%, tác giả nhận 80%
        END IF;

        v_platform_fee := ROUND(v_item.price_credits * v_commission_rate);
        v_seller_earnings := v_item.price_credits - v_platform_fee;

        -- 5.3. Trừ tiền ví người mua
        v_buyer_new_balance := v_buyer_wallet.balance - v_item.price_credits;
        UPDATE public.wallets
        SET balance = v_buyer_new_balance, updated_at = timezone('utc'::text, now())
        WHERE id = v_buyer_wallet.id;

        -- Ghi lịch sử giao dịch người mua
        INSERT INTO public.wallet_txns (
            wallet_id, amount, type, description, created_at
        ) VALUES (
            v_buyer_wallet.id, -v_item.price_credits, 'marketplace_buy', 
            'Mua đề thi: ' || v_item.title, timezone('utc'::text, now())
        );

        -- 5.4. Cộng tiền ví người bán (nếu có seller_id)
        IF v_item.seller_id IS NOT NULL THEN
            INSERT INTO public.wallets (user_id, balance, updated_at)
            VALUES (v_item.seller_id, v_seller_earnings, timezone('utc'::text, now()))
            ON CONFLICT (user_id) DO UPDATE 
            SET balance = public.wallets.balance + v_seller_earnings,
                updated_at = timezone('utc'::text, now())
            RETURNING id INTO v_seller_wallet.id;

            -- Ghi lịch sử giao dịch người bán
            INSERT INTO public.wallet_txns (
                wallet_id, amount, type, description, created_at
            ) VALUES (
                v_seller_wallet.id, v_seller_earnings, 'marketplace_sell', 
                'Bán đề thi: ' || v_item.title || ' (Đã trừ ' || (v_commission_rate * 100)::INTEGER || '% phí sàn)',
                timezone('utc'::text, now())
            );
        END IF;

        -- 5.5. Ghi nhận lượt mua
        INSERT INTO public.marketplace_purchases (
            buyer_id, item_id, price_credits, commission_rate, seller_earnings, platform_fee
        ) VALUES (
            v_buyer_id, p_item_id, v_item.price_credits, v_commission_rate, v_seller_earnings, v_platform_fee
        ) RETURNING id INTO v_new_purchase_id;

        -- 5.6. Tăng số lượt tải
        UPDATE public.marketplace_items
        SET downloads_count = downloads_count + 1
        WHERE id = p_item_id;

        RETURN jsonb_build_object(
            'success', true,
            'already_owned', false,
            'message', 'Giao dịch mua đề thi thành công!',
            'purchase_id', v_new_purchase_id,
            'price_credits', v_item.price_credits,
            'new_balance', v_buyer_new_balance
        );
    END IF;
END;
$$;

-- 3. SEED CURATED EXAMS (Chuẩn GDPT 2025 - Toán, Lý, Hóa, Sinh)
INSERT INTO public.marketplace_items (
    id, seller_id, seller_name, seller_tier, title, subject, grade, description,
    price_credits, question_count, tags, downloads_count, rating, review_count, status, created_at
) VALUES 
(
    '00000000-0000-4000-8000-000000000001',
    'a0000000-0000-4000-8000-000000000001',
    'Thầy Vũ Tuấn Anh',
    'pro',
    'Đề thi thử Tốt nghiệp THPT 2025 Môn Toán - Chuẩn Cấu trúc 3 Phần',
    'Toán',
    12,
    'Đề thi mẫu chuẩn cấu trúc 3 phần mới nhất của Bộ GD&ĐT: Phần I (12 câu trắc nghiệm 4 lựa chọn), Phần II (4 câu Đúng/Sai 4 ý) và Phần III (6 câu Trả lời ngắn). Có lời giải chi tiết và ma trận đặc tả.',
    0,
    22,
    ARRAY['GDPT 2025', 'THPT Quốc Gia', 'Toán 12', 'Đúng Sai', 'Trả lời ngắn'],
    148,
    4.9,
    18,
    'published',
    timezone('utc'::text, now()) - interval '3 days'
),
(
    '00000000-0000-4000-8000-000000000002',
    'a0000000-0000-4000-8000-000000000002',
    'Cô Nguyễn Bích Trâm',
    'max',
    'Bộ Đề Vận Dụng Cao Vật Lý 12 - Chuyên đề Sóng Cơ & Giao Thoa Sóng',
    'Vật lý',
    12,
    'Tuyển tập 28 câu hỏi vận dụng cao bám sát thực tiễn đời sống và thí nghiệm vật lý. Kèm video giải đa cách và mẹo nhớ 15s phục vụ giáo viên dạy đội tuyển và dạy thêm.',
    500,
    28,
    ARRAY['Vận dụng cao', 'Vật lý 12', 'Sóng cơ', 'Thí nghiệm thực hành', 'MAX VIP'],
    62,
    5.0,
    12,
    'published',
    timezone('utc'::text, now()) - interval '5 days'
),
(
    '00000000-0000-4000-8000-000000000003',
    'a0000000-0000-4000-8000-000000000003',
    'Thầy Đỗ Văn Sang',
    'pro',
    'Đề Khảo Sát Hóa Học 12 GDPT 2025 - Chuyên đề Este, Lipit & Hợp Chất Nitơ',
    'Hóa học',
    12,
    'Bộ câu hỏi Đúng/Sai và Trả lời ngắn có liên hệ phòng thí nghiệm 3D và bài toán thực tế sản xuất xà phòng, mỡ động thực vật. Barem điểm rõ ràng 100%.',
    300,
    24,
    ARRAY['Hóa học 12', 'Este Lipit', 'GDPT 2025', 'Đúng Sai', 'Phòng TN 3D'],
    95,
    4.8,
    15,
    'published',
    timezone('utc'::text, now()) - interval '7 days'
),
(
    '00000000-0000-4000-8000-000000000004',
    'a0000000-0000-4000-8000-000000000004',
    'Cô Lê Hoàng Yến',
    'free',
    'Đề Ôn Tập Sinh Học 12 - Cơ Chế Di Truyền & Biến Dị Cấp Tế Bào',
    'Sinh học',
    12,
    'Bộ 20 câu hỏi trọng tâm ôn tập thi giữa kỳ I bám sát chương trình sách giáo khoa mới (Kết nối tri thức, Chân trời sáng tạo, Cánh diều).',
    0,
    20,
    ARRAY['Sinh học 12', 'Di truyền', 'Giữa kỳ I', 'SGK Mới', 'Miễn phí'],
    215,
    4.7,
    29,
    'published',
    timezone('utc'::text, now()) - interval '10 days'
)
ON CONFLICT (id) DO NOTHING;
