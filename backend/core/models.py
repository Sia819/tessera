"""
ORM 모델 정의.

모든 테이블은 여기에서 선언한다.
database.py의 Base를 상속하여 init_db()에서 자동 생성된다.
"""

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from backend.core.database import Base


class AuditLog(Base):
    """시스템 감사 로그."""

    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(primary_key=True)
    timestamp: Mapped[float] = mapped_column(index=True)
    ip: Mapped[str] = mapped_column(String(45))
    method: Mapped[str] = mapped_column(String(10))
    path: Mapped[str] = mapped_column(String(500))
    status: Mapped[int]
    user: Mapped[str | None] = mapped_column(String(255), default=None)
    event: Mapped[str | None] = mapped_column(String(50), index=True, default=None)
    detail: Mapped[str | None] = mapped_column(String(500), default=None)
    version: Mapped[str | None] = mapped_column(String(100), default=None)
