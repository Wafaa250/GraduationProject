import { CalendarDays, LayoutDashboard, Megaphone, User, UsersRound } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { AssociationAvatar } from '../../../components/association/associationBrand'
import { assocDash } from './associationDashTokens'

const NAV = [
  { to: '/association/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/organization/events', label: 'Events', icon: CalendarDays, matchPrefix: true },
  {
    to: '/organization/recruitment-campaigns',
    label: 'Recruitment',
    icon: Megaphone,
    matchPrefix: true,
  },
  { to: '/organization/team-members', label: 'Leadership Team', icon: UsersRound, matchPrefix: true },
  { to: '/association/profile', label: 'Profile', icon: User },
] as const

export type AssociationSidebarProfile = {
  associationName: string
  logoUrl?: string | null
}

type Props = {
  mobileOpen: boolean
  onCloseMobile: () => void
  profile?: AssociationSidebarProfile | null
}

export function AssociationSidebar({ mobileOpen, onCloseMobile, profile }: Props) {
  const location = useLocation()
  const name = profile?.associationName ?? 'Organization'

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
          width: 260,
          flexShrink: 0,
          background: assocDash.surface,
          borderRight: `1px solid ${assocDash.border}`,
          padding: '16px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          position: mobileOpen ? 'fixed' : 'relative',
          top: mobileOpen ? 0 : undefined,
          left: mobileOpen ? 0 : undefined,
          bottom: mobileOpen ? 0 : undefined,
          zIndex: 50,
          transform: mobileOpen ? 'translateX(0)' : undefined,
        }}
        className="assoc-sidebar"
      >
        <div
          style={{
            padding: '12px 10px 20px',
            marginBottom: 4,
            borderBottom: `1px solid ${assocDash.border}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <AssociationAvatar name={name} logoUrl={profile?.logoUrl} size="sm" />
            <div style={{ minWidth: 0, flex: 1 }}>
              <p
                style={{
                  margin: 0,
                  fontSize: 14,
                  fontWeight: 700,
                  color: assocDash.text,
                  lineHeight: 1.3,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={name}
              >
                {name}
              </p>
              <p style={{ margin: '2px 0 0', fontSize: 11, color: assocDash.muted, fontWeight: 600 }}>
                Student Organization
              </p>
            </div>
          </div>
          <span
            style={{
              fontFamily: assocDash.fontDisplay,
              fontWeight: 800,
              fontSize: 15,
              color: assocDash.subtle,
            }}
          >
            Skill<span style={{ color: assocDash.accent }}>Swap</span>
          </span>
        </div>

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
      </aside>
    </>
  )
}



