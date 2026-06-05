import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  listOrganizationEventRegistrations,
  parseApiErrorMessage,
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
