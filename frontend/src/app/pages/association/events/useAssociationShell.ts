import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { getAssociationProfile, parseApiErrorMessage, type StudentAssociationProfile } from '../../../../api/associationApi'

export function useAssociationShell() {
  const navigate = useNavigate()
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
    localStorage.clear()
    navigate('/login')
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
