import type { ReactNode } from 'react'
import { Menu } from 'lucide-react'
import { AssociationSidebar } from './AssociationSidebar'
import { AssociationProfileMenu } from './AssociationProfileMenu'
import { assocDash, assocShellHeader } from './associationDashTokens'

type Props = {
  associationName: string
  sidebarProfile?: { associationName: string; logoUrl?: string | null } | null
  sidebarMobileOpen: boolean
  onSidebarOpen: () => void
  onSidebarClose: () => void
  onLogout: () => void
  children: ReactNode
  /** Full-width workspace (e.g. form builder). */
  wideContent?: boolean
}

export function AssociationDashboardLayout({
  associationName,
  sidebarProfile,
  sidebarMobileOpen,
  onSidebarOpen,
  onSidebarClose,
  onLogout,
  children,
  wideContent,
}: Props) {
  return (
    <div
      style={{
        display: 'flex',
        height: '100dvh',
        overflow: 'hidden',
        background: assocDash.bg,
        fontFamily: assocDash.font,
        color: assocDash.text,
      }}
    >
      <AssociationSidebar
        mobileOpen={sidebarMobileOpen}
        onCloseMobile={onSidebarClose}
        onLogout={onLogout}
      />
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <header
          style={{
            ...assocShellHeader,
            justifyContent: 'space-between',
            gap: 16,
            padding: '0 24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
            <button
              type="button"
              onClick={onSidebarOpen}
              style={{
                display: 'none',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 8,
                flexShrink: 0,
              }}
              className="assoc-menu-btn"
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>
            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
                lineHeight: 1,
                color: assocDash.text,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {associationName}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <AssociationProfileMenu
              associationName={associationName}
              logoUrl={sidebarProfile?.logoUrl}
              onLogout={onLogout}
            />
          </div>
        </header>
        <main
          style={{
            flex: 1,
            minHeight: 0,
            overflow: wideContent ? 'hidden' : 'auto',
            padding: wideContent ? 0 : '20px 16px 32px',
          }}
        >
          <div
            style={{
              maxWidth: wideContent ? 'none' : 1120,
              margin: '0 auto',
              height: wideContent ? '100%' : undefined,
            }}
          >
            {children}
          </div>
        </main>
      </div>
      <style>{`
        @media (max-width: 900px) {
          .assoc-menu-btn { display: flex !important; }
        }
      `}</style>
    </div>
  )
}
