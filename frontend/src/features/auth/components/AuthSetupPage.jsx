import { useState } from 'react'
import ThemeToggle from '../../../shared/components/ThemeToggle'
import Spinner from '../../../shared/components/Spinner'

/**
 * 초기 인증 설정 페이지.
 *
 * auth.json이 없을 때 표시. 관리자가 Google OAuth 정보를 입력한다.
 * 설정 완료 후 Google 로그인 페이지로 전환된다.
 */
export default function AuthSetupPage({ onComplete }) {
  const [clientId, setClientId] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [emails, setEmails] = useState('')
  const defaultRedirectUri = `${window.location.origin}/auth/callback`
  const [redirectUri, setRedirectUri] = useState(defaultRedirectUri)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSaving(true)

    const emailList = emails.split(',').map((e) => e.trim()).filter(Boolean)
    if (!clientId || !clientSecret || emailList.length === 0) {
      setError('모든 필수 항목을 입력해주세요.')
      setSaving(false)
      return
    }

    try {
      const res = await fetch('/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          google_client_id: clientId,
          google_client_secret: clientSecret,
          allowed_emails: emailList,
          oauth_redirect_uri: redirectUri || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail || `설정 저장 실패 (${res.status})`)
      }

      onComplete()
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <div className="flex h-full items-center justify-center p-4">
      <div className="shell-frame w-full max-w-lg p-8">
        <div className="flex flex-col">
          <div className="text-center">
            <div className="eyebrow">Initial Setup</div>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-fg">
              Tessera
            </h1>
            <p className="mt-3 text-sm leading-6 text-fg-muted">
              Google OAuth를 설정하여 워크스페이스를 보호합니다.
            </p>
          </div>

          {error && (
            <div className="notice-banner is-error mt-4 text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-fg-muted">Google Client ID *</span>
              <input
                type="text"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="123...apps.googleusercontent.com"
                className="field-input"
                required
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-fg-muted">Google Client Secret *</span>
              <input
                type="password"
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                placeholder="GOCSPX-..."
                className="field-input"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-fg-muted">허용 이메일 (쉼표로 구분) *</span>
              <input
                type="text"
                value={emails}
                onChange={(e) => setEmails(e.target.value)}
                placeholder="admin@gmail.com, user2@gmail.com"
                className="field-input"
                required
              />
              <span className="text-[11px] text-fg-faint">
                이 이메일만 로그인할 수 있습니다.
              </span>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-fg-muted">OAuth Redirect URI *</span>
              <input
                type="text"
                value={redirectUri}
                onChange={(e) => setRedirectUri(e.target.value)}
                className="field-input"
                required
              />
              <span className="text-[11px] text-fg-faint">
                이 URI를 Google Cloud Console의 승인된 리디렉션 URI에 등록하세요.
              </span>
            </label>

            <button
              type="submit"
              disabled={saving}
              className="primary-button mt-2 w-full justify-center"
            >
              {saving ? <><Spinner className="h-4 w-4" /> 저장 중...</> : '설정 저장'}
            </button>
          </form>

          <div className="mt-6 flex justify-center">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </div>
  )
}
