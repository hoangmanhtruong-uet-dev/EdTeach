import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  marketplaceItemsStore,
  marketplacePurchasesStore,
} from "@/lib/marketplace/marketplace-store";
import { MarketplaceItem } from "@/types/marketplace";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const subject = searchParams.get("subject") || "all";
    const grade = searchParams.get("grade") || "all";
    const search = (searchParams.get("search") || "").trim().toLowerCase();
    const tab = searchParams.get("tab") || "all"; // 'all' | 'purchased' | 'my_listings'

    // Lấy thông tin user hiện tại nếu có
    let currentUserId: string | null = null;
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        currentUserId = user.id;
      }
    } catch {
      // Bỏ qua nếu chưa login
    }

    // 1. Thử lấy từ Supabase DB trước
    let itemsFromDb: MarketplaceItem[] | null = null;
    try {
      const supabase = await createClient();
      let query = supabase.from("marketplace_items").select("*").eq("status", "published");
      if (subject !== "all") query = query.eq("subject", subject);
      if (grade !== "all") query = query.eq("grade", parseInt(grade, 10));

      const { data, error } = await (query as any);
      if (!error && Array.isArray(data) && data.length > 0) {
        itemsFromDb = data;
      }
    } catch {
      // Table chưa migrate thì dùng memory store
    }

    // 2. Nguồn dữ liệu kết hợp
    const allItems: MarketplaceItem[] = itemsFromDb || Array.from(marketplaceItemsStore.values());

    // 3. Lọc theo search, subject, grade
    let filtered = allItems.filter((item) => {
      const matchSubject = subject === "all" || item.subject === subject;
      const matchGrade = grade === "all" || item.grade.toString() === grade;
      const matchSearch =
        !search ||
        item.title.toLowerCase().includes(search) ||
        item.seller_name.toLowerCase().includes(search) ||
        item.tags.some((t) => t.toLowerCase().includes(search));

      return matchSubject && matchGrade && matchSearch;
    });

    // 4. Kiểm tra quyền sở hữu và đã mua
    const purchasedIds = new Set<string>();
    if (currentUserId) {
      marketplacePurchasesStore.forEach((p) => {
        if (p.buyer_id === currentUserId) {
          purchasedIds.add(p.item_id);
        }
      });
    }

    filtered = filtered.map((item) => {
      const isOwner = !!currentUserId && item.seller_id === currentUserId;
      const isPurchased = isOwner || (!!currentUserId && purchasedIds.has(item.id)) || item.price_credits === 0;

      // Không trả exam_data đầy đủ ở danh sách để bảo mật
      const { exam_data, ...publicItem } = item;
      return {
        ...publicItem,
        is_owner: isOwner,
        is_purchased: isPurchased,
      };
    });

    // 5. Lọc theo Tab
    if (tab === "purchased") {
      filtered = filtered.filter((i) => i.is_purchased);
    } else if (tab === "my_listings") {
      filtered = filtered.filter((i) => i.is_owner);
    }

    return NextResponse.json({
      success: true,
      items: filtered,
      total: filtered.length,
    });
  } catch (err: any) {
    console.error("Lỗi GET /api/marketplace/items:", err);
    return NextResponse.json({ error: "Lỗi tải danh sách đề thi: " + err.message }, { status: 500 });
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
      return NextResponse.json({ error: "Vui lòng đăng nhập để đăng bán đề thi." }, { status: 401 });
    }

    const body = await req.json();
    const {
      title,
      subject,
      grade,
      description,
      price_credits,
      exam_id, // nếu chọn từ đề có sẵn trong kho
      tags,
      questions: rawQuestions,
    } = body;

    if (!title || !subject || !grade || price_credits === undefined) {
      return NextResponse.json(
        { error: "Vui lòng nhập đầy đủ thông tin: Tiêu đề, Môn học, Khối lớp và Giá bán." },
        { status: 400 }
      );
    }

    // Lấy thông tin user profile để biết seller_name và seller_tier (free / pro)
    let sellerName = user.user_metadata?.full_name || user.email?.split("@")[0] || "Thầy Cô Giáo";
    let sellerTier: "free" | "pro" = "free";

    try {
      const { data: profile } = await (supabase
        .from("users") as any)
        .select("full_name, subscription_tier")
        .eq("id", user.id)
        .maybeSingle();

      if (profile) {
        if ((profile as any).full_name) sellerName = (profile as any).full_name;
        if ((profile as any).subscription_tier === "pro") sellerTier = "pro";
      }
    } catch {
      // Fallback
    }

    // Lấy danh sách câu hỏi nếu chọn từ exam_id
    let fullQuestions = rawQuestions || [];
    if (exam_id && (!rawQuestions || rawQuestions.length === 0)) {
      try {
        const { data: dbQuestions } = await supabase
          .from("questions")
          .select("*")
          .eq("exam_id", exam_id)
          .order("order_index", { ascending: true });

        if (dbQuestions && dbQuestions.length > 0) {
          fullQuestions = dbQuestions.map((q: any, idx: number) => ({
            id: q.id || `q-${idx + 1}`,
            order: q.order_index ?? idx + 1,
            type: q.type || "multiple_choice",
            content: q.content,
            options: Array.isArray(q.options) ? q.options : [],
            correct_answer: q.correct_answer || "",
            explanation: q.explanation || "",
            difficulty: q.difficulty || "medium",
          }));
        }
      } catch {
        // Fallback
      }
    }

    // Xây dựng ma trận và 3 câu hỏi xem trước
    const sampleQuestions = fullQuestions.slice(0, 3).map((q: any) => ({
      id: q.id,
      order: q.order,
      type: q.type,
      content: q.content,
      options: q.options,
      difficulty: q.difficulty,
    }));

    const newItem: MarketplaceItem = {
      id: `mk-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      seller_id: user.id,
      seller_name: sellerName,
      seller_tier: sellerTier,
      title: title.trim(),
      subject: subject.trim(),
      grade: parseInt(grade, 10) || 12,
      description: description?.trim() || `Bộ đề thi môn ${subject} lớp ${grade} chất lượng cao chuẩn cấu trúc mới.`,
      price_credits: Math.max(0, parseInt(price_credits, 10)),
      question_count: fullQuestions.length || 20,
      tags: Array.isArray(tags) && tags.length > 0 ? tags : [`${subject}`, `Lop${grade}`, "ChuanMaTran"],
      downloads_count: 0,
      rating: 5.0,
      review_count: 0,
      status: "published",
      created_at: new Date().toISOString(),
      preview_data: {
        matrix: {
          total_questions: fullQuestions.length || 20,
          multiple_choice_count: fullQuestions.filter((q: any) => q.type === "multiple_choice").length || 15,
          true_false_count: fullQuestions.filter((q: any) => q.type === "true_false").length || 3,
          short_answer_count: fullQuestions.filter((q: any) => q.type === "short_answer").length || 2,
          difficulty_distribution: {
            easy: Math.ceil(fullQuestions.length * 0.4) || 8,
            medium: Math.ceil(fullQuestions.length * 0.4) || 8,
            hard: Math.floor(fullQuestions.length * 0.15) || 3,
            very_hard: Math.floor(fullQuestions.length * 0.05) || 1,
          },
          duration_minutes: 50,
        },
        sample_questions: sampleQuestions,
      },
      exam_data: {
        questions: fullQuestions,
      },
    };

    // 1. Thử lưu vào Supabase table
    try {
      await (supabase.from("marketplace_items") as any).insert({
        id: newItem.id,
        seller_id: newItem.seller_id,
        seller_name: newItem.seller_name,
        seller_tier: newItem.seller_tier,
        title: newItem.title,
        subject: newItem.subject,
        grade: newItem.grade,
        description: newItem.description,
        price_credits: newItem.price_credits,
        question_count: newItem.question_count,
        tags: newItem.tags,
        preview_data: newItem.preview_data,
        exam_data: newItem.exam_data,
        downloads_count: 0,
        rating: 5.0,
        status: "published",
      });
    } catch {
      // Table chưa có thì lưu memory store
    }

    // 2. Luôn lưu vào memory store
    marketplaceItemsStore.set(newItem.id, newItem);

    return NextResponse.json({
      success: true,
      message: "Đăng bán đề thi thành công!",
      item: newItem,
    });
  } catch (err: any) {
    console.error("Lỗi POST /api/marketplace/items:", err);
    return NextResponse.json({ error: "Lỗi đăng đề: " + err.message }, { status: 500 });
  }
}
