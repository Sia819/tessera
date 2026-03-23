import { useState } from 'react'

const STEPS = [
  { num: 1, label: 'GitHub 토큰' },
  { num: 2, label: 'GitHub 계정' },
  { num: 3, label: 'Notion 연동' },
  { num: 4, label: '속성 매핑' },
  { num: 5, label: '검토 및 저장' },
]

const PROPERTY_FIELDS = [
  { key: 'name', label: '이름', defaultMatch: 'Name' },
  { key: 'url', label: 'URL', defaultMatch: 'URL' },
  { key: 'description', label: '설명', defaultMatch: 'Description' },
  { key: 'last_commit', label: '마지막 커밋', defaultMatch: 'Last Commit' },
  { key: 'commit_count', label: '커밋 수', defaultMatch: 'Commit Count' },
  { key: 'visibility', label: '공개 여부', defaultMatch: 'Visibility' },
  { key: 'repo_id', label: '리포지토리 ID', defaultMatch: 'repository-id' },
]

export default function Setup({ onComplete }) {
  const [step, setStep] = useState(1)

  // Step 1
  const [githubToken, setGithubToken] = useState('')
  const [githubUser, setGithubUser] = useState(null)
  const [githubTesting, setGithubTesting] = useState(false)
  const [githubError, setGithubError] = useState('')

  // Step 2
  const [accounts, setAccounts] = useState([{ name: '', type: 'user', label: '' }])
  const [accountPreviews, setAccountPreviews] = useState({})
  const [accountPreviewLoading, setAccountPreviewLoading] = useState({})

  // Step 3
  const [notionToken, setNotionToken] = useState('')
  const [notionDbId, setNotionDbId] = useState('')
  const [notionResult, setNotionResult] = useState(null)
  const [notionTesting, setNotionTesting] = useState(false)
  const [notionError, setNotionError] = useState('')

  // Step 4
  const [propertyMapping, setPropertyMapping] = useState(() => {
    const initial = {}
    PROPERTY_FIELDS.forEach(f => { initial[f.key] = '' })
    return initial
  })

  // Step 5
  const [webhookSecret, setWebhookSecret] = useState('')
  const [visibilityError, setVisibilityError] = useState('Error')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  // ── Step 1: GitHub 토큰 테스트 ──
  async function testGithub() {
    setGithubTesting(true)
    setGithubError('')
    setGithubUser(null)
    try {
      const res = await fetch('/api/setup/test-github', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: githubToken }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setGithubUser(data)
    } catch (e) {
      setGithubError(`연결 실패: ${e.message}`)
    } finally {
      setGithubTesting(false)
    }
  }

  // ── Step 2: 계정 관리 ──
  function addAccount() {
    setAccounts(prev => [...prev, { name: '', type: 'user', label: '' }])
  }

  function removeAccount(idx) {
    setAccounts(prev => prev.filter((_, i) => i !== idx))
    setAccountPreviews(prev => {
      const next = { ...prev }
      delete next[idx]
      return next
    })
  }

  function updateAccount(idx, field, value) {
    setAccounts(prev => prev.map((a, i) => i === idx ? { ...a, [field]: value } : a))
  }

  async function previewRepos(idx) {
    const account = accounts[idx]
    if (!account.name) return
    setAccountPreviewLoading(prev => ({ ...prev, [idx]: true }))
    setAccountPreviews(prev => { const n = { ...prev }; delete n[idx]; return n })
    try {
      const res = await fetch('/api/setup/test-github-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: githubToken, name: account.name, type: account.type }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setAccountPreviews(prev => ({ ...prev, [idx]: data }))
    } catch (e) {
      setAccountPreviews(prev => ({ ...prev, [idx]: { error: e.message } }))
    } finally {
      setAccountPreviewLoading(prev => ({ ...prev, [idx]: false }))
    }
  }

  // ── Step 3: Notion 테스트 ──
  async function testNotion() {
    setNotionTesting(true)
    setNotionError('')
    setNotionResult(null)
    try {
      const res = await fetch('/api/setup/test-notion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: notionToken, database_id: notionDbId }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setNotionResult(data)
      // Step 4 기본값 자동 매핑
      if (data.properties) {
        const propNames = Object.keys(data.properties)
        setPropertyMapping(prev => {
          const next = { ...prev }
          PROPERTY_FIELDS.forEach(f => {
            const match = propNames.find(
              p => p.toLowerCase() === f.defaultMatch.toLowerCase()
            )
            if (match) next[f.key] = match
          })
          return next
        })
      }
    } catch (e) {
      setNotionError(`연결 실패: ${e.message}`)
    } finally {
      setNotionTesting(false)
    }
  }

  // ── Step 5: 저장 ──
  async function handleSave() {
    setSaving(true)
    setSaveError('')
    try {
      const res = await fetch('/api/setup/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          github_token: githubToken,
          github_webhook_secret: webhookSecret,
          github_accounts: accounts.map(a => ({ name: a.name, type: a.type, label: a.label })),
          notion_token: notionToken,
          notion_database_id: notionDbId,
          notion_properties: propertyMapping,
          visibility_error: visibilityError,
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      onComplete()
    } catch (e) {
      setSaveError(`저장 실패: ${e.message}`)
    } finally {
      setSaving(false)
    }
  }

  // ── 네비게이션 가드 ──
  function canNext() {
    switch (step) {
      case 1: return !!githubUser
      case 2: return accounts.length > 0 && accounts.every(a => a.name.trim())
      case 3: return !!notionResult
      case 4: return true
      default: return false
    }
  }

  function maskToken(token) {
    if (!token) return ''
    if (token.length <= 8) return '****'
    return token.slice(0, 4) + '****' + token.slice(-4)
  }

  // ── 렌더링 ──
  return (
    <main className="container">
      <h1>서버 초기 설정</h1>

      {/* 스텝 인디케이터 */}
      <nav>
        <ul style={{ display: 'flex', listStyle: 'none', padding: 0, gap: '0.5rem', flexWrap: 'wrap' }}>
          {STEPS.map(s => (
            <li key={s.num}>
              <button
                className={step === s.num ? '' : 'outline'}
                style={{ minWidth: '7rem', fontSize: '0.85rem' }}
                disabled
              >
                {s.num}. {s.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <hr />

      {/* ── Step 1: GitHub 토큰 ── */}
      {step === 1 && (
        <article>
          <header><h2>GitHub 토큰</h2></header>
          <label>
            GitHub Personal Access Token
            <input
              type="password"
              placeholder="ghp_..."
              value={githubToken}
              onChange={e => { setGithubToken(e.target.value); setGithubUser(null) }}
            />
          </label>
          <button onClick={testGithub} disabled={!githubToken || githubTesting} aria-busy={githubTesting}>
            연결 테스트
          </button>
          {githubError && <p style={{ color: 'var(--pico-del-color)' }}>{githubError}</p>}
          {githubUser && (
            <p style={{ color: 'var(--pico-ins-color)' }}>
              연결 성공: {githubUser.name} ({githubUser.login})
            </p>
          )}
        </article>
      )}

      {/* ── Step 2: GitHub 계정 ── */}
      {step === 2 && (
        <article>
          <header><h2>GitHub 계정 목록</h2></header>
          {accounts.map((account, idx) => (
            <fieldset key={idx} style={{ marginBottom: '1rem' }}>
              <legend>계정 #{idx + 1}</legend>
              <div className="grid">
                <label>
                  계정 이름
                  <input
                    type="text"
                    placeholder="username 또는 org name"
                    value={account.name}
                    onChange={e => updateAccount(idx, 'name', e.target.value)}
                  />
                </label>
                <label>
                  유형
                  <select value={account.type} onChange={e => updateAccount(idx, 'type', e.target.value)}>
                    <option value="user">user</option>
                    <option value="org">org</option>
                  </select>
                </label>
                <label>
                  라벨 (선택)
                  <input
                    type="text"
                    placeholder="표시 이름"
                    value={account.label}
                    onChange={e => updateAccount(idx, 'label', e.target.value)}
                  />
                </label>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  className="outline"
                  onClick={() => previewRepos(idx)}
                  disabled={!account.name || accountPreviewLoading[idx]}
                  aria-busy={accountPreviewLoading[idx]}
                >
                  리포 미리보기
                </button>
                {accounts.length > 1 && (
                  <button className="outline secondary" onClick={() => removeAccount(idx)}>
                    삭제
                  </button>
                )}
              </div>
              {accountPreviews[idx] && !accountPreviews[idx].error && (
                <details open style={{ marginTop: '0.5rem' }}>
                  <summary>발견된 리포지토리 ({accountPreviews[idx].count_preview}개)</summary>
                  <ul>
                    {accountPreviews[idx].repos.map(r => <li key={r}>{r}</li>)}
                  </ul>
                </details>
              )}
              {accountPreviews[idx]?.error && (
                <p style={{ color: 'var(--pico-del-color)' }}>미리보기 실패: {accountPreviews[idx].error}</p>
              )}
            </fieldset>
          ))}
          <button className="outline" onClick={addAccount}>+ 계정 추가</button>
        </article>
      )}

      {/* ── Step 3: Notion 연동 ── */}
      {step === 3 && (
        <article>
          <header><h2>Notion 연동</h2></header>
          <label>
            Notion Integration Token
            <input
              type="password"
              placeholder="ntn_..."
              value={notionToken}
              onChange={e => { setNotionToken(e.target.value); setNotionResult(null) }}
            />
          </label>
          <label>
            Database ID
            <input
              type="text"
              placeholder="Notion Database ID"
              value={notionDbId}
              onChange={e => { setNotionDbId(e.target.value); setNotionResult(null) }}
            />
          </label>
          <button
            onClick={testNotion}
            disabled={!notionToken || !notionDbId || notionTesting}
            aria-busy={notionTesting}
          >
            연결 테스트
          </button>
          {notionError && <p style={{ color: 'var(--pico-del-color)' }}>{notionError}</p>}
          {notionResult && (
            <div style={{ marginTop: '1rem' }}>
              <p style={{ color: 'var(--pico-ins-color)' }}>
                연결 성공: <strong>{notionResult.title}</strong>
              </p>
              <details open>
                <summary>감지된 속성</summary>
                <table>
                  <thead>
                    <tr><th>속성 이름</th><th>타입</th></tr>
                  </thead>
                  <tbody>
                    {Object.entries(notionResult.properties).map(([name, type]) => (
                      <tr key={name}><td>{name}</td><td>{type}</td></tr>
                    ))}
                  </tbody>
                </table>
              </details>
            </div>
          )}
        </article>
      )}

      {/* ── Step 4: 속성 매핑 ── */}
      {step === 4 && (
        <article>
          <header><h2>Notion 속성 매핑</h2></header>
          <p>Notion 데이터베이스의 속성을 각 필드에 매핑하세요.</p>
          {PROPERTY_FIELDS.map(field => (
            <label key={field.key}>
              {field.label} ({field.key})
              <select
                value={propertyMapping[field.key]}
                onChange={e => setPropertyMapping(prev => ({ ...prev, [field.key]: e.target.value }))}
              >
                <option value="">-- 선택 --</option>
                {notionResult?.properties && Object.keys(notionResult.properties).map(name => (
                  <option key={name} value={name}>{name} ({notionResult.properties[name]})</option>
                ))}
              </select>
            </label>
          ))}
        </article>
      )}

      {/* ── Step 5: 검토 및 저장 ── */}
      {step === 5 && (
        <article>
          <header><h2>검토 및 저장</h2></header>

          <h3>GitHub</h3>
          <table>
            <tbody>
              <tr><td>토큰</td><td>{maskToken(githubToken)}</td></tr>
              <tr><td>사용자</td><td>{githubUser?.name} ({githubUser?.login})</td></tr>
            </tbody>
          </table>

          <h3>GitHub 계정</h3>
          <table>
            <thead><tr><th>이름</th><th>유형</th><th>라벨</th></tr></thead>
            <tbody>
              {accounts.map((a, i) => (
                <tr key={i}><td>{a.name}</td><td>{a.type}</td><td>{a.label || '-'}</td></tr>
              ))}
            </tbody>
          </table>

          <h3>Notion</h3>
          <table>
            <tbody>
              <tr><td>토큰</td><td>{maskToken(notionToken)}</td></tr>
              <tr><td>Database ID</td><td>{notionDbId}</td></tr>
              <tr><td>Database 이름</td><td>{notionResult?.title}</td></tr>
            </tbody>
          </table>

          <h3>속성 매핑</h3>
          <table>
            <thead><tr><th>필드</th><th>Notion 속성</th></tr></thead>
            <tbody>
              {PROPERTY_FIELDS.map(f => (
                <tr key={f.key}><td>{f.label}</td><td>{propertyMapping[f.key] || '-'}</td></tr>
              ))}
            </tbody>
          </table>

          <hr />

          <label>
            Webhook Secret (선택)
            <input
              type="text"
              placeholder="GitHub Webhook Secret"
              value={webhookSecret}
              onChange={e => setWebhookSecret(e.target.value)}
            />
          </label>
          <label>
            Visibility 오류 라벨
            <input
              type="text"
              value={visibilityError}
              onChange={e => setVisibilityError(e.target.value)}
            />
          </label>

          <button onClick={handleSave} disabled={saving} aria-busy={saving}>
            저장
          </button>
          {saveError && <p style={{ color: 'var(--pico-del-color)' }}>{saveError}</p>}
        </article>
      )}

      {/* ── 네비게이션 버튼 ── */}
      {step < 5 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
          <button className="outline" onClick={() => setStep(s => s - 1)} disabled={step === 1}>
            이전
          </button>
          <button onClick={() => setStep(s => s + 1)} disabled={!canNext()}>
            다음
          </button>
        </div>
      )}
      {step === 5 && (
        <div style={{ marginTop: '1rem' }}>
          <button className="outline" onClick={() => setStep(4)}>
            이전
          </button>
        </div>
      )}
    </main>
  )
}
