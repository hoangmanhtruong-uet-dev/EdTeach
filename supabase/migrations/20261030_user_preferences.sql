-- ========================================================
-- EduTest AI - User Preferences & Phone Migration
-- ========================================================

-- 1. Bổ sung cột phone và preferences (JSONB) vào bảng public.users
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::jsonb;

-- 2. Đảm bảo chính sách RLS cho phép users cập nhật preferences của chính mình
DROP POLICY IF EXISTS "Users can update their own preferences" ON public.users;
CREATE POLICY "Users can update their own preferences"
    ON public.users FOR UPDATE
    USING (auth.uid() = id);
