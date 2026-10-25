"""
Question Generator Agent - Generates high quality exam questions using LLM.
Fully compliant with Vietnam General Education Program 2018 (GDPT 2018).
Supports: MCQ, TRUE_FALSE, ESSAY, FILL_BLANK, SHORT_ANSWER.
"""

import json
import re
import structlog
from typing import Optional, Any
from pydantic import BaseModel, Field

from app.gateway.llm_gateway import gateway
from app.providers.base_provider import LLMRequest, ChatMessage

logger = structlog.get_logger()


class QuestionRequest(BaseModel):
    """Request payload to generate exam questions."""
    subject: str
    grade: int
    topic: str
    question_type: str = "MCQ"  # MCQ, TRUE_FALSE, FILL_BLANK, SHORT_ANSWER, ESSAY
    num_questions: int = 5
    difficulty: int = 2  # 1-4 (Nhận biết, Thông hiểu, Vận dụng, Vận dụng cao)
    language: str = "vi"
    additional_context: Optional[str] = None


class GeneratedQuestion(BaseModel):
    """Normalized generated question."""
    content: str
    type: str
    options: Optional[dict[str, str]] = None  # Format {"A": "...", "B": "...", "C": "...", "D": "..."}
    correct_answer: str = ""
    solution: str = ""
    bloom_level: str = "UNDERSTAND"
    difficulty: int = 2
    topic: str = ""


DIFFICULTY_LABELS = {
    1: "Nhận biết (Recall, định nghĩa, nhận diện cơ bản)",
    2: "Thông hiểu (Hiểu bản chất, giải thích, so sánh)",
    3: "Vận dụng (Áp dụng công thức, tính toán, tình huống thực tế cơ bản)",
    4: "Vận dụng cao (Tổng hợp nhiều kiến thức, giải quyết bài toán phức tạp, sáng tạo)",
}

BLOOM_MAPPING = {
    1: "REMEMBER",
    2: "UNDERSTAND",
    3: "APPLY",
    4: "ANALYZE",
}

SYSTEM_PROMPT = """Bạn là chuyên gia khảo thí và xây dựng ngân hàng đề thi hàng đầu Việt Nam theo chương trình Giáo dục Phổ thông mới (GDPT 2018) của Bộ Giáo dục & Đào tạo.

QUY TẮC BẮT BUỘC:
1. Ngôn ngữ: Tiếng Việt chuẩn mực sư phạm, chuẩn chính tả, rõ ràng, phù hợp khối lớp.
2. Tính chính xác: Nội dung chính xác 100% về mặt khoa học, không có yếu tố mơ hồ hay tranh cãi.
3. Ký hiệu Toán & Khoa học: Bắt buộc dùng LaTeX chuẩn:
   - Inline math: `$công thức$` (Ví dụ: `$y = x^2 - 4x + 3$`, `$\\Delta = b^2 - 4ac$`, `$H_2SO_4$`)
   - Block math nếu cần: `$$...$$`
4. Dạng Trắc nghiệm (MCQ):
   - Bắt buộc đủ 4 phương án ký hiệu key A, B, C, D trong object `options`.
   - Chỉ DUY NHẤT 1 phương án đúng, 3 phương án còn lại là phương án gây nhiễu (distractor) hợp lý, dựa trên các lỗi học sinh thường mắc phải.
   - `correct_answer` chỉ ghi chữ cái đại diện ("A", "B", "C", hoặc "D").
5. Dạng Đúng/Sai (TRUE_FALSE):
   - Mệnh đề rõ ràng, không mập mờ.
   - `correct_answer` chỉ là "Đúng" hoặc "Sai".
6. Lời giải (`solution`): Chi tiết từng bước dẫn tới kết quả, chỉ rõ phương pháp giải.
7. Đầu ra: CHỈ trả về duy nhất một chuỗi JSON hợp lệ theo schema sau (không thêm bất kỳ lời dẫn nào ngoài JSON):

{
  "questions": [
    {
      "content": "Nội dung câu hỏi chứa công thức LaTeX...",
      "options": {
        "A": "Nội dung phương án A",
        "B": "Nội dung phương án B",
        "C": "Nội dung phương án C",
        "D": "Nội dung phương án D"
      },
      "correct_answer": "A",
      "solution": "Hướng dẫn giải chi tiết từng bước...",
      "bloom_level": "REMEMBER / UNDERSTAND / APPLY / ANALYZE",
      "difficulty": 2,
      "topic": "Tên chủ đề"
    }
  ]
}
"""


