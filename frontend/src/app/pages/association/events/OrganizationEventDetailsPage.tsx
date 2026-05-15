import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Calendar, MapPin, Pencil, Users, Wifi } from 'lucide-react'
import toast from 'react-hot-toast'
import { resolveApiFileUrl } from '../../../../api/axiosInstance'
import {
  getOrganizationEvent,
  parseApiErrorMessage,
  type StudentOrganizationEvent,
} from '../../../../api/organizationEventsApi'
import { AssociationAvatar } from '../../../components/association/associationBrand'
import { AssociationDashboardLayout } from '../dashboard/AssociationDashboardLayout'
import { assocCard, assocDash } from '../dashboard/associationDashTokens'
import { formatEventDate } from './eventFormUtils'
import { useAssociationShell } from './useAssociationShell'

export default function OrganizationEventDetailsPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const navigate = useNavigate()
  const shell = useAssociationShell()
  const [event, setEvent] = useState<StudentOrganizationEvent | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const id = Number(eventId)
    if (!Number.isFinite(id)) {
      setLoading(false)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const data = await getOrganizationEvent(id)
        if (!cancelled) setEvent(data)
      } catch (err) {
        toast.error(parseApiErrorMessage(err))
        if (!cancelled) navigate('/organization/events')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [eventId, navigate])

  const cover = event?.coverImageUrl ? resolveApiFileUrl(event.coverImageUrl) : null
  const orgName = event?.organizationName ?? shell.profile?.associationName ?? shell.name
  const orgLogo = event?.organizationLogoUrl ?? shell.profile?.logoUrl

  return (
    <AssociationDashboardLayout
      associationName={shell.name}
      sidebarProfile={shell.sidebarProfile}
      sidebarMobileOpen={shell.sidebarMobileOpen}
      onSidebarOpen={() => shell.setSidebarMobileOpen(true)}
      onSidebarClose={() => shell.setSidebarMobileOpen(false)}
      onLogout={shell.handleLogout}
    >
      <Link
        to="/organization/events"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          marginBottom: 20,
          fontSize: 13,
          fontWeight: 600,
          color: assocDash.accentDark,
          textDecoration: 'none',
        }}
      >
        <ArrowLeft size={16} />
        Back to events
      </Link>

      {loading || shell.loading ? (
        <p style={{ color: assocDash.muted, fontSize: 14 }}>Loading event…</p>
      ) : event ? (
        <>
          <div
            style={{
              borderRadius: assocDash.radiusLg ?? 16,
              overflow: 'hidden',
              marginBottom: 24,
              border: `1px solid ${assocDash.border}`,
              background: cover
                ? `center/cover no-repeat url(${cover})`
                : `linear-gradient(135deg, ${assocDash.accentMuted} 0%, #fff 70%)`,
              minHeight: 200,
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: cover ? 'linear-gradient(to top, rgba(15,23,42,0.75) 0%, transparent 55%)' : 'none',
              }}
            />
            <div style={{ position: 'relative', padding: '48px 28px 28px', color: cover ? '#fff' : assocDash.text }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                <Badge light={!!cover}>{event.eventType}</Badge>
                {event.category && <Badge light={!!cover} muted>{event.category}</Badge>}
              </div>
              <h1
                style={{
                  margin: 0,
                  fontSize: 28,
                  fontWeight: 800,
                  fontFamily: assocDash.fontDisplay,
                  lineHeight: 1.2,
                  maxWidth: 720,
                }}
              >
                {event.title}
              </h1>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 12,
              marginBottom: 24,
            }}
          >
            <Link
              to={`/organization/events/${event.id}/edit`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 18px',
                borderRadius: assocDash.radiusMd,
                background: assocDash.gradient,
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              <Pencil size={16} />
              Edit event
            </Link>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 20,
              marginBottom: 20,
            }}
          >
            <section style={{ ...assocCard, padding: 24 }}>
              <h2 style={sectionTitleStyle}>When & where</h2>
              <DetailRow icon={Calendar} label="Event date" value={formatEventDate(event.eventDate)} />
              {event.registrationDeadline && (
                <DetailRow
                  icon={Calendar}
                  label="Registration deadline"
                  value={formatEventDate(event.registrationDeadline)}
                />
              )}
              <DetailRow
                icon={event.isOnline ? Wifi : MapPin}
                label={event.isOnline ? 'Format' : 'Location'}
                value={event.isOnline ? 'Online event' : event.location?.trim() || 'Location TBD'}
              />
              {event.maxParticipants != null && (
                <DetailRow icon={Users} label="Capacity" value={`Up to ${event.maxParticipants} participants`} />
              )}
            </section>

            {event.organizationProfileId > 0 && (orgName || orgLogo) && (
              <section style={{ ...assocCard, padding: 24 }}>
                <h2 style={sectionTitleStyle}>Hosted by</h2>
                <Link
                  to={`/organizations/${event.organizationProfileId}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    textDecoration: 'none',
                    color: 'inherit',
                  }}
                >
                  <AssociationAvatar name={orgName} logoUrl={orgLogo} size="md" />
                  <div>
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{orgName}</p>
                    <p style={{ margin: '4px 0 0', fontSize: 12, color: assocDash.accentDark, fontWeight: 600 }}>
                      View public profile →
                    </p>
                  </div>
                </Link>
              </section>
            )}
          </div>

          <section style={{ ...assocCard, padding: 28 }}>
            <h2 style={sectionTitleStyle}>About this event</h2>
            <p style={{ margin: 0, fontSize: 14, color: assocDash.text, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
              {event.description}
            </p>
          </section>
        </>
      ) : null}
    </AssociationDashboardLayout>
  )
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Calendar
  label: string
  value: string
}) {
  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: assocDash.accentMuted,
          border: `1px solid ${assocDash.accentBorder}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: assocDash.accent,
          flexShrink: 0,
        }}
      >
        <Icon size={16} />
      </div>
      <div>
        <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: assocDash.subtle, textTransform: 'uppercase' }}>
          {label}
        </p>
        <p style={{ margin: '4px 0 0', fontSize: 14, color: assocDash.text }}>{value}</p>
      </div>
    </div>
  )
}

function Badge({
  children,
  light,
  muted,
}: {
  children: React.ReactNode
  light?: boolean
  muted?: boolean
}) {
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 600,
        padding: '4px 10px',
        borderRadius: 6,
        background: light ? 'rgba(255,255,255,0.2)' : muted ? '#f1f5f9' : assocDash.accentMuted,
        color: light ? '#fff' : muted ? assocDash.muted : assocDash.accentDark,
        border: light ? '1px solid rgba(255,255,255,0.35)' : `1px solid ${muted ? assocDash.border : assocDash.accentBorder}`,
      }}
    >
      {children}
    </span>
  )
}

const sectionTitleStyle: React.CSSProperties = {
  margin: '0 0 16px',
  fontSize: 15,
  fontWeight: 700,
  fontFamily: assocDash.fontDisplay,
  color: assocDash.text,
}
