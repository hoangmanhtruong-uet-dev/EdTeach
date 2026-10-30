-- ========================================================
-- EdTeach - Grading Sessions (Kỳ thi chấm trắc nghiệm OMR) Migration
-- Sprint MG-1: Dữ liệu vững & Lưu trữ đám mây bền vững
-- ========================================================

-- 1. BẢNG GRADING_SESSIONS
CREATE TABLE IF NOT EXISTS public.grading_sessions (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    subject TEXT NOT NULL DEFAULT 'Toán',
    grade TEXT NOT NULL DEFAULT '10',
    sheet_type TEXT NOT NULL DEFAULT '20',
    question_count INTEGER NOT NULL DEFAULT 20,
    answer_key JSONB NOT NULL DEFAULT '{}'::jsonb,
    exam_id UUID REFERENCES public.exams(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'in_progress', -- 'not_started', 'in_progress', 'completed'
    graded_students JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. INDEXES
CREATE INDEX IF NOT EXISTS idx_grading_sessions_user_id ON public.grading_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_grading_sessions_exam_id ON public.grading_sessions(exam_id);
CREATE INDEX IF NOT EXISTS idx_grading_sessions_updated_at ON public.grading_sessions(updated_at DESC);

-- 3. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.grading_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own grading sessions"
    ON public.grading_sessions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own grading sessions"
    ON public.grading_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own grading sessions"
    ON public.grading_sessions FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own grading sessions"
    ON public.grading_sessions FOR DELETE
    USING (auth.uid() = user_id);

-- 4. FUNCTION CẬP NHẬT UPDATED_AT TỰ ĐỘNG
CREATE OR REPLACE FUNCTION public.handle_grading_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_grading_sessions_updated_at
    BEFORE UPDATE ON public.grading_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_grading_sessions_updated_at();
