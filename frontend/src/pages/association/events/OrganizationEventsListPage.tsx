import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Calendar,
  CalendarPlus,
  ClipboardList,
  Eye,
  MapPin,
  MoreHorizontal,
  Pencil,
  Send,
  Trash2,
  Wifi,
} from 'lucide-react'
import {
  ensureEventRegistrationForm,
  getEventRegistrationForm,
  parseApiErrorMessage as parseFormApiError,
} from '@/api/eventRegistrationFormApi'
import { eventRegistrationFormPath } from '@/utils/eventRegistrationFormFields'
import toast from 'react-hot-toast'
import { resolveApiFileUrl } from '@/api/axiosInstance'
import {
  deleteOrganizationEvent,
  listOrganizationEvents,
  parseApiErrorMessage,
  publishOrganizationEvent,
  type StudentOrganizationEvent,
} from '@/api/organizationEventsApi'
import { AssociationDashboardLayout } from '../dashboard/AssociationDashboardLayout'
import { assocCard, assocDash, assocSemantic } from '../dashboard/associationDashTokens'
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
  const [publishingId, setPublishingId] = useState<number | null>(null)

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
              publishing={publishingId === event.id}
              onDelete={() => void handleDelete(event)}
              onPublish={async () => {
                setPublishingId(event.id)
                try {
                  await publishOrganizationEvent(event.id)
                  toast.success('Event published')
                  await loadEvents()
                } catch (err) {
                  toast.error(parseApiErrorMessage(err))
                } finally {
                  setPublishingId(null)
                }
              }}
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
  publishing,
  onDelete,
  onPublish,
}: {
  event: StudentOrganizationEvent
  deleting: boolean
  publishing: boolean
  onDelete: () => void
  onPublish: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const cover = event.coverImageUrl ? resolveApiFileUrl(event.coverImageUrl) : null
  const when = formatEventDateLine(event.eventDate)
  const regStatus = getRegistrationDeadlineStatus(event.registrationDeadline)
  const regDate = event.registrationDeadline
    ? formatRegistrationCloseDate(event.registrationDeadline)
    : null

  const statusLabel = !event.isPublished
    ? 'Draft'
    : regStatus === 'closed'
      ? 'Closed'
      : 'Published'

  const statusTone = !event.isPublished
    ? assocSemantic.neutral
    : regStatus === 'closed'
      ? assocSemantic.error
      : assocSemantic.success

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
        boxShadow: hovered ? assocDash.shadowHover : assocDash.shadow,
        borderColor: hovered ? assocDash.accentBorder : assocDash.border,
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
              : assocDash.gradientCard,
            transform: hovered && cover ? 'scale(1.04)' : 'scale(1)',
            transition: 'transform 0.4s ease',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: cover
              ? 'linear-gradient(to top, hsl(var(--aw-overlay) / 0.18) 0%, transparent 55%)'
              : 'linear-gradient(to top, hsl(var(--aw-accent) / 0.06) 0%, transparent 50%)',
            pointerEvents: 'none',
          }}
        />
        <span
          style={{
            position: 'absolute',
            top: sp.md,
            right: sp.md,
            fontSize: 11,
            fontWeight: 700,
            padding: '4px 10px',
            borderRadius: 999,
            background: statusTone.bg,
            color: statusTone.color,
            border: `1px solid ${statusTone.border}`,
            letterSpacing: '0.02em',
          }}
        >
          {statusLabel}
        </span>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: sp.lg, flexWrap: 'wrap' }}>
            <ActionLink to={`/association/events/${event.id}`} icon={Eye}>
              View
            </ActionLink>
            <ActionLink to={`/association/events/${event.id}/edit`} icon={Pencil}>
              Edit
            </ActionLink>
            <EventPublishAction
              event={event}
              publishing={publishing}
              deleting={deleting}
              onPublish={onPublish}
            />
          </div>
          <EventCardMenu deleting={deleting} onDelete={onDelete} />
        </div>
      </div>
    </article>
  )
}

