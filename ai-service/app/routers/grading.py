"""API endpoints for AI Grading (MCQ and Essay with Rubric)."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, Any
import json
import structlog
from app.gateway.router import LLMRouter
from app.core.config import settings

logger = structlog.get_logger()
router = APIRouter(prefix="/ai/grade", tags=["AI Grading"])
llm_router = LLMRouter()


class MCQGradeRequest(BaseModel):
    answer_key: dict[str, str] = Field(..., description="Đáp án chuẩn: {'1': 'A', '2': 'B', ...}")
    student_answers: dict[str, str] = Field(..., description="Đáp án học sinh: {'1': 'A', '2': 'C', ...}")


class EssayGradeRequest(BaseModel):
    question: str = Field(..., description="Đề bài hoặc câu hỏi tự luận")
    rubric: Optional[str] = Field(None, description="Barem thang điểm chi tiết")
    student_answer: str = Field(..., description="Nội dung bài làm của học sinh")


@router.post("/mcq")
async def grade_mcq(req: MCQGradeRequest):
    """Auto-grade multiple choice questions against answer key."""
    total = len(req.answer_key)
    if total == 0:
        raise HTTPException(status_code=400, detail="Đáp án mẫu rỗng")

    correct = 0
    incorrect = 0
    unanswered = 0
    details = []

    for q_num, ans in req.answer_key.items():
        std_ans = req.student_answers.get(str(q_num), "").strip().upper()
        correct_ans = ans.strip().upper()

        if not std_ans:
            unanswered += 1
            details.append({
                "question": q_num,
                "correct": correct_ans,
                "student": "Chưa làm",
                "is_correct": False
            })
        elif std_ans == correct_ans:
            correct += 1
            details.append({
                "question": q_num,
                "correct": correct_ans,
                "student": std_ans,
                "is_correct": True
            })
        else:
            incorrect += 1
            details.append({
                "question": q_num,
                "correct": correct_ans,
                "student": std_ans,
                "is_correct": False
            })

    score = round((correct / total) * 10, 2)
    return {
        "success": True,
        "mode": "mcq",
        "score": score,
        "total_questions": total,
        "correct_count": correct,
        "incorrect_count": incorrect,
        "unanswered_count": unanswered,
        "details": details
    }


@router.post("/essay")
async def grade_essay(req: EssayGradeRequest):
    """AI-powered essay grading based on rubric."""
    api_key = settings.GOOGLE_AI_API_KEY or settings.DEEPSEEK_API_KEY
    rubric = req.rubric or "Thang điểm 10 Bộ GD&ĐT: Ý 1 (4đ) kiến thức cốt lõi, Ý 2 (3đ) lập luận và dẫn chứng, Ý 3 (2đ) diễn đạt chính tả, Ý 4 (1đ) sáng tạo."

    if not api_key:
        # Fallback simulation
        word_count = len(req.student_answer.split())
        score = 8.0 if word_count > 100 else 6.5
        return {
            "success": True,
            "mode": "essay",
            "has_api_key": False,
            "total_score": score,
            "max_score": 10.0,
            "grade_level": "Khá",
            "criteria_scores": [
                {"criterion": "Kiến thức cốt lõi", "score": round(score * 0.4, 1), "max": 4.0},
                {"criterion": "Lập luận & Dẫn chứng", "score": round(score * 0.3, 1), "max": 3.0},
                {"criterion": "Trình bày & Diễn đạt", "score": round(score * 0.2, 1), "max": 2.0},
                {"criterion": "Sáng tạo", "score": round(score * 0.1, 1), "max": 1.0},
            ],
            "strengths": ["Nắm bắt đúng nội dung câu hỏi", "Cấu trúc câu rõ ràng"],
            "weaknesses": ["Cần bổ sung thêm ví dụ minh họa"],
            "teacher_feedback": "Bài làm tương đối tốt. Cần phát triển thêm các ý sâu hơn."
        }

    # Gemini call
    try:
        from app.providers.google_provider import GoogleProvider
        from app.providers.base_provider import LLMRequest, ChatMessage

        provider = GoogleProvider(api_key=settings.GOOGLE_AI_API_KEY)
        prompt = f"""Bạn là giám khảo chuyên môn Bộ GD&ĐT. Hãy chấm bài tự luận sau theo Barem:
[ĐỀ BÀI]: {req.question}
[BAREM ĐIỂM]: {rubric}
[BÀI LÀM]: {req.student_answer}

Trả về JSON:
{{
  "total_score": 8.5,
  "max_score": 10.0,
  "grade_level": "Giỏi",
  "criteria_scores": [
    {{"criterion": "Kiến thức", "score": 3.5, "max": 4.0, "feedback": "Đủ ý"}},
    {{"criterion": "Lập luận", "score": 2.5, "max": 3.0, "feedback": "Chặt chẽ"}},
    {{"criterion": "Trình bày", "score": 1.75, "max": 2.0, "feedback": "Rõ ràng"}},
    {{"criterion": "Sáng tạo", "score": 0.75, "max": 1.0, "feedback": "Tốt"}}
  ],
  "strengths": ["Ưu điểm 1", "Ưu điểm 2"],
  "weaknesses": ["Nhược điểm 1"],
  "teacher_feedback": "Lời nhận xét chi tiết"
}}"""

        res = await provider.generate(LLMRequest(
            messages=[ChatMessage(role="user", content=prompt)],
            temperature=0.3,
            response_format={"type": "json_object"}
        ))
        data = json.loads(res.content)
        return {"success": True, "has_api_key": True, **data}
    except Exception as e:
        logger.error("Essay grading error", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))
