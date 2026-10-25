"""Health check and monitoring endpoints."""

from fastapi import APIRouter
from app.gateway.llm_gateway import gateway

router = APIRouter(tags=["Health"])


@router.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "edutest-ai-service",
        "version": "0.1.0",
    }


@router.get("/ai/usage")
async def get_usage_stats():
    """Get AI API usage statistics."""
    return gateway.get_metrics()