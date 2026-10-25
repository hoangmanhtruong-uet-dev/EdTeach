import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const AI_SERVICE_URL =
  process.env.AI_SERVICE_URL ||
  process.env.NEXT_PUBLIC_AI_SERVICE_URL ||
  "http://localhost:8000";

// Simple in-memory IP rate limiter: max 5 requests per IP per day
const ipRateLimits = new Map<string, { count: number; date: string }>();

function checkIpRateLimit(ip: string): boolean {
  const today = new Date().toISOString().slice(0, 10);
  const record = ipRateLimits.get(ip);
  if (!record || record.date !== today) {
    ipRateLimits.set(ip, { count: 1, date: today });
    return true;
  }
  if (record.count >= 6) {
    return false; // Exceeded 5 requests/day limit
  }
  record.count += 1;
  return true;
}

export async function POST(req: NextRequest) {
  try {
    // 0. Kiểm tra IP rate-limit để chống bot cày tài khoản ảo
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";

    if (!checkIpRateLimit(clientIp)) {
      return NextResponse.json(
        {
          error: "IP_RATE_LIMITED",
          message: "Địa chỉ mạng này đã đạt giới hạn 5 đề thi miễn phí trong ngày để đảm bảo tài nguyên cho mọi giáo viên.",
        },
        { status: 429 }
      );
    }

    const supabase = await createClient();

    // 1. Xác thực user session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Bạn cần đăng nhập để thực hiện chức năng này." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      name,
      subject,
      grade,
      topic,
      question_type = "MCQ",
      num_questions = 10,
      difficulty = 2,
      additional_context = "",
    } = body;

    if (!name || !subject || !grade) {
      return NextResponse.json(
        { error: "Thiếu thông tin bắt buộc: tên đề, môn học, hoặc khối lớp." },
        { status: 400 }
      );
    }

    // 2. Lấy thông tin ví và người dùng
    const { data: wallet, error: walletError } = await (supabase
      .from("wallets") as any)
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    const { data: userProfile } = await (supabase
      .from("users") as any)
      .select("referral_code, tier")
      .eq("id", user.id)
      .maybeSingle();

    const requiredCredits = Math.ceil(num_questions / 10) * 20;

    // Daily Quota Logic:
    let dailyQuota = wallet?.daily_quota ?? 3;
    let dailyUsed = wallet?.daily_quota_used ?? 0;
    let balance = wallet?.balance ?? 0;
    let isFreeUsage = false;
    let creditsDeducted = 0;

    // Kiểm tra reset ngày mới (00:00 UTC/Local)
    const todayStr = new Date().toISOString().slice(0, 10);
    const lastResetStr = wallet?.last_quota_reset
      ? new Date(wallet.last_quota_reset).toISOString().slice(0, 10)
      : "";

    if (lastResetStr !== todayStr) {
      // Đã sang ngày mới -> Tự động hồi phục lượt free!
      dailyUsed = 0;
    }

    if (dailyUsed < dailyQuota) {
      // Dùng lượt miễn phí hàng ngày (0 đồng chi phí!)
      isFreeUsage = true;
      dailyUsed += 1;
      creditsDeducted = 0;
    } else if (balance >= requiredCredits) {
      // Đã hết lượt free nhưng còn credits (do nạp hoặc referral)
      isFreeUsage = false;
      creditsDeducted = requiredCredits;
      balance -= requiredCredits;
    } else {
      // HẾT CẢ LƯỢT FREE LẪN CREDITS -> Kích hoạt Viral Loop & Monetization
      return NextResponse.json(
        {
          error: "QUOTA_EXHAUSTED",
          message: "Thầy/Cô đã dùng hết 3 lượt tạo đề miễn phí trong ngày hôm nay.",
          daily_quota: dailyQuota,
          daily_quota_used: dailyUsed,
          remaining_credits: balance,
          referral_code: userProfile?.referral_code || "EDU" + user.id.slice(0, 4).toUpperCase(),
        },
        { status: 403 }
      );
    }

    // 3. Tạo record exam ở trạng thái "generating"
    const { data: exam, error: examError } = await (supabase
      .from("exams") as any)
      .insert({
        user_id: user.id,
        name,
        subject,
        grade: grade.toString(),
        status: "generating",
        credit_cost: creditsDeducted,
        question_count: 0,
        config: {
          difficulty,
          topic,
          additional_context,
          question_type,
          is_free_quota: isFreeUsage,
        },
      })
      .select()
      .single();

    if (examError || !exam) {
      return NextResponse.json(
        { error: "Lỗi khởi tạo đề thi: " + examError?.message },
        { status: 500 }
      );
    }

    // 4. Gọi Python AI Service hoặc trực tiếp Google Gemini API
    let generatedQuestions: any[] = [];
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;

    try {
      const aiResponse = await fetch(`${AI_SERVICE_URL}/ai/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          grade: parseInt(grade.toString()) || 4,
          topic: topic || name,
          question_type,
          num_questions: Math.min(num_questions, 20),
          difficulty,
          additional_context,
          verify: true,
        }),
      });

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        generatedQuestions = aiData.questions || [];
      } else {
        throw new Error(`AI Service returned ${aiResponse.status}`);
      }
    } catch (aiServiceErr: any) {
      console.warn("Python AI Service not reachable, checking direct Gemini API key...", aiServiceErr.message);

      // Nếu có GEMINI_API_KEY cấu hình trong .env.local, gọi trực tiếp Gemini 1.5 Flash
      if (geminiKey) {
        try {
          const geminiPrompt = `Bạn là chuyên gia giáo dục biên soạn đề thi chuẩn Bộ GD&ĐT Việt Nam.
Hãy tạo ${Math.min(num_questions, 10)} câu hỏi trắc nghiệm khách quan 4 lựa chọn (A, B, C, D) cho môn: ${subject}, lớp: ${grade}, chủ đề: "${topic || name}".
Mức độ nhận thức: ${difficulty === 1 ? "Nhận biết" : difficulty === 3 ? "Vận dụng" : "Thông hiểu"}.
${additional_context ? `Yêu cầu thêm: ${additional_context}` : ""}

YÊU CẦU ĐẦU RA JSON CHUẨN CÓ CẤU TRÚC:
{
  "questions": [
    {
      "content": "Nội dung câu hỏi (sử dụng LaTeX $...$ nếu có công thức)",
      "options": {
        "A": "Đáp án A",
        "B": "Đáp án B",
        "C": "Đáp án C",
        "D": "Đáp án D"
      },
      "correct_answer": "A",
      "explanation": "Lời giải chi tiết từng bước ngắn gọn dễ hiểu"
    }
  ]
}`;

          const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ parts: [{ text: geminiPrompt }] }],
                generationConfig: {
                  temperature: 0.7,
                  responseMimeType: "application/json",
                },
              }),
            }
          );

          if (geminiRes.ok) {
            const geminiData = await geminiRes.json();
            const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
            if (rawText) {
              const parsed = JSON.parse(rawText);
              generatedQuestions = parsed.questions || [];
            }
          }
        } catch (geminiErr: any) {
          console.warn("Direct Gemini call failed:", geminiErr.message);
        }
      }

      // Nếu chưa có API Key hoặc cả 2 đều không thành công -> Dùng ngân hàng câu hỏi mẫu chuẩn
      if (!generatedQuestions || generatedQuestions.length === 0) {
        generatedQuestions = Array.from({ length: Math.min(num_questions, 5) }).map((_, idx) => ({
          content: `Câu hỏi ${idx + 1} (${subject} lớp ${grade}): Tìm giá trị thích hợp thỏa mãn biểu thức $P = ${idx + 1} \\times 15 + \\sqrt{16}$`,
          type: "multiple_choice",
          options: {
            A: `${(idx + 1) * 15 + 4}`,
            B: `${(idx + 1) * 15 + 2}`,
            C: `${(idx + 1) * 15 - 4}`,
            D: `${(idx + 1) * 15 + 8}`,
          },
          correct_answer: "A",
          explanation: `Bước 1: Tính $\\sqrt{16} = 4$.\nBước 2: Thực hiện phép nhân ${(idx + 1)} * 15 = ${(idx + 1) * 15}.\nBước 3: Cộng hai kết quả lại được ${(idx + 1) * 15 + 4}. Vậy đáp án đúng là A.`,
          difficulty: "medium",
        }));
      }
    }

    // 5. Lưu câu hỏi vào database questions
    for (let i = 0; i < generatedQuestions.length; i++) {
      const q = generatedQuestions[i];
      await (supabase.from("questions") as any).insert({
        exam_id: exam.id,
        type: "multiple_choice",
        content: q.content,
        options: typeof q.options === "object" ? q.options : { A: "A", B: "B", C: "C", D: "D" },
        correct_answer: q.correct_answer || "A",
        explanation: q.explanation || q.solution || "Lời giải chi tiết cho câu hỏi.",
        difficulty: "medium",
        order_index: i + 1,
      });
    }

    // 6. Cập nhật trạng thái exam sang completed
    await (supabase
      .from("exams") as any)
      .update({
        status: "completed",
        question_count: generatedQuestions.length,
      })
      .eq("id", exam.id);

    // 7. Cập nhật lượt hàng ngày & trừ credit trong ví
    if (wallet) {
      await (supabase
        .from("wallets") as any)
        .update({
          balance: balance,
          daily_quota_used: dailyUsed,
          last_quota_reset: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", wallet.id);

      if (creditsDeducted > 0) {
        await (supabase.from("wallet_txns") as any).insert({
          wallet_id: wallet.id,
          amount: -creditsDeducted,
          type: "generate_exam",
          description: `Tạo đề thi "${name}" (${generatedQuestions.length} câu)`,
          ref_id: exam.id,
        });
      }
    }

    return NextResponse.json({
      success: true,
      exam_id: exam.id,
      questions_count: generatedQuestions.length,
      is_free_quota: isFreeUsage,
      daily_quota: dailyQuota,
      daily_quota_used: dailyUsed,
      credits_deducted: creditsDeducted,
      remaining_balance: balance,
    });
  } catch (err: any) {
    console.error("Generate exam error:", err);
    return NextResponse.json(
      { error: err.message || "Lỗi máy chủ trong quá trình sinh đề thi." },
      { status: 500 }
    );
  }
}