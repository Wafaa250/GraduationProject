import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  getOrganizationEventRegistration,
  parseApiErrorMessage,
  type EventRegistrationDetail,
} from '@/api/eventRegistrationsApi'
import { eventFieldTypeLabel, normalizeEventFieldType } from '@/utils/eventRegistrationFormFields'
import { ASSOCIATION_ROUTES } from '@/routes/paths'
import { AssociationDashboardLayout } from '../dashboard/AssociationDashboardLayout'
import { assocCard, assocDash } from '../dashboard/associationDashTokens'
import { formatEventDate } from './eventFormUtils'
import { useAssociationShell } from './useAssociationShell'

export default function OrganizationEventRegistrationDetailPage() {
  const { eventId, registrationId } = useParams<{ eventId: string; registrationId: string }>()
  const navigate = useNavigate()
  const shell = useAssociationShell()
  const [registration, setRegistration] = useState<EventRegistrationDetail | null>(null)
  const [loading, setLoading] = useState(true)

  const evId = Number(eventId)
  const regId = Number(registrationId)

  const load = useCallback(async () => {
    if (!Number.isFinite(evId) || !Number.isFinite(regId)) return
    setLoading(true)
    try {
      const data = await getOrganizationEventRegistration(evId, regId)
      setRegistration(data)
    } catch (err) {
      toast.error(parseApiErrorMessage(err))
      navigate(ASSOCIATION_ROUTES.eventDetail(evId))
    } finally {
      setLoading(false)
    }
  }, [evId, regId, navigate])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <AssociationDashboardLayout
      associationName={shell.name}
      sidebarProfile={shell.sidebarProfile}
      sidebarMobileOpen={shell.sidebarMobileOpen}
      onSidebarOpen={() => shell.setSidebarMobileOpen(true)}
      onSidebarClose={() => shell.setSidebarMobileOpen(false)}
      onLogout={shell.handleLogout}
    >
      <Link
        to={ASSOCIATION_ROUTES.eventDetail(evId)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          marginBottom: 20,
          fontSize: 13,
          fontWeight: 600,
          color: assocDash.accentDark,
          textDecoration: 'none',
        }}
      >
        <ArrowLeft size={16} />
        Back to event
      </Link>

      {loading || shell.loading ? (
        <p style={{ color: assocDash.muted, display: 'flex', gap: 8, alignItems: 'center' }}>
          <Loader2 size={16} className="org-hub-spin" /> Loading registration…
        </p>
      ) : registration ? (
        <>
          <div style={{ ...assocCard, padding: 24, marginBottom: 20 }}>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>{registration.studentName}</h1>
            <p style={{ margin: '8px 0 0', fontSize: 14, color: assocDash.muted }}>
              Registered for {registration.eventTitle}
            </p>
            <p style={{ margin: '6px 0 0', fontSize: 13, color: assocDash.muted }}>
              Submitted {formatEventDate(registration.submittedAt)}
              {registration.studentEmail ? ` · ${registration.studentEmail}` : ''}
              {registration.studentMajor ? ` · ${registration.studentMajor}` : ''}
            </p>
          </div>

          <div style={{ ...assocCard, padding: 24 }}>
            <h2 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 800 }}>Submitted answers</h2>
            <div style={{ display: 'grid', gap: 16 }}>
              {registration.answers.map((a) => (
                <div
                  key={a.fieldId}
                  style={{
                    padding: 16,
                    borderRadius: 12,
                    border: `1px solid ${assocDash.border}`,
                    background: assocDash.bg,
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontSize: 11,
                      fontWeight: 800,
                      color: assocDash.subtle,
                      textTransform: 'uppercase',
                    }}
                  >
                    {eventFieldTypeLabel(normalizeEventFieldType(a.fieldType))}
                  </p>
                  <p style={{ margin: '6px 0 8px', fontSize: 15, fontWeight: 700 }}>{a.fieldLabel}</p>
                  {a.selectedValues && a.selectedValues.length > 0 ? (
                    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14, lineHeight: 1.6 }}>
                      {a.selectedValues.map((v) => (
                        <li key={v}>{v}</li>
                      ))}
                    </ul>
                  ) : (
                    <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                      {a.answerValue}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      ) : null}
      <style>{`@keyframes org-hub-spin { to { transform: rotate(360deg); } } .org-hub-spin { animation: org-hub-spin 0.8s linear infinite; }`}</style>
    </AssociationDashboardLayout>
  )
}
