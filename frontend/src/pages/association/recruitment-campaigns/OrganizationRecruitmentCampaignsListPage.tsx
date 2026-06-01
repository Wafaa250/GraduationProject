import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Briefcase,
  CalendarClock,
  ClipboardList,
  Eye,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { resolveApiFileUrl } from '@/api/axiosInstance'
import {
  deleteOrganizationRecruitmentCampaign,
  listOrganizationRecruitmentCampaigns,
  parseApiErrorMessage,
  type RecruitmentCampaign,
} from '@/api/recruitmentCampaignsApi'
import { AssociationDashboardLayout } from '../dashboard/AssociationDashboardLayout'
import { assocCard, assocDash } from '../dashboard/associationDashTokens'
import {
  formatRegistrationCloseDate,
  getRegistrationDeadlineStatus,
} from '../events/eventFormUtils'
import { useAssociationShell } from '../events/useAssociationShell'

/** 4px-based spacing scale — matches Events list page. */
const sp = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const

const metaIconCol = 18

type OpportunityTag = 'Executive Board' | 'Committee' | 'Volunteer' | 'Leadership'

function inferOpportunityTag(title: string, description: string): OpportunityTag | null {
  const text = `${title} ${description}`.toLowerCase()
  if (/\b(executive|board|president|vice.?president)\b/.test(text)) return 'Executive Board'
  if (/\bvolunteer\b/.test(text)) return 'Volunteer'
  if (/\b(committee|organizing|media team|technical team)\b/.test(text)) return 'Committee'
  if (/\b(leadership|lead role|team lead)\b/.test(text)) return 'Leadership'
  return null
}

function truncateDescription(text: string, max = 120): string {
  const trimmed = text.trim()
  if (trimmed.length <= max) return trimmed
  return `${trimmed.slice(0, max).trimEnd()}…`
}

function formatApplicationDeadlineLine(iso: string): { date: string; time: string } | null {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return {
    date: d.toLocaleDateString(undefined, {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }),
    time: d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }),
  }
}

