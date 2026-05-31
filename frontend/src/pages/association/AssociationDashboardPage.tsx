import { useEffect, useState, type CSSProperties } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CalendarPlus, CalendarDays, ClipboardList, Pencil, UsersRound, Sparkles } from 'lucide-react'
import { ROUTES } from '@/routes/paths'
import toast from 'react-hot-toast'
import {
  AssociationAvatar,
  CategoryBadge,
  VerifiedBadge,
} from '@/components/association/associationBrand'
import {
  getAssociationProfile,
  parseApiErrorMessage,
  type StudentAssociationProfile,
} from '@/api/associationApi'
import { AssociationDashboardLayout } from './dashboard/AssociationDashboardLayout'
import { assocCard, assocDash, assocType } from './dashboard/associationDashTokens'

export default function AssociationDashboardPage() {
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

  return (
    <AssociationDashboardLayout
      associationName={name}
      sidebarProfile={sidebarProfile}
      sidebarMobileOpen={sidebarMobileOpen}
      onSidebarOpen={() => setSidebarMobileOpen(true)}
      onSidebarClose={() => setSidebarMobileOpen(false)}
      onLogout={handleLogout}
    >
      {loading ? (
        <p style={{ ...assocType.meta, margin: 0 }}>Loading dashboard…</p>
      ) : (
        <>
          <section
            style={{
              ...assocCard,
              padding: '32px 36px',
              marginBottom: 28,
              background: `linear-gradient(135deg, ${assocDash.accentMuted} 0%, #fff 55%)`,
              borderColor: assocDash.accentBorder,
            }}
          >
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'flex-start',
                gap: 24,
              }}
            >
              <AssociationAvatar
                name={name}
                logoUrl={profile?.logoUrl}
                size="lg"
              />
              <div style={{ flex: 1, minWidth: 200 }}>
                <p style={{ ...assocType.eyebrow, margin: 0 }}>
                  Student Organization
                </p>
                <h1
                  style={{
                    ...assocType.pageTitle,
                    margin: '8px 0 10px',
                  }}
                >
                  Welcome back, {profile?.associationName ?? name}
                </h1>
                {profile?.faculty && (
                  <p style={{ ...assocType.bodySm, margin: '0 0 12px' }}>
                    {profile.faculty}
                  </p>
                )}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                  {profile?.category && <CategoryBadge category={profile.category} />}
                  {profile?.isVerified && <VerifiedBadge />}
                </div>
              </div>
            </div>
            <p
              style={{
                ...assocType.body,
                margin: '24px 0 0',
                paddingTop: 24,
                borderTop: `1px solid ${assocDash.accentBorder}`,
                maxWidth: 580,
              }}
            >
              Your organization hub on SkillSwap. Keep your profile up to date so students can discover your
              community.
            </p>
          </section>

          <div
            className="assoc-dashboard-cards"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 24,
              alignItems: 'stretch',
            }}
          >
            <ProfileSummaryCard profile={profile} />
            <QuickActionsCard navigate={navigate} />
          </div>
        </>
      )}
    </AssociationDashboardLayout>
  )
}

const dashboardCardStyle: CSSProperties = {
  ...assocCard,
  padding: 28,
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  boxSizing: 'border-box',
}

const cardHeaderStyle: CSSProperties = {
  minHeight: 72,
  marginBottom: 24,
}

const cardLinkStyle: CSSProperties = {
  ...assocType.link,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  marginTop: 'auto',
  paddingTop: 20,
  textDecoration: 'none',
}

