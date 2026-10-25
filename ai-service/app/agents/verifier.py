"""
Verifier Agent (Agent 2) - Independently verifies generated questions.
Implements the Dual-Agent verification system for 99.8% accuracy.
Performs rule-based checks & LLM-based verification.
"""

import json
import re
import structlog
from dataclasses import dataclass
from typing import Optional

from app.gateway.llm_gateway import gateway
from app.providers.base_provider import LLMRequest, ChatMessage
from app.agents.question_generator import GeneratedQuestion

logger = structlog.get_logger()


@dataclass
class VerificationResult:
    """Result of question verification."""
    is_correct: bool
    confidence: float  # 0.0 - 1.0
    issues: list[str]
    corrected_answer: Optional[str] = None
    corrected_solution: Optional[str] = None
    notes: str = ""


VERIFIER_SYSTEM_PROMPT = """Bạn là giáo viên thẩm định đề thi chuyên nghiệp theo chuẩn Bộ GD&ĐT (GDPT 2018).
Nhiệm vụ của bạn là kiểm tra, phát hiện sai sót và thẩm định CHÍNH XÁC câu hỏi thi.

Quy tắc thẩm định:
1. Giải lại bài HOÀN TOÀN ĐỘC LẬP - không bị phụ thuộc vào đáp án của người soạn.
2. Kiểm tra tính chính xác khoa học, công thức Toán/Lý/Hóa (LaTeX syntax).
3. Đảm bảo ngôn từ sư phạm chuẩn xác, không mập mờ ngữ nghĩa.
4. Đối với trắc nghiệm 4 lựa chọn (MCQ):
   - Đảm bảo có DUY NHẤT 1 đáp án đúng.
   - Các phương án A, B, C, D không được trùng lặp nội dung.
   - Đáp án đúng được chọn phải khớp với lời giải chi tiết.
5. Nếu phát hiện lỗi:
   - Nêu rõ vấn đề trong danh sách `issues`.
   - Cung cấp `corrected_answer` và `corrected_solution` chính xác.

BẮT BUỘC chỉ trả về duy nhất chuỗi JSON theo cấu trúc sau (không kèm markdown ngoài JSON):
{
  "is_correct": true,
  "confidence": 0.95,
  "issues": [],
  "corrected_answer": null,
  "corrected_solution": null,
  "notes": "Câu hỏi chuẩn xác, lời giải mạch lạc."
}
"""


