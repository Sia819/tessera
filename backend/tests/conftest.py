"""공통 테스트 fixture."""

import pytest

from backend.core.auth.config import AuthConfig


# auth 미들웨어 우회: 테스트 환경에서는 인증 통과
_test_auth_config = AuthConfig(
    google_client_id="test-id",
    google_client_secret="test-secret",
    allowed_emails=["test@test.com"],
    jwt_secret="test-jwt-secret",
    oauth_redirect_uri=None,
    session_max_age=3600,
)


@pytest.fixture(autouse=True, scope="session")
def _bypass_auth():
    """모든 테스트에서 auth 미들웨어를 우회한다."""
    import backend.core.auth as auth_module
    import backend.core.auth.middleware as mw_module

    auth_module._auth_config = _test_auth_config
    # 미들웨어가 import한 함수 참조도 패치
    mw_module.auth_configured = lambda: True
    mw_module.get_auth_config = lambda: _test_auth_config


@pytest.fixture
def sample_config():
    """유효한 config.toml 구조의 샘플 dict."""
    return {
        "github": {
            "token": "ghp_test1234567890",
            "webhook_secret": "secret123",
            "accounts": [
                {"name": "testuser", "type": "user", "label": "Personal"},
                {"name": "testorg", "type": "org", "label": "Work"},
            ],
        },
        "notion": {
            "token": "ntn_test1234567890",
            "database_id": "abc-def-123",
            "properties": {
                "name": "Name",
                "url": "URL",
                "description": "Description",
                "last_commit": "Last Commit",
                "commit_count": "Commit Count",
                "visibility": "Visibility",
                "repo_id": "repository-id",
            },
        },
        "visibility": {
            "error": "Error",
        },
    }


@pytest.fixture
def minimal_config():
    """필수 키만 있는 최소 config dict."""
    return {
        "github": {
            "token": "ghp_minimal",
            "accounts": [{"name": "user1", "label": "Me"}],
        },
        "notion": {
            "token": "ntn_minimal",
            "database_id": "db-id",
        },
    }
