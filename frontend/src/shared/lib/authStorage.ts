import type { AuthSession } from '@/shared/api/types/auth'

const KEY = 'skillswap_session'

export function getStoredSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    return JSON.parse(raw) as AuthSession
  } catch {
    return null
  }
}

export function setStoredSession(session: AuthSession): void {
  localStorage.setItem(KEY, JSON.stringify(session))
}

export function clearStoredSession(): void {
  localStorage.removeItem(KEY)
}

export function getStoredToken(): string | null {
  return getStoredSession()?.token ?? null
}
