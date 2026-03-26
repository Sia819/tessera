export default function ScreenFrame({ children }) {
  return (
    <div className="h-[100svh] overflow-hidden">
      {children}
    </div>
  )
}
