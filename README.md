# Tessera

> **Tessera** — 모자이크를 이루는 작은 타일 한 조각.
>
> 모자이크는 작은 타일 하나하나가 모여 하나의 그림이 됩니다.
> 데이터 통합도 마찬가지입니다. 사소한 자동화가 하나씩 쌓이면, 그것이 거대한 기반이 됩니다.
>
> Tessera는 흩어진 데이터를 자동으로 모아 하나의 그림으로 완성하는 개인 자동화 대시보드입니다.

> GitHub 리포지토리가 늘어날수록, 어디에 뭘 만들었는지 기억나지 않습니다.
>
> Notion으로 프로젝트를 관리하고 있다면, 리포지토리 목록을 일일이 옮겨 적고 있지는 않으신가요?
> 커밋할 때마다 Notion을 열어서 날짜를 수정하고, 새 리포를 만들 때마다 행을 추가하고...
>
> 이 프로젝트는 그 과정을 자동화합니다.
> 사소한 데이터 통합을 하나씩 쌓아, 흩어진 정보를 하나의 그림으로 완성합니다.

## 이런 분들을 위한 프로젝트입니다

- GitHub 리포지토리를 **Notion 데이터베이스**로 관리하고 싶은 분
- 개인 계정과 여러 조직의 리포지토리를 **한 곳에서** 보고 싶은 분
- 리포지토리 정보를 **수동으로 옮겨 적는 게 귀찮은** 분
- Private 리포지토리도 빠짐없이 관리하고 싶은 분

## 주요 기능

### Notion 버튼으로 동기화
Notion 페이지에 버튼을 만들고, 클릭 한 번이면 모든 GitHub 계정의 리포지토리가 Notion DB에 정리됩니다. 이미 있는 행은 업데이트, 새 리포는 자동 추가.

### 커밋하면 자동 반영
GitHub에 push하면 해당 리포지토리의 정보가 Notion에 자동으로 반영됩니다. 커밋 개수, 마지막 커밋 날짜가 알아서 갱신됩니다.

### 계정별 라벨 분류
여러 GitHub 계정/조직을 사용한다면, 각 계정에 원하는 라벨을 붙여서 Notion에서 그룹별로 정리할 수 있습니다.

### 동기화되는 정보

| 항목 | 설명 |
|---|---|
| 리포지토리명 | GitHub 리포지토리 이름 |
| URL | GitHub 리포지토리 링크 |
| 설명 | 리포지토리 Description |
| 마지막 커밋 날짜 | 가장 최근 push 일시 |
| 커밋 개수 | 총 커밋 수 |
| 계정 라벨 | 소속 계정/조직에 설정한 라벨 |

## 동작 방식

```
GitHub ──(API)──> 이 서버 ──(API)──> Notion DB
                    ^
                    |
         Notion 버튼 (웹훅)
         GitHub Push (웹훅)
```

1. **Notion 버튼 클릭** 또는 **GitHub push** 이벤트가 이 서버로 웹훅을 보냅니다
2. 서버가 GitHub API에서 리포지토리 정보를 가져옵니다
3. Notion API로 데이터베이스를 업데이트합니다

## API 엔드포인트

| 경로 | 설명 |
|---|---|
| `GET /health` | 서버 상태 확인 |
| `POST /webhook/sync-all` | 모든 계정의 리포지토리를 한번에 동기화합니다. 새 리포는 추가, 기존 리포는 업데이트됩니다. |
| `POST /webhook/sync-one` | Notion DB의 특정 행에 해당하는 리포지토리 하나만 업데이트합니다. |
| `POST /webhook/github-push` | GitHub push 이벤트를 수신하여, push된 리포지토리의 정보를 자동으로 반영합니다. main 브랜치만 처리합니다. |

## 시작하기

### 필요한 것

- Python 3.12+ 또는 Docker
- [GitHub Personal Access Token](https://github.com/settings/tokens) (classic, `repo` 권한)
- [Notion Internal Integration Token](https://www.notion.so/my-integrations)
- Notion 데이터베이스 (리포지토리 정보를 저장할 곳)

### 설치 및 실행

```bash
cd github-repository-automate
pip install -r requirements.txt
cp config.example.toml config.toml  # 설정 파일 편집
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Docker를 사용한다면:
```bash
cp config.example.toml config.toml  # 설정 파일 편집
docker compose up -d
```

### 설정 파일 (`config.toml`)

`config.example.toml`을 복사한 뒤, 토큰과 계정 정보를 입력합니다.

```toml
[github]
token = "ghp_xxxxxxxxxxxx"

# 동기화할 GitHub 계정들
[[github.accounts]]
name = "my-username"
label = "Personal"

[[github.accounts]]
name = "my-org"
type = "org"
label = "Work"

[notion]
token = "ntn_xxxxxxxxxxxx"
database_id = "your_database_id"
```

Notion DB 속성명이 기본값(`Name`, `URL` 등)과 다르다면 `[notion.properties]`에서 변경할 수 있습니다. 자세한 설정은 `config.example.toml`을 참고하세요.

### Notion 버튼 연결

1. Notion 페이지에 **버튼 블록** 추가
2. 자동화 편집 → 작업 추가 → **웹훅 보내기**
3. URL에 `https://your-domain/webhook/sync-all` 입력

### GitHub Push 자동 반영

1. GitHub 리포/조직 → Settings → Webhooks → Add webhook
2. Payload URL: `https://your-domain/webhook/github-push`
3. Content type: `application/json`
4. Events: **Just the push event**

## 기술 스택

- Python 3.12 + FastAPI
- httpx (비동기 HTTP 클라이언트)
- uvicorn (ASGI 서버)
- TOML 설정 파일 (Python 3.11+ 내장 `tomllib`)
- Docker 지원

## API 문서

서버 실행 시 자동으로 제공됩니다:
- `http://localhost:8000/docs` (Swagger UI)
- `http://localhost:8000/redoc` (ReDoc)
