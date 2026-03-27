"""
빌드 버전 정보.

Dockerfile에서 ENV로 주입된 커밋 해시와 빌드 시간을 읽는다.
로컬 개발 시에는 기본값("dev")을 사용한다.
"""

import os

COMMIT_SHA = os.environ.get("TESSERA_COMMIT_SHA", "dev")
BUILD_TIME = os.environ.get("TESSERA_BUILD_TIME", "unknown")
VERSION_STRING = f"{COMMIT_SHA[:7]} · {BUILD_TIME}"
