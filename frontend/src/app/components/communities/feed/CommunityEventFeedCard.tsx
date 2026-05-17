import { Link } from 'react-router-dom'
import { MapPin, Wifi } from 'lucide-react'
import { resolveApiFileUrl } from '../../../../api/axiosInstance'
import type { CommunityFeedEvent } from '../../../../api/communitiesFeedApi'
import { formatEventDate } from '../../../pages/association/events/eventFormUtils'
import { feed } from '../../../pages/communities/communitiesFeedStyles'
import { assocDash } from '../../../pages/association/dashboard/associationDashTokens'

type Props = {
  event: CommunityFeedEvent
}

function registrationLabel(status: CommunityFeedEvent['registrationStatus']): string {
  switch (status) {
    case 'open':
      return 'Registration open'
    case 'closed':
      return 'Registration closed'
    default:
      return 'No registration required'
  }
}

function registrationColors(status: CommunityFeedEvent['registrationStatus']) {
  switch (status) {
    case 'open':
      return { bg: '#ecfdf5', color: '#047857', border: '#a7f3d0' }
    case 'closed':
      return { bg: '#f1f5f9', color: '#64748b', border: '#e2e8f0' }
    default:
      return { bg: '#f8fafc', color: '#64748b', border: '#e2e8f0' }
  }
}

export function CommunityEventFeedCard({ event }: Props) {
  const cover = event.coverImageUrl ? resolveApiFileUrl(event.coverImageUrl) : null
  const locationLabel = event.isOnline ? 'Online' : event.location?.trim() || 'On campus'
  const regStyle = registrationColors(event.registrationStatus)

  return (
    <article style={feed.eventCard} className="feed-event-card">
      <div style={feed.eventCover(cover ?? undefined)} />
      <div style={{ padding: 14, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 600, color: assocDash.muted }}>
          {event.organizationName}
        </p>
        <h3
          style={{
            margin: '0 0 8px',
            fontSize: 15,
            fontWeight: 700,
            fontFamily: assocDash.fontDisplay,
            lineHeight: 1.35,
            color: assocDash.text,
          }}
        >
          {event.title}
        </h3>
        <p style={{ margin: '0 0 4px', fontSize: 12, color: assocDash.muted }}>{formatEventDate(event.eventDate)}</p>
        <p
          style={{
            margin: '0 0 8px',
            fontSize: 12,
            color: assocDash.muted,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          {event.isOnline ? <Wifi size={12} /> : <MapPin size={12} />}
          {locationLabel}
        </p>
        <span
          style={{
            display: 'inline-block',
            alignSelf: 'flex-start',
            marginBottom: 12,
            padding: '4px 8px',
            borderRadius: 6,
            fontSize: 10,
            fontWeight: 700,
            background: regStyle.bg,
            color: regStyle.color,
            border: `1px solid ${regStyle.border}`,
          }}
        >
          {registrationLabel(event.registrationStatus)}
        </span>
        <Link
          to={`/organizations/${event.organizationId}/events/${event.id}`}
          style={{ ...feed.primaryBtn, marginTop: 'auto', width: 'fit-content' }}
        >
          {event.registrationStatus === 'open' ? 'Register' : 'View event'}
        </Link>
      </div>
    </article>
  )
}
