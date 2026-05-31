import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, CalendarPlus } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  createOrganizationEvent,
  parseApiErrorMessage,
} from '@/api/organizationEventsApi'
import { AssociationDashboardLayout } from '../dashboard/AssociationDashboardLayout'
import { assocDash, assocType } from '../dashboard/associationDashTokens'
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
      <div className="event-create-page">
        <Link to="/association/events" className="event-create-back">
          <ArrowLeft size={16} strokeWidth={2} aria-hidden />
          Back to events
        </Link>

        <header className="event-create-hero">
          <div className="event-create-hero-icon" aria-hidden>
            <CalendarPlus size={22} strokeWidth={2} />
          </div>
          <div>
            <p style={{ ...assocType.eyebrow, margin: 0 }}>New event</p>
            <h1 style={{ ...assocType.pageTitle, margin: '6px 0 0', fontSize: 28, lineHeight: 1.2 }}>
              Create an event
            </h1>
          </div>
        </header>

        {!shell.loading && (
          <OrganizationEventForm
            mode="create"
            submitLabel="Create event"
            cancelTo="/association/events"
            saving={saving}
            onSubmit={async (payload) => {
              setSaving(true)
              try {
                const created = await createOrganizationEvent(payload)
                toast.success('Event created successfully')
                navigate(`/association/events/${created.id}`)
              } catch (err) {
                toast.error(parseApiErrorMessage(err))
                throw err
              } finally {
                setSaving(false)
              }
            }}
          />
        )}
      </div>

      <style>{`
        .event-create-page {
          max-width: 1080px;
          margin: 0 auto;
        }
        .event-create-back {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 24px;
          font-size: 13px;
          font-weight: 600;
          color: ${assocDash.muted};
          text-decoration: none;
          transition: color 0.15s ease;
        }
        .event-create-back:hover {
          color: ${assocDash.text};
        }
        .event-create-hero {
          display: flex;
          align-items: center;
          gap: 18px;
          margin-bottom: 32px;
        }
        .event-create-hero-icon {
          flex-shrink: 0;
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: ${assocDash.accentMuted};
          border: 1px solid ${assocDash.accentBorder};
          color: ${assocDash.accentDark};
        }
        @media (max-width: 560px) {
          .event-create-hero {
            flex-direction: column;
            gap: 14px;
          }
        }
      `}</style>
    </AssociationDashboardLayout>
  )
}
