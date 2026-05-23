import { useCallback, useEffect, useState } from 'react'
import { dashboardApi } from '@/shared/api/dashboardApi'
import type { DashboardSummary } from '@/shared/api/types/dashboard'
import { getApiErrorMessage } from '@/shared/lib/errors'

export function useDashboardSummary() {
  const [data, setData] = useState<DashboardSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const summary = await dashboardApi.getSummary()
      setData(summary)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not load your dashboard.'))
      setData(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { data, isLoading, error, refresh }
}
