import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { AuthSession } from '@/shared/api/types/auth'
import { authApi } from '@/shared/api/authApi'
import {
  clearStoredSession,
  getStoredSession,
  setStoredSession,
} from '@/shared/lib/authStorage'

interface AuthContextValue {
  session: AuthSession | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<AuthSession>
  logout: () => void
  setSession: (session: AuthSession) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<AuthSession | null>(() => getStoredSession())

  const setSession = useCallback((next: AuthSession) => {
    setStoredSession(next)
    setSessionState(next)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const result = await authApi.login({ email, password })
    setSession(result)
    return result
  }, [setSession])

  const logout = useCallback(() => {
    clearStoredSession()
    setSessionState(null)
  }, [])

  useEffect(() => {
    const onExpired = () => {
      clearStoredSession()
      setSessionState(null)
    }
    window.addEventListener('skillswap:session-expired', onExpired)
    return () => window.removeEventListener('skillswap:session-expired', onExpired)
  }, [])

  const value = useMemo(
    () => ({
      session,
      isAuthenticated: !!session?.token,
      login,
      logout,
      setSession,
    }),
    [session, login, logout, setSession],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
