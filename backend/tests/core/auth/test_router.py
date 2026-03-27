"""인증 라우터 엔드포인트 테스트."""

from fastapi.testclient import TestClient

from backend.main import app
from backend.core.auth.jwt_utils import create_token

client = TestClient(app)
_token = create_token({"email": "test@test.com"}, "test-jwt-secret", 3600)
client.cookies.set("tessera_session", _token)


class TestAuth엔드포인트:
    def test_auth_status_설정됨(self):
        """conftest에서 auth가 설정되어 있으므로 auth_configured: true."""
        res = client.get("/auth/status")
        assert res.status_code == 200
        data = res.json()
        assert data["auth_configured"] is True
        assert data["authenticated"] is True

    def test_auth_login_설정됨_리다이렉트(self):
        """설정됨 상태에서 login은 Google로 리다이렉트."""
        res = client.get("/auth/login", follow_redirects=False)
        assert res.status_code == 307
        assert "accounts.google.com" in res.headers["location"]

    def test_auth_logout(self):
        """로그아웃은 항상 성공."""
        res = client.post("/auth/logout")
        assert res.status_code == 200
        assert res.json()["status"] == "ok"

    def test_auth_setup_이미설정시_403(self):
        """이미 설정된 상태에서 setup 시도하면 403."""
        res = client.post("/auth/setup", json={
            "google_client_id": "id",
            "google_client_secret": "secret",
            "allowed_emails": ["a@b.com"],
        })
        assert res.status_code == 403

    def test_인증된_api_접근_성공(self):
        """유효한 세션 쿠키로 /api/* 접근 가능."""
        res = client.get("/api/plugins")
        assert res.status_code == 200
