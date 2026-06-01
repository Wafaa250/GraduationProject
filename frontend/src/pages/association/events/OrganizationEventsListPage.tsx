import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, CalendarPlus, Eye, MapPin, MoreHorizontal, Pencil, Trash2, Wifi } from 'lucide-react'
import toast from 'react-hot-toast'
import { resolveApiFileUrl } from '@/api/axiosInstance'
import {
  deleteOrganizationEvent,
  listOrganizationEvents,
  parseApiErrorMessage,
  type StudentOrganizationEvent,
} from '@/api/organizationEventsApi'
import { AssociationDashboardLayout } from '../dashboard/AssociationDashboardLayout'
import { assocCard, assocDash } from '../dashboard/associationDashTokens'
import {
  formatRegistrationCloseDate,
  formatEventDateLine,
  getRegistrationDeadlineStatus,
} from './eventFormUtils'
import { useAssociationShell } from './useAssociationShell'

/** 4px-based spacing scale for consistent vertical rhythm. */
const sp = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const

const metaIconCol = 18

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
      <header style={{ marginBottom: sp.xxl }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: assocDash.accent }}>Student Organization</p>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: sp.lg,
            marginTop: sp.sm,
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
                letterSpacing: '-0.02em',
              }}
            >
              My events
            </h1>
            <p style={{ margin: `${sp.md}px 0 0`, fontSize: 14, color: assocDash.muted, maxWidth: 480, lineHeight: 1.5 }}>
              Create and manage events for your student organization.
            </p>
          </div>
          <Link to="/association/events/create" style={createBtnStyle}>
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
          <Link to="/association/events/create" style={createBtnStyle}>
            Create your first event
          </Link>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: sp.xxl,
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
  const [hovered, setHovered] = useState(false)
  const cover = event.coverImageUrl ? resolveApiFileUrl(event.coverImageUrl) : null
  const when = formatEventDateLine(event.eventDate)
  const regStatus = getRegistrationDeadlineStatus(event.registrationDeadline)
  const regDate = event.registrationDeadline
    ? formatRegistrationCloseDate(event.registrationDeadline)
    : null

  return (
    <article
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...assocCard,
        padding: 0,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
        boxShadow: hovered ? assocDash.shadowLg : assocDash.shadow,
        borderColor: hovered ? '#cbd5e1' : assocDash.border,
        transition: 'transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease',
      }}
    >
      <div style={{ height: 152, overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
        <div
          style={{
            height: '100%',
            width: '100%',
            background: cover
              ? `center/cover no-repeat url(${cover})`
              : `linear-gradient(145deg, ${assocDash.accentMuted} 0%, #fff7ed 45%, #fff 100%)`,
            transform: hovered && cover ? 'scale(1.04)' : 'scale(1)',
            transition: 'transform 0.4s ease',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: cover
              ? 'linear-gradient(to top, rgba(15,23,42,0.18) 0%, transparent 55%)'
              : 'linear-gradient(to top, rgba(217,119,6,0.06) 0%, transparent 50%)',
            pointerEvents: 'none',
          }}
        />
      </div>

      <div
        style={{
          padding: sp.xl,
          flex: 1,
          display: 'grid',
          gridTemplateColumns: `${metaIconCol}px 1fr`,
          columnGap: sp.sm,
          rowGap: sp.lg,
          alignContent: 'start',
        }}
      >
        <span aria-hidden />
        <div style={{ display: 'flex', flexDirection: 'column', gap: sp.sm }}>
          <h3
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 700,
              fontFamily: assocDash.fontDisplay,
              lineHeight: 1.28,
              letterSpacing: '-0.02em',
              color: assocDash.text,
            }}
          >
            {event.title}
          </h3>
          <p
            style={{
              margin: 0,
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: assocDash.accentDark,
            }}
          >
            {event.eventType}
            {event.category ? ` · ${event.category}` : ''}
          </p>
        </div>

        {when ? (
          <>
            <span style={{ display: 'flex', justifyContent: 'center', paddingTop: 2 }}>
              <Calendar size={15} color={assocDash.accent} strokeWidth={2.25} aria-hidden />
            </span>
            <div>
              <p
                style={{
                  margin: 0,
                  fontSize: 15,
                  fontWeight: 600,
                  lineHeight: 1.35,
                  letterSpacing: '-0.01em',
                  color: assocDash.text,
                }}
              >
                {when.date}
              </p>
              <p
                style={{
                  margin: `${sp.xs}px 0 0`,
                  fontSize: 13,
                  fontWeight: 500,
                  lineHeight: 1.4,
                  color: assocDash.muted,
                }}
              >
                {when.time}
              </p>
            </div>
          </>
        ) : null}

        <span style={{ display: 'flex', justifyContent: 'center', paddingTop: 2 }}>
          {event.isOnline ? (
            <Wifi size={15} color={assocDash.accent} strokeWidth={2.25} aria-hidden />
          ) : (
            <MapPin size={15} color={assocDash.accent} strokeWidth={2.25} aria-hidden />
          )}
        </span>
        <p
          style={{
            margin: 0,
            fontSize: 14,
            fontWeight: 600,
            lineHeight: 1.45,
            color: assocDash.textSecondary,
          }}
        >
          {event.isOnline ? 'Online event' : event.location?.trim() || 'Location TBD'}
        </p>

        {event.registrationDeadline && regDate ? (
          <RegistrationStatus status={regStatus} closeDate={regDate} />
        ) : null}

        <div
          style={{
            gridColumn: '1 / -1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 0,
            paddingTop: sp.lg,
            borderTop: `1px solid ${assocDash.border}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: sp.lg }}>
            <ActionLink to={`/association/events/${event.id}`} icon={Eye}>
              View
            </ActionLink>
            <ActionLink to={`/association/events/${event.id}/edit`} icon={Pencil}>
              Edit
            </ActionLink>
          </div>
          <EventCardMenu deleting={deleting} onDelete={onDelete} />
        </div>
      </div>
    </article>
  )
}

function RegistrationStatus({
  status,
  closeDate,
}: {
  status: ReturnType<typeof getRegistrationDeadlineStatus>
  closeDate: string
}) {
  const dotColor =
    status === 'closed' ? '#ef4444' : status === 'closing-soon' ? '#f59e0b' : '#22c55e'
  const message =
    status === 'closed' ? 'Registration closed' : `Registration closes ${closeDate}`

  return (
    <>
      <span style={{ display: 'flex', justifyContent: 'center', paddingTop: 6 }}>
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: dotColor,
            flexShrink: 0,
          }}
          aria-hidden
        />
      </span>
      <p
        style={{
          margin: 0,
          fontSize: 13,
          lineHeight: 1.45,
          fontWeight: 500,
          color: status === 'closed' ? assocDash.muted : assocDash.textSecondary,
        }}
      >
        {message}
      </p>
    </>
  )
}

function EventCardMenu({ deleting, onDelete }: { deleting: boolean; onDelete: () => void }) {
  const [open, setOpen] = useState(false)
  const [hovered, setHovered] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  return (
    <div ref={rootRef} style={{ position: 'relative' }}>
      <button
        type="button"
        aria-label="More actions"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          ...menuTriggerStyle,
          background: open || hovered ? '#f1f5f9' : 'transparent',
          color: open || hovered ? assocDash.textSecondary : assocDash.subtle,
        }}
      >
        <MoreHorizontal size={16} />
      </button>
      {open ? (
        <div style={menuPanelStyle} role="menu">
          <button
            type="button"
            role="menuitem"
            disabled={deleting}
            onClick={() => {
              setOpen(false)
              onDelete()
            }}
            style={menuItemDangerStyle}
          >
            <Trash2 size={14} />
            {deleting ? 'Deleting…' : 'Delete event'}
          </button>
        </div>
      ) : null}
    </div>
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
  const [hovered, setHovered] = useState(false)

  return (
    <Link
      to={to}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...actionLinkStyle,
        color: hovered ? assocDash.accent : assocDash.accentDark,
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

const actionLinkStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  fontSize: 13,
  fontWeight: 600,
  textDecoration: 'none',
  transition: 'color 0.15s ease',
}

const menuTriggerStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 32,
  height: 32,
  borderRadius: 8,
  border: 'none',
  cursor: 'pointer',
  fontFamily: 'inherit',
  transition: 'background 0.15s ease, color 0.15s ease',
}

const menuPanelStyle: React.CSSProperties = {
  position: 'absolute',
  right: 0,
  bottom: 'calc(100% + 6px)',
  minWidth: 148,
  padding: 4,
  borderRadius: 10,
  background: '#fff',
  border: `1px solid ${assocDash.border}`,
  boxShadow: assocDash.shadowLg,
  zIndex: 10,
}

const menuItemDangerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  width: '100%',
  padding: '8px 10px',
  borderRadius: 7,
  border: 'none',
  background: 'transparent',
  fontSize: 13,
  fontWeight: 500,
  color: '#b91c1c',
  cursor: 'pointer',
  fontFamily: 'inherit',
  textAlign: 'left',
}
