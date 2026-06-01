import { Link } from 'react-router-dom'
import { Check, FileText, X } from 'lucide-react'
import type { CSSProperties } from 'react'
import type { RecruitmentApplicantAnalysisResult } from '@/api/recruitmentApplicationsApi'
import { assocDash } from '@/pages/association/dashboard/associationDashTokens'

export type AiRecruitmentCardVariant = 'suggested' | 'accepted' | 'rejected'

type Props = {
  campaignId: number
  result: RecruitmentApplicantAnalysisResult
  variant: AiRecruitmentCardVariant
  showBestPick?: boolean
  busy?: boolean
  onAccept?: () => void
  onReject?: () => void
}

export function AiRecruitmentCandidateCard({
  campaignId,
  result: r,
  variant,
  showBestPick,
  busy,
  onAccept,
  onReject,
}: Props) {
  const cardStyle: CSSProperties = {
    ...cardBase,
    ...(variant === 'accepted'
      ? { border: '1px solid #86efac', background: '#f0fdf4' }
      : variant === 'rejected'
        ? { opacity: 0.55, border: `1px solid ${assocDash.border}`, background: assocDash.bg }
        : {}),
  }

  const badge =
    variant === 'accepted' ? (
      <span style={badgeAccepted}>Accepted</span>
    ) : variant === 'rejected' ? (
      <span style={badgeRejected}>Rejected</span>
    ) : (
      <span style={badgeSuggested}>AI Suggested</span>
    )

  return (
    <article style={cardStyle}>
      <div style={topRow}>
        <div style={badgeRow}>
          {showBestPick ? <span style={bestPick}>Best match</span> : null}
          {badge}
        </div>
        {variant !== 'accepted' ? (
          <div style={scoreBlock} aria-label={`${r.matchScore} percent match`}>
            <div style={scoreInner}>
              <span style={scoreNum}>{r.matchScore}</span>
              <span style={scorePct}>%</span>
            </div>
            <span style={scoreLbl}>Match</span>
          </div>
        ) : (
          <span style={acceptedNote}>Added to organization</span>
        )}
      </div>

      <div style={identityBlock}>
        <p style={name}>{r.studentName}</p>
        <p style={meta}>{[r.faculty, r.major].filter(Boolean).join(' · ') || '—'}</p>
      </div>

      {variant !== 'accepted' && r.strengths.length > 0 ? (
        <div style={detailSection}>
          <p style={sectionLbl}>Strengths</p>
          <div style={strengthTagRow}>
            {r.strengths.map((s) => (
              <span key={s} style={strengthTag}>
                {s}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {variant !== 'accepted' && r.concerns.length > 0 ? (
        <div style={detailSection}>
          <p style={sectionLbl}>Concerns</p>
          <ul style={concernList}>
            {r.concerns.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {variant !== 'accepted' ? (
        <div style={reasonBox}>
          <p style={reasonLbl}>Why this student</p>
          <p style={reasonText}>{r.reason}</p>
        </div>
      ) : null}

      <div style={actions}>
        <Link to={`/association/recruitment/${campaignId}/applications/${r.applicationId}`} style={outlineBtn}>
          <FileText size={15} />
          View application
        </Link>
        {variant === 'suggested' && onAccept && onReject ? (
          <>
            <button type="button" style={acceptBtn} disabled={busy} onClick={onAccept}>
              <Check size={15} />
              Accept
            </button>
            <button type="button" style={rejectBtn} disabled={busy} onClick={onReject}>
              <X size={15} />
              Reject
            </button>
          </>
        ) : null}
      </div>
    </article>
  )
}

const cardBase: CSSProperties = {
  padding: '20px 20px 18px',
  borderRadius: assocDash.radiusLg,
  border: `1px solid ${assocDash.border}`,
  background: assocDash.surface,
  marginBottom: 14,
  boxShadow: assocDash.shadow,
}

const topRow: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 16,
  marginBottom: 16,
}

const badgeRow: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
  alignItems: 'center',
  flex: 1,
  minWidth: 0,
}

const identityBlock: CSSProperties = {
  marginBottom: 16,
  paddingBottom: 16,
  borderBottom: `1px solid ${assocDash.border}`,
}

const name: CSSProperties = {
  margin: 0,
  fontSize: 18,
  fontWeight: 800,
  fontFamily: assocDash.fontDisplay,
  color: assocDash.text,
  letterSpacing: '-0.02em',
  lineHeight: 1.25,
}

const meta: CSSProperties = {
  margin: '6px 0 0',
  fontSize: 13,
  color: assocDash.muted,
  fontWeight: 500,
  lineHeight: 1.45,
}

const scoreBlock: CSSProperties = {
  flexShrink: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 88,
  padding: '10px 14px',
  borderRadius: assocDash.radiusMd,
  background: assocDash.accentMuted,
  border: `2px solid ${assocDash.accentBorder}`,
  boxShadow: assocDash.shadow,
}

const scoreInner: CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'center',
  gap: 1,
  lineHeight: 1,
}

const scoreNum: CSSProperties = {
  fontSize: 32,
  fontWeight: 800,
  color: assocDash.accentDark,
  fontFamily: assocDash.fontDisplay,
  letterSpacing: '-0.04em',
  fontVariantNumeric: 'tabular-nums',
}

const scorePct: CSSProperties = {
  fontSize: 16,
  fontWeight: 700,
  color: assocDash.accentDark,
}

const scoreLbl: CSSProperties = {
  marginTop: 6,
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: assocDash.muted,
}

const acceptedNote: CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: '#047857',
  flexShrink: 0,
}

const detailSection: CSSProperties = {
  marginBottom: 14,
}

const sectionLbl: CSSProperties = {
  margin: '0 0 8px',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: assocDash.subtle,
}

const strengthTagRow: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
}

const strengthTag: CSSProperties = {
  padding: '5px 11px',
  borderRadius: 999,
  background: assocDash.bg,
  border: `1px solid ${assocDash.border}`,
  fontSize: 12,
  fontWeight: 600,
  color: assocDash.textSecondary,
}

const concernList: CSSProperties = {
  margin: 0,
  paddingLeft: 18,
  fontSize: 13,
  lineHeight: 1.55,
  color: assocDash.accentDark,
  fontWeight: 500,
}

const reasonBox: CSSProperties = {
  marginBottom: 16,
  padding: '14px 16px',
  borderRadius: assocDash.radiusMd,
  background: assocDash.bg,
  border: `1px solid ${assocDash.border}`,
}

const reasonLbl: CSSProperties = {
  margin: '0 0 6px',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: assocDash.subtle,
}

const reasonText: CSSProperties = {
  margin: 0,
  fontSize: 14,
  lineHeight: 1.6,
  color: assocDash.textSecondary,
  fontWeight: 500,
}

const actions: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 10,
  paddingTop: 4,
}

const outlineBtn: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '10px 14px',
  borderRadius: assocDash.radiusMd,
  border: `1px solid ${assocDash.border}`,
  background: assocDash.surface,
  color: assocDash.text,
  fontSize: 13,
  fontWeight: 600,
  textDecoration: 'none',
}

const acceptBtn: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '10px 14px',
  borderRadius: assocDash.radiusMd,
  border: '1px solid #86efac',
  background: '#ecfdf5',
  color: '#047857',
  fontSize: 13,
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: 'inherit',
}

const rejectBtn: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '10px 14px',
  borderRadius: assocDash.radiusMd,
  border: `1px solid ${assocDash.border}`,
  background: assocDash.bg,
  color: assocDash.muted,
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'inherit',
}

const bestPick: CSSProperties = {
  display: 'inline-block',
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: '#fff',
  background: assocDash.text,
  padding: '5px 10px',
  borderRadius: 999,
}

const badgeBase: CSSProperties = {
  display: 'inline-block',
  padding: '5px 11px',
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 700,
}

const badgeAccepted: CSSProperties = { ...badgeBase, background: '#ecfdf5', color: '#047857', border: '1px solid #86efac' }
const badgeRejected: CSSProperties = { ...badgeBase, background: assocDash.bg, color: assocDash.muted, border: `1px solid ${assocDash.border}` }
const badgeSuggested: CSSProperties = {
  ...badgeBase,
  background: assocDash.accentMuted,
  color: assocDash.accentDark,
  border: `1px solid ${assocDash.accentBorder}`,
}
