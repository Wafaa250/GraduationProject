import { Link } from 'react-router-dom'
import { CalendarDays, Megaphone } from 'lucide-react'
import type { FollowingActivityItem } from '../../../../api/communitiesFeedApi'
import { AssociationAvatar } from '../../association/associationBrand'
import { formatEventDate } from '../../../pages/association/events/eventFormUtils'
import { feed } from '../../../pages/communities/communitiesFeedStyles'
import { assocDash } from '../../../pages/association/dashboard/associationDashTokens'

type Props = {
  item: FollowingActivityItem
}

export function FollowingActivityCard({ item }: Props) {
  const Icon = item.type === 'event' ? CalendarDays : Megaphone
  const iconBg = item.type === 'event' ? '#eff6ff' : '#f5f3ff'
  const iconColor = item.type === 'event' ? '#2563eb' : '#7c3aed'

  return (
    <Link to={item.link} style={{ textDecoration: 'none', color: 'inherit' }}>
      <article style={feed.activityCard} className="feed-activity-card">
        <AssociationAvatar
          name={item.organizationName}
          logoUrl={item.organizationLogoUrl}
          size="sm"
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: assocDash.muted }}>
            {item.organizationName} · {item.detail}
          </p>
          <p
            style={{
              margin: '4px 0 0',
              fontSize: 14,
              fontWeight: 700,
              color: assocDash.text,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {item.title}
          </p>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: assocDash.muted }}>
            {formatEventDate(item.timestamp)}
          </p>
        </div>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: iconBg,
            color: iconColor,
            flexShrink: 0,
          }}
        >
          <Icon size={16} />
        </div>
      </article>
    </Link>
  )
}
