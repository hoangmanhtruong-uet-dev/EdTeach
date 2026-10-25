"""Dependency injection for FastAPI."""

from functools import lru_cache
from typing import Optional
from fastapi import Header, HTTPException, status
from app.core.config import Settings, settings


@lru_cache()
def get_settings() -> Settings:
    return Settings()


async def verify_internal_api_key(
    x_internal_key: Optional[str] = Header(None, alias="X-Internal-Key")
):
    """
    Xác thực khóa bảo vệ nội bộ giữa Next.js Frontend và Python AI Service.
    Nếu INTERNAL_API_KEY được cấu hình trong môi trường, bắt buộc request phải có X-Internal-Key hợp lệ.
    """
    configured_key = settings.INTERNAL_API_KEY
    if configured_key:
        if not x_internal_key or x_internal_key != configured_key:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Unauthorized: Khóa API nội bộ không hợp lệ hoặc bị thiếu (X-Internal-Key)."
            )
