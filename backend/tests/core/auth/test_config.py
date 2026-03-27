"""인증 설정 로드 테스트."""

import json

from backend.core.auth.config import load_auth_config, save_auth_config, AUTH_CONFIG_PATH


class TestAuthConfig로드:
    def test_파일_없으면_None(self, tmp_path, monkeypatch):
        monkeypatch.setattr("backend.core.auth.config.AUTH_CONFIG_PATH", tmp_path / "missing.json")
        assert load_auth_config() is None

    def test_유효한_설정_파일_로드(self, tmp_path, monkeypatch):
        path = tmp_path / "auth.json"
        path.write_text(json.dumps({
            "google_client_id": "client-id",
            "google_client_secret": "client-secret",
            "allowed_emails": ["A@Test.COM", " b@test.com "],
            "jwt_secret": "my-secret",
        }))
        monkeypatch.setattr("backend.core.auth.config.AUTH_CONFIG_PATH", path)

        cfg = load_auth_config()
        assert cfg is not None
        assert cfg.google_client_id == "client-id"
        assert cfg.allowed_emails == ["a@test.com", "b@test.com"]  # 소문자 정규화
        assert cfg.session_max_age == 604800  # 기본값

    def test_필수_키_누락시_None(self, tmp_path, monkeypatch):
        path = tmp_path / "auth.json"
        path.write_text(json.dumps({"google_client_id": "id"}))
        monkeypatch.setattr("backend.core.auth.config.AUTH_CONFIG_PATH", path)
        assert load_auth_config() is None

    def test_빈_이메일_목록이면_None(self, tmp_path, monkeypatch):
        path = tmp_path / "auth.json"
        path.write_text(json.dumps({
            "google_client_id": "id",
            "google_client_secret": "secret",
            "allowed_emails": [],
            "jwt_secret": "jwt",
        }))
        monkeypatch.setattr("backend.core.auth.config.AUTH_CONFIG_PATH", path)
        assert load_auth_config() is None

    def test_선택_변수_반영(self, tmp_path, monkeypatch):
        path = tmp_path / "auth.json"
        path.write_text(json.dumps({
            "google_client_id": "id",
            "google_client_secret": "secret",
            "allowed_emails": ["user@test.com"],
            "jwt_secret": "jwt",
            "oauth_redirect_uri": "https://nas.example.com/auth/callback",
            "session_max_age": 3600,
        }))
        monkeypatch.setattr("backend.core.auth.config.AUTH_CONFIG_PATH", path)

        cfg = load_auth_config()
        assert cfg.oauth_redirect_uri == "https://nas.example.com/auth/callback"
        assert cfg.session_max_age == 3600

    def test_잘못된_JSON이면_None(self, tmp_path, monkeypatch):
        path = tmp_path / "auth.json"
        path.write_text("not json")
        monkeypatch.setattr("backend.core.auth.config.AUTH_CONFIG_PATH", path)
        assert load_auth_config() is None


class TestAuthConfig저장:
    def test_저장_후_로드_라운드트립(self, tmp_path, monkeypatch):
        path = tmp_path / "auth.json"
        monkeypatch.setattr("backend.core.auth.config.AUTH_CONFIG_PATH", path)
        monkeypatch.setattr("backend.core.auth.config.DATA_DIR", tmp_path)

        data = {
            "google_client_id": "id",
            "google_client_secret": "secret",
            "allowed_emails": ["test@test.com"],
            "jwt_secret": "jwt-secret",
        }
        save_auth_config(data)
        assert path.exists()

        cfg = load_auth_config()
        assert cfg is not None
        assert cfg.google_client_id == "id"
