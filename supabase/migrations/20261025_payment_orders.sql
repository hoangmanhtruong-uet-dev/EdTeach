-- ========================================================
-- EduTest AI - Payment Orders & VietQR/SePay Integration
-- ========================================================

-- 1. Bảng PAYMENT_ORDERS (Đơn nạp tiền qua VietQR/SePay)
CREATE TABLE IF NOT EXISTS public.payment_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    order_code TEXT NOT NULL UNIQUE,
    amount INTEGER NOT NULL,               -- Số tiền VNĐ (VD: 49000, 89000, 159000)
    credits INTEGER NOT NULL,              -- Số credits nhận được (VD: 50, 100, 200)
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled', 'expired')),
    sepay_txn_id TEXT,                    -- Mã giao dịch ngân hàng từ SePay
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    paid_at TIMESTAMPTZ
);

-- 2. INDEXES
CREATE INDEX IF NOT EXISTS idx_payment_orders_user_id ON public.payment_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_order_code ON public.payment_orders(order_code);
CREATE INDEX IF NOT EXISTS idx_payment_orders_status ON public.payment_orders(status);

-- 3. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.payment_orders ENABLE ROW LEVEL SECURITY;

-- Người dùng có thể xem đơn hàng của chính mình
CREATE POLICY "Users can view their own payment orders"
    ON public.payment_orders FOR SELECT
    USING (auth.uid() = user_id);

-- Người dùng có thể tạo đơn hàng mới cho chính mình
CREATE POLICY "Users can create payment orders"
    ON public.payment_orders FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Cho phép cập nhật đơn hàng
CREATE POLICY "Users can update their own pending payment orders"
    ON public.payment_orders FOR UPDATE
    USING (auth.uid() = user_id);
