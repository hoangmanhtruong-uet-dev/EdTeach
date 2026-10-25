// Fallback Store for Payment Orders when Supabase table 'payment_orders' hasn't been migrated yet

export interface FallbackPaymentOrder {
  id: string;
  user_id: string;
  order_code: string;
  amount: number;
  credits: number;
  status: "pending" | "paid" | "cancelled" | "expired";
  created_at: string;
  paid_at?: string;
  bank_id: string;
  account_no: string;
  account_name: string;
  qr_url: string;
}

declare global {
  // eslint-disable-next-line no-var
  var __fallbackPaymentOrders: Map<string, FallbackPaymentOrder> | undefined;
}

export const fallbackOrders: Map<string, FallbackPaymentOrder> =
  globalThis.__fallbackPaymentOrders || (globalThis.__fallbackPaymentOrders = new Map());

export function saveFallbackOrder(order: FallbackPaymentOrder) {
  fallbackOrders.set(order.order_code, order);
}

export function getFallbackOrder(orderCode: string): FallbackPaymentOrder | undefined {
  return fallbackOrders.get(orderCode);
}

export function markFallbackOrderPaid(orderCode: string): FallbackPaymentOrder | null {
  const order = fallbackOrders.get(orderCode);
  if (!order) return null;
  order.status = "paid";
  order.paid_at = new Date().toISOString();
  return order;
}
