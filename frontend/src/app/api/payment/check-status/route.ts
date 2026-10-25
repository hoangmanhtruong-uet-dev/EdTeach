import { NextRequest, NextResponse, connection } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

    // Truy vấn trạng thái đơn hàng
    const { data: order, error: orderError } = await (supabase
      .from("payment_orders") as any)
      .select("*")
      .eq("order_code", orderCode)
      .eq("user_id", user.id)
      .maybeSingle();

    if (orderError || !order) {
      return NextResponse.json(
        { error: "Không tìm thấy đơn hàng tương ứng." },
        { status: 404 }
      );
    }

    // Lấy số dư ví mới nhất
    const { data: wallet } = await (supabase.from("wallets") as any)
      .select("balance")
      .eq("user_id", user.id)
      .maybeSingle();

    return NextResponse.json({
      success: true,
      order_code: order.order_code,
      status: order.status,
      amount: order.amount,
      credits: order.credits,
      paid_at: order.paid_at,
      current_balance: wallet?.balance ?? 0,
    });
  } catch (err: any) {
    console.error("Check order status error:", err);
    return NextResponse.json(
      { error: err.message || "Lỗi kiểm tra trạng thái đơn nạp." },
      { status: 500 }
    );
  }
}
