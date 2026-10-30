-- ========================================================
-- EduTest AI - Chợ Đề Thi (EdTech Marketplace) Schema
-- Tables: marketplace_items, marketplace_purchases, payout_requests
-- ========================================================

CREATE TABLE IF NOT EXISTS public.marketplace_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    seller_name TEXT NOT NULL,
    seller_tier TEXT NOT NULL DEFAULT 'free',
    title TEXT NOT NULL,
    subject TEXT NOT NULL,
    grade INTEGER NOT NULL DEFAULT 10,
    description TEXT,
    price_credits INTEGER NOT NULL DEFAULT 0 CHECK (price_credits >= 0),
    question_count INTEGER NOT NULL DEFAULT 40,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    preview_data JSONB DEFAULT '[]'::jsonb,
    exam_data JSONB DEFAULT '{}'::jsonb,
    downloads_count INTEGER NOT NULL DEFAULT 0,
    rating NUMERIC(2,1) NOT NULL DEFAULT 5.0,
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'draft', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.marketplace_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES public.marketplace_items(id) ON DELETE CASCADE,
    price_credits INTEGER NOT NULL,
    commission_rate NUMERIC(3,2) NOT NULL DEFAULT 0.20,
    seller_earnings INTEGER NOT NULL,
    platform_fee INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.payout_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    amount_credits INTEGER NOT NULL,
    amount_vnd INTEGER NOT NULL,
    bank_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    account_holder TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    completed_at TIMESTAMPTZ
);

-- RLS Policies
ALTER TABLE public.marketplace_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published marketplace items"
    ON public.marketplace_items FOR SELECT USING (status = 'published');

CREATE POLICY "Sellers can manage their own marketplace items"
    ON public.marketplace_items FOR ALL USING (auth.uid() = seller_id);

CREATE POLICY "Buyers can view their own purchases"
    ON public.marketplace_purchases FOR SELECT USING (auth.uid() = buyer_id);

CREATE POLICY "Users can view their own payout requests"
    ON public.payout_requests FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create payout requests"
    ON public.payout_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
