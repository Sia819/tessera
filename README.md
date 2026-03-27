# Tessera

> **Tessera** — 모자이크를 이루는 작은 타일 한 조각.
>
> 사소한 자동화가 하나씩 쌓이면, 그것이 거대한 기반이 됩니다.
> Tessera는 흩어진 데이터를 자동으로 모아 하나의 그림으로 완성하는 개인 자동화 대시보드입니다.

## 주요 기능

### 웹 대시보드
브라우저에서 동기화 현황, 연결된 계정, 운영 로그를 한눈에 확인합니다. 설정 변경도 웹에서 직접 가능합니다.

### 설정 마법사
토큰 입력부터 Notion DB 연결까지, 단계별 가이드를 따라 설정합니다. config 파일을 직접 편집할 필요 없습니다.

### GitHub → Notion 자동 동기화
모든 GitHub 계정(개인 + 조직)의 리포지토리를 Notion 데이터베이스에 자동으로 정리합니다. 새 리포는 추가, 기존 리포는 업데이트.

### Push 시 자동 반영
GitHub에 push하면 해당 리포지토리 정보가 Notion에 자동 반영됩니다. 커밋 개수, 마지막 커밋 날짜가 알아서 갱신됩니다.

### 동기화되는 정보

| 항목 | 설명 |
|---|---|
| 리포지토리명 | GitHub 리포지토리 이름 |
| URL | GitHub 리포지토리 링크 |
| 설명 | 리포지토리 Description |
| 마지막 커밋 날짜 | 가장 최근 push 일시 |
| 커밋 개수 | 총 커밋 수 |
| 계정 라벨 | 소속 계정/조직에 설정한 라벨 |

## 시작하기

### Docker로 배포 (권장)

1. 배포할 디렉토리에 `docker-compose.yml` 생성:

```yaml
services:
  tessera:
    image: ghcr.io/sia819/tessera:latest
    container_name: tessera
    ports:
      - "8000:8000"
    volumes:
      - ./data:/app/data
    restart: unless-stopped
```

2. 컨테이너 실행:

```bash
docker compose up -d
```

3. 브라우저에서 `http://서버주소:8000` 접속 → 설정 마법사가 안내합니다.

### 필요한 것

- [GitHub Personal Access Token](https://github.com/settings/tokens) (classic, `repo` 권한)
- [Notion Internal Integration Token](https://www.notion.so/my-integrations)
- Notion 데이터베이스 (리포지토리 정보를 저장할 곳)

### Google OAuth 인증

첫 접속 시 Google OAuth 설정 페이지가 표시됩니다. 설정이 완료되기 전에는 대시보드에 접근할 수 없습니다.

**사전 준비 — Google OAuth 클라이언트:**
1. [Google Cloud Console](https://console.cloud.google.com/) → API 및 서비스 → 사용자 인증 정보
2. OAuth 2.0 클라이언트 ID 생성 (웹 애플리케이션)
3. 승인된 리디렉션 URI에 `http://서버주소:포트/auth/callback` 추가

**웹 UI에서 설정:**
1. 브라우저에서 Tessera에 접속하면 인증 설정 페이지가 표시됩니다
2. Google Client ID, Client Secret, 허용할 이메일 주소를 입력합니다
3. 설정 저장 후 Google 로그인 페이지로 전환됩니다

설정은 `data/auth.json`에 저장됩니다. 재설정하려면 이 파일을 삭제하고 컨테이너를 재시작하면 됩니다.

### Webhook 설정

#### GitHub Push 자동 반영

1. GitHub 리포/조직 → Settings → Webhooks → Add webhook
2. Payload URL: `https://서버주소/api/plugins/github-sync/webhook/github-push`
3. Content type: `application/json`
4. Secret: 설정 마법사에서 입력한 Webhook Secret
5. Events: **Just the push event**

#### Notion 버튼 연결

1. Notion 페이지에 **버튼 블록** 추가
2. 자동화 편집 → 작업 추가 → **웹훅 보내기**
3. URL에 `https://서버주소/api/plugins/github-sync/webhook/sync-all` 입력

## 자동 업데이트 (Watchtower)

NAS 환경에서 GitHub Actions로 이미지가 빌드되면 자동으로 컨테이너를 업데이트하도록 구성할 수 있습니다. 자세한 설정은 `.docs/docker-compose.nas.yml`을 참고하세요.

## API 엔드포인트

### 인증

| 메서드 | 경로 | 인증 | 설명 |
|---|---|---|---|
| GET | `/auth/status` | - | 인증 설정 여부 + 세션 상태 확인 |
| POST | `/auth/setup` | - | 초기 OAuth 설정 저장 (미설정 시만) |
| GET | `/auth/login` | - | Google OAuth 로그인 리다이렉트 |
| GET | `/auth/callback` | - | Google OAuth 콜백 처리 |
| POST | `/auth/logout` | - | 세션 쿠키 삭제 |

### Core

| 메서드 | 경로 | 인증 | 설명 |
|---|---|---|---|
| GET | `/health` | - | 서버 상태 + 등록된 플러그인 목록 |
| GET | `/api/plugins` | O | 등록된 플러그인 매니페스트 목록 |

### GitHub Sync 플러그인

> 모든 경로에 `/api/plugins/github-sync` 접두사가 붙습니다.

**설정**

| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | `/status` | 플러그인 설정 완료 여부 |
| POST | `/setup/test-github` | GitHub 토큰 검증 |
| POST | `/setup/test-github-account` | GitHub 계정 리포지토리 미리보기 |
| POST | `/setup/test-notion` | Notion 토큰 + DB 검증 |
| POST | `/setup/save` | 설정 저장 |
| GET | `/settings` | 현재 설정 조회 (토큰 마스킹) |
| POST | `/settings` | 설정 수정 |

**동기화**

| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | `/dashboard` | 대시보드 데이터 (상태, 계정, 최근 동기화) |
| POST | `/sync/trigger` | 전체 동기화 시작 (백그라운드) |
| POST | `/sync/cancel` | 진행 중인 동기화 중지 |
| GET | `/sync/logs` | 최근 동기화 로그 |

**Webhook** (인증 불필요 — HMAC 서명 검증)

| 메서드 | 경로 | 설명 |
|---|---|---|
| POST | `/webhook/sync-all` | 모든 계정 리포지토리 동기화 |
| POST | `/webhook/sync-one` | 특정 리포지토리 하나 동기화 |
| POST | `/webhook/github-push` | GitHub push 이벤트 수신 |
| POST | `/webhook/deduplicate` | Notion DB 중복 행 제거 |

## 플러그인 구조

Tessera는 플러그인 기반 아키텍처입니다. 현재 제공되는 플러그인:

| 플러그인 | 설명 |
|---|---|
| **GitHub Sync** | GitHub 리포지토리 → Notion 데이터베이스 동기화 |

향후 YouTube 재생목록, NAS 전자책 관리 등 새로운 자동화 플러그인이 추가될 수 있습니다.
