import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { payOSService } from "@/lib/payment/payos";
import { getFallbackOrder, markFallbackOrderPaid } from "@/lib/payment/payment-fallback-store";

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
    const body = await req.json();

    // 1. Kiểm tra tính hợp lệ của Webhook từ PayOS bằng Checksum Key
    const isValidSignature = payOSService.verifyWebhookData(body);
    if (!isValidSignature) {
      console.warn("PayOS webhook signature verification failed!");
      return NextResponse.json(
        { error: "Invalid PayOS signature." },
        { status: 400 }
      );
    }

    const { code, data } = body;
    if (code !== "00" || !data) {
      return NextResponse.json({
        success: false,
        message: "Giao dịch không ở trạng thái thành công.",
      });
    }

    const orderCodeStr = data.orderCode?.toString();
    const paidAmount = data.amount;
    const supabase = getServiceSupabase();
    const nowIso = new Date().toISOString();

    let userId: string | null = null;
    let creditsToAdd = 0;
    let orderId = "payos_" + orderCodeStr;

    // 2. Tìm đơn hàng tương ứng trong DB
    try {
      const { data: order } = await (supabase.from("payment_orders") as any)
        .select("*")
        .eq("order_code", orderCodeStr)
        .maybeSingle();

      if (order) {
        if (order.status === "paid") {
          return NextResponse.json({
            success: true,
            message: "Đơn hàng đã được ghi nhận trước đó.",
          });
        }
        userId = order.user_id;
        creditsToAdd = order.credits;
        orderId = order.id;

        // Cập nhật trạng thái đơn hàng thành paid
        await (supabase.from("payment_orders") as any)
          .update({
            status: "paid",
            paid_at: nowIso,
            sepay_txn_id: data.reference || data.paymentLinkId,
          })
          .eq("id", order.id);
      }
    } catch {
      // ignore
    }

    // Nếu không tìm thấy trong DB thì kiểm tra fallback store
    if (!userId) {
      const fbOrder = getFallbackOrder(orderCodeStr);
      if (fbOrder) {
        userId = fbOrder.user_id;
        creditsToAdd = fbOrder.credits;
        markFallbackOrderPaid(orderCodeStr);
      }
    }

    // 3. Nếu tìm thấy user, cộng tiền vào ví (Wallets)
    if (userId && creditsToAdd > 0) {
      const { data: wallet } = await (supabase.from("wallets") as any)
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (wallet) {
        const newBalance = (wallet.balance || 0) + creditsToAdd;
        await (supabase.from("wallets") as any)
          .update({
            balance: newBalance,
            updated_at: nowIso,
          })
          .eq("id", wallet.id);

        try {
          await (supabase.from("wallet_txns") as any).insert({
            wallet_id: wallet.id,
            amount: creditsToAdd,
            type: "purchase",
            description: `Nạp tiền tự động qua PayOS: +${creditsToAdd} Credits (Mã GD: ${orderCodeStr})`,
            ref_id: orderId,
          });
        } catch {
          // ignore
        }
      }

      // Nếu là gói PRO (99.000đ hoặc mô tả có PRO), nâng cấp tier cho user
      if (paidAmount === 99000 || data.description?.includes("PRO")) {
        try {
          await (supabase.from("users") as any)
            .update({ tier: "pro" })
            .eq("id", userId);
          console.log(`[PayOS Webhook] Đã nâng cấp tài khoản user ${userId} lên gói PRO!`);
        } catch (tierErr) {
          console.warn("Lỗi update tier user:", tierErr);
        }
      }
    }

    console.log(`[PayOS Webhook] Thành công xử lý đơn ${orderCodeStr}, cộng ${creditsToAdd} credits cho user ${userId}`);

    return NextResponse.json({
      success: true,
      message: "Webhook processed successfully.",
    });
  } catch (err: any) {
    console.error("PayOS webhook error:", err);
    return NextResponse.json(
      { error: err.message || "Lỗi xử lý webhook PayOS." },
      { status: 500 }
    );
  }
}
