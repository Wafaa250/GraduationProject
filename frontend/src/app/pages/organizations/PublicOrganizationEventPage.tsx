import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Calendar, MapPin, Wifi } from 'lucide-react'
import toast from 'react-hot-toast'
import { resolveApiFileUrl } from '../../../api/axiosInstance'
import {
  getPublicOrganizationEvent,
  parseApiErrorMessage,
  type PublicOrganizationEventDetail,
} from '../../../api/organizationsApi'
import { AssociationAvatar } from '../../components/association/associationBrand'
import { assocDash } from '../association/dashboard/associationDashTokens'
import { formatEventDate } from '../association/events/eventFormUtils'
import { publicOrgPage } from './publicOrgPageStyles'

export default function PublicOrganizationEventPage() {
  const { organizationId, eventId } = useParams<{ organizationId: string; eventId: string }>()
  const navigate = useNavigate()
  const [event, setEvent] = useState<PublicOrganizationEventDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const orgId = Number(organizationId)
    const evId = Number(eventId)
    if (!Number.isFinite(orgId) || !Number.isFinite(evId)) {
      setLoading(false)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const data = await getPublicOrganizationEvent(orgId, evId)
        if (!cancelled) setEvent(data)
      } catch (err) {
        toast.error(parseApiErrorMessage(err))
        if (!cancelled) navigate(`/organizations/${organizationId}`)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [organizationId, eventId, navigate])

  const cover = event?.coverImageUrl ? resolveApiFileUrl(event.coverImageUrl) : null
  const orgId = Number(organizationId)

  return (
    <div style={publicOrgPage.page}>
      <nav style={publicOrgPage.nav}>
        <div style={publicOrgPage.navInner}>
          <button type="button" onClick={() => navigate(-1)} style={publicOrgPage.backBtn}>
            <ArrowLeft size={14} />
            Back
          </button>
          <span style={publicOrgPage.logoText}>
            Skill<span style={publicOrgPage.logoAccent}>Swap</span>
          </span>
        </div>
      </nav>

      <div style={publicOrgPage.content}>
        <Link
          to={`/organizations/${orgId}`}
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
          Back to organization
        </Link>

        {loading ? (
          <p style={{ color: assocDash.muted, fontSize: 14 }}>Loading event…</p>
        ) : event ? (
          <>
            <div
              style={{
                ...publicOrgPage.card,
                overflow: 'hidden',
                marginBottom: 24,
                border: `1px solid ${assocDash.border}`,
              }}
            >
              <div
                style={{
                  minHeight: 180,
                  background: cover
                    ? `center/cover no-repeat url(${cover})`
                    : `linear-gradient(135deg, ${assocDash.accentMuted} 0%, #fff 70%)`,
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: cover ? 'linear-gradient(to top, rgba(15,23,42,0.7) 0%, transparent 50%)' : 'none',
                  }}
                />
                <div style={{ position: 'relative', padding: '40px 28px 24px', color: cover ? '#fff' : assocDash.text }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                    <Badge light={!!cover}>{event.eventType}</Badge>
                    {event.category && <Badge light={!!cover} muted>{event.category}</Badge>}
                  </div>
                  <h1
                    style={{
                      margin: 0,
                      fontSize: 26,
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
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: 20,
                marginBottom: 20,
              }}
            >
              <section style={{ ...publicOrgPage.card, padding: 24 }}>
                <h2 style={publicOrgPage.sectionTitle}>When & where</h2>
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
              </section>

              <section style={{ ...publicOrgPage.card, padding: 24 }}>
                <h2 style={publicOrgPage.sectionTitle}>Hosted by</h2>
                <Link
                  to={`/organizations/${orgId}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    textDecoration: 'none',
                    color: 'inherit',
                  }}
                >
                  <AssociationAvatar
                    name={event.organizationName}
                    logoUrl={event.organizationLogoUrl}
                    size="md"
                  />
                  <div>
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: assocDash.text }}>
                      {event.organizationName}
                    </p>
                    <p style={{ margin: '4px 0 0', fontSize: 12, color: assocDash.accentDark, fontWeight: 600 }}>
                      View organization profile →
                    </p>
                  </div>
                </Link>
              </section>
            </div>

            <section style={{ ...publicOrgPage.card, padding: 28 }}>
              <h2 style={publicOrgPage.sectionTitle}>About this event</h2>
              <p style={{ margin: 0, fontSize: 15, lineHeight: 1.7, color: assocDash.text, whiteSpace: 'pre-wrap' }}>
                {event.description}
              </p>
            </section>
          </>
        ) : null}
      </div>
    </div>
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
