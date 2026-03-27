"""
Core API.

플러그인 목록과 시스템 감사 로그를 제공하는 엔드포인트.
"""

from fastapi import APIRouter

from backend.core import audit
from backend.core.plugin_registry import get_registered

router = APIRouter(tags=["core"])


@router.get("/api/plugins")
async def list_plugins():
    """등록된 플러그인 매니페스트 목록을 반환한다."""
    return {"plugins": get_registered()}


@router.get("/api/system/logs")
async def system_logs(limit: int = 200):
    """시스템 감사 로그를 반환한다."""
    return {"logs": audit.get_entries(min(limit, 500))}
