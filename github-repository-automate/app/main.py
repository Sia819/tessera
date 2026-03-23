"""
FastAPI 애플리케이션 엔트리포인트.

- React SPA(index.html)를 서빙하고, API 라우터를 등록한다.
- 설정 미완료 시 React가 /setup으로 리다이렉트
- 웹훅 엔드포인트는 설정 완료 후에만 동작 (503)
"""

import logging
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app import config
from app.config import try_load_config
from app.state import app_state

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(title="GitHub-Notion Sync")

STATIC_DIR = Path(__file__).parent / "static"


@app.on_event("startup")
async def startup():
    """서버 시작 시 config.toml을 로드한다."""
    loaded = try_load_config()
    config.settings = loaded
    app_state.configured = loaded is not None
    if loaded:
        logger.info("설정 로드 완료")
    else:
        logger.warning("설정 미완료 — 설정 마법사 모드로 시작합니다.")


# API 라우터 등록
from app.routers import webhook, setup, dashboard  # noqa: E402

app.include_router(webhook.router)
app.include_router(setup.router)
app.include_router(dashboard.router)


@app.get("/health")
async def health():
    return {"status": "ok", "configured": app_state.configured}


# React SPA 정적 파일 서빙
# assets/ 디렉토리 (JS, CSS 번들)
app.mount("/assets", StaticFiles(directory=str(STATIC_DIR / "assets")), name="assets")


@app.get("/{full_path:path}")
async def serve_spa(request: Request, full_path: str):
    """API가 아닌 모든 경로에서 React SPA의 index.html을 반환한다."""
    # 정적 파일이 존재하면 직접 반환 (favicon.ico 등)
    file_path = STATIC_DIR / full_path
    if full_path and file_path.is_file():
        return FileResponse(file_path)
    # 그 외는 SPA index.html로 라우팅
    return FileResponse(STATIC_DIR / "index.html")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
