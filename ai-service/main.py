"""
EduTest AI Service - FastAPI Application
Main entry point for the AI microservice.
"""

import logging
import sys
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import structlog

from app.core.config import settings
from app.routers import generation, health, grading, omr_grading

# Configure standard logging & structured logging
log_level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)
logging.basicConfig(
    format="%(message)s",
    stream=sys.stdout,
    level=log_level,
)

structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.dev.ConsoleRenderer(),
    ],
    wrapper_class=structlog.stdlib.BoundLogger,
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()

# Create FastAPI app
app = FastAPI(
    title="EduTest AI Service",
    description=(
        "AI microservice for exam question generation, verification, "
        "OCR, and grading. Powered by DeepSeek & Gemini."
    ),
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(health.router)
app.include_router(generation.router)
app.include_router(grading.router)
app.include_router(omr_grading.router)


@app.get("/", tags=["Root"])
async def root():
    """Root endpoint for status check."""
    return {
        "status": "online",
        "service": "EduTest AI Backend",
        "docs": "/docs",
        "health": "/health",
    }


@app.on_event("startup")
async def startup():
    logger.info(
        "EduTest AI Service starting",
        env=settings.APP_ENV,
        providers_configured={
            "deepseek": bool(settings.DEEPSEEK_API_KEY),
            "google": bool(settings.GOOGLE_AI_API_KEY),
        },
    )


@app.on_event("shutdown")
async def shutdown():
    logger.info("EduTest AI Service shutting down")
