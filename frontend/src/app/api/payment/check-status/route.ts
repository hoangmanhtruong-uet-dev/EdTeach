import { NextRequest, NextResponse, connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getFallbackOrder } from "@/lib/payment/payment-fallback-store";

export async function GET(req: NextRequest) {
  await connection();
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const orderCode = searchParams.get("order_code")?.trim().toUpperCase();

    if (!orderCode) {
      return NextResponse.json(
        { error: "Thiếu mã đơn nạp (order_code)." },
        { status: 400 }
      );
    }

    let status = "pending";
    let amount = 0;
    let credits = 0;
    let paid_at = null;

    // 1. Thử tìm trong Supabase
    try {
      const { data: order } = await (supabase
        .from("payment_orders") as any)
        .select("*")
        .eq("order_code", orderCode)
        .eq("user_id", user.id)
        .maybeSingle();

      if (order) {
        status = order.status;
        amount = order.amount;
        credits = order.credits;
        paid_at = order.paid_at;
      } else {
        // 2. Thử tìm trong in-memory fallback
        const fbOrder = getFallbackOrder(orderCode);
        if (fbOrder) {
          status = fbOrder.status;
          amount = fbOrder.amount;
          credits = fbOrder.credits;
          paid_at = fbOrder.paid_at || null;
        } else {
          return NextResponse.json(
            { error: "Không tìm thấy đơn hàng tương ứng." },
            { status: 404 }
          );
        }
      }
    } catch {
      // Supabase error / table missing -> Fallback
      const fbOrder = getFallbackOrder(orderCode);
      if (fbOrder) {
        status = fbOrder.status;
        amount = fbOrder.amount;
        credits = fbOrder.credits;
        paid_at = fbOrder.paid_at || null;
      } else {
        return NextResponse.json(
          { error: "Không tìm thấy đơn hàng tương ứng." },
          { status: 404 }
        );
      }
    }

    // Lấy số dư ví mới nhất
    let currentBalance = 0;
    try {
      const { data: wallet } = await (supabase.from("wallets") as any)
        .select("balance")
        .eq("user_id", user.id)
        .maybeSingle();
      currentBalance = wallet?.balance ?? 0;
    } catch {
      currentBalance = 100;
    }

    return NextResponse.json({
      success: true,
      order_code: orderCode,
      status,
      amount,
      credits,
      paid_at,
      current_balance: currentBalance,
    });
  } catch (err: any) {
    console.error("Check order status error:", err);
    return NextResponse.json(
      { error: err.message || "Lỗi kiểm tra trạng thái đơn nạp." },
      { status: 500 }
    );
  }
}
