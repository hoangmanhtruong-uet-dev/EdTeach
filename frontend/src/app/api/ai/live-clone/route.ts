import { NextRequest, NextResponse } from "next/server";
import { callGeminiJson } from "@/lib/ai/gemini-client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { question, options, subject, grade, currentAnswer } = body;

    if (!question) {
      return NextResponse.json({ error: "Thiếu nội dung câu hỏi gốc." }, { status: 400 });
    }

    const prompt = `
Bạn là chuyên gia ra đề thi THPT Quốc Gia môn ${subject || "Toán"} lớp ${grade || "12"} chuẩn Bộ GD&ĐT 2025.
Dưới đây là một câu hỏi gốc mà giáo viên vừa giảng xong trên lớp:

[CÂU HỎI GỐC]:
${question}

[CÁC PHƯƠNG ÁN GỐC]:
${Array.isArray(options) ? options.join("\n") : "Không có"}

[ĐÁP ÁN ĐÚNG HIỆN TẠI]: ${currentAnswer || "Chưa rõ"}

NHIỆM VỤ CỦA BẠN (TÍNH NĂNG ĐẺ CÂU TƯƠNG TỰ TẠI CHỖ CHO HỌC SINH LUYỆN TẬP 2 PHÚT):
Hãy tạo ra 1 CÂU HỎI MỚI TINH có các đặc tính sau:
1. Giữ nguyên 100% dạng bài toán, hiện tượng vật lý/hóa học/toán học và ma trận độ khó của câu gốc.
2. Thay đổi toàn bộ số liệu, bối cảnh bài toán, công thức hoặc chất hóa học (đảm bảo số liệu đẹp, giải ra kết quả hợp lý không bị lẻ vô lý).
3. Tạo 4 phương án trắc nghiệm A, B, C, D mới với 3 phương án gây nhiễu được tính toán theo các lỗi sai phổ biến của học sinh.
4. Cung cấp đáp án đúng và lời giải tóm tắt 3 dòng để giáo viên chữa nhanh.
5. Công thức toán học/ký hiệu viết bằng LaTeX kẹp giữa dấu $ (ví dụ $x^2 + 2x - 3 = 0$, $V = 22,4$ lít).

TRẢ VỀ DUY NHẤT ĐỊNH DẠNG JSON với cấu trúc:
{
  "content": "Nội dung câu hỏi mới...",
  "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
  "correct_answer": "A",
  "explanation": "Hướng dẫn giải nhanh cho câu mới..."
}
`;

    const result = await callGeminiJson(prompt);
    return NextResponse.json({ success: true, question: result });
  } catch (error: any) {
    console.error("Live question clone error:", error);
    const msg = error.name === "AbortError"
      ? "Quá thời gian phản hồi từ máy chủ AI. Vui lòng bấm thử lại."
      : error.message || "Không thể sinh câu hỏi tương tự.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
