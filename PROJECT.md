# Tessera 개발 가이드

## 기술 스택

| 영역 | 도구 |
|---|---|
| Backend | Python 3.12, FastAPI, httpx, uvicorn |
| Frontend | React 19, Vite 8, Tailwind CSS 4 |
| 테스트 | pytest (백엔드), Vitest (프론트엔드) |
| 배포 | Docker multi-stage build, GitHub Actions → GHCR |
| 인증 | Google OAuth + JWT (환경 변수 기반, 선택) |

## 로컬 개발 환경

### 사전 요구사항

- Python 3.12+
- Node.js 22+
- npm

### 백엔드

```bash
# 프로젝트 루트에서
pip install -r requirements.txt
uvicorn backend.main:app --reload --port 8000
```

### 프론트엔드

```bash
cd frontend
npm ci
npm run dev
```

Vite dev server가 `/api`, `/auth`, `/webhook`, `/health` 요청을 `localhost:8000`으로 프록시합니다.

### 프론트엔드 빌드

```bash
cd frontend
npm run build    # → backend/static/ 에 출력
```

빌드 후 `http://localhost:8000`에서 SPA를 직접 서빙합니다.

## 테스트

```bash
# 백엔드 (프로젝트 루트에서)
python -m pytest -v

# 프론트엔드
cd frontend && npm test
```

CI에서는 `.github/workflows/unittest-build-deploy.yml`이 push/PR마다 양쪽 테스트를 자동 실행합니다.

## 프로젝트 구조

```
tessera/
├── backend/
│   ├── main.py                  # 엔트리포인트 (등록 순서가 중요)
│   ├── core/
│   │   ├── auth/                # Google OAuth 인증 (환경 변수 기반)
│   │   ├── config.py            # config.toml 로더
│   │   ├── state.py             # 플러그인별 상태 레지스트리
│   │   ├── plugin_registry.py   # 플러그인 자동 발견
│   │   └── toml_writer.py       # TOML 직렬화
│   ├── routers/
│   │   └── plugins.py           # GET /api/plugins
│   ├── plugins/
│   │   └── github_sync/         # GitHub → Notion 동기화 플러그인
│   └── tests/                   # pytest (소스 구조 미러링)
│
├── frontend/src/
│   ├── App.jsx                  # 메인 컴포넌트
│   ├── features/                # Core UI (auth, dashboard, logs)
│   ├── plugins/                 # 플러그인 UI 모듈
│   │   └── github-sync/
│   └── shared/                  # 공유 컴포넌트, hooks, utils
│
├── Dockerfile                   # Multi-stage (Node → Python)
├── requirements.txt
└── CLAUDE.md                    # 아키텍처 명세 (AI 코딩 도구용)
```

## main.py 등록 순서

순서를 바꾸면 라우팅이 깨집니다:

1. config.toml 로드
2. 인증 미들웨어 (조건부) + auth 라우터
3. 플러그인 디스커버리 (라우터 자동 마운트)
4. Core 라우터 (`/api/plugins`)
5. SPA catch-all (`/{path}` → index.html) — **반드시 마지막**

## 인증 시스템

환경 변수 4개가 모두 설정되면 Google OAuth가 활성화됩니다:

| 변수 | 설명 |
|---|---|
| `TESSERA_GOOGLE_CLIENT_ID` | Google OAuth 클라이언트 ID |
| `TESSERA_GOOGLE_CLIENT_SECRET` | Google OAuth 클라이언트 시크릿 |
| `TESSERA_ALLOWED_EMAILS` | 허용 이메일 (쉼표 구분) |
| `TESSERA_JWT_SECRET` | JWT 서명 키 |

미설정 시 인증 없이 동작합니다 (하위 호환). config.toml이 아닌 환경 변수를 사용하는 이유: config.toml은 첫 실행 시 존재하지 않을 수 있고, 설정 마법사에 접근하려면 인증이 먼저 되어야 하는 chicken-and-egg 문제를 회피하기 위함입니다.

## Docker 빌드

```bash
docker build -t tessera .
docker run -p 8000:8000 -v ./data:/app/data tessera
```

Dockerfile은 2-stage:
1. **Node stage**: `npm ci` → `vite build` → `backend/static/`
2. **Python stage**: `pip install` → 소스 복사 → 빌드 결과 복사

## CI/CD 파이프라인

`.github/workflows/unittest-build-deploy.yml`:

```
push/PR → test-backend (pytest) + test-frontend (vitest + lint)
                    ↓ (main push, 테스트 통과 시)
            Docker Build → GHCR push → Watchtower webhook → NAS 자동 배포
```

## 플러그인 추가 방법

**백엔드** (`backend/plugins/새플러그인/`):
- `__init__.py`: `PLUGIN_MANIFEST` dict + `get_router()` + `on_startup()` (선택)
- `router.py`: prefix 없는 APIRouter (Core가 `/api/plugins/{id}` 자동 마운트)
- `config.py`: 자기 config.toml 섹션만 파싱
- `state.py`: 플러그인 전용 상태

**프론트엔드** (`frontend/src/plugins/새플러그인/`):
- `manifest.js`: id, name, tabs, setupWizard, dashboardWidget
- `registry.js`에 1줄 추가

Core 코드 수정 0줄. 상세 계약은 `CLAUDE.md` 참고.
