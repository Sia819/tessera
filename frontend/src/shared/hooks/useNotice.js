import { useCallback, useEffect, useState } from 'react'

/**
 * 토스트 알림 Hook.
 *
 * WPF 비유: NotificationService에 해당.
 * 알림을 표시하고 일정 시간 후 자동 소멸시킨다.
 *
 * @param {number} duration - 자동 소멸까지의 밀리초 (기본 3200ms)
 * @returns {{ notice, showNotice }}
 */
export default function useNotice(duration = 3200) {
  const [notice, setNotice] = useState(null)

  const showNotice = useCallback((tone, message) => {
    setNotice({ tone, message })
  }, [])

  useEffect(() => {
    if (!notice) return undefined

    const timer = window.setTimeout(() => setNotice(null), duration)
    return () => window.clearTimeout(timer)
  }, [notice, duration])

  return { notice, showNotice }
}
