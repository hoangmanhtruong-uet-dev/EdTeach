-- ========================================================
-- EduTest AI - Security Hardening Migration
-- 1. Khóa toàn bộ quyền sửa ví và nâng quyền trái phép qua RLS
-- 2. Ngăn chặn thao túng trạng thái đơn hàng (payment_orders)
-- 3. Cung cấp hàm trừ credits nguyên tử (Atomic Deduction - chống Race Condition)
-- ========================================================

-- 1. BẢO VỆ BẢNG WALLETS: Thu hồi quyền sửa/thêm trực tiếp từ Client
DROP POLICY IF EXISTS "Users can update their own wallet" ON public.wallets;
DROP POLICY IF EXISTS "Users can insert their own wallet" ON public.wallets;

-- Chỉ cho phép người dùng xem số dư ví của chính mình
DROP POLICY IF EXISTS "Users can view their own wallet" ON public.wallets;
CREATE POLICY "Users can view their own wallet"
    ON public.wallets FOR SELECT
    USING (auth.uid() = user_id);

-- 2. BẢO VỆ BẢNG USERS: Ngăn người dùng tự phong quyền (role: admin) hoặc tự nâng hạng (tier: pro/school)
CREATE OR REPLACE FUNCTION public.prevent_user_privilege_escalation()
RETURNS TRIGGER AS $$
BEGIN
    -- Nếu không phải là service_role (backend/trigger), không cho phép sửa role, tier, referral_code
    IF current_user <> 'service_role' AND (auth.jwt()->>'role') IS DISTINCT FROM 'service_role' THEN
        NEW.role := OLD.role;
        NEW.tier := OLD.tier;
        NEW.referral_code := OLD.referral_code;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_prevent_user_privilege_escalation ON public.users;
CREATE TRIGGER trg_prevent_user_privilege_escalation
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.prevent_user_privilege_escalation();

-- Cập nhật policy cho Users: Chỉ cho phép sửa hồ sơ cơ bản
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY "Users can update their own profile"
    ON public.users FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- 3. BẢO VỆ BẢNG PAYMENT_ORDERS: Thu hồi quyền sửa status thành 'paid' từ Client
DROP POLICY IF EXISTS "Users can update their own pending payment orders" ON public.payment_orders;
DROP POLICY IF EXISTS "Users can create payment orders" ON public.payment_orders;

-- Người dùng chỉ được tạo đơn với status ban đầu là 'pending'
CREATE POLICY "Users can create pending payment orders"
    ON public.payment_orders FOR INSERT
    WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- 4. HÀM TRỪ CREDITS NGUYÊN TỬ (Atomic Credit Deduction)
-- Khóa dòng (Row Lock) chống Race Condition / Double-spending khi nhiều request tạo đề diễn ra cùng lúc
CREATE OR REPLACE FUNCTION public.deduct_user_credits(
    p_user_id UUID,
    p_amount INTEGER,
    p_description TEXT DEFAULT '',
    p_ref_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_balance INTEGER;
    v_wallet_id UUID;
    v_new_balance INTEGER;
BEGIN
    -- Khóa hàng ví của user bằng FOR UPDATE để loại bỏ triệt để Race Condition
    SELECT id, balance INTO v_wallet_id, v_balance
    FROM public.wallets
    WHERE user_id = p_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'WALLET_NOT_FOUND');
    END IF;

    IF v_balance < p_amount THEN
        RETURN jsonb_build_object('success', false, 'error', 'INSUFFICIENT_CREDITS', 'balance', v_balance);
    END IF;

    v_new_balance := v_balance - p_amount;

    UPDATE public.wallets
    SET balance = v_new_balance,
        updated_at = timezone('utc'::text, now())
    WHERE id = v_wallet_id;

    IF p_amount > 0 THEN
        INSERT INTO public.wallet_txns (wallet_id, amount, type, description, ref_id)
        VALUES (v_wallet_id, -p_amount, 'generate_exam', p_description, p_ref_id);
    END IF;

    RETURN jsonb_build_object('success', true, 'balance', v_new_balance, 'deducted', p_amount);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.deduct_user_credits TO authenticated, service_role;
