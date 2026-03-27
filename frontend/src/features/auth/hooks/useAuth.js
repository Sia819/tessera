import { useCallback, useEffect, useState } from 'react'

/**
 * 인증 상태 관리 Hook.
 *
 * authState:
 *   null              — 로딩 중
 *   'setup_required'  — auth 미설정 (초기 설정 필요)
 *   'unauthenticated' — 설정됨, 로그인 필요
 *   'authenticated'   — 로그인 완료
 */
export default function useAuth() {
  const [authState, setAuthState] = useState(null)
  const [user, setUser] = useState(null)
  const [error, setError] = useState(null)

  const checkStatus = useCallback(() => {
    // URL에서 auth 에러 확인 (Google 콜백 리다이렉트)
    const params = new URLSearchParams(window.location.search)
    const authError = params.get('auth_error')
    if (authError) {
      const messages = {
        not_whitelisted: '이 이메일은 접근이 허용되지 않습니다.',
        google_error: 'Google 인증 중 오류가 발생했습니다.',
        invalid_state: '잘못된 인증 요청입니다. 다시 시도해주세요.',
        email_not_verified: '이메일 인증이 완료되지 않은 계정입니다.',
      }
      setError(messages[authError] || '인증 오류가 발생했습니다.')
      window.history.replaceState(null, '', '/')
    }

    fetch('/auth/status')
      .then((res) => res.json())
      .then((data) => {
        if (!data.auth_configured) {
          setAuthState('setup_required')
        } else if (data.authenticated) {
          setAuthState('authenticated')
          setUser({ email: data.email, name: data.name })
        } else {
          setAuthState('unauthenticated')
        }
      })
      .catch(() => setAuthState('setup_required'))
  }, [])

  useEffect(() => {
    checkStatus()
  }, [checkStatus])

  const login = useCallback(() => {
    window.location.href = '/auth/login'
  }, [])

  const logout = useCallback(async () => {
    await fetch('/auth/logout', { method: 'POST' })
    setAuthState('unauthenticated')
    setUser(null)
  }, [])

  const onSetupComplete = useCallback(() => {
    checkStatus()
  }, [checkStatus])

  return { authState, user, error, login, logout, onSetupComplete }
}
