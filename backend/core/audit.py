"""
시스템 감사 로그.

모든 인증 이벤트와 API 요청을 기록하는 순환 버퍼.
IP, 메서드, 경로, 사용자, 상태 코드를 추적한다.
"""

import time
from collections import deque
from dataclasses import dataclass, field, asdict

MAX_ENTRIES = 500


@dataclass
class AuditEntry:
    timestamp: float
    ip: str
    method: str
    path: str
    status: int
    user: str | None = None
    event: str | None = None  # login_success, login_rejected, auth_setup, logout 등
    detail: str | None = None


_log: deque[AuditEntry] = deque(maxlen=MAX_ENTRIES)


def add_entry(
    ip: str,
    method: str,
    path: str,
    status: int,
    user: str | None = None,
    event: str | None = None,
    detail: str | None = None,
) -> None:
    """감사 로그에 항목을 추가한다."""
    _log.appendleft(AuditEntry(
        timestamp=time.time(),
        ip=ip,
        method=method,
        path=path,
        status=status,
        user=user,
        event=event,
        detail=detail,
    ))


def get_entries(limit: int = 200) -> list[dict]:
    """최근 감사 로그를 반환한다."""
    return [asdict(e) for e in list(_log)[:limit]]
