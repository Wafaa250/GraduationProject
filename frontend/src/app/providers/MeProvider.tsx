import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { meApi } from '@/shared/api/meApi'
import type { StudentMe } from '@/shared/api/types/me'
import { isStudentMe } from '@/shared/api/types/me'
import { getApiErrorMessage } from '@/shared/lib/errors'

interface MeContextValue {
  me: StudentMe | null
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
}

const MeContext = createContext<MeContextValue | null>(null)

export function MeProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<StudentMe | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await meApi.getMe()
      if (!isStudentMe(data)) {
        setError('Unexpected profile type for this workspace.')
        setMe(null)
        return
      }
      setMe(data)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not load your profile.'))
      setMe(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const value = useMemo(
    () => ({ me, isLoading, error, refresh }),
    [me, isLoading, error, refresh],
  )

  return <MeContext.Provider value={value}>{children}</MeContext.Provider>
}

export function useMe() {
  const ctx = useContext(MeContext)
  if (!ctx) throw new Error('useMe must be used within MeProvider')
  return ctx
}
