import { Link, useLocation } from 'react-router-dom'
import { Building2, LayoutDashboard, Sparkles } from 'lucide-react'
import { coDash } from './companyDashTokens'

const NAV = [
  { to: '/company/dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/company/talent-search', label: 'AI Talent Search', icon: Sparkles },
]

type Props = {
  companyName: string
  onNavigate?: () => void
}

export function CompanySidebar({ companyName, onNavigate }: Props) {
  const { pathname } = useLocation()

  return (
    <aside
      style={{
        width: 260,
        flexShrink: 0,
        background: coDash.surface,
        borderRight: `1px solid ${coDash.border}`,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100%',
      }}
    >
      <div style={{ padding: '24px 20px 20px', borderBottom: `1px solid ${coDash.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: coDash.gradient,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
            }}
          >
            <Building2 size={20} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: coDash.accent,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              Company
            </div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: coDash.text,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={companyName}
            >
              {companyName}
            </div>
          </div>
        </div>
      </div>

      <nav style={{ padding: '16px 12px', flex: 1 }}>
        {NAV.map(({ to, label, icon: Icon }) => {
          const active =
            pathname === to || (to !== '/company/dashboard' && pathname.startsWith(to))
          return (
            <Link
              key={to}
              to={to}
              onClick={onNavigate}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '11px 14px',
                borderRadius: 10,
                marginBottom: 4,
                textDecoration: 'none',
                fontSize: 14,
                fontWeight: active ? 700 : 500,
                color: active ? coDash.accentDark : coDash.muted,
                background: active ? coDash.accentMuted : 'transparent',
                border: active ? `1px solid ${coDash.accentBorder}` : '1px solid transparent',
              }}
            >
              <Icon size={18} strokeWidth={active ? 2.2 : 1.8} />
              {label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
