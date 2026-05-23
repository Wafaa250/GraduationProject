import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/app/providers/AuthProvider'
import { getHomeForRole } from '@/shared/constants/routes'

export function GuestGuard() {
  const { isAuthenticated, session } = useAuth()

  if (isAuthenticated && session) {
    return <Navigate to={getHomeForRole(session.role)} replace />
  }

  return <Outlet />
}
