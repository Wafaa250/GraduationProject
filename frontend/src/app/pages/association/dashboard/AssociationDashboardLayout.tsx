import type { ReactNode } from 'react'
import { Menu, LogOut } from 'lucide-react'
import { AssociationSidebar, type AssociationSidebarProfile } from './AssociationSidebar'
import { AssociationAvatar } from '../../../components/association/associationBrand'
import { assocDash } from './associationDashTokens'

type Props = {
  associationName: string
  sidebarProfile?: AssociationSidebarProfile | null
  sidebarMobileOpen: boolean
  onSidebarOpen: () => void
  onSidebarClose: () => void
  onLogout: () => void
  children: ReactNode
}

export function AssociationDashboardLayout({
  associationName,
  sidebarProfile,
  sidebarMobileOpen,
  onSidebarOpen,
  onSidebarClose,
  onLogout,
  children,
}: Props) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: assocDash.bg,
        fontFamily: assocDash.font,
        color: assocDash.text,
      }}
    >
      <header
        style={{
          height: 60,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px 0 20px',
          background: assocDash.surface,
          borderBottom: `1px solid ${assocDash.border}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <button
            type="button"
            onClick={onSidebarOpen}
            style={{
              display: 'none',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 6,
              flexShrink: 0,
            }}
            className="assoc-menu-btn"
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
          <div className="assoc-header-avatar" style={{ display: 'none' }}>
            <AssociationAvatar
              name={associationName}
              logoUrl={sidebarProfile?.logoUrl}
              size="sm"
            />
          </div>
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: assocDash.text,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {associationName}
          </span>
        </div>
        <button
          type="button"
          onClick={onLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 14px',
            borderRadius: assocDash.radiusMd,
            border: `1px solid ${assocDash.border}`,
            background: assocDash.surface,
            color: assocDash.muted,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
            flexShrink: 0,
          }}
        >
          <LogOut size={16} />
          <span className="assoc-logout-label">Log out</span>
        </button>
      </header>
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <AssociationSidebar
          mobileOpen={sidebarMobileOpen}
          onCloseMobile={onSidebarClose}
          profile={sidebarProfile}
        />
        <main
          style={{
            flex: 1,
            minWidth: 0,
            overflow: 'auto',
            padding: '24px 20px 40px',
          }}
        >
          <div style={{ maxWidth: 1120, margin: '0 auto' }}>{children}</div>
        </main>
      </div>
      <style>{`
        @media (max-width: 900px) {
          .assoc-menu-btn { display: flex !important; }
          .assoc-header-avatar { display: flex !important; }
        }
        @media (max-width: 480px) {
          .assoc-logout-label { display: none; }
        }
      `}</style>
    </div>
  )
}
