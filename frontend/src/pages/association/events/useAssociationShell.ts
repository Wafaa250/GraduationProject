import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { getAssociationProfile, parseApiErrorMessage, type StudentAssociationProfile } from '@/api/associationApi'
import { ROUTES } from '@/routes/paths'

export function useAssociationShell() {
  const [profile, setProfile] = useState<StudentAssociationProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await getAssociationProfile()
        if (!cancelled) setProfile(data)
      } catch (err) {
        toast.error(parseApiErrorMessage(err))
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userId')
    localStorage.removeItem('role')
    localStorage.removeItem('name')
    localStorage.removeItem('email')
    window.location.href = ROUTES.login
  }

  const name = profile?.associationName ?? localStorage.getItem('name') ?? 'Organization'
  const sidebarProfile = profile
    ? { associationName: profile.associationName, logoUrl: profile.logoUrl }
    : { associationName: name, logoUrl: null }

  return {
    profile,
    loading,
    name,
    sidebarProfile,
    sidebarMobileOpen,
    setSidebarMobileOpen,
    handleLogout,
  }
}
