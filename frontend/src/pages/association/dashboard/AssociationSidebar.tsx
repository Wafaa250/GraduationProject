import {
  Building2,
  CalendarDays,
  ChevronsLeft,
  ChevronsRight,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  UsersRound,
} from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { useAssociationSidebarCollapsed } from '@/hooks/useAssociationSidebarCollapsed'
import { ASSOCIATION_ROUTES, ROUTES } from '@/routes/paths'
import { assocDash, assocShellHeader } from './associationDashTokens'
import './association-sidebar.css'

const SIDEBAR_WIDTH = 260
const SIDEBAR_WIDTH_COLLAPSED = 68

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
  const { collapsed, toggle } = useAssociationSidebarCollapsed()
  const desktopCollapsed = collapsed && !mobileOpen
  const sidebarWidth = desktopCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH

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
          width: mobileOpen ? SIDEBAR_WIDTH : sidebarWidth,
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
          ['--assoc-muted' as string]: assocDash.muted,
          ['--assoc-bg' as string]: assocDash.bg,
          ['--assoc-text' as string]: assocDash.text,
        }}
        className={`assoc-sidebar${mobileOpen ? ' assoc-sidebar--open' : ''}${
          desktopCollapsed ? ' assoc-sidebar--collapsed' : ''
        }`}
      >
        <div
          className="assoc-sidebar-header"
          style={{
            ...assocShellHeader,
            padding: desktopCollapsed ? '12px 8px' : '0 14px',
          }}
        >
          <div className="assoc-sidebar-brand-row">
            <BrandLogo
              to={ROUTES.home}
              size="sm"
              variant={desktopCollapsed ? 'mark' : 'full'}
            />
            <button
              type="button"
              className="assoc-sidebar-toggle hidden md:grid"
              onClick={toggle}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-expanded={!collapsed}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? (
                <ChevronsRight size={16} strokeWidth={2} />
              ) : (
                <ChevronsLeft size={16} strokeWidth={2} />
              )}
            </button>
          </div>
        </div>

        <nav
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            padding: desktopCollapsed ? '12px 8px' : '12px 14px',
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
                title={desktopCollapsed ? label : undefined}
                className="assoc-sidebar-nav-link"
                style={{
                  color: active ? assocDash.accentDark : assocDash.muted,
                  background: active ? assocDash.accentMuted : 'transparent',
                  borderColor: active ? assocDash.accentBorder : 'transparent',
                }}
              >
                <Icon size={18} strokeWidth={2} className="shrink-0" />
                <span className="assoc-sidebar-nav-label">{label}</span>
              </Link>
            )
          })}
        </nav>

        <div
          style={{
            flexShrink: 0,
            marginTop: 'auto',
            padding: desktopCollapsed ? '10px 8px 14px' : '10px 14px 14px',
            borderTop: `1px solid ${assocDash.border}`,
          }}
        >
          <button
            type="button"
            onClick={onLogout}
            title={desktopCollapsed ? 'Log out' : undefined}
            className="assoc-sidebar-logout-btn assoc-sidebar-logout"
            style={{ color: assocDash.muted }}
          >
            <LogOut size={18} strokeWidth={2} className="shrink-0" />
            <span className="assoc-sidebar-logout-label">Log out</span>
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
            transition: transform 0.2s ease, width 0.25s ease;
          }
          .assoc-sidebar.assoc-sidebar--open {
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  )
}
