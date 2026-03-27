import ThemeToggle from '../../../shared/components/ThemeToggle'

/**
 * Google 로그인 페이지.
 *
 * 인증이 활성화되어 있고 미인증 상태일 때 표시된다.
 * "Sign in with Google" 버튼 클릭 시 /auth/login으로 이동.
 */
export default function LoginPage({ onLogin, error }) {
  return (
    <div className="flex h-full items-center justify-center p-4">
      <div className="shell-frame w-full max-w-sm p-8">
        <div className="flex flex-col items-center text-center">
          <div className="eyebrow">Authentication</div>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-fg">
            Tessera
          </h1>
          <p className="mt-3 text-sm leading-6 text-fg-muted">
            이 워크스페이스는 허가된 계정만 접근할 수 있습니다.
          </p>

          {error && (
            <div className="notice-banner is-error mt-4 w-full text-sm">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={onLogin}
            className="primary-button mt-6 w-full justify-center gap-3"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Sign in with Google
          </button>

          <div className="mt-6">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </div>
  )
}
