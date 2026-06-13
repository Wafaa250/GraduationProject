import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  generateEventRegistrationAiRecommendations,
  listOrganizationEventRegistrations,
  parseApiErrorMessage,
  type EventRegistrationAiRecommendation,
  type EventRegistrationListItem,
} from '@/api/eventRegistrationsApi'
import { ASSOCIATION_ROUTES } from '@/routes/paths'
import { assocCard, assocDash } from '@/pages/association/dashboard/associationDashTokens'
import { formatEventDate } from '@/pages/association/events/eventFormUtils'

type Props = {
  eventId: number
  onRegistrationsCountChange?: (count: number) => void
}

export function OrganizationEventRegistrationsSection({ eventId, onRegistrationsCountChange }: Props) {
  const [registrations, setRegistrations] = useState<EventRegistrationListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiRecommendations, setAiRecommendations] = useState<EventRegistrationAiRecommendation[] | null>(null)
  const [aiUsedAi, setAiUsedAi] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await listOrganizationEventRegistrations(eventId)
      setRegistrations(data)
      onRegistrationsCountChange?.(data.length)
    } catch (err) {
      toast.error(parseApiErrorMessage(err))
      setRegistrations([])
      onRegistrationsCountChange?.(0)
    } finally {
      setLoading(false)
    }
  }, [eventId, onRegistrationsCountChange])

  useEffect(() => {
    void load()
  }, [load])

  const handleGenerateAiRecommendations = async () => {
    if (registrations.length === 0) {
      toast.error('No registrations to analyze yet.')
      return
    }

    setAiLoading(true)
    try {
      const response = await generateEventRegistrationAiRecommendations(eventId)
      setAiRecommendations(response.recommendations)
      setAiUsedAi(response.usedAi)
      if (response.recommendations.length === 0) {
        toast('No recommendations were generated.')
      } else if (!response.usedAi) {
        toast('Recommendations generated using profile matching (AI unavailable).')
      }
    } catch (err) {
      toast.error(parseApiErrorMessage(err))
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <section style={{ marginTop: 40 }}>
      <div style={sectionHeadingBlock}>
        <h2 style={sectionTitle}>Registrations</h2>
        <p style={sectionHint}>Students who registered for this event through the registration form.</p>
      </div>

      {loading ? (
        <p style={{ color: assocDash.muted, display: 'flex', gap: 8, alignItems: 'center', fontSize: 14 }}>
          <Loader2 size={16} className="org-hub-spin" /> Loading registrations…
        </p>
      ) : registrations.length === 0 ? (
        <div style={{ ...assocCard, padding: 32, textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: 14, color: assocDash.muted, fontWeight: 500 }}>
            No registrations yet.
          </p>
        </div>
      ) : (
        <div style={{ ...assocCard, padding: 0, overflow: 'hidden' }}>
          <div style={tableHead}>
            <span>Registrant</span>
            <span>Submitted</span>
            <span />
          </div>
          {registrations.map((row, index) => (
            <div
              key={row.id}
              style={{
                ...tableRow,
                borderBottom: index === registrations.length - 1 ? 'none' : tableRow.borderBottom,
              }}
            >
              <div>
                <p style={applicantName}>{row.studentName}</p>
                <p style={applicantMeta}>{row.studentEmail ?? row.studentMajor ?? '—'}</p>
                {row.previewAnswer ? <p style={applicantPreview}>{row.previewAnswer}</p> : null}
              </div>
              <span style={cellMuted}>{formatEventDate(row.submittedAt)}</span>
              <Link
                to={ASSOCIATION_ROUTES.eventRegistrationDetail(eventId, row.id)}
                style={viewLink}
              >
                View
              </Link>
            </div>
          ))}
        </div>
      )}
      <style>{`@keyframes org-hub-spin { to { transform: rotate(360deg); } } .org-hub-spin { animation: org-hub-spin 0.8s linear infinite; }`}</style>

      <section style={{ marginTop: 40 }}>
        <div style={sectionHeadingBlock}>
          <h2 style={sectionTitle}>AI Recommended Participants</h2>
          <p style={sectionHint}>
            Rank registered students by fit using skills, interests, major/faculty, and form answers.
          </p>
        </div>

        <button
          type="button"
          disabled={aiLoading || loading || registrations.length === 0}
          onClick={() => void handleGenerateAiRecommendations()}
          style={{
            ...generateAiBtn,
            opacity: aiLoading || loading || registrations.length === 0 ? 0.75 : 1,
            cursor: aiLoading || loading || registrations.length === 0 ? 'not-allowed' : 'pointer',
          }}
        >
          {aiLoading ? (
            <>
              <Loader2 size={16} className="org-hub-spin" />
              Generating recommendations…
            </>
          ) : (
            <>
              <Sparkles size={16} />
              Generate AI Recommendations
            </>
          )}
        </button>

        {aiRecommendations && aiRecommendations.length > 0 ? (
          <div style={{ ...assocCard, padding: 0, overflow: 'hidden', marginTop: 16 }}>
            {!aiUsedAi ? (
              <p style={aiFallbackNote}>
                AI service was unavailable; scores were computed from profile and registration data.
              </p>
            ) : null}
            <div style={aiTableHead}>
              <span>Participant</span>
              <span>Match</span>
              <span>Reason</span>
            </div>
            {aiRecommendations.map((row, index) => (
              <div
                key={row.registrationId}
                style={{
                  ...aiTableRow,
                  borderBottom: index === aiRecommendations.length - 1 ? 'none' : aiTableRow.borderBottom,
                }}
              >
                <div>
                  <p style={applicantName}>{row.studentName}</p>
                  <p style={applicantMeta}>{row.studentMajor ?? '—'}</p>
                </div>
                <span style={matchScoreBadge}>{row.matchScore}%</span>
                <p style={aiReason}>{row.reason}</p>
              </div>
            ))}
          </div>
        ) : aiRecommendations && aiRecommendations.length === 0 ? (
          <div style={{ ...assocCard, padding: 24, marginTop: 16 }}>
            <p style={{ margin: 0, fontSize: 14, color: assocDash.muted }}>
              No recommendations were generated for this event.
            </p>
          </div>
        ) : null}
      </section>
    </section>
  )
}