export default function OrganizationRecruitmentCampaignsListPage() {
  const shell = useAssociationShell()
  const [campaigns, setCampaigns] = useState<RecruitmentCampaign[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await listOrganizationRecruitmentCampaigns()
      setCampaigns(data)
    } catch (err) {
      toast.error(parseApiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const handleDelete = async (c: RecruitmentCampaign) => {
    if (!window.confirm(`Delete "${c.title}"? This cannot be undone.`)) return
    setDeletingId(c.id)
    try {
      await deleteOrganizationRecruitmentCampaign(c.id)
      toast.success('Opportunity deleted')
      setCampaigns((prev) => prev.filter((x) => x.id !== c.id))
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
              Leadership Opportunities
            </h1>
            <p style={{ margin: `${sp.md}px 0 0`, fontSize: 14, color: assocDash.muted, maxWidth: 520, lineHeight: 1.5 }}>
              Invite students to apply for leadership, committee, and volunteer positions within your organization.
            </p>
          </div>
          <Link to="/association/recruitment/create" style={createBtnStyle}>
            <Plus size={18} />
            Create Opportunity
          </Link>
        </div>
      </header>

      {shell.loading || loading ? (
        <p style={{ color: assocDash.muted, fontSize: 14 }}>Loading opportunities…</p>
      ) : campaigns.length === 0 ? (
        <div style={{ ...assocCard, padding: 48, textAlign: 'center' }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 18,
              margin: '0 auto 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: assocDash.accentMuted,
              border: `1px solid ${assocDash.accentBorder}`,
              color: assocDash.accentDark,
            }}
          >
            <Briefcase size={32} strokeWidth={1.75} aria-hidden />
          </div>
          <h2
            style={{
              margin: '0 0 8px',
              fontSize: 18,
              fontWeight: 700,
              fontFamily: assocDash.fontDisplay,
              color: assocDash.text,
            }}
          >
            No opportunities created yet
          </h2>
          <p style={{ margin: '0 0 24px', fontSize: 14, color: assocDash.muted, maxWidth: 420, marginInline: 'auto', lineHeight: 1.55 }}>
            Create your first leadership opportunity and start receiving student applications.
          </p>
          <Link to="/association/recruitment/create" style={createBtnStyle}>
            <Plus size={18} />
            Create Opportunity
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
          {campaigns.map((c) => (
            <OpportunityCard
              key={c.id}
              campaign={c}
              deleting={deletingId === c.id}
              onDelete={() => void handleDelete(c)}
            />
          ))}
        </div>
      )}
    </AssociationDashboardLayout>
  )
}

function OpportunityCard({
  campaign,
  deleting,
  onDelete,
}: {
  campaign: RecruitmentCampaign
  deleting: boolean
  onDelete: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const cover = campaign.coverImageUrl ? resolveApiFileUrl(campaign.coverImageUrl) : null
  const positionCount = campaign.positions?.length ?? 0
  const deadlineStatus = getRegistrationDeadlineStatus(campaign.applicationDeadline)
  const deadlineLine = formatApplicationDeadlineLine(campaign.applicationDeadline)
  const closeDate = formatRegistrationCloseDate(campaign.applicationDeadline)
  const tag = inferOpportunityTag(campaign.title, campaign.description)
  const descriptionPreview = campaign.description?.trim()
    ? truncateDescription(campaign.description)
    : null

  const statusLabel = !campaign.isPublished
    ? 'Draft'
    : deadlineStatus === 'closed'
      ? 'Closed'
      : 'Open'

  const statusTone =
    statusLabel === 'Draft'
      ? { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' }
      : statusLabel === 'Closed'
        ? { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' }
        : { bg: '#ecfdf5', color: '#15803d', border: '#bbf7d0' }

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
              ? 'linear-gradient(to top, rgba(15,23,42,0.22) 0%, transparent 55%)'
              : 'linear-gradient(to top, rgba(217,119,6,0.06) 0%, transparent 50%)',
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
            {campaign.title}
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: sp.xs, alignItems: 'center' }}>
            {tag ? (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: assocDash.accentDark,
                }}
              >
                {tag}
              </span>
            ) : (
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
                Leadership opportunity
              </p>
            )}
          </div>
        </div>

        {deadlineLine ? (
          <>
            <span style={{ display: 'flex', justifyContent: 'center', paddingTop: 2 }}>
              <CalendarClock size={15} color={assocDash.accent} strokeWidth={2.25} aria-hidden />
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
                Apply by {deadlineLine.date}
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
                {deadlineLine.time}
              </p>
            </div>
          </>
        ) : null}

        <span style={{ display: 'flex', justifyContent: 'center', paddingTop: 2 }}>
          <ClipboardList size={15} color={assocDash.accent} strokeWidth={2.25} aria-hidden />
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
          {positionCount} open position{positionCount === 1 ? '' : 's'}
        </p>

        {closeDate && deadlineStatus ? (
          <ApplicationDeadlineStatus status={deadlineStatus} closeDate={closeDate} />
        ) : null}

        {descriptionPreview ? (
          <>
            <span aria-hidden />
            <p
              style={{
                margin: 0,
                fontSize: 13,
                lineHeight: 1.5,
                color: assocDash.muted,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {descriptionPreview}
            </p>
          </>
        ) : null}

        <div
          style={{
            gridColumn: '1 / -1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: sp.lg,
            borderTop: `1px solid ${assocDash.border}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: sp.lg }}>
            <ActionLink to={`/association/recruitment/${campaign.id}`} icon={Eye}>
              View
            </ActionLink>
            <ActionLink to={`/association/recruitment/${campaign.id}/edit`} icon={Pencil}>
              Edit
            </ActionLink>
          </div>
          <OpportunityCardMenu deleting={deleting} onDelete={onDelete} />
        </div>
      </div>
    </article>
  )
}

function ApplicationDeadlineStatus({
  status,
  closeDate,
}: {
  status: ReturnType<typeof getRegistrationDeadlineStatus>
  closeDate: string
}) {
  const dotColor =
    status === 'closed' ? '#ef4444' : status === 'closing-soon' ? '#f59e0b' : '#22c55e'
  const message =
    status === 'closed' ? 'Applications closed' : `Applications close ${closeDate}`

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

function OpportunityCardMenu({ deleting, onDelete }: { deleting: boolean; onDelete: () => void }) {
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
            {deleting ? 'Deleting…' : 'Delete opportunity'}
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
  minWidth: 168,
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