function ProfileSummaryCard({ profile }: { profile: StudentAssociationProfile | null }) {
  if (!profile) {
    return (
      <div style={dashboardCardStyle}>
        <p style={{ ...assocType.bodySm, margin: 0 }}>
          Complete your profile to show students who you are.
        </p>
        <Link to="/association/settings" style={cardLinkStyle}>
          Go to profile →
        </Link>
      </div>
    )
  }

  const about = profile.description?.trim()

  return (
    <div style={dashboardCardStyle}>
      <div style={{ ...cardHeaderStyle, display: 'flex', alignItems: 'flex-start', gap: 16 }}>
        <AssociationAvatar name={profile.associationName} logoUrl={profile.logoUrl} size="md" />
        <div>
          <h2 style={{ ...assocType.sectionTitle, margin: 0 }}>Profile summary</h2>
          <p style={{ ...assocType.meta, margin: '5px 0 0' }}>@{profile.username}</p>
        </div>
      </div>
      <dl style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <SummaryRow label="Faculty" value={profile.faculty ?? '—'} />
        <SummaryRow label="Category" value={profile.category ?? '—'} />
        <SummaryRow
          label="About"
          value={about || 'Add a short description on your profile.'}
          multiline
        />
      </dl>
      <Link to="/association/profile" style={cardLinkStyle}>
        <Pencil size={14} strokeWidth={2} />
        Edit profile
      </Link>
    </div>
  )
}

function SummaryRow({
  label,
  value,
  multiline = false,
}: {
  label: string
  value: string
  multiline?: boolean
}) {
  return (
    <div
      style={{
        padding: '13px 16px',
        borderRadius: assocDash.radiusMd,
        background: assocDash.bg,
        border: `1px solid ${assocDash.border}`,
      }}
    >
      <dt style={{ ...assocType.label, margin: 0 }}>{label}</dt>
      <dd
        style={{
          ...assocType.value,
          margin: '7px 0 0',
          ...(multiline ? { fontWeight: 400, color: assocDash.textSecondary } : {}),
        }}
      >
        {value}
      </dd>
    </div>
  )
}

function QuickActionsCard({ navigate }: { navigate: (path: string) => void }) {
  const actions = [
    {
      icon: CalendarPlus,
      title: 'Create Event',
      desc: 'Set up a new workshop, hackathon, or gathering',
      disabled: false,
      onClick: () => navigate('/association/events/create'),
    },
    {
      icon: CalendarDays,
      title: 'My Events',
      desc: 'View and manage your organization events',
      disabled: false,
      onClick: () => navigate('/association/events'),
    },
    {
      icon: UsersRound,
      title: 'Manage Leadership Board',
      desc: 'Showcase coordinators and representatives on your public profile',
      disabled: false,
      onClick: () => navigate('/association/leadership'),
    },
    {
      icon: ClipboardList,
      title: 'Leadership opportunities',
      desc: 'Open your team to students with committee and board applications',
      disabled: false,
      onClick: () => navigate('/association/recruitment'),
    },
    {
      icon: Sparkles,
      title: 'Discovery',
      desc: 'Discover students based on skills and interests',
      disabled: true,
    },
  ]

  return (
    <div style={dashboardCardStyle}>
      <div style={cardHeaderStyle}>
        <h2 style={{ ...assocType.sectionTitle, margin: 0 }}>Quick actions</h2>
        <p style={{ ...assocType.sectionDesc, margin: '5px 0 0' }}>
          Shortcuts to key organization tools
        </p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
        {actions.map(({ icon: Icon, title, desc, disabled, onClick }) => {
          const Wrapper = disabled ? 'div' : 'button'
          return (
            <Wrapper
              key={title}
              type={disabled ? undefined : 'button'}
              onClick={disabled ? undefined : onClick}
              className={disabled ? undefined : 'assoc-action-item'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '15px 16px',
                borderRadius: assocDash.radiusMd,
                border: `1px solid ${assocDash.border}`,
                background: assocDash.surface,
                opacity: disabled ? 0.88 : 1,
                width: '100%',
                textAlign: 'left',
                fontFamily: 'inherit',
                cursor: disabled ? 'default' : 'pointer',
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: assocDash.accentMuted,
                  border: `1px solid ${assocDash.accentBorder}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: assocDash.accentDark,
                  flexShrink: 0,
                }}
              >
                <Icon size={18} strokeWidth={2} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{ ...assocType.actionTitle, margin: 0 }}>{title}</p>
                <p style={{ ...assocType.actionDesc, margin: '3px 0 0' }}>{desc}</p>
              </div>
            </Wrapper>
          )
        })}
      </div>
      <style>{`
        .assoc-action-item {
          transition: background 0.15s ease, border-color 0.15s ease;
        }
        .assoc-action-item:hover {
          background: ${assocDash.bg};
          border-color: ${assocDash.accentBorder};
        }
      `}</style>
    </div>
  )
}
