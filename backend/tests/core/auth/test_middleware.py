"""인증 미들웨어 테스트."""

from backend.core.auth.middleware import AuthMiddleware


class TestMiddleware우회경로:
    def test_auth_경로_우회(self):
        assert AuthMiddleware._is_bypassed("/auth/status") is True
        assert AuthMiddleware._is_bypassed("/auth/login") is True
        assert AuthMiddleware._is_bypassed("/auth/callback") is True

    def test_health_우회(self):
        assert AuthMiddleware._is_bypassed("/health") is True

    def test_webhook_우회(self):
        assert AuthMiddleware._is_bypassed("/api/plugins/github-sync/webhook/github-push") is True
        assert AuthMiddleware._is_bypassed("/api/plugins/github-sync/webhook/sync-all") is True

    def test_정적파일_우회(self):
        assert AuthMiddleware._is_bypassed("/") is True
        assert AuthMiddleware._is_bypassed("/assets/index.js") is True
        assert AuthMiddleware._is_bypassed("/some-random-path") is True

    def test_api_경로는_보호(self):
        assert AuthMiddleware._is_bypassed("/api/plugins") is False
        assert AuthMiddleware._is_bypassed("/api/plugins/github-sync/status") is False
        assert AuthMiddleware._is_bypassed("/api/plugins/github-sync/dashboard") is False
        assert AuthMiddleware._is_bypassed("/api/plugins/github-sync/sync/trigger") is False
