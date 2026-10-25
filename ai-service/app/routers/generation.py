"""API endpoints for exam question generation."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, Any

from app.agents.question_generator import QuestionGeneratorAgent, QuestionRequest
from app.agents.verifier import VerifierAgent

router = APIRouter(prefix="/ai", tags=["AI Generation"])

generator = QuestionGeneratorAgent()
verifier = VerifierAgent()


class GenerateRequest(BaseModel):
    """Request body for question generation."""
    subject: str = Field(..., description="Môn học (Toán, Vật lý, Hóa học, ...)")
    grade: int = Field(..., ge=1, le=12, description="Lớp (1-12)")
    topic: str = Field(..., description="Chủ đề/Bài học")
    question_type: str = Field(
        default="MCQ",
        description="Loại câu hỏi: MCQ, TRUE_FALSE, FILL_BLANK, SHORT_ANSWER, ESSAY"
    )
    num_questions: int = Field(default=5, ge=1, le=50, description="Số câu hỏi cần tạo")
    difficulty: int = Field(
        default=2, ge=1, le=4,
        description="Mức độ: 1=Nhận biết, 2=Thông hiểu, 3=Vận dụng, 4=Vận dụng cao"
    )
    additional_context: Optional[str] = Field(
        None, description="Ngữ cảnh bổ sung hoặc hướng dẫn đặc thù của giáo viên"
    )
    verify: bool = Field(
        default=True, description="Bật Dual-Agent verification"
    )


class QuestionResponse(BaseModel):
    """A single generated question response."""
    content: str
    type: str
    options: Optional[dict[str, str]] = None
    correct_answer: str
    solution: str
    bloom_level: str
    difficulty: int
    is_verified: bool = False
    verification_confidence: float = 0.0
    issues: list[str] = []


class GenerateResponse(BaseModel):
    """Response from question generation."""
    success: bool = True
    questions: list[QuestionResponse]
    total: int
    verified: bool


@router.post("/generate", response_model=GenerateResponse)
async def generate_questions(request: GenerateRequest):
    """
    Generate exam questions using AI.

    Supports Dual-Agent verification:
    - Agent 1 (Generator): Creates questions conforming to GDPT 2018
    - Agent 2 (Verifier): Independently verifies accuracy & LaTeX formatting
    """
    try:
        # Step 1: Generate questions
        question_request = QuestionRequest(
            subject=request.subject,
            grade=request.grade,
            topic=request.topic,
            question_type=request.question_type,
            num_questions=request.num_questions,
            difficulty=request.difficulty,
            additional_context=request.additional_context,
        )

        questions = await generator.generate(question_request)

        if not questions:
            raise HTTPException(
                status_code=500,
                detail="Không thể tạo câu hỏi hoặc parse dữ liệu AI thất bại. Vui lòng thử lại."
            )

        # Step 2: Verify if requested
        results = []
        for q in questions:
            response_q = QuestionResponse(
                content=q.content,
                type=q.type,
                options=q.options,
                correct_answer=q.correct_answer,
                solution=q.solution,
                bloom_level=q.bloom_level,
                difficulty=q.difficulty,
            )

            if request.verify:
                verification = await verifier.verify(q)
                response_q.is_verified = verification.is_correct
                response_q.verification_confidence = verification.confidence
                response_q.issues = verification.issues

                # Apply corrections if verified wrong but correct suggestion provided
                if not verification.is_correct and verification.corrected_answer:
                    response_q.correct_answer = verification.corrected_answer
                if not verification.is_correct and verification.corrected_solution:
                    response_q.solution = verification.corrected_solution

            results.append(response_q)

        return GenerateResponse(
            success=True,
            questions=results,
            total=len(results),
            verified=request.verify,
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi xử lý AI: {str(e)}")