import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "";
  return createClient(url, key);
}

export async function POST(req: NextRequest) {
  try {
    // 1. Kiểm tra xác thực SePay API Key bắt buộc (BẢO MẬT: Chặn bypass nếu chưa cấu hình KEY)
    const expectedApiKey = process.env.SEPAY_API_KEY?.trim();
    if (!expectedApiKey) {
      console.warn("SePay webhook invoked but SEPAY_API_KEY is not configured.");
      return NextResponse.json(
        { error: "Cổng SePay webhook hiện chưa được kích hoạt hoặc chưa cấu hình API Key." },
        { status: 403 }
      );
    }

    const authHeader = req.headers.get("authorization") || "";
    const isApiKeyMatch =
      authHeader.includes(expectedApiKey) ||
      authHeader === `Apikey ${expectedApiKey}` ||
      authHeader === `Bearer ${expectedApiKey}`;

    if (!isApiKeyMatch) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid SePay API Key" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      id: sepayTxnId,
      content,
      description,
      transferType,
      transferAmount,
    } = body;

    // Chỉ xử lý giao dịch tiền vào (tiền cộng vào tài khoản)
    if (transferType && transferType !== "in") {
      return NextResponse.json({
        success: true,
        message: "Ignored: transferType is not 'in'",
      });
    }

    const textToScan = `${content || ""} ${description || ""}`.toUpperCase();

    // 2. Trích xuất mã đơn EDUPAY...
    const match = textToScan.match(/EDUPAY[A-Z0-9]{4,8}/);
    if (!match) {
      return NextResponse.json({
        success: true,
        message: "Ignored: No EDUPAY order code found in payment description",
      });
    }

    const orderCode = match[0];
    const supabase = getServiceSupabase();

    // 3. Tìm đơn hàng tương ứng
    const { data: order, error: orderError } = await (supabase
      .from("payment_orders") as any)
      .select("*")
      .eq("order_code", orderCode)
      .maybeSingle();

    if (orderError || !order) {
      return NextResponse.json(
        { error: `Order ${orderCode} not found in database.` },
        { status: 404 }
      );
    }

    // Nếu đơn đã được xử lý trước đó (idempotent)
    if (order.status === "paid") {
      return NextResponse.json({
        success: true,
        message: `Order ${orderCode} was already fulfilled.`,
      });
    }

    // 4. Kiểm tra số tiền nhận được so với giá trị đơn hàng
    const amountReceived = parseInt(transferAmount, 10) || 0;
    if (amountReceived < order.amount) {
      console.warn(
        `Order ${orderCode}: Received amount ${amountReceived} is less than required ${order.amount}`
      );
      return NextResponse.json(
        {
          error: `Số tiền chuyển (${amountReceived}) nhỏ hơn giá trị đơn (${order.amount})`,
        },
        { status: 400 }
      );
    }

    // 5. Cập nhật trạng thái đơn sang 'paid'
    const nowIso = new Date().toISOString();
    await (supabase.from("payment_orders") as any)
      .update({
        status: "paid",
        paid_at: nowIso,
        sepay_txn_id: sepayTxnId ? String(sepayTxnId) : null,
      })
      .eq("id", order.id);

    // 6. Lấy ví của user và cộng credits
    const { data: wallet } = await (supabase.from("wallets") as any)
      .select("*")
      .eq("user_id", order.user_id)
      .maybeSingle();

    if (wallet) {
      const newBalance = (wallet.balance || 0) + order.credits;

      await (supabase.from("wallets") as any)
        .update({
          balance: newBalance,
          updated_at: nowIso,
        })
        .eq("id", wallet.id);

      // 7. Ghi nhận lịch sử giao dịch vào wallet_txns
      await (supabase.from("wallet_txns") as any).insert({
        wallet_id: wallet.id,
        amount: order.credits,
        type: "purchase",
        description: `Nạp ${order.credits} credits qua VietQR/SePay (Mã: ${order.order_code})`,
        ref_id: order.id,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Đã nạp thành công ${order.credits} credits cho đơn hàng ${order.order_code}.`,
    });
  } catch (err: any) {
    console.error("SePay webhook processing error:", err);
    return NextResponse.json(
      { error: err.message || "Lỗi xử lý SePay webhook." },
      { status: 500 }
    );
  }
}
