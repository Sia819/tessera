import { lazy, Suspense, useMemo } from 'react'
import DashboardTab from './components/DashboardTab'
import SetupWizard from './components/SetupWizard'
import ThemeToggle from './shared/components/ThemeToggle'
import Spinner from './shared/components/Spinner'
import ScreenFrame from './shared/components/ScreenFrame'
import CancelConfirmDialog from './shared/components/CancelConfirmDialog'
import StopIcon from './shared/components/StopIcon'
import LoginPage from './features/auth/components/LoginPage'
import AuthSetupPage from './features/auth/components/AuthSetupPage'
import { formatRelativeTime } from './shared/utils/formatters'
import useAuth from './features/auth/hooks/useAuth'
import useDashboard from './features/dashboard/hooks/useDashboard'
import plugins from './plugins/registry'

const SystemLogsTab = lazy(() => import('./features/system/components/SystemLogsTab'))

// position: 'top' (기본) | 'bottom' (하단 고정)
// bottom 탭은 사이드바 하단에 구분선과 함께 배치된다.
// 어떤 탭이든 position: 'bottom'으로 바꾸면 하단으로 이동한다.
const CORE_TABS = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    title: '운영 대시보드',
    description: '통계, 최근 이벤트, 연결된 계정을 하나의 워크스페이스에서 확인합니다.',
  },
  {
    key: 'system',
    label: 'System',
    title: '시스템 로그',
    description: '접속 IP, 인증 시도, API 호출 등 감사 로그를 추적합니다.',
    component: SystemLogsTab,
    position: 'bottom',
  },
]

const PLUGIN_TABS = plugins.flatMap((p) =>
  p.tabs.map((tab) => ({
    key: tab.key,
    label: tab.label,
    title: tab.title,
    description: tab.description,
    component: tab.component,
    position: tab.position || 'top',
  })),
)

const ALL_TABS = [...CORE_TABS, ...PLUGIN_TABS]
const NAV_TOP = ALL_TABS.filter((t) => (t.position || 'top') === 'top')
const NAV_BOTTOM = ALL_TABS.filter((t) => t.position === 'bottom')

