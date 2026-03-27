"""JWT 유틸리티 테스트."""

import time

from backend.core.auth.jwt_utils import create_token, verify_token


class TestJWT생성검증:
    def test_라운드트립_성공(self):
        payload = {"email": "test@test.com", "name": "Test"}
        token = create_token(payload, "secret", max_age=3600)
        result = verify_token(token, "secret")
        assert result is not None
        assert result["email"] == "test@test.com"
        assert result["name"] == "Test"
        assert "iat" in result
        assert "exp" in result

    def test_만료된_토큰은_None(self):
        payload = {"email": "test@test.com"}
        token = create_token(payload, "secret", max_age=-1)  # 이미 만료
        assert verify_token(token, "secret") is None

    def test_잘못된_시크릿이면_None(self):
        payload = {"email": "test@test.com"}
        token = create_token(payload, "secret-a", max_age=3600)
        assert verify_token(token, "secret-b") is None

    def test_변조된_토큰은_None(self):
        payload = {"email": "test@test.com"}
        token = create_token(payload, "secret", max_age=3600)
        # 페이로드 부분을 변조
        parts = token.split(".")
        parts[1] = parts[1][:-2] + "xx"
        tampered = ".".join(parts)
        assert verify_token(tampered, "secret") is None

    def test_형식이_잘못된_토큰은_None(self):
        assert verify_token("not.a.jwt.token", "secret") is None
        assert verify_token("", "secret") is None
        assert verify_token("abc", "secret") is None

    def test_exp_클레임이_자동_추가됨(self):
        now = int(time.time())
        token = create_token({"email": "a@b.com"}, "s", max_age=100)
        result = verify_token(token, "s")
        assert result["exp"] >= now + 100
        assert result["iat"] >= now
