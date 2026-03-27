import { useState } from 'react'
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
 * 하단 고정 시스템 로그 패널.
 *
 * 모든 탭에서 항상 표시. 접기/펴기 가능.
 */
export default function SystemLogPanel() {
  const { logs, totalCount, activeFilter, setActiveFilter, FILTERS } = useSystemLogs()
  const [open, setOpen] = useState(false)

  return (
    <div className="shrink-0 border-t border-edge">
      {/* 토글 바 */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-5 py-2 text-left transition-colors hover:bg-surface-hover/50 sm:px-8"
      >
        <span className="inline-flex h-1.5 w-1.5 rounded-full bg-ok status-pulse" />
        <span className="text-xs font-medium text-fg-muted">
          System Log
        </span>
        <span className="text-xs text-fg-faint">{totalCount}</span>

        {open && (
          <div className="ml-2 flex gap-1">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={(e) => { e.stopPropagation(); setActiveFilter(f.key) }}
                className={`rounded-full px-2 py-0.5 text-[10px] font-medium transition-all ${
                  activeFilter === f.key
                    ? 'bg-accent-soft text-accent-text'
                    : 'text-fg-faint hover:text-fg-muted'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}

        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className={`ml-auto shrink-0 text-fg-faint transition-transform ${open ? '' : 'rotate-180'}`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {/* 로그 목록 */}
      {open && (
        <div className="max-h-[240px] overflow-y-auto border-t border-edge/50">
          {logs.length === 0 ? (
            <div className="px-5 py-4 text-center text-xs text-fg-faint sm:px-8">
              기록된 로그가 없습니다.
            </div>
          ) : (
            <div className="divide-y divide-edge/30">
              {logs.map((log, i) => {
                const evMeta = log.event ? EVENT_LABELS[log.event] : null
                return (
                  <div
                    key={`${log.timestamp}-${i}`}
                    className="grid grid-cols-[50px_100px_40px_minmax(0,1fr)_auto] items-center gap-2 px-5 py-1 text-xs transition-colors hover:bg-surface-hover/50 sm:px-8"
                  >
                    <span className="font-mono text-fg-faint" title={formatTime(log.timestamp)}>
                      {relativeTime(log.timestamp)}
                    </span>
                    <span className="truncate font-mono text-fg-muted" title={log.ip}>
                      {log.ip}
                    </span>
                    <span className={`font-mono ${log.status >= 400 ? 'text-danger' : 'text-fg-faint'}`}>
                      {log.method}
                    </span>
                    <span className="truncate text-fg-muted" title={log.path}>
                      {log.path}
                      {log.detail && <span className="ml-1 text-fg-faint">({log.detail})</span>}
                    </span>
                    <span>
                      {evMeta ? (
                        <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${evMeta.cls}`}>
                          {evMeta.label}
                        </span>
                      ) : (
                        <span className="text-fg-faint">{log.status}</span>
                      )}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
