import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/app/providers/AuthProvider'
import { ROUTES } from '@/shared/constants/routes'

export function AuthGuard() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.login} replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
