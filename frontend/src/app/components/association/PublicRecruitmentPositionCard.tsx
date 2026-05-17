import type { CSSProperties } from 'react'
import { Users } from 'lucide-react'
import {
  parseSkillsList,
  type RecruitmentPosition,
  type RecruitmentQuestion,
} from '../../../api/recruitmentCampaignsApi'
import { RecruitmentPositionApplyPanel } from './RecruitmentPositionApplyPanel'
import { assocDash } from '../../pages/association/dashboard/associationDashTokens'

type Props = {
  organizationId: number
  campaignId: number
  position: RecruitmentPosition
  questions?: RecruitmentQuestion[]
}

export function PublicRecruitmentPositionCard({
  organizationId,
  campaignId,
  position,
  questions = [],
}: Props) {
  const skills = parseSkillsList(position.requiredSkills)

  return (
    <article style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
        <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: assocDash.text, lineHeight: 1.3 }}>
          {position.roleTitle}
        </h3>
        <span style={countBadge}>
          <Users size={14} />
          {position.neededCount} needed
        </span>
      </div>
      {position.description?.trim() ? (
        <p style={bodyStyle}>{position.description.trim()}</p>
      ) : null}
      {position.requirements?.trim() ? (
        <div>
          <p style={labelStyle}>Requirements</p>
          <p style={bodyStyle}>{position.requirements.trim()}</p>
        </div>
      ) : null}
      {skills.length > 0 ? (
        <div>
          <p style={labelStyle}>Skills</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {skills.map((skill) => (
              <span key={skill} style={skillChip}>
                {skill}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <RecruitmentPositionApplyPanel
        organizationId={organizationId}
        campaignId={campaignId}
        position={position}
        questions={questions}
      />
    </article>
  )
}

const cardStyle: CSSProperties = {
  backgroundColor: assocDash.surface,
  borderRadius: 16,
  border: `1px solid ${assocDash.border}`,
  padding: 20,
  marginBottom: 14,
}

const countBadge: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  flexShrink: 0,
  padding: '6px 10px',
  borderRadius: 10,
  backgroundColor: assocDash.accentMuted,
  border: `1px solid ${assocDash.accentBorder}`,
  fontSize: 12,
  fontWeight: 800,
  color: assocDash.accentDark,
}

const labelStyle: CSSProperties = {
  margin: '0 0 6px',
  fontSize: 11,
  fontWeight: 800,
  color: assocDash.subtle,
  textTransform: 'uppercase',
  letterSpacing: 0.4,
}

const bodyStyle: CSSProperties = {
  margin: 0,
  fontSize: 14,
  lineHeight: 1.6,
  color: assocDash.text,
  fontWeight: 500,
}

const skillChip: CSSProperties = {
  padding: '4px 10px',
  borderRadius: 8,
  backgroundColor: assocDash.accentMuted,
  border: `1px solid ${assocDash.accentBorder}`,
  fontSize: 12,
  fontWeight: 700,
  color: assocDash.accentDark,
}
