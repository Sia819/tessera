"""
Core API.

플러그인 목록, 시스템 감사 로그, SSE 실시간 스트림.
"""

import asyncio
import json
from dataclasses import asdict

from fastapi import APIRouter, Request
from starlette.responses import StreamingResponse

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


@router.get("/api/system/logs/stream")
async def system_logs_stream(request: Request):
    """SSE로 실시간 감사 로그를 스트리밍한다."""

    async def event_generator():
        q = audit.subscribe()
        try:
            while True:
                if await request.is_disconnected():
                    break
                try:
                    entry = await asyncio.wait_for(q.get(), timeout=30)
                    data = json.dumps(asdict(entry), ensure_ascii=False)
                    yield f"data: {data}\n\n"
                except asyncio.TimeoutError:
                    # keepalive
                    yield ": keepalive\n\n"
        finally:
            audit.unsubscribe(q)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
