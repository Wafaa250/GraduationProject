import { useNavigate } from 'react-router-dom'
import { Heart, Loader2, Users } from 'lucide-react'
import type { MouseEvent } from 'react'
import type { PublicOrganizationDiscovery } from '../../../../api/organizationsApi'
import { AssociationAvatar, CategoryBadge } from '../../association/associationBrand'
import { feed } from '../../../pages/communities/communitiesFeedStyles'
import { assocDash } from '../../../pages/association/dashboard/associationDashTokens'

type Props = {
  org: PublicOrganizationDiscovery
  isStudent: boolean
  followBusy: boolean
  onFollowToggle?: (org: PublicOrganizationDiscovery, e: MouseEvent) => void
}

export function SuggestedCommunityCard({ org, isStudent, followBusy, onFollowToggle }: Props) {
  const navigate = useNavigate()
  const name = org.organizationName || 'Organization'
  const description =
    org.shortDescription?.trim() ||
    'Join this campus community for events, updates, and opportunities.'

  return (
    <article style={feed.orgCard} className="feed-org-card">
      <button
        type="button"
        onClick={() => navigate(`/organizations/${org.id}`)}
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
          width: '100%',
          padding: 0,
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          fontFamily: 'inherit',
        }}
      >
        <AssociationAvatar name={name} logoUrl={org.logoUrl} size="md" />
        <div style={{ minWidth: 0, flex: 1 }}>
          <p
            style={{
              margin: 0,
              fontSize: 15,
              fontWeight: 700,
              fontFamily: assocDash.fontDisplay,
              color: assocDash.text,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {name}
          </p>
          {org.category ? (
            <div style={{ marginTop: 6 }}>
              <CategoryBadge category={org.category} />
            </div>
          ) : null}
        </div>
      </button>

      <p
        style={{
          margin: '12px 0 0',
          fontSize: 12,
          lineHeight: 1.5,
          color: assocDash.muted,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          minHeight: 36,
        }}
      >
        {description}
      </p>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          marginTop: 14,
          paddingTop: 12,
          borderTop: `1px solid ${assocDash.border}`,
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            fontSize: 11,
            fontWeight: 600,
            color: assocDash.muted,
          }}
        >
          <Users size={12} />
          {(org.followersCount ?? 0).toLocaleString()} followers
        </span>
        {isStudent && onFollowToggle ? (
          <button
            type="button"
            disabled={followBusy}
            onClick={(e) => onFollowToggle(org, e)}
            style={{
              ...feed.ghostBtn,
              ...(org.isFollowing
                ? { background: assocDash.accent, color: '#fff', border: 'none' }
                : {}),
            }}
          >
            {followBusy ? (
              <Loader2 size={12} className="org-hub-spin" />
            ) : (
              <Heart size={12} fill={org.isFollowing ? 'currentColor' : 'none'} />
            )}
            {org.isFollowing ? 'Following' : 'Follow'}
          </button>
        ) : null}
      </div>
    </article>
  )
}
