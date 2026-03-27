"""
시스템 감사 로그.

SQLAlchemy로 data/tessera.db에 영속 저장한다.
SSE 구독자에게 실시간으로 새 항목을 푸시한다.
"""

import asyncio
import time

from sqlalchemy import select

from backend.core.models import AuditLog
from backend.core.version import VERSION_STRING

_subscribers: list[asyncio.Queue] = []


async def add_entry(
    ip: str,
    method: str,
    path: str,
    status: int,
    user: str | None = None,
    event: str | None = None,
    detail: str | None = None,
) -> None:
    """감사 로그를 DB에 저장하고 SSE 구독자에게 푸시한다."""
    entry = AuditLog(
        timestamp=time.time(),
        ip=ip,
        method=method,
        path=path,
        status=status,
        user=user,
        event=event,
        detail=detail,
        version=VERSION_STRING,
    )

    from backend.core.database import async_session
    async with async_session() as session:
        session.add(entry)
        await session.commit()
        await session.refresh(entry)

    # SSE 구독자에게 실시간 푸시
    entry_dict = _to_dict(entry)
    dead = []
    for q in _subscribers:
        try:
            q.put_nowait(entry_dict)
        except asyncio.QueueFull:
            dead.append(q)
    for q in dead:
        _subscribers.remove(q)


async def get_entries(limit: int = 200, event_filter: str | None = None) -> list[dict]:
    """DB에서 최신 순으로 감사 로그를 조회한다."""
    from backend.core.database import async_session
    async with async_session() as session:
        query = select(AuditLog).order_by(AuditLog.timestamp.desc())
        if event_filter == "auth":
            query = query.where(AuditLog.event.isnot(None))
        elif event_filter == "api":
            query = query.where(AuditLog.event.is_(None))
        result = await session.scalars(query.limit(limit))
        return [_to_dict(row) for row in result]


def subscribe() -> asyncio.Queue:
    """SSE 구독용 큐를 생성하고 등록한다."""
    q: asyncio.Queue = asyncio.Queue(maxsize=100)
    _subscribers.append(q)
    return q


def unsubscribe(q: asyncio.Queue) -> None:
    """SSE 구독을 해제한다."""
    if q in _subscribers:
        _subscribers.remove(q)


def _to_dict(entry: AuditLog) -> dict:
    return {
        "id": entry.id,
        "timestamp": entry.timestamp,
        "ip": entry.ip,
        "method": entry.method,
        "path": entry.path,
        "status": entry.status,
        "user": entry.user,
        "event": entry.event,
        "detail": entry.detail,
        "version": entry.version,
    }
