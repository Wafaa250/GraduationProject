import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { getOrganizationEvent, parseApiErrorMessage } from '../../../../api/organizationEventsApi'
import {
  getEventRegistrationForm,
  type EventRegistrationForm,
} from '../../../../api/eventRegistrationFormApi'
import { EventRegistrationFormEditor } from '../../../components/association/EventRegistrationFormEditor'
import { AssociationDashboardLayout } from '../dashboard/AssociationDashboardLayout'
import { useAssociationShell } from './useAssociationShell'

export default function OrganizationEventRegistrationFormPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const navigate = useNavigate()
  const shell = useAssociationShell()
  const [loading, setLoading] = useState(true)
  const [eventTitle, setEventTitle] = useState('')
  const [form, setForm] = useState<EventRegistrationForm | null>(null)

  const id = Number(eventId)
  const backTo = Number.isFinite(id) ? `/organization/events/${id}/edit` : '/organization/events'

  useEffect(() => {
    if (!Number.isFinite(id)) {
      setLoading(false)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const [event, regForm] = await Promise.all([
          getOrganizationEvent(id),
          getEventRegistrationForm(id),
        ])
        if (cancelled) return
        if (!regForm) {
          toast.error('Registration form not found')
          navigate(backTo)
          return
        }
        setEventTitle(event.title)
        setForm(regForm)
      } catch (err) {
        toast.error(parseApiErrorMessage(err))
        if (!cancelled) navigate(backTo)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id, navigate, backTo])

  return (
    <AssociationDashboardLayout
      associationName={shell.name}
      sidebarProfile={shell.sidebarProfile}
      sidebarMobileOpen={shell.sidebarMobileOpen}
      onSidebarOpen={() => shell.setSidebarMobileOpen(true)}
      onSidebarClose={() => shell.setSidebarMobileOpen(false)}
      onLogout={shell.handleLogout}
    >
      {loading || shell.loading ? (
        <p style={{ color: '#64748b', fontSize: 14 }}>Loading…</p>
      ) : form ? (
        <EventRegistrationFormEditor
          eventId={id}
          eventTitle={eventTitle}
          form={form}
          backTo={backTo}
          backLabel="Back to event"
          onFormChange={setForm}
        />
      ) : null}
    </AssociationDashboardLayout>
  )
}