const sectionHeadingBlock: React.CSSProperties = { marginBottom: 16 }
const sectionTitle: React.CSSProperties = {
  margin: 0,
  fontSize: 18,
  fontWeight: 800,
  fontFamily: assocDash.fontDisplay,
  color: assocDash.text,
}
const sectionHint: React.CSSProperties = { margin: '6px 0 0', fontSize: 13, color: assocDash.muted }
const tableHead: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 140px 72px',
  gap: 12,
  padding: '12px 20px',
  fontSize: 11,
  fontWeight: 800,
  textTransform: 'uppercase',
  color: assocDash.subtle,
  borderBottom: `1px solid ${assocDash.border}`,
  background: assocDash.bg,
}
const tableRow: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 140px 72px',
  gap: 12,
  padding: '16px 20px',
  alignItems: 'center',
  borderBottom: `1px solid ${assocDash.border}`,
  background: assocDash.surface,
}
const applicantName: React.CSSProperties = { margin: 0, fontSize: 14, fontWeight: 700, color: assocDash.text }
const applicantMeta: React.CSSProperties = { margin: '4px 0 0', fontSize: 12, color: assocDash.muted }
const applicantPreview: React.CSSProperties = {
  margin: '6px 0 0',
  fontSize: 12,
  color: assocDash.subtle,
  lineHeight: 1.4,
}
const cellMuted: React.CSSProperties = { fontSize: 13, color: assocDash.muted }
const viewLink: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: assocDash.accentDark,
  textDecoration: 'none',
}
const generateAiBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '12px 18px',
  borderRadius: assocDash.radiusMd,
  border: `1px solid ${assocDash.accentBorder}`,
  background: assocDash.accentMuted,
  color: assocDash.accentDark,
  fontSize: 14,
  fontWeight: 700,
}
const aiTableHead: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(160px, 1fr) 72px minmax(200px, 2fr)',
  gap: 12,
  padding: '12px 20px',
  fontSize: 11,
  fontWeight: 800,
  textTransform: 'uppercase',
  color: assocDash.subtle,
  borderBottom: `1px solid ${assocDash.border}`,
  background: assocDash.bg,
}
const aiTableRow: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(160px, 1fr) 72px minmax(200px, 2fr)',
  gap: 12,
  padding: '16px 20px',
  alignItems: 'start',
  borderBottom: `1px solid ${assocDash.border}`,
  background: assocDash.surface,
}
const matchScoreBadge: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 800,
  color: assocDash.accentDark,
}
const aiReason: React.CSSProperties = {
  margin: 0,
  fontSize: 13,
  color: assocDash.text,
  lineHeight: 1.5,
}
const aiFallbackNote: React.CSSProperties = {
  margin: 0,
  padding: '12px 20px',
  fontSize: 12,
  color: assocDash.muted,
  borderBottom: `1px solid ${assocDash.border}`,
  background: assocDash.bg,
}
