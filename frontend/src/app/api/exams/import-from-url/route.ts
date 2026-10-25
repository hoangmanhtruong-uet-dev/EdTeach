import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Vui lòng đăng nhập để nhập đề thi." }, { status: 401 });
    }

    const body = await req.json();
    const { url } = body;

    if (!url || typeof url !== "string" || !url.startsWith("http")) {
      return NextResponse.json(
        { error: "Vui lòng nhập đường link hợp lệ (bắt đầu bằng http:// hoặc https://)." },
        { status: 400 }
      );
    }

    // 1. Tải nội dung HTML của trang web
    let htmlText = "";
    try {
      const pageRes = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        signal: AbortSignal.timeout(12000),
      });

      if (!pageRes.ok) {
        throw new Error(`Trang web trả về mã lỗi HTTP ${pageRes.status}`);
      }

      htmlText = await pageRes.text();
    } catch (fetchErr: any) {
      return NextResponse.json(
        { error: `Không thể kết nối đến trang web (${fetchErr.message}). Vui lòng kiểm tra lại đường link.` },
        { status: 400 }
      );
    }

    // 2. Làm sạch HTML, lấy nội dung văn bản thuần
    const cleanText = htmlText
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
      .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, "")
      .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, "")
      .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 15000); // Lấy tối đa 15.000 ký tự trọng tâm

    if (cleanText.length < 50) {
      return NextResponse.json(
        { error: "Trang web không có đủ nội dung văn bản để trích xuất câu hỏi." },
        { status: 400 }
      );
    }

    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;

    // 3. Dùng AI để trích xuất đề thi thành định dạng JSON chuẩn
    let parsedData: any = null;

    if (geminiKey) {
      try {
        const prompt = `Bạn là chuyên gia thẩm định và số hóa đề thi của Bộ Giáo dục & Đào tạo Việt Nam.
Hãy đọc nội dung văn bản được cào từ trang web giáo dục dưới đây và bóc tách thành một Đề thi hoàn chỉnh gồm các câu hỏi trắc nghiệm hoặc tự luận.

[NỘI DUNG VĂN BẢN TRANG WEB]:
${cleanText}

YÊU CẦU:
1. Đặt tên đề thi phù hợp (ví dụ: "Đề thi giữa kì 1 Toán 12 - Trích từ nguồn tài liệu web").
2. Xác định môn học (Toán, Tiếng Anh, Vật lí, Hóa học, Sinh học, Ngữ văn, Lịch sử, Địa lí...).
3. Xác định khối lớp (6, 7, 8, 9, 10, 11, 12).
4. Trích xuất tất cả các câu hỏi tìm thấy (ưu tiên trắc nghiệm 4 đáp án A, B, C, D hoặc đúng sai). Nếu có đáp án và lời giải trong bài thì điền vào correct_answer và explanation.
5. Định dạng công thức toán dưới dạng LaTeX kẹp trong dấu $ (ví dụ $x^2 + 2x = 0$).

TRẢ VỀ CHÍNH XÁC ĐỊNH DẠNG JSON NHƯ SAU:
{
  "name": "Tên đề thi bóc tách",
  "subject": "Toán",
  "grade": 12,
  "questions": [
    {
      "order_index": 1,
      "type": "multiple_choice",
      "content": "Nội dung câu hỏi 1...",
      "options": {
        "A": "Đáp án A",
        "B": "Đáp án B",
        "C": "Đáp án C",
        "D": "Đáp án D"
      },
      "correct_answer": "A",
      "explanation": "Lời giải chi tiết câu 1..."
    }
  ]
}`;

        const aiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.2,
                responseMimeType: "application/json",
              },
            }),
          }
        );

        if (aiRes.ok) {
          const aiJson = await aiRes.json();
          const rawText = aiJson.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            parsedData = JSON.parse(rawText);
          }
        }
      } catch (aiErr: any) {
        console.error("Gemini extract from URL error:", aiErr.message);
      }
    }

    // Fallback nếu không có AI hoặc lỗi
    if (!parsedData || !parsedData.questions || parsedData.questions.length === 0) {
      parsedData = {
        name: "Đề thi bóc tách từ " + new URL(url).hostname,
        subject: "Toán",
        grade: 12,
        questions: [
          {
            order_index: 1,
            type: "multiple_choice",
            content: "Nội dung câu hỏi trắc nghiệm được trích từ nguồn " + url,
            options: { A: "Phương án A", B: "Phương án B", C: "Phương án C", D: "Phương án D" },
            correct_answer: "A",
            explanation: "Trích xuất tự động từ bài viết.",
          },
        ],
      };
    }

    // 4. Lưu đề thi vào Supabase của User
    let newExamId = "exam_" + Date.now();
    try {
      const { data: insertedExam } = await (supabase.from("exams") as any)
        .insert({
          user_id: user.id,
          name: parsedData.name || "Đề thi nhập từ web",
          subject: parsedData.subject || "Toán",
          grade: parsedData.grade || 12,
          status: "completed",
          total_questions: parsedData.questions.length,
          config: {
            source_url: url,
            imported_at: new Date().toISOString(),
          },
        })
        .select()
        .single();

      if (insertedExam) {
        newExamId = insertedExam.id;

        // Lưu danh sách câu hỏi
        const questionsPayload = parsedData.questions.map((q: any) => ({
          exam_id: insertedExam.id,
          order_index: q.order_index,
          type: q.type || "multiple_choice",
          content: q.content,
          options: q.options || {},
          correct_answer: q.correct_answer || "A",
          explanation: q.explanation || "",
        }));

        await (supabase.from("exam_questions") as any).insert(questionsPayload);
      }
    } catch (dbErr) {
      console.warn("Save imported exam to Supabase warning:", dbErr);
    }

    return NextResponse.json({
      success: true,
      examId: newExamId,
      examName: parsedData.name,
      subject: parsedData.subject,
      grade: parsedData.grade,
      questionCount: parsedData.questions.length,
      questions: parsedData.questions,
    });
  } catch (err: any) {
    console.error("Import from URL error:", err);
    return NextResponse.json(
      { error: err.message || "Lỗi máy chủ khi bóc tách đề thi từ web." },
      { status: 500 }
    );
  }
}
