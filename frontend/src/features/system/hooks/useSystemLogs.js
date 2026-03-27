import { useEffect, useMemo, useState } from 'react'

const FILTERS = [
  { key: 'all', label: '전체' },
  { key: 'auth', label: '인증' },
  { key: 'api', label: 'API' },
]

/**
 * 시스템 감사 로그 Hook.
 *
 * /api/system/logs를 fetch하고 필터링한다.
 */
export default function useSystemLogs() {
  const [logs, setLogs] = useState([])
  const [activeFilter, setActiveFilter] = useState('all')
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    fetch('/api/system/logs')
      .then((res) => res.json())
      .then((data) => { if (!cancelled) setLogs(data.logs || []) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [refreshKey])

  const filteredLogs = useMemo(() => {
    if (activeFilter === 'all') return logs
    if (activeFilter === 'auth') return logs.filter((l) => l.event)
    if (activeFilter === 'api') return logs.filter((l) => !l.event)
    return logs
  }, [logs, activeFilter])

  const refresh = () => setRefreshKey((k) => k + 1)

  return { logs: filteredLogs, totalCount: logs.length, activeFilter, setActiveFilter, refresh, FILTERS }
}
