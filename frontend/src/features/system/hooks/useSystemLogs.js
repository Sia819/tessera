import { useEffect, useMemo, useRef, useState } from 'react'

const FILTERS = [
  { key: 'all', label: '전체' },
  { key: 'auth', label: '인증' },
  { key: 'api', label: 'API' },
]

/**
 * 시스템 감사 로그 Hook.
 *
 * 1. 마운트 시 GET /api/system/logs로 기존 로그 로드
 * 2. SSE /api/system/logs/stream으로 실시간 새 로그 수신
 * 3. 새 로그는 기존 목록 앞에 추가
 */
export default function useSystemLogs() {
  const [logs, setLogs] = useState([])
  const [activeFilter, setActiveFilter] = useState('all')
  const eventSourceRef = useRef(null)

  useEffect(() => {
    let cancelled = false

    // 1. 기존 로그 로드
    fetch('/api/system/logs')
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setLogs(data.logs || [])
      })
      .catch(() => {})

    // 2. SSE 실시간 스트림
    const es = new EventSource('/api/system/logs/stream')
    eventSourceRef.current = es

    es.onmessage = (event) => {
      try {
        const entry = JSON.parse(event.data)
        setLogs((prev) => [entry, ...prev].slice(0, 500))
      } catch {
        // ignore parse errors
      }
    }

    es.onerror = () => {
      // 연결 끊기면 브라우저가 자동 재연결 (SSE 기본 동작)
    }

    return () => {
      cancelled = true
      es.close()
      eventSourceRef.current = null
    }
  }, [])

  const filteredLogs = useMemo(() => {
    if (activeFilter === 'all') return logs
    if (activeFilter === 'auth') return logs.filter((l) => l.event)
    if (activeFilter === 'api') return logs.filter((l) => !l.event)
    return logs
  }, [logs, activeFilter])

  return { logs: filteredLogs, totalCount: logs.length, activeFilter, setActiveFilter, FILTERS }
}
