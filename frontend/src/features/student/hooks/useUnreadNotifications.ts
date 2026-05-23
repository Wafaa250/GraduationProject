import { useCallback, useEffect, useState } from 'react'
import { notificationsApi } from '@/shared/api/notificationsApi'

export function useUnreadNotifications() {
  const [count, setCount] = useState(0)

  const refresh = useCallback(async () => {
    try {
      const n = await notificationsApi.getUnreadCount()
      setCount(n)
    } catch {
      setCount(0)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { count, refresh }
}
