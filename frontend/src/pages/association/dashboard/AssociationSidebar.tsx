import { Building2, CalendarDays, ClipboardList, LayoutDashboard, LogOut, UsersRound } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { LandingBrandLogo } from '@/components/brand/LandingBrandLogo'
import { ASSOCIATION_ROUTES } from '@/routes/paths'
import { assocDash, assocShellHeader } from './associationDashTokens'

const SIDEBAR_WIDTH = 260

const NAV = [
  { to: '/association/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/association/events', label: 'Events', icon: CalendarDays, matchPrefix: true },
  { to: '/association/recruitment', label: 'Leadership Applications', icon: ClipboardList, matchPrefix: true },
  { to: '/association/leadership', label: 'Leadership Board', icon: UsersRound },
  { to: ASSOCIATION_ROUTES.profile, label: 'Organization Profile', icon: Building2 },
] as const

type Props = {
  mobileOpen: boolean
  onCloseMobile: () => void
  onLogout: () => void
}

export function AssociationSidebar({ mobileOpen, onCloseMobile, onLogout }: Props) {
  const location = useLocation()

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={onCloseMobile}
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
      <aside
        style={{
          width: SIDEBAR_WIDTH,
          flexShrink: 0,
          height: '100%',
          background: assocDash.surface,
          borderRight: `1px solid ${assocDash.border}`,
          display: 'flex',
          flexDirection: 'column',
          position: mobileOpen ? 'fixed' : 'relative',
          top: mobileOpen ? 0 : undefined,
          left: mobileOpen ? 0 : undefined,
          bottom: mobileOpen ? 0 : undefined,
          zIndex: 50,
        }}
        className={`assoc-sidebar${mobileOpen ? ' assoc-sidebar--open' : ''}`}
      >
        <div
          style={{
            ...assocShellHeader,
            padding: '0 14px',
          }}
        >
          <LandingBrandLogo subtitle="Student Organizations" />
        </div>

        <nav
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          {NAV.map(({ to, label, icon: Icon, ...rest }) => {
            const matchPrefix = 'matchPrefix' in rest && rest.matchPrefix
            const active = matchPrefix
              ? location.pathname === to || location.pathname.startsWith(`${to}/`)
              : location.pathname === to
            return (
              <Link
                key={to}
                to={to}
                onClick={onCloseMobile}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 12px',
                  borderRadius: assocDash.radiusMd,
                  textDecoration: 'none',
                  fontSize: 14,
                  fontWeight: 600,
                  color: active ? assocDash.accentDark : assocDash.muted,
                  background: active ? assocDash.accentMuted : 'transparent',
                  border: active ? `1px solid ${assocDash.accentBorder}` : '1px solid transparent',
                }}
              >
                <Icon size={18} strokeWidth={2} />
                {label}
              </Link>
            )
          })}
        </nav>

        <div
          style={{
            flexShrink: 0,
            marginTop: 'auto',
            padding: '10px 14px 14px',
            borderTop: `1px solid ${assocDash.border}`,
          }}
        >
          <button
            type="button"
            onClick={onLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              width: '100%',
              padding: '10px 12px',
              borderRadius: assocDash.radiusMd,
              border: '1px solid transparent',
              background: 'transparent',
              textDecoration: 'none',
              fontSize: 14,
              fontWeight: 600,
              color: assocDash.muted,
              cursor: 'pointer',
              fontFamily: 'inherit',
              textAlign: 'left',
            }}
            className="assoc-sidebar-logout"
          >
            <LogOut size={18} strokeWidth={2} />
            Log out
          </button>
        </div>
      </aside>
      <style>{`
        .assoc-sidebar-logout:hover {
          background: ${assocDash.bg};
          color: ${assocDash.text};
        }
        @media (max-width: 900px) {
          .assoc-sidebar {
            position: fixed !important;
            top: 0;
            left: 0;
            bottom: 0;
            transform: translateX(-100%);
            transition: transform 0.2s ease;
          }
          .assoc-sidebar.assoc-sidebar--open {
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  )
}
