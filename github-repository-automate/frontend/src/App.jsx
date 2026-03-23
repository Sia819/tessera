import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Setup from './pages/Setup'
import Dashboard from './pages/Dashboard'
import Settings from './pages/Settings'

export default function App() {
  const [configured, setConfigured] = useState(null)

  useEffect(() => {
    fetch('/api/setup/status')
      .then(r => r.json())
      .then(d => setConfigured(d.configured))
      .catch(() => setConfigured(false))
  }, [])

  if (configured === null) return <main className="container"><p aria-busy="true">로딩 중...</p></main>

  return (
    <Routes>
      <Route path="/" element={configured ? <Dashboard /> : <Navigate to="/setup" />} />
      <Route path="/setup" element={<Setup onComplete={() => setConfigured(true)} />} />
      <Route path="/settings" element={<Settings />} />
    </Routes>
  )
}