export default function App() {
  const { authState, user, error: authError, login, logout, onSetupComplete } = useAuth()
  const {
    configured, activeTab, setActiveTab, showSetup, setShowSetup,
    dashboard, logs, syncing, cancelling,
    showCancelConfirm, setShowCancelConfirm,
    notice, accountCount, statusLabel,
    handleSync, handleCancelSync, handleSetupComplete,
  } = useDashboard()

  const currentTab = useMemo(() => ALL_TABS.find((tab) => tab.key === activeTab) ?? ALL_TABS[0], [activeTab])

  // 인증 상태 로딩 중
  if (authState === null) {
    return (
      <ScreenFrame>
        <div className="flex h-full items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Spinner className="h-6 w-6 text-accent" />
            <p className="text-sm text-fg-muted">인증 상태를 확인하고 있습니다</p>
          </div>
        </div>
      </ScreenFrame>
    )
  }

  // 인증 초기 설정 필요
  if (authState === 'setup_required') {
    return (
      <ScreenFrame>
        <AuthSetupPage onComplete={onSetupComplete} />
      </ScreenFrame>
    )
  }

  // 로그인 필요
  if (authState === 'unauthenticated') {
    return (
      <ScreenFrame>
        <LoginPage onLogin={login} error={authError} />
      </ScreenFrame>
    )
  }

  // 앱 로딩 중 (인증 통과 후)
  if (configured === null) {
    return (
      <ScreenFrame>
        <div className="flex h-full items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Spinner className="h-6 w-6 text-accent" />
            <p className="text-sm text-fg-muted">워크스페이스를 준비하고 있습니다</p>
          </div>
        </div>
      </ScreenFrame>
    )
  }

  if (!configured || showSetup) {
    return (
      <ScreenFrame>
        <div className="mx-auto h-full w-full max-w-[1540px] p-3 sm:p-5">
          <div className="shell-frame flex h-full flex-col overflow-hidden">
            <header className="shrink-0 border-b border-edge px-5 py-5 sm:px-8 sm:py-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <div className="eyebrow">GitHub to Notion</div>
                  <h1 className="mt-3 text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
                    Tessera
                  </h1>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-fg-muted">
                    {configured
                      ? '기존 설정을 단계별로 다시 구성합니다.'
                      : '실제 운영 워크플로에 맞춘 단계형 온보딩으로 자동화를 연결합니다.'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {configured && (
                    <button
                      type="button"
                      onClick={() => { setShowSetup(false); window.history.replaceState(null, '', '/') }}
                      className="secondary-button"
                    >
                      대시보드로 돌아가기
                    </button>
                  )}
                  {user && (
                    <button type="button" onClick={logout} className="secondary-button" title={user.email}>
                      로그아웃
                    </button>
                  )}
                  <ThemeToggle />
                </div>
              </div>
            </header>

            <main className="min-h-0 flex-1 overflow-hidden px-5 py-5 sm:px-8 sm:py-6">
              <SetupWizard onComplete={handleSetupComplete} isReconfigure={!!configured} />
            </main>
          </div>
        </div>
      </ScreenFrame>
    )
  }

  return (
    <ScreenFrame>
      {showCancelConfirm && (
        <CancelConfirmDialog
          onConfirm={handleCancelSync}
          onCancel={() => setShowCancelConfirm(false)}
        />
      )}
      <div className="mx-auto flex h-full w-full max-w-[1680px] p-3 sm:p-5">
        <div className="shell-frame grid h-full w-full overflow-hidden lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="flex h-full flex-col overflow-hidden border-b border-edge px-5 py-5 sm:px-6 lg:border-b-0 lg:border-r lg:py-7">
            <div>
              <div className="eyebrow">Operations</div>
              <h1 className="mt-3 text-[1.9rem] font-semibold tracking-tight text-fg">
                Tessera
              </h1>
              <p className="mt-3 max-w-xs text-sm leading-6 text-fg-muted">
                저장소 메타데이터와 최신 동기화 결과를 차분한 SaaS 워크스페이스 형태로 관리합니다.
              </p>
            </div>

            <nav className="mt-8 flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:gap-1">
              {NAV_TOP.map((tab) => (
                <NavButton key={tab.key} tab={tab} active={activeTab === tab.key} onClick={() => setActiveTab(tab.key)} />
              ))}
            </nav>

            <div className="mt-auto hidden lg:block">
              {NAV_BOTTOM.length > 0 && (
                <nav className="flex flex-col gap-1 border-t border-edge pt-3 pb-3">
                  {NAV_BOTTOM.map((tab) => (
                    <NavButton key={tab.key} tab={tab} active={activeTab === tab.key} onClick={() => setActiveTab(tab.key)} />
                  ))}
                </nav>
              )}
              {user && (
                <div className="border-t border-edge pt-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs text-fg-muted" title={user.email}>
                      {user.email}
                    </span>
                    <button
                      type="button"
                      onClick={logout}
                      className="shrink-0 text-xs text-fg-faint transition-colors hover:text-fg-muted"
                    >
                      로그아웃
                    </button>
                  </div>
                </div>
              )}
            </div>

          </aside>

          <section className="flex min-h-0 h-full flex-col overflow-hidden">
            <header className="shrink-0 border-b border-edge px-5 py-4 sm:px-8">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-xl font-semibold tracking-tight text-fg">
                    {currentTab.title}
                  </h2>
                  <p className="mt-1 text-sm text-fg-muted">{currentTab.description}</p>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  <div className="subtle-chip hidden sm:inline-flex">
                    <span className={`inline-flex h-2 w-2 rounded-full ${syncing ? 'bg-accent status-pulse' : 'bg-ok'}`} />
                    <span>{statusLabel}</span>
                  </div>

                  <div className="group relative">
                    {cancelling ? (
                      <button type="button" disabled className="primary-button opacity-70">
                        <Spinner className="h-4 w-4" /> 중지하는 중
                      </button>
                    ) : syncing ? (
                      <button
                        type="button"
                        onClick={() => setShowCancelConfirm(true)}
                        className="primary-button group/sync"
                      >
                        <span className="flex items-center gap-2 group-hover/sync:hidden">
                          <Spinner className="h-4 w-4" /> 동기화 중
                        </span>
                        <span className="hidden items-center gap-2 group-hover/sync:flex">
                          <StopIcon /> 동기화 중지
                        </span>
                      </button>
                    ) : (
                      <button type="button" onClick={handleSync} className="primary-button">
                        전체 동기화
                      </button>
                    )}
                    <div className="pointer-events-none absolute right-0 top-full z-50 mt-2 min-w-[180px] rounded-2xl border border-edge bg-surface-elevated p-3 text-sm opacity-0 shadow-lg transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                      <div className="flex items-center justify-between">
                        <span className="text-fg-muted">마지막 동기화:</span>
                        <span className="font-medium text-fg">{dashboard?.last_sync_time ? formatRelativeTime(dashboard.last_sync_time) : '없음'}</span>
                      </div>
                      <div className="mt-1.5 flex items-center justify-between">
                        <span className="text-fg-muted">연결 계정:</span>
                        <span className="font-medium text-fg">{accountCount}개</span>
                      </div>
                    </div>
                  </div>

                  <ThemeToggle />
                </div>
              </div>
            </header>

            {notice && (
              <div className={`notice-banner shrink-0 ${notice.tone === 'error' ? 'is-error' : 'is-info'}`}>
                {notice.message}
              </div>
            )}

            <main className="flex-1 min-h-0 overflow-hidden px-5 py-5 sm:px-8 sm:py-6">
              {activeTab === 'dashboard' && (
                <div className="h-full">
                  <DashboardTab
                    dashboard={dashboard}
                    logs={logs}
                    syncing={syncing}
                    onNavigate={setActiveTab}
                  />
                </div>
              )}
              {ALL_TABS.filter((t) => t.component).map((tab) =>
                activeTab === tab.key ? (
                  <div key={tab.key} className="h-full">
                    <Suspense fallback={<div className="flex h-full items-center justify-center"><Spinner className="h-6 w-6 text-accent" /></div>}>
                      <tab.component />
                    </Suspense>
                  </div>
                ) : null,
              )}
            </main>
          </section>
        </div>
      </div>
    </ScreenFrame>
  )
}

function NavButton({ tab, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`nav-item min-w-[180px] lg:min-w-0 ${active ? 'is-active' : ''}`}
    >
      <div className="min-w-0 flex-1 text-left">
        <div className="text-sm font-medium text-fg">{tab.label}</div>
        <div className="mt-1 truncate text-xs text-fg-muted">{tab.description}</div>
      </div>
    </button>
  )
}
