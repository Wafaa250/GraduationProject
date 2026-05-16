import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  getOrganizationEvent,
  parseApiErrorMessage,
  updateOrganizationEvent,
  type StudentOrganizationEvent,
} from '../../../../api/organizationEventsApi'
import { AssociationDashboardLayout } from '../dashboard/AssociationDashboardLayout'
import { assocDash } from '../dashboard/associationDashTokens'
import { EventRegistrationFormSection } from '../../../components/association/EventRegistrationFormSection'
import { OrganizationEventForm, eventToFormValues } from './OrganizationEventForm'
import { useAssociationShell } from './useAssociationShell'

export default function OrganizationEventEditPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const navigate = useNavigate()
  const shell = useAssociationShell()
  const [event, setEvent] = useState<StudentOrganizationEvent | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const id = Number(eventId)
    if (!Number.isFinite(id)) {
      setLoading(false)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const data = await getOrganizationEvent(id)
        if (!cancelled) setEvent(data)
      } catch (err) {
        toast.error(parseApiErrorMessage(err))
        if (!cancelled) navigate('/organization/events')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [eventId, navigate])

  const id = Number(eventId)

  return (
    <AssociationDashboardLayout
      associationName={shell.name}
      sidebarProfile={shell.sidebarProfile}
      sidebarMobileOpen={shell.sidebarMobileOpen}
      onSidebarOpen={() => shell.setSidebarMobileOpen(true)}
      onSidebarClose={() => shell.setSidebarMobileOpen(false)}
      onLogout={shell.handleLogout}
    >
      <header style={{ marginBottom: 24 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: assocDash.accent }}>Student Organization</p>
        <h1
          style={{
            margin: '6px 0 0',
            fontSize: 26,
            fontWeight: 800,
            fontFamily: assocDash.fontDisplay,
            color: assocDash.text,
          }}
        >
          Edit event
        </h1>
        {event && (
          <p style={{ margin: '8px 0 0', fontSize: 14, color: assocDash.muted }}>{event.title}</p>
        )}
      </header>

      {loading || shell.loading ? (
        <p style={{ color: assocDash.muted, fontSize: 14 }}>Loading event…</p>
      ) : event ? (
        <>
          <OrganizationEventForm
            key={event.id}
            mode="edit"
            initialValues={eventToFormValues(event)}
            submitLabel="Save changes"
            cancelTo={`/organization/events/${id}`}
            saving={saving}
            onSubmit={async (payload) => {
            setSaving(true)
            try {
              await updateOrganizationEvent(id, payload)
              toast.success('Event updated successfully')
              navigate(`/organization/events/${id}`)
            } catch (err) {
              toast.error(parseApiErrorMessage(err))
              throw err
            } finally {
              setSaving(false)
            }
          }}
          />
          <EventRegistrationFormSection
            eventId={id}
            eventTitle={event.title}
            disabled={saving}
          />
        </>
      ) : null}
    </AssociationDashboardLayout>
  )
}
