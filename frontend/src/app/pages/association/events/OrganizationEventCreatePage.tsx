import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  createOrganizationEvent,
  parseApiErrorMessage,
} from '../../../../api/organizationEventsApi'
import { AssociationDashboardLayout } from '../dashboard/AssociationDashboardLayout'
import { assocDash } from '../dashboard/associationDashTokens'
import { OrganizationEventForm } from './OrganizationEventForm'
import { useAssociationShell } from './useAssociationShell'

export default function OrganizationEventCreatePage() {
  const navigate = useNavigate()
  const shell = useAssociationShell()
  const [saving, setSaving] = useState(false)

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
          Create event
        </h1>
        <p style={{ margin: '8px 0 0', fontSize: 14, color: assocDash.muted }}>
          Share workshops, hackathons, and community events with students on SkillSwap.
        </p>
      </header>

      {!shell.loading && (
        <OrganizationEventForm
          mode="create"
          submitLabel="Create event"
          cancelTo="/organization/events"
          saving={saving}
          onSubmit={async (payload) => {
            setSaving(true)
            try {
              const created = await createOrganizationEvent(payload)
              toast.success('Event created successfully')
              navigate(`/organization/events/${created.id}`)
            } catch (err) {
              toast.error(parseApiErrorMessage(err))
              throw err
            } finally {
              setSaving(false)
            }
          }}
        />
      )}
    </AssociationDashboardLayout>
  )
}
