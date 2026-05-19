import { Link } from 'react-router-dom'
import { Check, FileText, X } from 'lucide-react'
import type { CSSProperties } from 'react'
import type { RecruitmentApplicantAnalysisResult } from '../../../api/recruitmentApplicationsApi'
import { assocDash } from '../../pages/association/dashboard/associationDashTokens'

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
      ? { border: '1px solid #86efac', background: 'linear-gradient(180deg, #f0fdf4 0%, #ffffff 100%)' }
      : variant === 'rejected'
        ? { opacity: 0.55, border: '1px solid #e2e8f0', background: '#f8fafc' }
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
      <div style={row}>
        {showBestPick ? <span style={bestPick}>Best match</span> : null}
        {badge}
        {variant === 'accepted' ? (
          <span style={{ fontSize: 12, fontWeight: 700, color: '#047857' }}>Added to organization</span>
        ) : null}
      </div>
      <div style={headerRow}>
        <div style={{ minWidth: 0 }}>
          <p style={name}>{r.studentName}</p>
          <p style={meta}>{[r.faculty, r.major].filter(Boolean).join(' · ') || '—'}</p>
        </div>
        {variant !== 'accepted' ? (
          <div style={scoreDock}>
            <span style={scoreNum}>{r.matchScore}</span>
            <span style={scorePct}>%</span>
            <span style={scoreLbl}>match</span>
          </div>
        ) : null}
      </div>
      {variant !== 'accepted' && r.strengths.length > 0 ? (
        <>
          <p style={sectionLbl}>Strengths</p>
          <ul style={list}>
            {r.strengths.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </>
      ) : null}
      {variant !== 'accepted' && r.concerns.length > 0 ? (
        <>
          <p style={{ ...sectionLbl, marginTop: 12 }}>Concerns</p>
          <ul style={{ ...list, color: '#9a3412' }}>
            {r.concerns.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </>
      ) : null}
      {variant !== 'accepted' ? (
        <div style={reasonBox}>
          <p style={reasonLbl}>Why this student</p>
          <p style={reasonText}>{r.reason}</p>
        </div>
      ) : null}
      <div style={actions}>
        <Link to={`/organization/recruitment-campaigns/${campaignId}/applications/${r.applicationId}`} style={outlineBtn}>
          <FileText size={15} />
          View application
        </Link>
        <Link to={`/students/${r.studentUserId}`} style={outlineBtn}>
          View student profile
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
  position: 'relative',
  padding: '18px 18px 16px',
  borderRadius: 16,
  border: '1px solid rgba(226, 232, 240, 0.95)',
  background: '#ffffff',
  marginBottom: 12,
  boxShadow: '0 4px 18px rgba(15, 23, 42, 0.04)',
}

const row: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 10 }
const headerRow: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 14,
  marginBottom: 12,
}
const name: CSSProperties = {
  margin: 0,
  fontSize: 17,
  fontWeight: 800,
  fontFamily: assocDash.fontDisplay,
  color: assocDash.text,
  letterSpacing: -0.02,
}
const meta: CSSProperties = { margin: '8px 0 0', fontSize: 13, color: assocDash.muted, fontWeight: 600 }
const scoreDock: CSSProperties = {
  flexShrink: 0,
  textAlign: 'right',
  padding: '8px 12px',
  borderRadius: 14,
  background: 'linear-gradient(145deg, #fff7ed, #ffedd5)',
  border: '1px solid rgba(251, 191, 36, 0.45)',
  minWidth: 88,
}
const scoreNum: CSSProperties = {
  fontSize: 26,
  fontWeight: 900,
  color: '#c2410c',
  lineHeight: 1,
  fontFamily: assocDash.fontDisplay,
}
const scorePct: CSSProperties = { fontSize: 14, fontWeight: 800, color: '#c2410c', marginLeft: 1 }
const scoreLbl: CSSProperties = {
  display: 'block',
  marginTop: 4,
  fontSize: 10,
  fontWeight: 800,
  color: assocDash.muted,
  textTransform: 'uppercase',
}
const sectionLbl: CSSProperties = {
  margin: '4px 0 6px',
  fontSize: 11,
  fontWeight: 800,
  color: assocDash.subtle,
  textTransform: 'uppercase',
}
const list: CSSProperties = {
  margin: 0,
  paddingLeft: 18,
  fontSize: 13,
  lineHeight: 1.55,
  color: assocDash.text,
  fontWeight: 500,
}
const reasonBox: CSSProperties = {
  marginTop: 14,
  padding: '12px 14px',
  borderRadius: 12,
  background: 'linear-gradient(120deg, rgba(248, 250, 252, 0.9), rgba(255, 251, 235, 0.65))',
  border: '1px solid rgba(226, 232, 240, 0.9)',
}
const reasonLbl: CSSProperties = {
  margin: '0 0 6px',
  fontSize: 10,
  fontWeight: 900,
  color: assocDash.subtle,
  textTransform: 'uppercase',
  letterSpacing: 0.06,
}
const reasonText: CSSProperties = {
  margin: 0,
  fontSize: 14,
  lineHeight: 1.55,
  color: assocDash.text,
  fontWeight: 600,
  fontStyle: 'italic',
}
const actions: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 16 }
const outlineBtn: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '10px 14px',
  borderRadius: 12,
  border: `1px solid ${assocDash.border}`,
  background: assocDash.surface,
  color: assocDash.text,
  fontSize: 13,
  fontWeight: 700,
  textDecoration: 'none',
}
const acceptBtn: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '10px 14px',
  borderRadius: 12,
  border: '1px solid #86efac',
  background: '#ecfdf5',
  color: '#047857',
  fontSize: 13,
  fontWeight: 800,
  cursor: 'pointer',
}
const rejectBtn: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '10px 14px',
  borderRadius: 12,
  border: `1px solid ${assocDash.border}`,
  background: '#f8fafc',
  color: assocDash.muted,
  fontSize: 13,
  fontWeight: 700,
  cursor: 'pointer',
}
const bestPick: CSSProperties = {
  display: 'inline-block',
  fontSize: 10,
  fontWeight: 900,
  letterSpacing: 0.08,
  textTransform: 'uppercase',
  color: '#fff',
  background: 'linear-gradient(90deg, #0f172a, #334155)',
  padding: '5px 10px',
  borderRadius: 8,
}
const badgeBase: CSSProperties = {
  display: 'inline-block',
  padding: '4px 10px',
  borderRadius: 8,
  fontSize: 11,
  fontWeight: 800,
}
const badgeAccepted: CSSProperties = { ...badgeBase, background: '#ecfdf5', color: '#047857', border: '1px solid #86efac' }
const badgeRejected: CSSProperties = { ...badgeBase, background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0' }
const badgeSuggested: CSSProperties = { ...badgeBase, background: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa' }
