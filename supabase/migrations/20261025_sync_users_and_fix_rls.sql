-- ========================================================
-- ALL-IN-ONE FIX: BỔ SUNG CỘT CÒN THIẾU & ĐỒNG BỘ TÀI KHOẢN
-- Copy và dán toàn bộ đoạn này vào Supabase SQL Editor rồi bấm RUN
-- ========================================================

-- 1. Bổ sung các cột mới vào bảng public.users (nếu chưa có)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'school'));

-- 2. Bổ sung các cột hạn mức ngày vào bảng public.wallets (nếu chưa có)
ALTER TABLE public.wallets 
ADD COLUMN IF NOT EXISTS daily_quota INTEGER NOT NULL DEFAULT 3,
ADD COLUMN IF NOT EXISTS daily_quota_used INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_quota_reset TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now());

-- 3. Cấp quyền RLS để user tự động thêm profile và ví
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
CREATE POLICY "Users can insert their own profile"
    ON public.users FOR INSERT
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY "Users can update their own profile"
    ON public.users FOR UPDATE
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own wallet" ON public.wallets;
CREATE POLICY "Users can insert their own wallet"
    ON public.wallets FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own wallet" ON public.wallets;
CREATE POLICY "Users can update their own wallet"
    ON public.wallets FOR UPDATE
    USING (auth.uid() = user_id);

-- 4. Đồng bộ tất cả tài khoản từ auth.users sang public.users
INSERT INTO public.users (id, email, name, avatar_url, role, referral_code, tier)
SELECT 
    au.id, 
    COALESCE(au.email, 'teacher@eduteach.vn'),
    COALESCE(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', split_part(au.email, '@', 1), 'Thầy Cô'),
    COALESCE(au.raw_user_meta_data->>'avatar_url', au.raw_user_meta_data->>'picture', ''),
    'teacher',
    'EDU' || upper(substr(replace(au.id::text, '-', ''), 1, 5)),
    'free'
FROM auth.users au
ON CONFLICT (id) DO NOTHING;

-- 5. Tạo ví và cấp hạn mức cho toàn bộ tài khoản
INSERT INTO public.wallets (user_id, balance, daily_quota, daily_quota_used, last_quota_reset)
SELECT 
    pu.id,
    100,
    3,
    0,
    timezone('utc'::text, now())
FROM public.users pu
ON CONFLICT (user_id) DO NOTHING;

-- 6. Trigger tự động chạy cho mọi tài khoản đăng ký sau này
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    ref_code TEXT;
BEGIN
    ref_code := 'EDU' || upper(substr(replace(NEW.id::text, '-', ''), 1, 5));

    INSERT INTO public.users (id, email, name, avatar_url, referral_code, tier, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.email, 'teacher@eduteach.vn'),
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1), 'Thầy Cô'),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', ''),
        ref_code,
        'free',
        'teacher'
    )
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.wallets (user_id, balance, daily_quota, daily_quota_used, last_quota_reset)
    VALUES (NEW.id, 100, 3, 0, timezone('utc'::text, now()))
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
