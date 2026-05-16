import { type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { Eye, Megaphone, Users } from 'lucide-react'
import { resolveApiFileUrl } from '../../../api/axiosInstance'
import type { PublicRecruitmentCampaignSummary } from '../../../api/recruitmentCampaignsApi'
import { assocDash } from '../../pages/association/dashboard/associationDashTokens'
import { formatEventDate } from '../../pages/association/events/eventFormUtils'

type Props = {
  organizationId: number
  campaign: PublicRecruitmentCampaignSummary
}

export function PublicRecruitmentCampaignCard({ organizationId, campaign }: Props) {
  const cover = campaign.coverImageUrl ? resolveApiFileUrl(campaign.coverImageUrl) : null

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
          height: 120,
          background: cover
            ? `center/cover no-repeat url(${cover})`
            : `linear-gradient(135deg, ${assocDash.accentMuted}, #fff)`,
          borderBottom: `1px solid ${assocDash.border}`,
        }}
      />
      <div style={{ padding: 18, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <Megaphone size={16} color={assocDash.accent} />
          <span style={badge}>
            <Users size={12} />
            {campaign.openPositionsCount} open position{campaign.openPositionsCount === 1 ? '' : 's'}
          </span>
        </div>
        <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700, lineHeight: 1.35 }}>{campaign.title}</h3>
        <p style={{ margin: '0 0 14px', fontSize: 13, color: assocDash.muted }}>
          Apply by {formatEventDate(campaign.applicationDeadline)}
        </p>
        <Link
          to={`/organizations/${organizationId}/recruitment-campaigns/${campaign.id}`}
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
          View campaign
        </Link>
      </div>
    </article>
  )
}

const badge: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 5,
  fontSize: 11,
  fontWeight: 700,
  padding: '3px 8px',
  borderRadius: 6,
  background: assocDash.accentMuted,
  color: assocDash.accentDark,
  border: `1px solid ${assocDash.accentBorder}`,
}
