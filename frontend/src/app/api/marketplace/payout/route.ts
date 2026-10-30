import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
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

    let balance = 0;
    let isPro = false;
    let isMax = false;

    try {
      const { data: wallet } = await (supabase
        .from("wallets") as any)
        .select("id, balance")
        .eq("user_id", user.id)
        .maybeSingle();

      if (wallet) {
        balance = (wallet as any).balance ?? 0;
      }

      const { data: profile } = await (supabase
        .from("users") as any)
        .select("subscription_tier")
        .eq("id", user.id)
        .maybeSingle();

      if (profile) {
        if ((profile as any).subscription_tier === "max") isMax = true;
        else if ((profile as any).subscription_tier === "pro") isPro = true;
      }
    } catch {
      // Fallback
    }

    // Lấy doanh thu thật từ Supabase DB
    let totalEarned = 0;
    let totalSales = 0;
    let activeListings = 0;
    let userPayoutRequests: PayoutRequest[] = [];

    try {
      // 1. Đề thi của user
      const { data: items } = await supabase
        .from("marketplace_items")
        .select("id")
        .eq("seller_id", user.id);

      if (items && items.length > 0) {
        activeListings = items.length;
        const itemIds = items.map((i: any) => i.id);

        // 2. Lượt mua các đề thi này
        const { data: purchases } = await supabase
          .from("marketplace_purchases")
          .select("seller_earnings")
          .in("item_id", itemIds);

        if (purchases && purchases.length > 0) {
          totalSales = purchases.length;
          totalEarned = purchases.reduce((sum: number, p: any) => sum + (p.seller_earnings || 0), 0);
        }
      }

      // 3. Lịch sử yêu cầu rút tiền của user
      const { data: payouts } = await supabase
        .from("payout_requests")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (payouts) {
        userPayoutRequests = payouts as PayoutRequest[];
      }
    } catch (e: any) {
      console.warn("Lỗi query payouts:", e.message);
    }

    // Hoa hồng 3 bậc: MAX 5%, PRO 10%, Free 20% (Sprint MP-1 Fix U7)
    const commissionRate = isMax ? 0.05 : isPro ? 0.10 : 0.20;

    return NextResponse.json({
      success: true,
      stats: {
        total_earned_credits: totalEarned,
        total_sales: totalSales,
        active_listings: activeListings,
        available_balance: balance,
        available_vnd: balance * 100,
        commission_rate: commissionRate,
        is_pro: isPro || isMax,
        is_max: isMax,
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
      return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
    }

    const body = await req.json();
    const { amount_credits, bank_name, account_number, account_holder } = body;

    const credits = parseInt(amount_credits, 10);
    if (!credits || credits < 500) {
      return NextResponse.json(
        { error: "Hạn mức rút tiền tối thiểu là 500 credits (tương đương 50.000 VNĐ)." },
        { status: 400 }
      );
    }

    if (!bank_name || !account_number || !account_holder) {
      return NextResponse.json(
        { error: "Vui lòng nhập đầy đủ thông tin ngân hàng và số tài khoản." },
        { status: 400 }
      );
    }

    // Kiểm tra số dư ví
    let currentBalance = 0;
    let walletId = "";
    const { data: wallet } = await (supabase
      .from("wallets") as any)
      .select("id, balance")
      .eq("user_id", user.id)
      .maybeSingle();

    if (wallet) {
      currentBalance = (wallet as any).balance ?? 0;
      walletId = (wallet as any).id ?? "";
    }

    if (currentBalance < credits) {
      return NextResponse.json(
        { error: `Số dư ví không đủ. Ví hiện có ${currentBalance} credits, cần ${credits} credits.` },
        { status: 400 }
      );
    }

    const amountVnd = credits * 100;
    const payoutId = crypto.randomUUID();

    // 1. Tạo yêu cầu rút tiền trong DB (status = 'pending') (Sprint MP-1 Fix U1 & A5)
    const { error: payoutError } = await (supabase.from("payout_requests") as any).insert({
      id: payoutId,
      user_id: user.id,
      amount_credits: credits,
      amount_vnd: amountVnd,
      bank_name: bank_name.trim(),
      account_number: account_number.trim(),
      account_holder: account_holder.trim().toUpperCase(),
      status: "pending",
    });

    if (payoutError) {
      console.error("Lỗi insert payout_requests:", payoutError);
      return NextResponse.json({ error: "Lỗi tạo yêu cầu rút tiền: " + payoutError.message }, { status: 500 });
    }

    // 2. Tạm khóa credits rút trong ví người dùng
    if (walletId) {
      await (supabase
        .from("wallets") as any)
        .update({ balance: currentBalance - credits, updated_at: new Date().toISOString() })
        .eq("id", walletId);

      await (supabase.from("wallet_txns") as any).insert({
        wallet_id: walletId,
        amount: -credits,
        type: "payout_request",
        description: `Yêu cầu rút tiền ${amountVnd.toLocaleString("vi-VN")} VNĐ về ${bank_name}`,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Đã gửi yêu cầu rút ${credits.toLocaleString("vi-VN")} credits (${amountVnd.toLocaleString("vi-VN")} VNĐ) thành công!`,
      payout_id: payoutId,
    });
  } catch (err: any) {
    console.error("Lỗi POST /api/marketplace/payout:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
