"""
SQLAlchemy 비동기 엔진 및 세션.

data/tessera.db에 SQLite를 사용한다.
도커 볼륨 마운트(data/)로 컨테이너 재시작에도 데이터가 유지된다.
"""

from pathlib import Path

from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"
DB_PATH = DATA_DIR / "tessera.db"

engine = create_async_engine(
    f"sqlite+aiosqlite:///{DB_PATH}",
    echo=False,
)
async_session = async_sessionmaker(engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def init_db():
    """테이블을 생성한다. 앱 시작 시 한 번 호출."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
