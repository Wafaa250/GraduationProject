import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/app/providers/AuthProvider'
import { getHomeForRole } from '@/shared/constants/routes'

function normalizeRole(role: string | undefined): string {
  const r = (role ?? '').trim().toLowerCase()
  if (r === 'association') return 'studentassociation'
  return r
}

interface RoleGuardProps {
  allowedRoles: string[]
}

export function RoleGuard({ allowedRoles }: RoleGuardProps) {
  const { session } = useAuth()
  const role = normalizeRole(session?.role)
  const allowed = allowedRoles.map((r) => normalizeRole(r))

  if (!role || !allowed.includes(role)) {
    return <Navigate to={getHomeForRole(session?.role ?? 'student')} replace />
  }

  return <Outlet />
}
