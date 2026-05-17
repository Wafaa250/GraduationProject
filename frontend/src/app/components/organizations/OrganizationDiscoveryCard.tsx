import { useNavigate } from 'react-router-dom'
import { Heart, Loader2, Users, ExternalLink } from 'lucide-react'
import type { CSSProperties, MouseEvent } from 'react'
import type { PublicOrganizationDiscovery } from '../../../api/organizationsApi'
import { AssociationAvatar, CategoryBadge } from '../association/associationBrand'
import { assocDash } from '../../pages/association/dashboard/associationDashTokens'

function formatFollowers(count: number) {
  const n = Number.isFinite(count) ? Math.max(0, count) : 0
  if (n === 1) return '1 follower'
  return `${n.toLocaleString()} followers`
}

type Props = {
  org: PublicOrganizationDiscovery
  isStudent: boolean
  followBusy: boolean
  onFollowToggle?: (org: PublicOrganizationDiscovery, e: MouseEvent) => void
  compact?: boolean
}

export function OrganizationDiscoveryCard({ org, isStudent, followBusy, onFollowToggle, compact }: Props) {
  const navigate = useNavigate()
  const name = org.organizationName || 'Organization'
  const username = org.username || `org-${org.id}`

  return (
    <article style={{ ...card.wrap, ...(compact ? card.compact : {}) }} className="org-hub-card">
      <OrgCardBanner org={org} />
      <div style={card.body}>
        <div style={card.top}>
          <div style={card.avatarWrap}>
            <AssociationAvatar name={name} logoUrl={org.logoUrl} size={compact ? 'sm' : 'md'} />
          </div>
          <div style={card.meta}>
            <h3 style={card.title}>{name}</h3>
            <p style={card.username}>@{username}</p>
            {org.category ? (
              <div style={{ marginTop: 8 }}>
                <CategoryBadge category={org.category} />
              </div>
            ) : null}
          </div>
        </div>

        {org.shortDescription ? (
          <p style={card.desc}>{org.shortDescription}</p>
        ) : (
          <p style={card.descMuted}>Campus community · events & opportunities</p>
        )}

        <OrgCardStats count={org.followersCount} />

        <div style={card.actions}>
          <button type="button" style={card.viewBtn} onClick={() => navigate(`/organizations/${org.id}`)}>
            <ExternalLink size={14} />
            View profile
          </button>
          {isStudent && onFollowToggle ? (
            <button
              type="button"
              disabled={followBusy}
              style={{ ...card.followBtn, ...(org.isFollowing ? card.followBtnActive : {}) }}
              onClick={(e) => onFollowToggle(org, e)}
            >
              {followBusy ? (
                <Loader2 size={14} className="org-hub-spin" />
              ) : (
                <Heart size={14} fill={org.isFollowing ? 'currentColor' : 'none'} />
              )}
              {org.isFollowing ? 'Following' : 'Follow'}
            </button>
          ) : null}
        </div>
      </div>
    </article>
  )
}

function OrgCardBanner({ org }: { org: PublicOrganizationDiscovery }) {
  return (
    <div
      style={{
        ...card.banner,
        background: org.coverUrl
          ? `center/cover no-repeat url(${org.coverUrl})`
          : assocDash.gradient,
      }}
    />
  )
}

function OrgCardStats({ count }: { count: number }) {
  return (
    <div style={card.stats}>
      <Users size={14} color={assocDash.muted} />
      <span>{formatFollowers(count)}</span>
    </div>
  )
}

const card: Record<string, CSSProperties> = {
  wrap: {
    background: '#fff',
    borderRadius: 16,
    border: `1px solid ${assocDash.border}`,
    boxShadow: '0 4px 20px rgba(15,23,42,0.06)',
    overflow: 'hidden',
    transition: 'transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease',
  },
  compact: { minHeight: 'auto' },
  banner: { height: 88, borderBottom: `1px solid ${assocDash.border}` },
  body: { padding: '16px 16px 14px' },
  top: { display: 'flex', gap: 12, alignItems: 'flex-start' },
  avatarWrap: { marginTop: -36 },
  meta: { flex: 1, minWidth: 0, paddingTop: 2 },
  title: {
    margin: 0,
    fontSize: 15,
    fontWeight: 700,
    fontFamily: assocDash.fontDisplay,
    color: assocDash.text,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  username: { margin: '2px 0 0', fontSize: 12, color: assocDash.muted },
  desc: {
    margin: '12px 0 0',
    fontSize: 13,
    lineHeight: 1.5,
    color: assocDash.text,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  descMuted: {
    margin: '12px 0 0',
    fontSize: 12,
    lineHeight: 1.45,
    color: assocDash.muted,
    fontStyle: 'italic',
  },
  stats: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    fontSize: 12,
    fontWeight: 600,
    color: assocDash.muted,
  },
  actions: {
    display: 'flex',
    gap: 8,
    marginTop: 14,
    paddingTop: 12,
    borderTop: `1px solid ${assocDash.border}`,
  },
  viewBtn: {
    flex: 1,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: '9px 10px',
    borderRadius: 10,
    border: `1px solid ${assocDash.border}`,
    background: '#fff',
    color: assocDash.text,
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  followBtn: {
    flex: 1,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: '9px 10px',
    borderRadius: 10,
    border: `1px solid ${assocDash.accentBorder}`,
    background: assocDash.accentMuted,
    color: assocDash.accentDark,
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  followBtnActive: {
    background: assocDash.accent,
    borderColor: assocDash.accent,
    color: '#fff',
  },
}
