import { Link } from 'react-router-dom'
import { Building2 } from 'lucide-react'
import type { CommunityFeedRecruitment } from '../../../../api/communitiesFeedApi'
import { formatEventDate } from '../../../pages/association/events/eventFormUtils'
import { feed } from '../../../pages/communities/communitiesFeedStyles'
import { assocDash } from '../../../pages/association/dashboard/associationDashTokens'

type Props = {
  item: CommunityFeedRecruitment
}

export function CommunityRecruitmentFeedCard({ item }: Props) {
  return (
    <article style={feed.recruitmentCard} className="feed-recruitment-card">
      <p
        style={{
          margin: 0,
          fontSize: 11,
          fontWeight: 600,
          color: assocDash.muted,
          display: 'flex',
          alignItems: 'center',
          gap: 5,
        }}
      >
        <Building2 size={12} />
        {item.organizationName}
      </p>
      <h3 style={{ margin: '4px 0 0', fontSize: 15, fontWeight: 700, color: assocDash.text, lineHeight: 1.35 }}>
        {item.roleTitle}
      </h3>
      <p style={{ margin: '6px 0 0', fontSize: 12, color: assocDash.muted }}>
        Apply by {formatEventDate(item.applicationDeadline)}
      </p>
      {item.skillTags.length > 0 ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
          {item.skillTags.map((tag) => (
            <span key={tag} style={feed.tag}>
              {tag}
            </span>
          ))}
        </div>
      ) : item.openPositionsCount > 0 ? (
        <span style={{ ...feed.tag, marginTop: 8, alignSelf: 'flex-start' }}>
          {item.openPositionsCount} open role{item.openPositionsCount === 1 ? '' : 's'}
        </span>
      ) : null}
      <Link
        to={`/organizations/${item.organizationId}/recruitment-campaigns/${item.id}`}
        style={{ ...feed.primaryBtn, marginTop: 10, width: 'fit-content' }}
      >
        Apply
      </Link>
    </article>
  )
}
