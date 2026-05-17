import { useNavigate } from 'react-router-dom'
import { Heart, Loader2, Users } from 'lucide-react'
import type { MouseEvent, ReactNode } from 'react'
import type { PublicOrganizationDiscovery } from '../../../api/organizationsApi'
import { AssociationAvatar, CategoryBadge } from '../association/associationBrand'
import { communitiesHub } from '../../pages/communities/communitiesHubStyles'
import { assocDash } from '../../pages/association/dashboard/associationDashTokens'

type Props = {
  org: PublicOrganizationDiscovery
  isStudent: boolean
  followBusy: boolean
  onFollowToggle?: (org: PublicOrganizationDiscovery, e: MouseEvent) => void
}

export function CommunitiesOrgPreviewCard({ org, isStudent, followBusy, onFollowToggle }: Props) {
  const navigate = useNavigate()
  const name = org.organizationName || 'Organization'

  return (
    <article style={communitiesHub.previewCard} className="communities-preview-card">
      <button
        type="button"
        onClick={() => navigate(`/organizations/${org.id}`)}
        style={{
          display: 'flex',
          alignItems: 'center',
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
        <AssociationAvatar name={name} logoUrl={org.logoUrl} size="sm" />
        <div style={{ minWidth: 0, flex: 1 }}>
          <p
            style={{
              margin: 0,
              fontSize: 14,
              fontWeight: 700,
              fontFamily: assocDash.fontDisplay,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              color: assocDash.text,
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
      <PreviewFooter>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: assocDash.muted }}>
          <Users size={12} />
          {(org.followersCount ?? 0).toLocaleString()} followers
        </span>
        {isStudent && onFollowToggle ? (
          <button
            type="button"
            disabled={followBusy}
            onClick={(e) => onFollowToggle(org, e)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '6px 10px',
              borderRadius: 8,
              border: `1px solid ${org.isFollowing ? assocDash.accent : assocDash.accentBorder}`,
              background: org.isFollowing ? assocDash.accent : assocDash.accentMuted,
              color: org.isFollowing ? '#fff' : assocDash.accentDark,
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'inherit',
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
      </PreviewFooter>
    </article>
  )
}

function PreviewFooter({ children }: { children: ReactNode }) {
  return (
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
      {children}
    </div>
  )
}
