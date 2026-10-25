import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

    // Tìm đơn hàng của chính user
    const { data: order, error: orderError } = await (supabase
      .from("payment_orders") as any)
      .select("*")
      .eq("order_code", order_code.trim().toUpperCase())
      .eq("user_id", user.id)
      .maybeSingle();

    if (orderError || !order) {
      return NextResponse.json(
        { error: "Không tìm thấy đơn hàng tương ứng." },
        { status: 404 }
      );
    }

    if (order.status === "paid") {
      return NextResponse.json({
        success: true,
        message: "Đơn hàng đã được thanh toán trước đó.",
      });
    }

    const nowIso = new Date().toISOString();

    // 1. Cập nhật đơn hàng sang 'paid'
    await (supabase.from("payment_orders") as any)
      .update({
        status: "paid",
        paid_at: nowIso,
        sepay_txn_id: "MOCK_SEPAY_" + Date.now(),
      })
      .eq("id", order.id);

    // 2. Lấy ví và cộng credits
    const { data: wallet } = await (supabase.from("wallets") as any)
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    let newBalance = order.credits;

    if (wallet) {
      newBalance = (wallet.balance || 0) + order.credits;
      await (supabase.from("wallets") as any)
        .update({
          balance: newBalance,
          updated_at: nowIso,
        })
        .eq("id", wallet.id);

      // 3. Ghi nhận giao dịch vào wallet_txns
      await (supabase.from("wallet_txns") as any).insert({
        wallet_id: wallet.id,
        amount: order.credits,
        type: "purchase",
        description: `[Test Mode] Nạp ${order.credits} credits thành công (Mã: ${order.order_code})`,
        ref_id: order.id,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Giả lập nạp thành công ${order.credits} credits!`,
      credits: order.credits,
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
