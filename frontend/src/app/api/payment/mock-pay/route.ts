import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getFallbackOrder, markFallbackOrderPaid } from "@/lib/payment/payment-fallback-store";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
    }

    const body = await req.json();
    const { order_code } = body;

    if (!order_code) {
      return NextResponse.json(
        { error: "Thiếu mã đơn hàng." },
        { status: 400 }
      );
    }

    const cleanCode = order_code.trim().toUpperCase();
    let orderCredits = 100;
    let orderId = "";

    // 1. Thử tìm trong Supabase
    let orderFoundInDb = false;
    try {
      const { data: order } = await (supabase
        .from("payment_orders") as any)
        .select("*")
        .eq("order_code", cleanCode)
        .eq("user_id", user.id)
        .maybeSingle();

      if (order) {
        orderFoundInDb = true;
        orderCredits = order.credits;
        orderId = order.id;

        if (order.status === "paid") {
          return NextResponse.json({
            success: true,
            message: "Đơn hàng đã được thanh toán trước đó.",
          });
        }

        const nowIso = new Date().toISOString();
        await (supabase.from("payment_orders") as any)
          .update({
            status: "paid",
            paid_at: nowIso,
            sepay_txn_id: "MOCK_SEPAY_" + Date.now(),
          })
          .eq("id", order.id);
      }
    } catch {
      orderFoundInDb = false;
    }

    // 2. Nếu không có trong DB thì kiểm tra fallback store
    if (!orderFoundInDb) {
      const fbOrder = getFallbackOrder(cleanCode);
      if (fbOrder) {
        orderCredits = fbOrder.credits;
        orderId = fbOrder.id;
        markFallbackOrderPaid(cleanCode);
      } else {
        return NextResponse.json(
          { error: "Không tìm thấy đơn hàng tương ứng." },
          { status: 404 }
        );
      }
    }

    const nowIso = new Date().toISOString();

    // 3. Cập nhật số dư ví trong Supabase
    let newBalance = orderCredits;
    try {
      const { data: wallet } = await (supabase.from("wallets") as any)
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (wallet) {
        newBalance = (wallet.balance || 0) + orderCredits;
        await (supabase.from("wallets") as any)
          .update({
            balance: newBalance,
            updated_at: nowIso,
          })
          .eq("id", wallet.id);

        try {
          await (supabase.from("wallet_txns") as any).insert({
            wallet_id: wallet.id,
            amount: orderCredits,
            type: "purchase",
            description: `[Test Mode] Nạp ${orderCredits} credits thành công (Mã: ${cleanCode})`,
            ref_id: orderId,
          });
        } catch {
          // ignore txn log failure
        }
      }
    } catch {
      newBalance = orderCredits;
    }

    return NextResponse.json({
      success: true,
      message: `Giả lập nạp thành công ${orderCredits} credits!`,
      credits: orderCredits,
      new_balance: newBalance,
    });
  } catch (err: any) {
    console.error("Mock pay error:", err);
    return NextResponse.json(
      { error: err.message || "Lỗi giả lập thanh toán." },
      { status: 500 }
    );
  }
}
