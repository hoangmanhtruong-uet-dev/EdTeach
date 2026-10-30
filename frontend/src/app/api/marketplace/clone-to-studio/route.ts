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
      return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
    }

    const body = await req.json();
    const { item_id } = body;

    if (!item_id) {
      return NextResponse.json({ error: "Thiếu mã đề thi." }, { status: 400 });
    }

    const item = marketplaceItemsStore.get(item_id);
    if (!item) {
      return NextResponse.json({ error: "Không tìm thấy đề thi." }, { status: 404 });
    }

    // Kiểm tra quyền: tác giả, miễn phí, hoặc đã mua
    const isOwner = item.seller_id === user.id;
    const isFree = item.price_credits === 0;
    const isPurchased = marketplacePurchasesStore.some(
      (p) => p.item_id === item_id && p.buyer_id === user.id
    );

    if (!isOwner && !isFree && !isPurchased) {
      return NextResponse.json(
        { error: "Thầy/Cô cần mở khóa bộ đề này trước khi sao chép vào Studio." },
        { status: 403 }
      );
    }

    const questions = item.exam_data?.questions || [];

    // 1. Tạo bản ghi mới trong bảng exams
    const newExamData = {
      user_id: user.id,
      name: `[Chợ Đề Thi] ${item.title}`,
      subject: item.subject,
      grade: item.grade.toString(),
      chapter: `Bản quyền từ: ${item.seller_name}`,
      status: "completed" as const,
      credit_cost: 0,
      question_count: questions.length || item.question_count,
      config: {
        cloned_from_marketplace_id: item.id,
        seller_name: item.seller_name,
        cloned_at: new Date().toISOString(),
      },
    };

    let createdExamId = `exam-cloned-${Date.now()}`;
    try {
      const { data: createdExam, error: examError } = await (supabase.from("exams") as any)
        .insert(newExamData)
        .select()
        .single();

      if (!examError && createdExam) {
        createdExamId = createdExam.id;

        // 2. Chèn từng câu hỏi vào questions table
        if (questions.length > 0) {
          const insertQuestions = questions.map((q, idx) => ({
            exam_id: createdExamId,
            type: q.type || "multiple_choice",
            content: q.content,
            options: q.options || [],
            correct_answer: q.correct_answer || "",
            explanation: q.explanation || "",
            difficulty: q.difficulty || "medium",
            order_index: q.order ?? idx + 1,
          }));

          await (supabase.from("questions") as any).insert(insertQuestions);
        }
      }
    } catch (e: any) {
      console.warn("Lỗi khi ghi exams vào Supabase:", e.message);
    }

    return NextResponse.json({
      success: true,
      message: "Đã sao chép đề thi vào kho cá nhân của Thầy/Cô!",
      exam_id: createdExamId,
    });
  } catch (err: any) {
    console.error("Lỗi POST /api/marketplace/clone-to-studio:", err);
    return NextResponse.json({ error: "Lỗi sao chép đề: " + err.message }, { status: 500 });
  }
}

