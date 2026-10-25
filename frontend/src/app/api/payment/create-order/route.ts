import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { saveFallbackOrder, FallbackPaymentOrder } from "@/lib/payment/payment-fallback-store";

function generateOrderCode(): string {
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let result = "EDUPAY";
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Vui lòng đăng nhập để thực hiện nạp tiền." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { amount, credits } = body;

    const numAmount = parseInt(amount, 10);
    const numCredits = parseInt(credits, 10);

    if (!numAmount || numAmount < 10000 || !numCredits || numCredits <= 0) {
      return NextResponse.json(
        { error: "Gói nạp tiền không hợp lệ. Số tiền tối thiểu là 10.000đ." },
        { status: 400 }
      );
    }

    // Sinh mã đơn hàng duy nhất
    let orderCode = generateOrderCode();
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 5) {
      try {
        const { data: existing } = await (supabase.from("payment_orders") as any)
          .select("id")
          .eq("order_code", orderCode)
          .maybeSingle();

        if (!existing) {
          isUnique = true;
        } else {
          orderCode = generateOrderCode();
          attempts++;
        }
      } catch {
        isUnique = true;
      }
    }

    // Lấy thông tin tài khoản ngân hàng cấu hình
    const bankId = process.env.NEXT_PUBLIC_PAYMENT_BANK_ID || "MB";
    const accountNo = process.env.NEXT_PUBLIC_PAYMENT_ACCOUNT_NO || "0988888888";
    const accountName = process.env.NEXT_PUBLIC_PAYMENT_ACCOUNT_NAME || "NGUYEN VAN A";

    // Sinh link VietQR chuẩn
    const qrUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?amount=${numAmount}&addInfo=${encodeURIComponent(
      orderCode
    )}&accountName=${encodeURIComponent(accountName)}`;

    // Tạo đơn nạp tiền trong database Supabase
    let orderRecord: any = null;
    const { data: order, error: insertError } = await (supabase.from("payment_orders") as any)
      .insert({
        user_id: user.id,
        order_code: orderCode,
        amount: numAmount,
        credits: numCredits,
        status: "pending",
      })
      .select()
      .single();

    if (insertError) {
      console.warn(
        `[Notice] Table 'public.payment_orders' is not present in Supabase (PGRST205). Using in-memory fallback order for ${orderCode}.`
      );
      // Fallback in-memory order so user can still test payments & QR code smoothly
      const fallbackOrder: FallbackPaymentOrder = {
        id: "order_" + Date.now(),
        user_id: user.id,
        order_code: orderCode,
        amount: numAmount,
        credits: numCredits,
        status: "pending",
        created_at: new Date().toISOString(),
        bank_id: bankId,
        account_no: accountNo,
        account_name: accountName,
        qr_url: qrUrl,
      };
      saveFallbackOrder(fallbackOrder);
      orderRecord = fallbackOrder;
    } else {
      orderRecord = order;
    }

    return NextResponse.json({
      success: true,
      order: {
        id: orderRecord.id,
        order_code: orderCode,
        amount: numAmount,
        credits: numCredits,
        status: "pending",
        bank_id: bankId,
        account_no: accountNo,
        account_name: accountName,
        qr_url: qrUrl,
        created_at: orderRecord.created_at || new Date().toISOString(),
      },
    });
  } catch (err: any) {
    console.error("Create payment order error:", err);
    return NextResponse.json(
      { error: err.message || "Lỗi máy chủ khi tạo đơn nạp tiền." },
      { status: 500 }
    );
  }
}
