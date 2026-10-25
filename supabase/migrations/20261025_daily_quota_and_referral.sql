-- ========================================================
-- EduTest AI - Daily Quota, Viral Referral & Tier Migration
-- ========================================================

-- 1. Thêm referral_code và tier vào bảng users
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'school'));

-- 2. Thêm hạn mức hàng ngày (Daily Quota) vào bảng wallets
ALTER TABLE public.wallets 
ADD COLUMN IF NOT EXISTS daily_quota INTEGER NOT NULL DEFAULT 3,
ADD COLUMN IF NOT EXISTS daily_quota_used INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_quota_reset TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now());

-- 3. Bảng REFERRALS (Lịch sử giới thiệu đồng nghiệp)
CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inviter_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    invitee_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    reward_credits INTEGER NOT NULL DEFAULT 60, -- Tương đương 3 lượt tạo đề
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their referrals"
    ON public.referrals FOR SELECT
    USING (auth.uid() = inviter_id OR auth.uid() = invitee_id);

-- 4. Hàm sinh mã giới thiệu ngẫu nhiên (VD: EDU9X8K)
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    result TEXT := 'EDU';
    i INTEGER;
BEGIN
    FOR i IN 1..5 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 5. Cập nhật trigger handle_new_user để tự sinh referral_code
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_wallet_id UUID;
    ref_code TEXT;
BEGIN
    -- Sinh mã referral duy nhất
    ref_code := public.generate_referral_code();
    WHILE EXISTS (SELECT 1 FROM public.users WHERE referral_code = ref_code) LOOP
        ref_code := public.generate_referral_code();
    END LOOP;

    -- 1. Insert user profile
    INSERT INTO public.users (id, email, name, avatar_url, referral_code, tier)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', ''),
        ref_code,
        'free'
    );

    -- 2. Create user wallet với 3 lượt/ngày ban đầu và 100 credits quà tặng
    INSERT INTO public.wallets (user_id, balance, daily_quota, daily_quota_used, last_quota_reset)
    VALUES (NEW.id, 100, 3, 0, timezone('utc'::text, now()))
    RETURNING id INTO new_wallet_id;

    -- 3. Log transaction chào mừng
    INSERT INTO public.wallet_txns (wallet_id, amount, type, description)
    VALUES (
        new_wallet_id,
        100,
        'signup_bonus',
        'Quà tặng chào mừng thành viên mới (3 lượt tạo đề/ngày)'
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Gán mã referral cho các user hiện tại nếu chưa có
DO $$
DECLARE
    r RECORD;
    new_code TEXT;
BEGIN
    FOR r IN SELECT id FROM public.users WHERE referral_code IS NULL LOOP
        new_code := public.generate_referral_code();
        UPDATE public.users SET referral_code = new_code WHERE id = r.id;
    END LOOP;
END $$;
