import { useEffect, useRef, useState } from 'react'
import { LogOut, UserRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AssociationAvatar } from '@/components/association/associationBrand'
import { ASSOCIATION_ROUTES } from '@/routes/paths'
import { assocDash } from './associationDashTokens'

type Props = {
  associationName: string
  logoUrl?: string | null
  onLogout: () => void
}

export function AssociationProfileMenu({ associationName, logoUrl, onLogout }: Props) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointer = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  const close = () => setOpen(false)

  return (
    <div ref={rootRef} style={{ position: 'relative' }}>
      <button
        type="button"
        aria-label="Open profile menu"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          borderRadius: 999,
          outline: 'none',
          boxShadow: open ? `0 0 0 2px ${assocDash.surface}, 0 0 0 4px ${assocDash.accentBorder}` : undefined,
        }}
        className="assoc-profile-btn"
      >
        <AssociationAvatar
          name={associationName}
          logoUrl={logoUrl}
          size="sm"
          style={{
            width: 36,
            height: 36,
            borderRadius: 999,
            border: `2px solid ${assocDash.border}`,
          }}
        />
      </button>

      {open && (
        <div
          role="menu"
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 8px)',
            zIndex: 50,
            width: 224,
            overflow: 'hidden',
            borderRadius: assocDash.radiusMd,
            border: `1px solid ${assocDash.border}`,
            background: assocDash.surface,
            boxShadow: assocDash.shadowLg,
          }}
        >
          <div style={{ padding: 4 }}>
            <Link
              to={ASSOCIATION_ROUTES.profile}
              role="menuitem"
              onClick={close}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                padding: '8px 10px',
                border: 'none',
                borderRadius: 8,
                background: 'transparent',
                color: assocDash.muted,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
                textAlign: 'left',
                textDecoration: 'none',
              }}
              className="assoc-profile-menu-item"
            >
              <UserRound size={16} strokeWidth={2} aria-hidden />
              Open profile
            </Link>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                close()
                onLogout()
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                padding: '8px 10px',
                border: 'none',
                borderRadius: 8,
                background: 'transparent',
                color: assocDash.muted,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
                textAlign: 'left',
              }}
              className="assoc-profile-menu-logout"
            >
              <LogOut size={16} strokeWidth={2} aria-hidden />
              Log out
            </button>
          </div>
        </div>
      )}
      <style>{`
        .assoc-profile-btn:focus-visible {
          box-shadow: 0 0 0 2px ${assocDash.surface}, 0 0 0 4px ${assocDash.accentBorder};
        }
        .assoc-profile-menu-item:hover,
        .assoc-profile-menu-logout:hover {
          background: ${assocDash.bg};
          color: ${assocDash.text};
        }
      `}</style>
    </div>
  )
}
