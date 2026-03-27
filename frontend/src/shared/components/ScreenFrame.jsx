export default function ScreenFrame({ children }) {
  return (
    <div className="relative h-[100svh] overflow-hidden">
      {children}
      <div className="pointer-events-none absolute bottom-0.5 left-1.5 z-50">
        <p className="font-mono text-[10px] text-fg-faint/50">
          {__COMMIT_SHA__} · {new Date(__BUILD_TIME__).toLocaleString('ko-KR', { year: '2-digit', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  )
}
