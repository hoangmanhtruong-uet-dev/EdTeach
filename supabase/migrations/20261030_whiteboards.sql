-- ========================================================
-- EdTeach - Whiteboards (Bảng trắng tương tác) Migration
-- ========================================================

-- 1. BẢNG WHITEBOARDS
CREATE TABLE IF NOT EXISTS public.whiteboards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Bảng vẽ chưa đặt tên',
    description TEXT,
    elements JSONB NOT NULL DEFAULT '[]'::jsonb,
    app_state JSONB NOT NULL DEFAULT '{}'::jsonb,
    thumbnail_url TEXT,
    is_favorite BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. INDEXES
CREATE INDEX IF NOT EXISTS idx_whiteboards_user_id ON public.whiteboards(user_id);
CREATE INDEX IF NOT EXISTS idx_whiteboards_updated_at ON public.whiteboards(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_whiteboards_favorite ON public.whiteboards(user_id, is_favorite);

-- 3. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.whiteboards ENABLE ROW LEVEL SECURITY;

-- Người dùng toàn quyền SELECT, INSERT, UPDATE, DELETE bảng vẽ của chính mình
CREATE POLICY "Users can view their own whiteboards"
    ON public.whiteboards FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own whiteboards"
    ON public.whiteboards FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own whiteboards"
    ON public.whiteboards FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own whiteboards"
    ON public.whiteboards FOR DELETE
    USING (auth.uid() = user_id);

-- 4. FUNCTION CẬP NHẬT UPDATED_AT TỰ ĐỘNG
CREATE OR REPLACE FUNCTION public.handle_whiteboards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_whiteboards_updated_at
    BEFORE UPDATE ON public.whiteboards
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_whiteboards_updated_at();
