-- ========================================================
-- EduTest AI - Initial Schema Migration
-- Tables: users, wallets, wallet_txns, exams, questions
-- RLS, Triggers (Auto create user & wallet with 5000 credits bonus)
-- ========================================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. BẢNG USERS (Public Profile ánh xạ từ auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    role TEXT NOT NULL DEFAULT 'teacher' CHECK (role IN ('teacher', 'student', 'admin')),
    school TEXT,
    avatar_url TEXT,
    referral_code TEXT UNIQUE,
    referred_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'school')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. BẢNG WALLETS
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
    daily_quota INTEGER NOT NULL DEFAULT 3,
    daily_quota_used INTEGER NOT NULL DEFAULT 0,
    last_quota_reset TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. BẢNG WALLET_TXNS (Lịch sử giao dịch ví)
CREATE TABLE IF NOT EXISTS public.wallet_txns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL, -- Dương: nạp/cộng thưởng, Âm: tiêu credit
    type TEXT NOT NULL CHECK (type IN ('signup_bonus', 'generate_exam', 'export', 'purchase', 'refund')),
    description TEXT,
    ref_id UUID, -- Liên kết tới exam_id hoặc payment_id
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. BẢNG EXAMS (Đề thi)
CREATE TABLE IF NOT EXISTS public.exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    grade TEXT NOT NULL,
    chapter TEXT,
    config JSONB DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'generating', 'completed', 'failed')),
    credit_cost INTEGER NOT NULL DEFAULT 0,
    question_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. BẢNG QUESTIONS (Câu hỏi trong đề)
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('multiple_choice', 'true_false', 'essay', 'fill_blank')),
    content TEXT NOT NULL,
    options JSONB, -- {"A": "...", "B": "...", "C": "...", "D": "..."}
    correct_answer TEXT,
    explanation TEXT,
    difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard', 'very_hard')),
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON public.wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_txns_wallet_id ON public.wallet_txns(wallet_id);
CREATE INDEX IF NOT EXISTS idx_exams_user_id ON public.exams(user_id);
CREATE INDEX IF NOT EXISTS idx_questions_exam_id ON public.questions(exam_id);

-- ========================================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_txns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- Policies for USERS
CREATE POLICY "Users can view their own profile"
    ON public.users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.users FOR UPDATE
    USING (auth.uid() = id);

-- Policies for WALLETS
CREATE POLICY "Users can view their own wallet"
    ON public.wallets FOR SELECT
    USING (auth.uid() = user_id);

-- Policies for WALLET_TXNS
CREATE POLICY "Users can view transactions of their own wallet"
    ON public.wallet_txns FOR SELECT
    USING (
        wallet_id IN (
            SELECT id FROM public.wallets WHERE user_id = auth.uid()
        )
    );

-- Policies for EXAMS
CREATE POLICY "Users can view their own exams"
    ON public.exams FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own exams"
    ON public.exams FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own exams"
    ON public.exams FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own exams"
    ON public.exams FOR DELETE
    USING (auth.uid() = user_id);

-- Policies for QUESTIONS (Join qua bảng exams)
CREATE POLICY "Users can view questions of their exams"
    ON public.questions FOR SELECT
    USING (
        exam_id IN (
            SELECT id FROM public.exams WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert questions to their exams"
    ON public.questions FOR INSERT
    WITH CHECK (
        exam_id IN (
            SELECT id FROM public.exams WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update questions of their exams"
    ON public.questions FOR UPDATE
    USING (
        exam_id IN (
            SELECT id FROM public.exams WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete questions of their exams"
    ON public.questions FOR DELETE
    USING (
        exam_id IN (
            SELECT id FROM public.exams WHERE user_id = auth.uid()
        )
    );

-- ========================================================
-- TRIGGERS: Tự động khởi tạo user profile & ví thưởng 5000 credits
-- ========================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_wallet_id UUID;
BEGIN
    -- 1. Insert user profile
    INSERT INTO public.users (id, email, name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', '')
    );

    -- 2. Create user wallet với 5000 credits ban đầu
    INSERT INTO public.wallets (user_id, balance)
    VALUES (NEW.id, 5000)
    RETURNING id INTO new_wallet_id;

    -- 3. Log transaction tặng 5000 credits
    INSERT INTO public.wallet_txns (wallet_id, amount, type, description)
    VALUES (
        new_wallet_id,
        5000,
        'signup_bonus',
        'Quà tặng chào mừng thành viên mới (5,000 credits)'
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Gắn trigger vào auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();