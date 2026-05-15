import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CalendarPlus, CalendarDays, Pencil, UsersRound, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  AssociationAvatar,
  CategoryBadge,
  VerifiedBadge,
} from '../../components/association/associationBrand'
import {
  getAssociationProfile,
  parseApiErrorMessage,
  type StudentAssociationProfile,
} from '../../../api/associationApi'
import { AssociationDashboardLayout } from './dashboard/AssociationDashboardLayout'
import { assocCard, assocDash } from './dashboard/associationDashTokens'

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
    localStorage.clear()
    navigate('/login')
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
        <p style={{ color: assocDash.muted, fontSize: 14 }}>Loading dashboard…</p>
      ) : (
        <>
          <section
            style={{
              ...assocCard,
              padding: '28px 32px',
              marginBottom: 24,
              background: `linear-gradient(135deg, ${assocDash.accentMuted} 0%, #fff 55%)`,
              borderColor: assocDash.accentBorder,
            }}
          >
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'flex-start',
                gap: 20,
              }}
            >
              <AssociationAvatar
                name={name}
                logoUrl={profile?.logoUrl}
                size="lg"
              />
              <div style={{ flex: 1, minWidth: 200 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: assocDash.accent }}>
                  Student Organization
                </p>
                <h1
                  style={{
                    margin: '6px 0 8px',
                    fontSize: 28,
                    fontWeight: 800,
                    fontFamily: assocDash.fontDisplay,
                    color: assocDash.text,
                    lineHeight: 1.2,
                  }}
                >
                  Welcome back, {profile?.associationName ?? name}
                </h1>
                {profile?.faculty && (
                  <p style={{ margin: '0 0 10px', fontSize: 14, color: assocDash.muted }}>
                    {profile.faculty}
                  </p>
                )}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                  {profile?.category && <CategoryBadge category={profile.category} />}
                  {profile?.isVerified && <VerifiedBadge />}
                </div>
              </div>
            </div>
            <p style={{ margin: '20px 0 0', fontSize: 14, color: assocDash.muted, maxWidth: 560, lineHeight: 1.6 }}>
              Your organization hub on SkillSwap. Keep your profile up to date so students can discover your
              community.
            </p>
          </section>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 20,
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

function ProfileSummaryCard({ profile }: { profile: StudentAssociationProfile | null }) {
  if (!profile) {
    return (
      <div style={{ ...assocCard, padding: 24 }}>
        <p style={{ margin: 0, color: assocDash.muted, fontSize: 14 }}>
          Complete your profile to show students who you are.
        </p>
        <Link
          to="/association/profile"
          style={{
            display: 'inline-block',
            marginTop: 12,
            fontSize: 13,
            fontWeight: 600,
            color: assocDash.accentDark,
            textDecoration: 'none',
          }}
        >
          Go to profile →
        </Link>
      </div>
    )
  }

  const about = profile.description?.trim()

  return (
    <div style={{ ...assocCard, padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
        <AssociationAvatar name={profile.associationName} logoUrl={profile.logoUrl} size="md" />
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: 16,
              fontWeight: 700,
              fontFamily: assocDash.fontDisplay,
            }}
          >
            Profile summary
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: assocDash.muted }}>@{profile.username}</p>
        </div>
      </div>
      <dl style={{ margin: 0, display: 'grid', gap: 12, fontSize: 14 }}>
        <SummaryRow label="Faculty" value={profile.faculty ?? '—'} />
        <SummaryRow label="Category" value={profile.category ?? '—'} />
        <SummaryRow label="About" value={about || 'Add a short description on your profile.'} />
      </dl>
      <Link
        to="/association/profile"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          marginTop: 18,
          fontSize: 13,
          fontWeight: 600,
          color: assocDash.accentDark,
          textDecoration: 'none',
        }}
      >
        <Pencil size={14} />
        Edit profile
      </Link>
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt style={{ margin: 0, fontSize: 11, fontWeight: 700, color: assocDash.subtle, textTransform: 'uppercase' }}>
        {label}
      </dt>
      <dd style={{ margin: '4px 0 0', color: assocDash.text, lineHeight: 1.5 }}>{value}</dd>
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
      onClick: () => navigate('/organization/events/create'),
    },
    {
      icon: CalendarDays,
      title: 'My Events',
      desc: 'View and manage your organization events',
      disabled: false,
      onClick: () => navigate('/organization/events'),
    },
    {
      icon: UsersRound,
      title: 'Manage Leadership Team',
      desc: 'Showcase coordinators and representatives on your public profile',
      disabled: false,
      onClick: () => navigate('/organization/team-members'),
    },
    {
      icon: Sparkles,
      title: 'Discovery',
      desc: 'Discover students based on skills and interests',
      disabled: true,
    },
  ]

  return (
    <div style={{ ...assocCard, padding: 24 }}>
      <h2
        style={{
          margin: '0 0 4px',
          fontSize: 16,
          fontWeight: 700,
          fontFamily: assocDash.fontDisplay,
        }}
      >
        Quick actions
      </h2>
      <p style={{ margin: '0 0 16px', fontSize: 13, color: assocDash.muted }}>
        Shortcuts to key organization tools
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {actions.map(({ icon: Icon, title, desc, disabled, onClick }) => {
          const Wrapper = disabled ? 'div' : 'button'
          return (
          <Wrapper
            key={title}
            type={disabled ? undefined : 'button'}
            onClick={disabled ? undefined : onClick}
            style={{
              display: 'flex',
              gap: 12,
              padding: 14,
              borderRadius: assocDash.radiusMd,
              border: `1px solid ${assocDash.border}`,
              background: '#fff',
              opacity: disabled ? 0.92 : 1,
              width: '100%',
              textAlign: 'left',
              fontFamily: 'inherit',
              cursor: disabled ? 'default' : 'pointer',
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: assocDash.accentMuted,
                border: `1px solid ${assocDash.accentBorder}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: assocDash.accent,
                flexShrink: 0,
              }}
            >
              <Icon size={20} strokeWidth={2} />
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: assocDash.text }}>{title}</p>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: assocDash.muted, lineHeight: 1.45 }}>
                {desc}
              </p>
            </div>
          </Wrapper>
          )
        })}
      </div>
    </div>
  )
}