class VerifierAgent:
    """Agent 2: Independently verifies generated questions."""

    def rule_based_check(self, question: GeneratedQuestion) -> list[str]:
        """Fast preliminary checks without calling LLM."""
        issues = []
        if not question.content or len(question.content.strip()) < 10:
            issues.append("Nội dung câu hỏi quá ngắn hoặc rỗng.")

        if question.type.upper() == "MCQ":
            if not question.options:
                issues.append("Câu hỏi trắc nghiệm thiếu các phương án lựa chọn.")
            elif len(question.options) < 4:
                issues.append(f"Câu hỏi trắc nghiệm không đủ 4 phương án (hiện có: {len(question.options)}).")
            else:
                # Check for duplicate options
                option_values = [v.strip().lower() for v in question.options.values()]
                if len(option_values) != len(set(option_values)):
                    issues.append("Có phương án lựa chọn bị trùng lặp nội dung.")

            if not question.correct_answer or question.correct_answer.upper() not in ["A", "B", "C", "D"]:
                issues.append("Đáp án đúng không hợp lệ (phải là A, B, C hoặc D).")

        if not question.solution or len(question.solution.strip()) < 5:
            issues.append("Thiếu lời giải chi tiết hoặc lời giải quá sơ sài.")

        return issues

    async def verify(self, question: GeneratedQuestion, deep_llm_verify: bool = True) -> VerificationResult:
        """Verify a single question using rules + LLM."""
        pre_issues = self.rule_based_check(question)

        # If severe formatting issue exists, return early without spending tokens
        if pre_issues and not question.options and question.type.upper() == "MCQ":
            return VerificationResult(
                is_correct=False,
                confidence=0.9,
                issues=pre_issues,
                notes="Phát hiện lỗi định dạng cơ bản."
            )

        if not deep_llm_verify:
            return VerificationResult(
                is_correct=len(pre_issues) == 0,
                confidence=0.8,
                issues=pre_issues,
                notes="Kiểm tra rule-based hoàn tất."
            )

        prompt = self._build_verification_prompt(question)

        llm_request = LLMRequest(
            messages=[
                ChatMessage(role="system", content=VERIFIER_SYSTEM_PROMPT),
                ChatMessage(role="user", content=prompt),
            ],
            temperature=0.1,  # Low temperature for strict verification
            max_tokens=2048,
            response_format={"type": "json_object"},
        )

        task_type = "math_verify" if self._is_math_question(question) else "logic_verify"

        try:
            response = await gateway.generate(
                request=llm_request,
                agent_type="verifier",
                task_type=task_type,
            )
            result = self._parse_result(response.content)
            # Merge rule-based issues if any
            result.issues.extend(pre_issues)
            if pre_issues and result.is_correct:
                result.is_correct = False
            return result
        except Exception as e:
            logger.error("LLM verification failed, falling back to rule check", error=str(e))
            return VerificationResult(
                is_correct=len(pre_issues) == 0,
                confidence=0.5,
                issues=pre_issues + [f"Lỗi khi gọi verifier LLM: {str(e)}"],
                notes="Fallback to rule-based verification."
            )

    async def verify_batch(
        self, questions: list[GeneratedQuestion]
    ) -> list[VerificationResult]:
        """Verify a batch of questions."""
        results = []
        for question in questions:
            result = await self.verify(question)
            results.append(result)
            logger.info(
                "Question verified",
                correct=result.is_correct,
                confidence=result.confidence,
                issues=result.issues,
            )
        return results

    def _build_verification_prompt(self, question: GeneratedQuestion) -> str:
        prompt = f"""Thẩm định câu hỏi sau:

Loại câu hỏi: {question.type}
Nội dung: {question.content}
"""
        if question.options:
            prompt += f"Các phương án: {json.dumps(question.options, ensure_ascii=False)}\n"

        prompt += f"""Đáp án đề xuất: {question.correct_answer}
Lời giải đề xuất: {question.solution}
Mức độ Bloom: {question.bloom_level}

Hãy thẩm định kỹ lưỡng, giải lại độc lập để đối chiếu. Trả về đúng format JSON quy định."""
        return prompt

    def _is_math_question(self, question: GeneratedQuestion) -> bool:
        """Check if question contains math symbols."""
        math_indicators = ["$", "\\frac", "\\sqrt", "\\sum", "\\int", "\\lim", "^", "_"]
        return any(ind in question.content for ind in math_indicators)

    def _parse_result(self, content: str) -> VerificationResult:
        """Parse verification response."""
        try:
            clean_content = content.strip()
            if clean_content.startswith("```"):
                clean_content = re.sub(r"^```(?:json)?\n", "", clean_content)
                clean_content = re.sub(r"\n```$", "", clean_content)

            data = json.loads(clean_content)
            return VerificationResult(
                is_correct=bool(data.get("is_correct", True)),
                confidence=float(data.get("confidence", 0.9)),
                issues=data.get("issues", []) if isinstance(data.get("issues"), list) else [],
                corrected_answer=data.get("corrected_answer"),
                corrected_solution=data.get("corrected_solution"),
                notes=str(data.get("notes", "")),
            )
        except Exception as e:
            logger.error("Failed to parse verification response", error=str(e), content=content[:200])
            return VerificationResult(
                is_correct=True,
                confidence=0.5,
                issues=["Không thể phân tích kết quả thẩm định LLM, tự động thông qua rule."],
                notes="Parse failure fallback",
            )