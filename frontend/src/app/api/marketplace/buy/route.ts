import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  marketplaceItemsStore,
  marketplacePurchasesStore,
} from "@/lib/marketplace/marketplace-store";
import { MarketplacePurchase } from "@/types/marketplace";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Vui lòng đăng nhập để mua đề thi." }, { status: 401 });
    }

    const body = await req.json();
    const { item_id } = body;

    if (!item_id) {
      return NextResponse.json({ error: "Thiếu mã đề thi." }, { status: 400 });
    }

    const item = marketplaceItemsStore.get(item_id);
    if (!item) {
      return NextResponse.json({ error: "Không tìm thấy đề thi trên chợ." }, { status: 404 });
    }

    if (item.seller_id === user.id) {
      return NextResponse.json({ error: "Thầy/Cô là tác giả của đề thi này, không cần mua!" }, { status: 400 });
    }

    // Kiểm tra xem đã mua chưa
    const alreadyPurchased = marketplacePurchasesStore.some(
      (p) => p.item_id === item_id && p.buyer_id === user.id
    );
    if (alreadyPurchased) {
      return NextResponse.json({
        success: true,
        message: "Thầy/Cô đã sở hữu đề thi này trước đó.",
        item,
      });
    }

    const price = item.price_credits;

    // 1. Kiểm tra ví của người mua
    let buyerBalance = 0;
    let walletId = "";
    try {
      const { data: wallet } = await (supabase
        .from("wallets") as any)
        .select("id, balance")
        .eq("user_id", user.id)
        .maybeSingle();

      if (wallet) {
        buyerBalance = (wallet as any).balance ?? 0;
        walletId = (wallet as any).id ?? "";
      }
    } catch {
      // Fallback
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

    // 2. Tính toán hoa hồng theo bậc thang:
    // PRO seller: 10% hoa hồng sàn (nhận 90%)
    // Free seller: 20% hoa hồng sàn (nhận 80%)
    const commissionRate = item.seller_tier === "pro" ? 0.1 : 0.2;
    const platformFee = Math.round(price * commissionRate);
    const sellerEarnings = price - platformFee;

    // 3. Trừ tiền ví người mua (nếu price > 0)
    if (price > 0 && walletId) {
      const newBuyerBalance = buyerBalance - price;
      try {
        await (supabase.from("wallets") as any)
          .update({ balance: newBuyerBalance, updated_at: new Date().toISOString() })
          .eq("id", walletId);

        // Lưu lịch sử giao dịch ví người mua
        await (supabase.from("wallet_txns") as any).insert({
          wallet_id: walletId,
          amount: -price,
          type: "purchase",
          description: `Mua đề thi: ${item.title}`,
          ref_id: item.id,
        });
      } catch (e) {
        console.warn("Lỗi cập nhật ví buyer:", e);
      }

      // Cộng tiền ví người bán
      try {
        const { data: sellerWallet } = await (supabase
          .from("wallets") as any)
          .select("id, balance")
          .eq("user_id", item.seller_id)
          .maybeSingle();

        if (sellerWallet) {
          const sBal = (sellerWallet as any).balance ?? 0;
          const sId = (sellerWallet as any).id;
          await (supabase.from("wallets") as any)
            .update({
              balance: sBal + sellerEarnings,
              updated_at: new Date().toISOString(),
            })
            .eq("id", sId);

          await (supabase.from("wallet_txns") as any).insert({
            wallet_id: sId,
            amount: sellerEarnings,
            type: "purchase",
            description: `Bán đề thi: ${item.title} (Thu nhập ${100 - commissionRate * 100}%, sàn giữ ${commissionRate * 100}%)`,
            ref_id: item.id,
          });
        }
      } catch (e) {
        console.warn("Lỗi cộng ví seller:", e);
      }
    }

    // 4. Lưu đơn hàng mua bán
    const purchaseRecord: MarketplacePurchase = {
      id: `pur-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      buyer_id: user.id,
      item_id: item.id,
      price_credits: price,
      commission_rate: commissionRate,
      seller_earnings: sellerEarnings,
      platform_fee: platformFee,
      created_at: new Date().toISOString(),
    };

    marketplacePurchasesStore.push(purchaseRecord);

    // Cố gắng ghi vào Supabase
    try {
      await (supabase.from("marketplace_purchases") as any).insert(purchaseRecord);
    } catch {
      // Fallback
    }

    // Tăng lượt tải của đề
    item.downloads_count += 1;
    marketplaceItemsStore.set(item.id, item);

    return NextResponse.json({
      success: true,
      message: `Mua đề thi thành công! Đã trừ ${price} credits.`,
      item: {
        ...item,
        is_owner: false,
        is_purchased: true,
      },
      purchase: purchaseRecord,
      remainingBalance: buyerBalance - price,
    });
  } catch (err: any) {
    console.error("Lỗi POST /api/marketplace/buy:", err);
    return NextResponse.json({ error: "Lỗi xử lý mua đề: " + err.message }, { status: 500 });
  }
}