class QuestionGeneratorAgent:
    """Agent 1: Generates exam questions based on curriculum requirements."""

    async def generate(self, request: QuestionRequest) -> list[GeneratedQuestion]:
        """Generate a set of questions."""
        prompt = self._build_prompt(request)

        llm_request = LLMRequest(
            messages=[
                ChatMessage(role="system", content=SYSTEM_PROMPT),
                ChatMessage(role="user", content=prompt),
            ],
            temperature=0.4,
            max_tokens=4096,
            response_format={"type": "json_object"},
        )

        response = await gateway.generate(
            request=llm_request,
            agent_type="question_generator",
            task_type=request.question_type.lower(),
        )

        questions = self._parse_response(response.content, request)

        # Fallback generation if parsing returned empty
        if not questions:
            logger.warning("Primary parse returned no questions, attempting recovery", content=response.content[:200])
            questions = self._recover_from_text(response.content, request)

        logger.info(
            "Questions generated successfully",
            count=len(questions),
            type=request.question_type,
            subject=request.subject,
            grade=request.grade,
            cost=f"${response.cost_usd:.6f}",
        )
        return questions

    def _build_prompt(self, request: QuestionRequest) -> str:
        diff_label = DIFFICULTY_LABELS.get(request.difficulty, "Thông hiểu")
        bloom_expected = BLOOM_MAPPING.get(request.difficulty, "UNDERSTAND")

        prompt = f"""Hãy biên soạn {request.num_questions} câu hỏi theo chuẩn GDPT 2018:
- Môn học: {request.subject}
- Khối lớp: Lớp {request.grade}
- Chủ đề / Bài học: {request.topic}
- Dạng câu hỏi: {request.question_type}
- Cấp độ nhận thức: {diff_label} (Bloom: {bloom_expected})
"""
        if request.additional_context:
            prompt += f"\nYêu cầu / Ngữ cảnh đặc thù của giáo viên:\n{request.additional_context}\n"

        # Specific prompt instructions per subject
        if request.subject in ["Toán", "Toán học"]:
            prompt += "- Chú ý: Đảm bảo các công thức toán học, tập nghiệm, tọa độ... được bọc chuẩn LaTeX bằng `$ ... $`.\n"
        elif request.subject in ["Vật lý", "Vật lí", "Hóa học"]:
            prompt += "- Chú ý: Đảm bảo đơn vị đo, phương trình phản ứng, chỉ số dưới/trên chính xác.\n"
        elif request.subject in ["Tiếng Anh", "Ngoại ngữ"]:
            prompt += "- Chú ý: Câu hỏi và các phương án bằng Tiếng Anh chuẩn ngữ pháp bản xứ, lời giải giải thích bằng Tiếng Việt.\n"

        prompt += "\nTrả về kết quả bằng chuỗi JSON thuần tuý có key 'questions'."
        return prompt

    def _parse_response(
        self, content: str, request: QuestionRequest
    ) -> list[GeneratedQuestion]:
        """Extract and validate questions from LLM response."""
        try:
            # Handle markdown code blocks if present
            clean_content = content.strip()
            if clean_content.startswith("```"):
                clean_content = re.sub(r"^```(?:json)?\n", "", clean_content)
                clean_content = re.sub(r"\n```$", "", clean_content)

            data = json.loads(clean_content)
            raw_questions = data.get("questions", [])
            if not isinstance(raw_questions, list):
                raw_questions = []
        except Exception as e:
            logger.error("JSON parsing error in generator", error=str(e), content=content[:200])
            return []

        questions: list[GeneratedQuestion] = []
        for q in raw_questions:
            if not isinstance(q, dict):
                continue

            content_text = q.get("content", "").strip()
            if not content_text:
                continue

            # Normalize options
            raw_options = q.get("options")
            options_dict: Optional[dict[str, str]] = None
            if isinstance(raw_options, dict):
                options_dict = {str(k).upper(): str(v).strip() for k, v in raw_options.items()}
            elif isinstance(raw_options, list):
                # Convert list ["A. ...", "B. ..."] to dict {"A": "...", "B": "..."}
                options_dict = {}
                keys = ["A", "B", "C", "D", "E"]
                for i, opt in enumerate(raw_options):
                    key = keys[i] if i < len(keys) else str(i)
                    val = str(opt).strip()
                    # Strip leading "A. " if exists
                    if re.match(r"^[A-Z]\.\s*", val):
                        val = re.sub(r"^[A-Z]\.\s*", "", val)
                    options_dict[key] = val

            correct_ans = str(q.get("correct_answer", "")).strip()
            if request.question_type.upper() == "MCQ" and correct_ans and len(correct_ans) > 1:
                # In case model returned "A. Đáp án" instead of "A"
                match = re.match(r"^([A-D])", correct_ans.upper())
                if match:
                    correct_ans = match.group(1)

            question = GeneratedQuestion(
                content=content_text,
                type=request.question_type,
                options=options_dict,
                correct_answer=correct_ans,
                solution=str(q.get("solution", "")).strip(),
                bloom_level=str(q.get("bloom_level", BLOOM_MAPPING.get(request.difficulty, "UNDERSTAND"))),
                difficulty=int(q.get("difficulty", request.difficulty)),
                topic=str(q.get("topic", request.topic)),
            )
            questions.append(question)

        return questions

    def _recover_from_text(self, content: str, request: QuestionRequest) -> list[GeneratedQuestion]:
        """Regex-based fallback extraction if json was subtly malformed."""
        try:
            match = re.search(r"\{[\s\S]*\"questions\"[\s\S]*\}", content)
            if match:
                data = json.loads(match.group(0))
                if "questions" in data:
                    return self._parse_response(match.group(0), request)
        except Exception:
            pass
        return []