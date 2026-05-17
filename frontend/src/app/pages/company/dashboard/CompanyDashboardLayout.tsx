import type { ReactNode } from 'react'
import { Menu, LogOut } from 'lucide-react'
import { CompanySidebar } from './CompanySidebar'
import { coDash } from './companyDashTokens'

type Props = {
  companyName: string
  sidebarMobileOpen: boolean
  onSidebarOpen: () => void
  onSidebarClose: () => void
  onLogout: () => void
  children: ReactNode
}

export function CompanyDashboardLayout({
  companyName,
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
        background: coDash.bg,
        fontFamily: coDash.font,
        color: coDash.text,
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
          background: coDash.surface,
          borderBottom: `1px solid ${coDash.border}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <button
            type="button"
            onClick={onSidebarOpen}
            className="co-menu-btn"
            style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: 6 }}
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
          <span style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {companyName}
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
            borderRadius: coDash.radiusMd,
            border: `1px solid ${coDash.border}`,
            background: coDash.surface,
            color: coDash.muted,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          <LogOut size={16} />
          <span className="co-logout-label">Log out</span>
        </button>
      </header>

      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {sidebarMobileOpen && (
          <button
            type="button"
            aria-label="Close menu"
            onClick={onSidebarClose}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15,23,42,0.4)',
              zIndex: 40,
              border: 'none',
              cursor: 'pointer',
            }}
          />
        )}
        <div
          className={`co-sidebar-wrap${sidebarMobileOpen ? ' co-sidebar-open' : ''}`}
          style={
            sidebarMobileOpen
              ? { position: 'fixed', zIndex: 50, left: 0, top: 60, bottom: 0 }
              : undefined
          }
        >
          <CompanySidebar companyName={companyName} onNavigate={onSidebarClose} />
        </div>
        <main style={{ flex: 1, minWidth: 0, overflow: 'auto', padding: '24px 20px 40px' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>{children}</div>
        </main>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .co-menu-btn { display: flex !important; }
          .co-sidebar-wrap { transform: translateX(-100%); transition: transform 0.2s ease; }
          .co-sidebar-wrap.co-sidebar-open { transform: translateX(0); }
        }
        @media (max-width: 480px) { .co-logout-label { display: none; } }
      `}</style>
    </div>
  )
}
