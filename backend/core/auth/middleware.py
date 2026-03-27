"""
인증 미들웨어.

항상 활성화되며, 인증 상태에 따라 동작:
- auth 미설정: /auth/* 외 모든 /api/* 차단 (초기 설정 유도)
- auth 설정됨: JWT 쿠키 검증

모든 /api/* 및 /auth/* 요청을 감사 로그에 기록한다.
"""

import logging

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

from backend.core.auth import auth_configured, get_auth_config
from backend.core.auth.jwt_utils import verify_token
from backend.core import audit

logger = logging.getLogger(__name__)


def _get_client_ip(request: Request) -> str:
    """클라이언트 IP를 추출한다. 리버스 프록시 헤더 우선."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        method = request.method
        ip = _get_client_ip(request)

        # 항상 우회하는 경로
        if self._is_bypassed(path):
            response = await call_next(request)
            # auth 경로는 router에서 별도 감사 로깅
            return response

        # auth 미설정: /api/* 접근 차단
        if not auth_configured():
            audit.add_entry(ip=ip, method=method, path=path, status=401, detail="auth not configured")
            return JSONResponse(
                status_code=401, content={"detail": "Authentication not configured"}
            )

        # auth 설정됨: JWT 쿠키 검증
        cfg = get_auth_config()
        token = request.cookies.get("tessera_session")
        if not token:
            audit.add_entry(ip=ip, method=method, path=path, status=401, detail="no session cookie")
            return JSONResponse(
                status_code=401, content={"detail": "Not authenticated"}
            )

        payload = verify_token(token, cfg.jwt_secret)
        if not payload:
            audit.add_entry(ip=ip, method=method, path=path, status=401, detail="session expired")
            return JSONResponse(
                status_code=401, content={"detail": "Session expired"}
            )

        request.state.user = payload
        response = await call_next(request)

        # API 요청 로그 (정상 요청만, 너무 빈번한 경로는 제외)
        if not self._is_noisy(path):
            audit.add_entry(
                ip=ip, method=method, path=path,
                status=response.status_code,
                user=payload.get("email"),
            )

        return response

    @staticmethod
    def _is_bypassed(path: str) -> bool:
        if path.startswith("/auth/"):
            return True
        if path == "/health":
            return True
        if "/webhook/" in path:
            return True
        if not path.startswith("/api/"):
            return True
        return False

    @staticmethod
    def _is_noisy(path: str) -> bool:
        """자주 호출되는 폴링 경로를 감사 로그에서 제외."""
        noisy = ("/status", "/dashboard", "/sync/logs", "/system/logs")
        return any(path.endswith(p) for p in noisy)