function EventPublishAction({
  event,
  publishing,
  deleting,
  onPublish,
}: {
  event: StudentOrganizationEvent
  publishing: boolean
  deleting: boolean
  onPublish: () => void
}) {
  const [formReady, setFormReady] = useState(false)
  const [formChecked, setFormChecked] = useState(event.isPublished)

  useEffect(() => {
    if (event.isPublished) {
      setFormChecked(true)
      setFormReady(false)
      return
    }
    let cancelled = false
    setFormChecked(false)
    setFormReady(false)
    void getEventRegistrationForm(event.id)
      .then((form) => {
        if (!cancelled) setFormReady((form?.fields?.length ?? 0) > 0)
      })
      .catch(() => {
        if (!cancelled) setFormReady(false)
      })
      .finally(() => {
        if (!cancelled) setFormChecked(true)
      })
    return () => {
      cancelled = true
    }
  }, [event.id, event.isPublished])

  if (event.isPublished) {
    return (
      <span role="status" aria-label="Published" style={publishStatusIndicatorStyle}>
        Published
      </span>
    )
  }

  const canPublish = formChecked && formReady && !publishing && !deleting

  if (!canPublish) {
    return (
      <CompleteFormLink
        eventId={event.id}
        eventTitle={event.title}
        disabled={publishing || deleting}
      />
    )
  }

  return (
    <button
      type="button"
      disabled={publishing || deleting}
      onClick={() => void onPublish()}
      style={{
        ...publishBtnBaseStyle,
        ...publishBtnActiveStyle,
        cursor: publishing || deleting ? 'wait' : 'pointer',
      }}
    >
      <Send size={14} aria-hidden />
      {publishing ? 'Publishing…' : 'Publish Event'}
    </button>
  )
}

function CompleteFormLink({
  eventId,
  eventTitle,
  disabled,
}: {
  eventId: number
  eventTitle: string
  disabled?: boolean
}) {
  const navigate = useNavigate()
  const [hovered, setHovered] = useState(false)
  const [working, setWorking] = useState(false)

  const goToForm = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (disabled || working) return
    setWorking(true)
    try {
      await ensureEventRegistrationForm(eventId, eventTitle)
      navigate(eventRegistrationFormPath(eventId))
    } catch (err) {
      toast.error(parseFormApiError(err))
    } finally {
      setWorking(false)
    }
  }

  return (
    <Link
      to={eventRegistrationFormPath(eventId)}
      aria-label="Complete registration form"
      aria-busy={working}
      onClick={(e) => void goToForm(e)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...publishBtnBaseStyle,
        ...publishBtnCompleteFormStyle,
        ...(hovered && !disabled && !working ? publishBtnCompleteFormHoverStyle : {}),
        textDecoration: 'none',
        pointerEvents: disabled || working ? 'none' : undefined,
        opacity: disabled ? 0.55 : working ? 0.75 : 1,
        cursor: working ? 'wait' : 'pointer',
      }}
    >
      <ClipboardList size={14} strokeWidth={2.25} aria-hidden />
      {working ? 'Opening…' : 'Complete Form'}
    </Link>
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
    status === 'closed' ? assocDash.error : status === 'closing-soon' ? assocDash.accent : assocDash.success
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
          background: open || hovered ? assocDash.bg : 'transparent',
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

const publishBtnBaseStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  minWidth: 148,
  padding: '6px 12px',
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 600,
  fontFamily: 'inherit',
  lineHeight: 1.2,
  whiteSpace: 'nowrap',
  transition: 'background 0.15s ease, border-color 0.15s ease, color 0.15s ease',
}

const publishBtnActiveStyle: React.CSSProperties = {
  border: `1px solid ${assocDash.accentBorder}`,
  background: assocDash.accentMuted,
  color: assocDash.accentDark,
}

/** Setup CTA — guides org to complete the registration form before publish. */
const publishBtnCompleteFormStyle: React.CSSProperties = {
  border: `1px dashed ${assocDash.accentBorder}`,
  background: assocDash.accentSoft,
  color: assocDash.accentDark,
  cursor: 'pointer',
}

const publishBtnCompleteFormHoverStyle: React.CSSProperties = {
  background: assocDash.accentMuted,
  border: `1px dashed ${assocDash.accent}`,
  color: assocDash.accent,
  boxShadow: '0 2px 8px hsl(var(--aw-accent) / 0.12)',
}

/** Subtle orange status chip — matches org theme, not an action button. */
const publishStatusIndicatorStyle: React.CSSProperties = {
  ...publishBtnBaseStyle,
  border: `1px solid ${assocDash.accentBorder}`,
  background: assocDash.accentSoft,
  color: assocDash.accentDark,
  fontWeight: 600,
  cursor: 'default',
  userSelect: 'none',
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
  background: assocDash.surface,
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
  color: assocDash.error,
  cursor: 'pointer',
  fontFamily: 'inherit',
  textAlign: 'left',
}
