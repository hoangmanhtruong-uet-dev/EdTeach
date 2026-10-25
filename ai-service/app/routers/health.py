"""Health check and monitoring endpoints."""

import traceback
from fastapi import APIRouter
import google.generativeai as genai
from app.gateway.llm_gateway import gateway
from app.core.config import settings

router = APIRouter(tags=["Health"])


@router.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "edutest-ai-service",
        "version": "0.1.0",
        "providers": {
            "google": bool(settings.GOOGLE_AI_API_KEY),
            "deepseek": bool(settings.DEEPSEEK_API_KEY),
        },
    }


@router.get("/ai/usage")
async def get_usage_stats():
    """Get AI API usage statistics."""
    return gateway.get_metrics()


@router.get("/debug-gemini")
async def debug_gemini():
    """Diagnostic endpoint to inspect Google Gemini models and test connection."""
    info = {
        "has_google_key": bool(settings.GOOGLE_AI_API_KEY),
        "key_prefix": (settings.GOOGLE_AI_API_KEY[:6] + "...") if settings.GOOGLE_AI_API_KEY else None,
        "models": [],
        "test_call": None,
        "error": None,
    }
    if settings.GOOGLE_AI_API_KEY:
        try:
            genai.configure(api_key=settings.GOOGLE_AI_API_KEY)
            # Test with gemini-3.8-flash
            test_model = "gemini-3.8-flash"
            m = genai.GenerativeModel(test_model)
            res = await m.generate_content_async("Xin chào, hãy trả lời 1 chữ: OK")
            info["test_call"] = {"model_used": test_model, "reply": res.text}
        except Exception as e:
            info["error"] = str(e)
            info["traceback"] = traceback.format_exc()
    return info
