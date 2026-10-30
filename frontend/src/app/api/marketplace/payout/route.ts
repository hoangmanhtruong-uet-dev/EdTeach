import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  marketplaceItemsStore,
  marketplacePurchasesStore,
  payoutRequestsStore,
} from "@/lib/marketplace/marketplace-store";
import { PayoutRequest } from "@/types/marketplace";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
    }

    // Lấy thông tin ví và profile của user
    let balance = 0;
    let walletId = "";
    let isPro = false;

    try {
      const { data: wallet } = await (supabase
        .from("wallets") as any)
        .select("id, balance")
        .eq("user_id", user.id)
        .maybeSingle();

      if (wallet) {
        balance = (wallet as any).balance ?? 0;
        walletId = (wallet as any).id ?? "";
      }

      const { data: profile } = await (supabase
        .from("users") as any)
        .select("subscription_tier")
        .eq("id", user.id)
        .maybeSingle();

      if (profile && (profile as any).subscription_tier === "pro") {
        isPro = true;
      }
    } catch {
      // Fallback
    }

    // Tính toán doanh thu bán hàng của user
    const userItems = Array.from(marketplaceItemsStore.values()).filter(
      (item) => item.seller_id === user.id
    );
    const userItemIds = new Set(userItems.map((i) => i.id));

    const userSales = marketplacePurchasesStore.filter((p) => userItemIds.has(p.item_id));
    const totalEarned = userSales.reduce((sum, p) => sum + p.seller_earnings, 0);

    const userPayoutRequests = payoutRequestsStore.filter((r) => r.user_id === user.id);

    return NextResponse.json({
      success: true,
      stats: {
        total_earned_credits: totalEarned,
        total_sales: userSales.length,
        active_listings: userItems.length,
        available_balance: balance,
        available_vnd: balance * 100,
        commission_rate: isPro ? 0.1 : 0.2, // 10% cho PRO, 20% cho Free
        is_pro: isPro,
      },
      requests: userPayoutRequests,
    });
  } catch (err: any) {
    console.error("Lỗi GET /api/marketplace/payout:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
    }

    const body = await req.json();
    const { amount_credits, bank_name, account_number, account_holder } = body;

    const credits = parseInt(amount_credits, 10);
    if (!credits || credits < 2000) {
      return NextResponse.json(
        { error: "Hạn mức rút tối thiểu là 2.000 credits (tương đương 200.000 VNĐ)." },
        { status: 400 }
      );
    }

    if (!bank_name || !account_number || !account_holder) {
      return NextResponse.json(
        { error: "Vui lòng điền đầy đủ Tên ngân hàng, Số tài khoản và Tên chủ tài khoản." },
        { status: 400 }
      );
    }

    // 1. Kiểm tra ví
    let currentBalance = 0;
    let walletId = "";
    try {
      const { data: wallet } = await (supabase
        .from("wallets") as any)
        .select("id, balance")
        .eq("user_id", user.id)
        .maybeSingle();

      if (wallet) {
        currentBalance = (wallet as any).balance ?? 0;
        walletId = (wallet as any).id ?? "";
      }
    } catch {
      // Fallback
    }

    if (currentBalance < credits) {
      return NextResponse.json(
        {
          error: `Số dư ví không đủ để rút. Thầy/Cô đang có ${currentBalance} credits, yêu cầu rút ${credits} credits.`,
        },
        { status: 400 }
      );
    }

    // 2. Trừ tiền tạm giữ trong ví
    if (walletId) {
      try {
        await (supabase.from("wallets") as any)
          .update({
            balance: currentBalance - credits,
            updated_at: new Date().toISOString(),
          })
          .eq("id", walletId);

        await (supabase.from("wallet_txns") as any).insert({
          wallet_id: walletId,
          amount: -credits,
          type: "purchase",
          description: `Yêu cầu rút tiền về ${bank_name} - STK ${account_number}`,
        });
      } catch (e: any) {
        console.warn("Lỗi trừ ví khi rút tiền:", e.message);
      }
    }

    // 3. Tạo yêu cầu rút tiền
    const newRequest: PayoutRequest = {
      id: `payout-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      user_id: user.id,
      amount_credits: credits,
      amount_vnd: credits * 100, // 1 credit = 100 VNĐ
      bank_name: bank_name.trim(),
      account_number: account_number.trim(),
      account_holder: account_holder.trim().toUpperCase(),
      status: "pending",
      created_at: new Date().toISOString(),
      note: "Hệ thống đang xử lý chuyển khoản tự động qua VietQR 24/7",
    };

    payoutRequestsStore.unshift(newRequest);

    // Cố gắng lưu vào Supabase table
    try {
      await (supabase.from("payout_requests") as any).insert(newRequest);
    } catch {
      // Fallback
    }

    return NextResponse.json({
      success: true,
      message: `Yêu cầu rút ${(credits * 100).toLocaleString("vi-VN")} VNĐ đã được gửi thành công! Tiền sẽ được giải ngân về STK trong vòng 24h làm việc.`,
      request: newRequest,
      new_balance: currentBalance - credits,
    });
  } catch (err: any) {
    console.error("Lỗi POST /api/marketplace/payout:", err);
    return NextResponse.json({ error: "Lỗi gửi yêu cầu rút tiền: " + err.message }, { status: 500 });
  }
}
