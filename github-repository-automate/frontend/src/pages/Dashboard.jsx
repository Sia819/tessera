import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'

function relativeTime(unixTimestamp) {
  if (!unixTimestamp) return '없음'

  const now = Date.now() / 1000
  const diff = now - unixTimestamp

  if (diff < 0) return '방금'
  if (diff < 60) return `${Math.floor(diff)}초 전`
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`
  if (diff < 2592000) return `${Math.floor(diff / 86400)}일 전`
  if (diff < 31536000) return `${Math.floor(diff / 2592000)}개월 전`
  return `${Math.floor(diff / 31536000)}년 전`
}

export default function Dashboard() {
  const [dashboard, setDashboard] = useState(null)
  const [logs, setLogs] = useState([])
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState(null)
  const pollRef = useRef(null)

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard')
      if (!res.ok) throw new Error('대시보드 데이터를 불러올 수 없습니다.')
      const data = await res.json()
      setDashboard(data)
      setSyncing(data.sync_in_progress)
      return data
    } catch (e) {
      setError(e.message)
      return null
    }
  }, [])

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/sync/logs')
      if (!res.ok) throw new Error('로그를 불러올 수 없습니다.')
      const data = await res.json()
      setLogs(data.logs || [])
    } catch (e) {
      setError(e.message)
    }
  }, [])

  const startPolling = useCallback(() => {
    if (pollRef.current) return
    pollRef.current = setInterval(async () => {
      const data = await fetchDashboard()
      if (data && !data.sync_in_progress) {
        clearInterval(pollRef.current)
        pollRef.current = null
        setSyncing(false)
        fetchLogs()
      }
    }, 3000)
  }, [fetchDashboard, fetchLogs])

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }, [])

  useEffect(() => {
    fetchDashboard().then((data) => {
      if (data?.sync_in_progress) {
        setSyncing(true)
        startPolling()
      }
    })
    fetchLogs()

    return () => stopPolling()
  }, [fetchDashboard, fetchLogs, startPolling, stopPolling])

  const handleSync = async () => {
    setSyncing(true)
    setError(null)
    try {
      const res = await fetch('/api/sync/trigger', { method: 'POST' })
      if (!res.ok) throw new Error('동기화 요청에 실패했습니다.')
      startPolling()
    } catch (e) {
      setError(e.message)
      setSyncing(false)
    }
  }

  if (!dashboard) {
    return (
      <main className="container">
        <p aria-busy="true">로딩 중...</p>
      </main>
    )
  }

  const { last_sync_time, last_sync_result, accounts } = dashboard

  const sortedLogs = [...logs].sort((a, b) => b.timestamp - a.timestamp)

  return (
    <>
      <nav className="container">
        <ul>
          <li><strong>GitHub-Notion Sync</strong></li>
        </ul>
        <ul>
          <li><Link to="/settings">설정</Link></li>
        </ul>
      </nav>

      <main className="container">
        {error && (
          <article aria-label="오류">
            <p><strong>오류:</strong> {error}</p>
          </article>
        )}

        {/* 상태 카드 */}
        <div className="grid">
          <article>
            <header>서버 상태</header>
            {syncing ? (
              <p aria-busy="true">동기화 중...</p>
            ) : (
              <p>정상</p>
            )}
          </article>

          <article>
            <header>마지막 동기화</header>
            <p>{relativeTime(last_sync_time)}</p>
          </article>

          <article>
            <header>등록 계정</header>
            <p>
              <strong>{accounts?.length || 0}개</strong>
              {accounts?.length > 0 && (
                <small style={{ display: 'block', marginTop: '0.25rem' }}>
                  {accounts.map((a) => a.label || a.name).join(', ')}
                </small>
              )}
            </p>
          </article>
        </div>

        {/* 동기화 버튼 */}
        <section>
          <button onClick={handleSync} disabled={syncing} aria-busy={syncing}>
            {syncing ? '동기화 진행 중...' : '전체 동기화'}
          </button>
        </section>

        {/* 마지막 동기화 결과 */}
        {last_sync_result && (
          <section>
            <h3>마지막 동기화 결과</h3>
            <table>
              <thead>
                <tr>
                  <th>전체 저장소</th>
                  <th>생성</th>
                  <th>업데이트</th>
                  <th>아카이브</th>
                  <th>오류</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{last_sync_result.total_repos ?? '-'}</td>
                  <td>{last_sync_result.created ?? '-'}</td>
                  <td>{last_sync_result.updated ?? '-'}</td>
                  <td>{last_sync_result.archived ?? '-'}</td>
                  <td>{last_sync_result.marked_error ?? '-'}</td>
                </tr>
              </tbody>
            </table>
          </section>
        )}

        {/* 최근 로그 */}
        <section>
          <h3>최근 로그</h3>
          {sortedLogs.length === 0 ? (
            <p>로그가 없습니다.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>시간</th>
                  <th>유형</th>
                  <th>상세</th>
                </tr>
              </thead>
              <tbody>
                {sortedLogs.map((log, i) => (
                  <tr key={i}>
                    <td>
                      {new Date(log.timestamp * 1000).toLocaleString('ko-KR')}
                    </td>
                    <td>{log.type}</td>
                    <td>
                      {log.error
                        ? log.error
                        : log.result
                          ? `전체: ${log.result.total_repos}, 생성: ${log.result.created}, 업데이트: ${log.result.updated}, 아카이브: ${log.result.archived}, 오류: ${log.result.marked_error}`
                          : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </main>
    </>
  )
}
