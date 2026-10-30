import { NextRequest, NextResponse } from "next/server";
import { callGeminiJson } from "@/lib/ai/gemini-client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { question, options, subject, grade, currentAnswer, explanation } = body;

    if (!question) {
      return NextResponse.json({ error: "Thiếu nội dung câu hỏi." }, { status: 400 });
    }

    const prompt = `
Bạn là chuyên gia giảng dạy và thủ khoa luyện thi môn ${subject || "Toán"} lớp ${grade || "12"} chuẩn Bộ GD&ĐT 2025.
Dưới đây là một câu hỏi trắc nghiệm cần giải thích chuyên sâu cho giáo viên dùng làm tư liệu trình chiếu trên lớp:

[CÂU HỎI]:
${question}

[CÁC PHƯƠNG ÁN]:
${Array.isArray(options) ? options.join("\n") : "Không có"}

[ĐÁP ÁN ĐÚNG]: ${currentAnswer || "Chưa rõ"}
[LỜI GIẢI GỐC NẾU CÓ]: ${explanation || "Không có"}

NHIỆM VỤ CỦA BẠN (TÍNH NĂNG GIẢI ĐA CÁCH CHUYÊN SÂU CHO GÓI MAX):
Hãy cung cấp 3 PHƯƠNG PHÁP GIẢI KHÁC NHAU cho câu hỏi này để giáo viên mở rộng góc nhìn cho học sinh:

1. PHƯƠNG PHÁP 1: "Tự luận Bản chất"
   - Trình bày bài bản, chặt chẽ từng bước theo sách giáo khoa và bản chất khoa học.
   - Giúp học sinh nắm vững lý thuyết, không bị rơi vào bẫy câu hỏi thay đổi dữ kiện.

2. PHƯƠNG PHÁP 2: "Tuyệt kỹ 15s Trắc nghiệm & Loại trừ"
   - Áp dụng các định luật bảo toàn, công thức giải nhanh kinh điển, phương pháp đánh giá biên, chuẩn hóa số liệu hoặc phân tích loại trừ đáp án vô lý chỉ trong 15-30 giây.

3. PHƯƠNG PHÁP 3: "Bấm máy Casio fx-580 / fx-880" (Nếu bài lý thuyết không bấm được máy tính, hãy thay bằng "Mẹo ghi nhớ nhanh & Quy tắc bàn tay/vần thơ")
   - Hướng dẫn cụ thể từng bước phím bấm (ví dụ: MENU 8, SHIFT SOLVE, gán biến A, B...) hoặc mẹo nhớ siêu tốc để tìm ra đáp án.

Công thức toán học/ký hiệu viết bằng LaTeX kẹp giữa dấu $ (ví dụ $\\int f(x)dx$).

TRẢ VỀ DUY NHẤT ĐỊNH DẠNG JSON với cấu trúc:
{
  "methods": [
    {
      "id": "tu-luan",
      "name": "Cách 1: Tự luận bản chất",
      "badge": "Bản chất GDPT 2018",
      "summary": "Tóm tắt ngắn 1 dòng về ý tưởng...",
      "content": "Nội dung chi tiết lời giải tự luận..."
    },
    {
      "id": "trac-nghiem",
      "name": "Cách 2: Tuyệt kỹ 15s Trắc nghiệm",
      "badge": "Giải nhanh 15 giây",
      "summary": "Công thức giải nhanh hoặc mẹo loại trừ...",
      "content": "Nội dung chi tiết cách giải nhanh..."
    },
    {
      "id": "casio",
      "name": "Cách 3: Thủ thuật Casio fx-580 / Mẹo nhớ",
      "badge": "Bấm máy & Quy tắc",
      "summary": "Tóm tắt thao tác máy tính...",
      "content": "Nội dung chi tiết các bước bấm máy tính hoặc mẹo..."
    }
  ]
}
`;

    const result = await callGeminiJson(prompt);
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error("Multi-method generation error:", error);
    const msg = error.name === "AbortError"
      ? "Quá thời gian phản hồi từ máy chủ AI. Vui lòng bấm thử lại."
      : error.message || "Không thể phân tích đa phương pháp giải.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
