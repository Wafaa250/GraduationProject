import { useNavigate } from 'react-router-dom'
import { User, GraduationCap, CheckCircle2, ChevronRight } from 'lucide-react'
import type { CompanyTalentCandidate } from '../../../api/companyApi'
import { coCard, coDash } from './dashboard/companyDashTokens'

export function CompanyTalentCandidateCard({
  candidate,
  rank,
}: {
  candidate: CompanyTalentCandidate
  rank: number
}) {
  const navigate = useNavigate()
  const scoreColor =
    candidate.matchScore >= 75 ? '#059669' : candidate.matchScore >= 55 ? '#d97706' : '#64748b'
  const scoreBg =
    candidate.matchScore >= 75 ? '#ecfdf5' : candidate.matchScore >= 55 ? '#fffbeb' : '#f8fafc'

  return (
    <article
      className="co-candidate-card"
      style={{
        ...coCard,
        padding: '22px 24px',
        border: candidate.matchScore >= 75 ? `1.5px solid ${coDash.accentBorder}` : undefined,
      }}
    >
      <div className="co-candidate-inner" style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        <div
          className="co-candidate-rank"
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: coDash.gradient,
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: 16,
            flexShrink: 0,
          }}
        >
          #{rank}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="co-candidate-title-row" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>{candidate.name}</h3>
            <span
              style={{
                padding: '4px 10px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 800,
                background: scoreBg,
                color: scoreColor,
                border: `1px solid ${scoreColor}33`,
              }}
            >
              {candidate.matchScore}% match
            </span>
          </div>
          <div
            className="co-candidate-meta"
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 12,
              fontSize: 13,
              color: coDash.muted,
              marginBottom: 12,
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <GraduationCap size={14} />
              {candidate.major || 'Major not set'}
            </span>
            <span>{candidate.university}</span>
            {candidate.academicYear && <span>Year {candidate.academicYear}</span>}
          </div>
          {candidate.skills.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
              {candidate.skills.slice(0, 8).map((sk) => (
                <span
                  key={sk}
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    padding: '4px 10px',
                    borderRadius: 8,
                    background: coDash.accentMuted,
                    color: coDash.accentDark,
                  }}
                >
                  {sk}
                </span>
              ))}
            </div>
          )}
          <div
            className="co-candidate-reason"
            style={{
              background: '#f8fafc',
              borderRadius: 12,
              padding: '14px 16px',
              marginBottom: candidate.highlights.length > 0 ? 12 : 0,
              border: '1px solid #e2e8f0',
            }}
          >
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: coDash.text, marginBottom: 6 }}>
              Why this student?
            </p>
            <p style={{ margin: 0, fontSize: 14, color: coDash.muted, lineHeight: 1.6 }}>{candidate.reason}</p>
          </div>
          {candidate.highlights.length > 0 && (
            <ul style={{ margin: 0, padding: '0 0 0 18px', fontSize: 13, color: coDash.text, lineHeight: 1.7 }}>
              {candidate.highlights.map((h) => (
                <li key={h} style={{ marginBottom: 4 }}>
                  <CheckCircle2
                    size={14}
                    style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6, color: coDash.accent }}
                  />
                  {h}
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            className="co-candidate-profile-btn"
            onClick={() => navigate(`/students/profile/${candidate.userId}`)}
            style={{
              marginTop: 16,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '10px 16px',
              borderRadius: 10,
              border: `1px solid ${coDash.border}`,
              background: 'white',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
              fontFamily: 'inherit',
              color: coDash.accentDark,
            }}
          >
            <User size={16} />
            View full profile
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </article>
  )
}
