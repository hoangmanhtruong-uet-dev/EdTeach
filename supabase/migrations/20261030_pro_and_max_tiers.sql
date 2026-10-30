-- ========================================================
-- EduTest AI - PRO & MAX Tiers Migration
-- ========================================================

-- Cập nhật check constraint của bảng public.users để cho phép 'max' tier
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_tier_check;
ALTER TABLE public.users ADD CONSTRAINT users_tier_check CHECK (tier IN ('free', 'pro', 'max', 'school'));
