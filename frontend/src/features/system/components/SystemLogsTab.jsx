import useSystemLogs from '../hooks/useSystemLogs'

const EVENT_LABELS = {
  login_success: { label: '로그인', cls: 'bg-ok/20 text-ok' },
  login_rejected: { label: '차단', cls: 'bg-danger/20 text-danger' },
  auth_setup: { label: '설정', cls: 'bg-accent-soft text-accent-text' },
  logout: { label: '로그아웃', cls: 'bg-surface-tertiary text-fg-muted' },
}

function formatTime(ts) {
  return new Date(ts * 1000).toLocaleString('ko-KR', {
    month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

function relativeTime(ts) {
  const diff = Date.now() / 1000 - ts
  if (diff < 60) return '방금'
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`
  return `${Math.floor(diff / 86400)}일 전`
}

/**
 * 시스템 감사 로그 탭.
 *
 * IP, 메서드, 경로, 사용자, 이벤트 등 모든 접근 기록을 표시한다.
 */
export default function SystemLogsTab() {
  const { logs, totalCount, activeFilter, setActiveFilter, FILTERS } = useSystemLogs()

  return (
    <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-5">
      {/* 헤더 */}
      <section className="panel p-5 fade-in">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="eyebrow">Audit</div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-fg">
              시스템 로그
            </h1>
            <p className="mt-2 text-sm text-fg-muted">
              접속 IP, 인증 시도, API 호출 등 모든 이벤트를 추적합니다. 최근 {totalCount}건.
            </p>
          </div>
          <div className="subtle-chip">
            <span className="inline-flex h-2 w-2 rounded-full bg-ok status-pulse" />
            <span>실시간</span>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setActiveFilter(f.key)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                activeFilter === f.key
                  ? 'border-transparent bg-accent-soft text-accent-text'
                  : 'border-edge bg-surface-elevated text-fg-muted hover:text-fg'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </section>

      {/* 로그 목록 */}
      <section className="panel flex min-h-0 flex-col overflow-hidden fade-in fade-in-delayed">
        <div className="border-b border-edge px-6 py-3">
          <div className="grid grid-cols-[100px_60px_50px_minmax(0,1fr)_140px_auto] gap-3 text-xs font-medium text-fg-faint">
            <span>시간</span>
            <span>IP</span>
            <span>메서드</span>
            <span>경로</span>
            <span>사용자</span>
            <span>이벤트</span>
          </div>
        </div>

        {logs.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-fg-muted">
            기록된 로그가 없습니다.
          </div>
        ) : (
          <div className="scroll-pane divide-y divide-edge">
            {logs.map((log, i) => {
              const evMeta = log.event ? EVENT_LABELS[log.event] : null
              return (
                <div
                  key={`${log.timestamp}-${i}`}
                  className="grid grid-cols-[100px_60px_50px_minmax(0,1fr)_140px_auto] items-center gap-3 px-6 py-3 text-sm transition-colors hover:bg-surface-hover/70"
                >
                  <span className="font-mono text-xs text-fg-faint" title={formatTime(log.timestamp)}>
                    {relativeTime(log.timestamp)}
                  </span>
                  <span className="truncate font-mono text-xs text-fg-muted" title={log.ip}>
                    {log.ip}
                  </span>
                  <span className={`font-mono text-xs ${log.status >= 400 ? 'text-danger' : 'text-fg-muted'}`}>
                    {log.method}
                  </span>
                  <span className="truncate text-fg" title={log.path}>
                    {log.path}
                    {log.detail && <span className="ml-2 text-xs text-fg-faint">({log.detail})</span>}
                  </span>
                  <span className="truncate text-xs text-fg-muted" title={log.user || ''}>
                    {log.user || '-'}
                  </span>
                  <span>
                    {evMeta ? (
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${evMeta.cls}`}>
                        {evMeta.label}
                      </span>
                    ) : (
                      <span className="text-xs text-fg-faint">{log.status}</span>
                    )}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
