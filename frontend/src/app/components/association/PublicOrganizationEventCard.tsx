import { Link } from 'react-router-dom'
import { Eye, MapPin, Wifi } from 'lucide-react'
import { resolveApiFileUrl } from '../../../api/axiosInstance'
import type { PublicOrganizationEventSummary } from '../../../api/organizationsApi'
import { assocDash } from '../../pages/association/dashboard/associationDashTokens'
import { formatEventDate } from '../../pages/association/events/eventFormUtils'

type Props = {
  organizationId: number
  event: PublicOrganizationEventSummary
}

export function PublicOrganizationEventCard({ organizationId, event }: Props) {
  const cover = event.coverImageUrl ? resolveApiFileUrl(event.coverImageUrl) : null

  return (
    <article
      style={{
        borderRadius: assocDash.radiusLg,
        border: `1px solid ${assocDash.border}`,
        background: '#fff',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(15,23,42,0.06)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          height: 140,
          background: cover
            ? `center/cover no-repeat url(${cover})`
            : `linear-gradient(135deg, ${assocDash.accentMuted} 0%, #fff 100%)`,
          borderBottom: `1px solid ${assocDash.border}`,
        }}
      />
      <div style={{ padding: 18, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
          <EventBadge>{event.eventType}</EventBadge>
          {event.category && <EventBadge muted>{event.category}</EventBadge>}
        </div>
        <h3
          style={{
            margin: '0 0 8px',
            fontSize: 16,
            fontWeight: 700,
            fontFamily: assocDash.fontDisplay,
            lineHeight: 1.35,
            color: assocDash.text,
          }}
        >
          {event.title}
        </h3>
        <p style={{ margin: '0 0 6px', fontSize: 13, color: assocDash.muted }}>{formatEventDate(event.eventDate)}</p>
        <p
          style={{
            margin: '0 0 14px',
            fontSize: 13,
            color: assocDash.muted,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          {event.isOnline ? (
            <>
              <Wifi size={14} />
              Online
            </>
          ) : (
            <>
              <MapPin size={14} />
              {event.location?.trim() || 'Location TBD'}
            </>
          )}
        </p>
        <Link
          to={`/organizations/${organizationId}/events/${event.id}`}
          className="public-org-event-view"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            marginTop: 'auto',
            padding: '9px 14px',
            borderRadius: assocDash.radiusMd,
            border: `1px solid ${assocDash.accentBorder}`,
            background: assocDash.accentMuted,
            color: assocDash.accentDark,
            fontSize: 13,
            fontWeight: 600,
            textDecoration: 'none',
            width: 'fit-content',
          }}
        >
          <Eye size={15} />
          View event
        </Link>
      </div>
      <style>{`
        .public-org-event-view:hover {
          background: #fef3c7;
          box-shadow: 0 2px 10px rgba(245, 158, 11, 0.15);
        }
      `}</style>
    </article>
  )
}

function EventBadge({ children, muted }: { children: React.ReactNode; muted?: boolean }) {
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 600,
        padding: '3px 8px',
        borderRadius: 6,
        background: muted ? '#f8fafc' : assocDash.accentMuted,
        color: muted ? assocDash.muted : assocDash.accentDark,
        border: `1px solid ${muted ? assocDash.border : assocDash.accentBorder}`,
      }}
    >
      {children}
    </span>
  )
}
