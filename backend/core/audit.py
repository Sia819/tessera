"""
시스템 감사 로그.

모든 인증 이벤트와 API 요청을 기록하는 순환 버퍼.
SSE 구독자에게 실시간으로 새 항목을 푸시한다.
"""

import asyncio
import json
import time
from collections import deque
from dataclasses import dataclass, asdict

MAX_ENTRIES = 500


@dataclass
class AuditEntry:
    timestamp: float
    ip: str
    method: str
    path: str
    status: int
    user: str | None = None
    event: str | None = None
    detail: str | None = None


_log: deque[AuditEntry] = deque(maxlen=MAX_ENTRIES)
_subscribers: list[asyncio.Queue] = []


def add_entry(
    ip: str,
    method: str,
    path: str,
    status: int,
    user: str | None = None,
    event: str | None = None,
    detail: str | None = None,
) -> None:
    """감사 로그에 항목을 추가하고 SSE 구독자에게 푸시한다."""
    entry = AuditEntry(
        timestamp=time.time(),
        ip=ip,
        method=method,
        path=path,
        status=status,
        user=user,
        event=event,
        detail=detail,
    )
    _log.appendleft(entry)

    # 모든 SSE 구독자에게 비동기 푸시
    dead = []
    for q in _subscribers:
        try:
            q.put_nowait(entry)
        except asyncio.QueueFull:
            dead.append(q)
    for q in dead:
        _subscribers.remove(q)


def get_entries(limit: int = 200) -> list[dict]:
    """최근 감사 로그를 반환한다."""
    return [asdict(e) for e in list(_log)[:limit]]


def subscribe() -> asyncio.Queue:
    """SSE 구독용 큐를 생성하고 등록한다."""
    q: asyncio.Queue = asyncio.Queue(maxsize=100)
    _subscribers.append(q)
    return q


def unsubscribe(q: asyncio.Queue) -> None:
    """SSE 구독을 해제한다."""
    if q in _subscribers:
        _subscribers.remove(q)
