import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  marketplaceItemsStore,
  marketplacePurchasesStore,
} from "@/lib/marketplace/marketplace-store";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const item = marketplaceItemsStore.get(id);

    if (!item) {
      return NextResponse.json({ error: "Không tìm thấy đề thi này." }, { status: 404 });
    }

    // Xác định user hiện tại
    let currentUserId: string | null = null;
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) currentUserId = user.id;
    } catch {
      // Bỏ qua
    }

    const isOwner = !!currentUserId && item.seller_id === currentUserId;
    const isPurchased =
      isOwner ||
      item.price_credits === 0 ||
      marketplacePurchasesStore.some(
        (p) => p.item_id === id && p.buyer_id === currentUserId
      );

    if (isPurchased) {
      // Người mua hoặc tác giả: nhận full 100% câu hỏi + đáp án + giải thích
      return NextResponse.json({
        success: true,
        item: {
          ...item,
          is_owner: isOwner,
          is_purchased: true,
        },
      });
    }

    // Chưa mua: chỉ trả preview_data (đã ẩn đáp án)
    const { exam_data, ...publicItem } = item;
    return NextResponse.json({
      success: true,
      item: {
        ...publicItem,
        is_owner: false,
        is_purchased: false,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
