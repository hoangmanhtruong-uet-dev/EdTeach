import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  marketplaceItemsStore,
  marketplacePurchasesStore,
} from "@/lib/marketplace/marketplace-store";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Vui lòng đăng nhập để mở khóa đề thi." }, { status: 401 });
    }

    const body = await req.json();
    const { item_id } = body;

    if (!item_id) {
      return NextResponse.json({ error: "Thiếu mã đề thi." }, { status: 400 });
    }

    // 1. Thử gọi hàm Atomic RPC transaction trên Supabase (Sprint MP-1 Fix U5 & A4)
    try {
      const { data: rpcResult, error: rpcError } = await (supabase.rpc as any)(
        "marketplace_purchase_item",
        { p_item_id: item_id }
      );

      if (!rpcError && rpcResult) {
        if (rpcResult.success) {
          // Lấy full item để trả về
          let fullItem: any = null;
          const { data: dbItem } = await supabase
            .from("marketplace_items")
            .select("*")
            .eq("id", item_id)
            .maybeSingle();

          fullItem = dbItem || marketplaceItemsStore.get(item_id);

          return NextResponse.json({
            success: true,
            already_owned: rpcResult.already_owned,
            message: rpcResult.message,
            item: fullItem,
            purchase_id: rpcResult.purchase_id,
            new_balance: rpcResult.new_balance,
          });
        } else {
          // Xử lý lỗi cụ thể
          const status = rpcResult.error === "INSUFFICIENT_BALANCE" ? 402 : 400;
          return NextResponse.json(
            {
              error: rpcResult.message,
              errorCode: rpcResult.error,
              needTopup: rpcResult.error === "INSUFFICIENT_BALANCE",
              requiredPrice: rpcResult.required,
              currentBalance: rpcResult.current_balance,
            },
            { status }
          );
        }
      }
    } catch (rpcEx) {
      console.warn("RPC marketplace_purchase_item chưa khả dụng, thực hiện fallback:", rpcEx);
    }

    // 2. Fallback an toàn nếu RPC chưa nạp
    let item: any = null;
    const { data: dbItem } = await supabase
      .from("marketplace_items")
      .select("*")
      .eq("id", item_id)
      .maybeSingle();

    item = dbItem || marketplaceItemsStore.get(item_id);
    if (!item) {
      return NextResponse.json({ error: "Không tìm thấy đề thi trên chợ." }, { status: 404 });
    }

    if (item.seller_id === user.id) {
      return NextResponse.json({ error: "Thầy/Cô là tác giả của đề thi này, không cần mua!" }, { status: 400 });
    }

    // Kiểm tra xem đã mua chưa
    const { data: existingPurchase } = await supabase
      .from("marketplace_purchases")
      .select("id")
      .eq("buyer_id", user.id)
      .eq("item_id", item_id)
      .maybeSingle();

    if (existingPurchase || marketplacePurchasesStore.some((p) => p.item_id === item_id && p.buyer_id === user.id)) {
      return NextResponse.json({
        success: true,
        already_owned: true,
        message: "Thầy/Cô đã sở hữu đề thi này trước đó.",
        item,
      });
    }

    const price = item.price_credits;
    let buyerBalance = 0;
    let walletId = "";

    const { data: wallet } = await (supabase
      .from("wallets") as any)
      .select("id, balance")
      .eq("user_id", user.id)
      .maybeSingle();

    if (wallet) {
      buyerBalance = (wallet as any).balance ?? 0;
      walletId = (wallet as any).id ?? "";
    }

    if (price > 0 && buyerBalance < price) {
      return NextResponse.json(
        {
          error: `Số dư ví không đủ. Cần ${price} credits nhưng ví hiện có ${buyerBalance} credits. Vui lòng nạp thêm để tiếp tục!`,
          needTopup: true,
          currentBalance: buyerBalance,
          requiredPrice: price,
        },
        { status: 402 }
      );
    }

    // Tính toán hoa hồng 3 bậc (Free 20%, Pro 10%, MAX 5%) (Sprint MP-1 Fix U7)
    const sellerTier = item.seller_tier || "free";
    const commissionRate = sellerTier === "max" ? 0.05 : sellerTier === "pro" ? 0.1 : 0.2;
    const platformFee = Math.round(price * commissionRate);
    const sellerEarnings = price - platformFee;

    const purchaseId = crypto.randomUUID();

    // Cập nhật ví và giao dịch
    if (price > 0 && walletId) {
      await (supabase
        .from("wallets") as any)
        .update({ balance: buyerBalance - price, updated_at: new Date().toISOString() })
        .eq("id", walletId);

      await (supabase.from("wallet_txns") as any).insert({
        wallet_id: walletId,
        amount: -price,
        type: "marketplace_buy",
        description: `Mua đề thi: ${item.title}`,
      });
    }

    // Ghi nhận lượt mua
    await (supabase.from("marketplace_purchases") as any).insert({
      id: purchaseId,
      buyer_id: user.id,
      item_id: item.id,
      price_credits: price,
      commission_rate: commissionRate,
      seller_earnings: sellerEarnings,
      platform_fee: platformFee,
    });

    marketplacePurchasesStore.push({
      id: purchaseId,
      buyer_id: user.id,
      item_id: item.id,
      price_credits: price,
      commission_rate: commissionRate,
      seller_earnings: sellerEarnings,
      platform_fee: platformFee,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: price === 0 ? "Mở khóa đề thi miễn phí thành công!" : "Giao dịch mua đề thi thành công!",
      item,
      purchase_id: purchaseId,
    });
  } catch (err: any) {
    console.error("Lỗi POST /api/marketplace/buy:", err);
    return NextResponse.json({ error: "Lỗi giao dịch: " + err.message }, { status: 500 });
  }
}
