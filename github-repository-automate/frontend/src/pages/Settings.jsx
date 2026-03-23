import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'

const PROPERTY_FIELDS = [
  { key: 'name', label: '이름', placeholder: 'Name' },
  { key: 'url', label: 'URL', placeholder: 'URL' },
  { key: 'description', label: '설명', placeholder: 'Description' },
  { key: 'last_commit', label: '마지막 커밋', placeholder: 'Last Commit' },
  { key: 'commit_count', label: '커밋 개수', placeholder: 'Commit Count' },
  { key: 'visibility', label: '공유여부', placeholder: 'Visibility' },
  { key: 'repo_id', label: '리포 ID', placeholder: 'repository-id' },
]

const EMPTY_ACCOUNT = { name: '', type: 'user', label: '' }

export default function Settings() {
  const [form, setForm] = useState({
    github_token: '',
    github_webhook_secret: '',
    github_accounts: [],
    notion_token: '',
    notion_database_id: '',
    notion_properties: Object.fromEntries(PROPERTY_FIELDS.map(f => [f.key, ''])),
    visibility_error: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(data => {
        setForm({
          github_token: data.github?.token ?? '',
          github_webhook_secret: data.github?.webhook_secret ?? '',
          github_accounts: (data.github?.accounts ?? []).map(a => ({
            name: a.name ?? '',
            type: a.type ?? 'user',
            label: a.label ?? '',
          })),
          notion_token: data.notion?.token ?? '',
          notion_database_id: data.notion?.database_id ?? '',
          notion_properties: {
            ...Object.fromEntries(PROPERTY_FIELDS.map(f => [f.key, ''])),
            ...(data.notion?.properties ?? {}),
          },
          visibility_error: data.visibility?.error ?? '',
        })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const showToast = useCallback((msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }, [])

  const updateField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const updateProperty = (key, value) => {
    setForm(prev => ({
      ...prev,
      notion_properties: { ...prev.notion_properties, [key]: value },
    }))
  }

  const updateAccount = (index, field, value) => {
    setForm(prev => {
      const accounts = [...prev.github_accounts]
      accounts[index] = { ...accounts[index], [field]: value }
      return { ...prev, github_accounts: accounts }
    })
  }

  const addAccount = () => {
    setForm(prev => ({
      ...prev,
      github_accounts: [...prev.github_accounts, { ...EMPTY_ACCOUNT }],
    }))
  }

  const removeAccount = (index) => {
    setForm(prev => ({
      ...prev,
      github_accounts: prev.github_accounts.filter((_, i) => i !== index),
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const body = {
        github_token: form.github_token,
        github_webhook_secret: form.github_webhook_secret,
        github_accounts: form.github_accounts,
        notion_token: form.notion_token,
        notion_database_id: form.notion_database_id,
        notion_properties: form.notion_properties,
        visibility_error: form.visibility_error,
      }
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        showToast('설정이 저장되었습니다.')
      } else {
        showToast('저장에 실패했습니다.')
      }
    } catch {
      showToast('서버에 연결할 수 없습니다.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main className="container">
        <p aria-busy="true">로딩 중...</p>
      </main>
    )
  }

  return (
    <main className="container">
      <nav>
        <ul>
          <li><Link to="/">대시보드</Link></li>
        </ul>
        <ul>
          <li><strong>설정</strong></li>
        </ul>
      </nav>

      {toast && (
        <article style={{ padding: '0.75rem 1rem', marginBottom: '1rem' }}>
          {toast}
        </article>
      )}

      <form onSubmit={handleSubmit}>
        {/* GitHub */}
        <fieldset>
          <legend><strong>GitHub</strong></legend>
          <label>
            토큰
            <input
              type="password"
              value={form.github_token}
              onChange={e => updateField('github_token', e.target.value)}
              placeholder="ghp_..."
            />
          </label>
          <label>
            Webhook Secret
            <input
              type="text"
              value={form.github_webhook_secret}
              onChange={e => updateField('github_webhook_secret', e.target.value)}
              placeholder="webhook secret"
            />
          </label>
        </fieldset>

        {/* GitHub 계정 */}
        <fieldset>
          <legend><strong>GitHub 계정</strong></legend>
          {form.github_accounts.map((account, i) => (
            <div key={i} className="grid" style={{ alignItems: 'end' }}>
              <label>
                이름
                <input
                  type="text"
                  value={account.name}
                  onChange={e => updateAccount(i, 'name', e.target.value)}
                  placeholder="계정 이름"
                />
              </label>
              <label>
                유형
                <select
                  value={account.type}
                  onChange={e => updateAccount(i, 'type', e.target.value)}
                >
                  <option value="user">user</option>
                  <option value="org">org</option>
                </select>
              </label>
              <label>
                라벨
                <input
                  type="text"
                  value={account.label}
                  onChange={e => updateAccount(i, 'label', e.target.value)}
                  placeholder="라벨"
                />
              </label>
              <button
                type="button"
                className="secondary outline"
                onClick={() => removeAccount(i)}
              >
                삭제
              </button>
            </div>
          ))}
          <button type="button" className="outline" onClick={addAccount}>
            계정 추가
          </button>
        </fieldset>

        {/* Notion */}
        <fieldset>
          <legend><strong>Notion</strong></legend>
          <label>
            토큰
            <input
              type="password"
              value={form.notion_token}
              onChange={e => updateField('notion_token', e.target.value)}
              placeholder="ntn_..."
            />
          </label>
          <label>
            데이터베이스 ID
            <input
              type="text"
              value={form.notion_database_id}
              onChange={e => updateField('notion_database_id', e.target.value)}
              placeholder="데이터베이스 ID"
            />
          </label>
        </fieldset>

        {/* Notion 속성명 */}
        <fieldset>
          <legend><strong>Notion 속성명</strong></legend>
          {PROPERTY_FIELDS.map(({ key, label, placeholder }) => (
            <label key={key}>
              {label}
              <input
                type="text"
                value={form.notion_properties[key]}
                onChange={e => updateProperty(key, e.target.value)}
                placeholder={placeholder}
              />
            </label>
          ))}
        </fieldset>

        {/* 기타 */}
        <fieldset>
          <legend><strong>기타</strong></legend>
          <label>
            에러 라벨
            <input
              type="text"
              value={form.visibility_error}
              onChange={e => updateField('visibility_error', e.target.value)}
              placeholder="에러 라벨"
            />
          </label>
        </fieldset>

        <button type="submit" aria-busy={saving} disabled={saving}>
          {saving ? '저장 중...' : '저장'}
        </button>
      </form>
    </main>
  )
}
