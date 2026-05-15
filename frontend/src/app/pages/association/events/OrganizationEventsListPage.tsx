import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarPlus, Eye, MapPin, Pencil, Trash2, Wifi } from 'lucide-react'
import toast from 'react-hot-toast'
import { resolveApiFileUrl } from '../../../../api/axiosInstance'
import {
  deleteOrganizationEvent,
  listOrganizationEvents,
  parseApiErrorMessage,
  type StudentOrganizationEvent,
} from '../../../../api/organizationEventsApi'
import { AssociationDashboardLayout } from '../dashboard/AssociationDashboardLayout'
import { assocCard, assocDash } from '../dashboard/associationDashTokens'
import { formatEventDate } from './eventFormUtils'
import { useAssociationShell } from './useAssociationShell'

export default function OrganizationEventsListPage() {
  const shell = useAssociationShell()
  const [events, setEvents] = useState<StudentOrganizationEvent[]>([])
  const [eventsLoading, setEventsLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const loadEvents = async () => {
    setEventsLoading(true)
    try {
      const data = await listOrganizationEvents()
      setEvents(data)
    } catch (err) {
      toast.error(parseApiErrorMessage(err))
    } finally {
      setEventsLoading(false)
    }
  }

  useEffect(() => {
    void loadEvents()
  }, [])

  const handleDelete = async (event: StudentOrganizationEvent) => {
    if (!window.confirm(`Delete "${event.title}"? This cannot be undone.`)) return
    setDeletingId(event.id)
    try {
      await deleteOrganizationEvent(event.id)
      toast.success('Event deleted')
      setEvents((prev) => prev.filter((e) => e.id !== event.id))
    } catch (err) {
      toast.error(parseApiErrorMessage(err))
    } finally {
      setDeletingId(null)
    }
  }

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
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 16,
            marginTop: 6,
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: 26,
                fontWeight: 800,
                fontFamily: assocDash.fontDisplay,
                color: assocDash.text,
              }}
            >
              My events
            </h1>
            <p style={{ margin: '8px 0 0', fontSize: 14, color: assocDash.muted, maxWidth: 480 }}>
              Create and manage events for your student organization.
            </p>
          </div>
          <Link to="/organization/events/create" style={createBtnStyle}>
            <CalendarPlus size={18} />
            Create event
          </Link>
        </div>
      </header>

      {shell.loading || eventsLoading ? (
        <p style={{ color: assocDash.muted, fontSize: 14 }}>Loading events…</p>
      ) : events.length === 0 ? (
        <div style={{ ...assocCard, padding: 40, textAlign: 'center' }}>
          <CalendarPlus size={40} color={assocDash.accent} style={{ marginBottom: 16 }} />
          <h2 style={{ margin: '0 0 8px', fontSize: 18, fontFamily: assocDash.fontDisplay }}>No events yet</h2>
          <p style={{ margin: '0 0 20px', fontSize: 14, color: assocDash.muted, maxWidth: 400, marginInline: 'auto' }}>
            Host workshops, hackathons, and community gatherings. Your first event is one click away.
          </p>
          <Link to="/organization/events/create" style={createBtnStyle}>
            Create your first event
          </Link>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 20,
          }}
        >
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              deleting={deletingId === event.id}
              onDelete={() => void handleDelete(event)}
            />
          ))}
        </div>
      )}
    </AssociationDashboardLayout>
  )
}

function EventCard({
  event,
  deleting,
  onDelete,
}: {
  event: StudentOrganizationEvent
  deleting: boolean
  onDelete: () => void
}) {
  const cover = event.coverImageUrl ? resolveApiFileUrl(event.coverImageUrl) : null

  return (
    <article style={{ ...assocCard, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          height: 140,
          background: cover
            ? `center/cover no-repeat url(${cover})`
            : `linear-gradient(135deg, ${assocDash.accentMuted} 0%, #fff 100%)`,
          borderBottom: `1px solid ${assocDash.border}`,
        }}
      />
      <div style={{ padding: 18, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
          <Badge>{event.eventType}</Badge>
          {event.category && <Badge muted>{event.category}</Badge>}
        </div>
        <h3
          style={{
            margin: '0 0 8px',
            fontSize: 16,
            fontWeight: 700,
            fontFamily: assocDash.fontDisplay,
            lineHeight: 1.3,
          }}
        >
          {event.title}
        </h3>
        <p style={{ margin: '0 0 6px', fontSize: 13, color: assocDash.muted }}>{formatEventDate(event.eventDate)}</p>
        <p style={{ margin: '0 0 6px', fontSize: 13, color: assocDash.muted, display: 'flex', alignItems: 'center', gap: 6 }}>
          {event.isOnline ? (
            <>
              <Wifi size={14} />
              Online
            </>
          ) : (
            <>
              <MapPin size={14} />
              {event.location?.trim() || 'Location TBD'}
            </>
          )}
        </p>
        {event.registrationDeadline && (
          <p style={{ margin: '0 0 12px', fontSize: 12, color: assocDash.subtle }}>
            Register by {formatEventDate(event.registrationDeadline)}
          </p>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 'auto', paddingTop: 12 }}>
          <ActionLink to={`/organization/events/${event.id}`} icon={Eye}>
            View
          </ActionLink>
          <ActionLink to={`/organization/events/${event.id}/edit`} icon={Pencil}>
            Edit
          </ActionLink>
          <button type="button" onClick={onDelete} disabled={deleting} style={deleteBtnStyle}>
            <Trash2 size={14} />
            {deleting ? '…' : 'Delete'}
          </button>
        </div>
      </div>
    </article>
  )
}

function Badge({ children, muted }: { children: React.ReactNode; muted?: boolean }) {
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 600,
        padding: '3px 8px',
        borderRadius: 6,
        background: muted ? '#f1f5f9' : assocDash.accentMuted,
        color: muted ? assocDash.muted : assocDash.accentDark,
        border: `1px solid ${muted ? assocDash.border : assocDash.accentBorder}`,
      }}
    >
      {children}
    </span>
  )
}

function ActionLink({
  to,
  icon: Icon,
  children,
}: {
  to: string
  icon: typeof Eye
  children: React.ReactNode
}) {
  return (
    <Link
      to={to}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '7px 12px',
        borderRadius: 8,
        border: `1px solid ${assocDash.border}`,
        background: '#fff',
        fontSize: 12,
        fontWeight: 600,
        color: assocDash.accentDark,
        textDecoration: 'none',
      }}
    >
      <Icon size={14} />
      {children}
    </Link>
  )
}


const createBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '10px 18px',
  borderRadius: assocDash.radiusMd,
  background: assocDash.gradient,
  color: '#fff',
  fontSize: 14,
  fontWeight: 600,
  textDecoration: 'none',
  fontFamily: 'inherit',
}

const deleteBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 5,
  padding: '7px 12px',
  borderRadius: 8,
  border: '1px solid #fecaca',
  background: '#fff',
  fontSize: 12,
  fontWeight: 600,
  color: '#b91c1c',
  cursor: 'pointer',
  fontFamily: 'inherit',
}
