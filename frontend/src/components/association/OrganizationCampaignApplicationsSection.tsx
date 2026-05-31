import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import type { RecruitmentPosition } from '@/api/recruitmentCampaignsApi'
import {
  listOrganizationRecruitmentApplications,
  parseApiErrorMessage,
  type RecruitmentApplicationListItem,
  type RecruitmentApplicationStatus,
} from '@/api/recruitmentApplicationsApi'
import { assocCard, assocDash } from '@/pages/association/dashboard/associationDashTokens'
import { formatEventDate } from '@/pages/association/events/eventFormUtils'

const STATUS_OPTIONS: Array<RecruitmentApplicationStatus | ''> = [
  '',
  'Pending',
  'AiSuggested',
  'Accepted',
  'Rejected',
]

const STATUS_LABELS: Record<RecruitmentApplicationStatus, string> = {
  Pending: 'Pending',
  AiSuggested: 'AI Suggested',
  Accepted: 'Accepted',
  Rejected: 'Rejected',
}

type Props = {
  campaignId: number
  positions: RecruitmentPosition[]
  onApplicationsCountChange?: (count: number) => void
}

export function OrganizationCampaignApplicationsSection({
  campaignId,
  positions,
  onApplicationsCountChange,
}: Props) {
  const [applications, setApplications] = useState<RecruitmentApplicationListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [positionFilter, setPositionFilter] = useState<number | ''>('')
  const [statusFilter, setStatusFilter] = useState<RecruitmentApplicationStatus | ''>('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await listOrganizationRecruitmentApplications(campaignId, {
        positionId: positionFilter === '' ? undefined : positionFilter,
        status: statusFilter === '' ? undefined : statusFilter,
      })
      setApplications(data)
      if (positionFilter === '' && statusFilter === '') {
        onApplicationsCountChange?.(data.length)
      }
    } catch (err) {
      toast.error(parseApiErrorMessage(err))
      setApplications([])
      onApplicationsCountChange?.(0)
    } finally {
      setLoading(false)
    }
  }, [campaignId, positionFilter, statusFilter, onApplicationsCountChange])

  useEffect(() => {
    void load()
  }, [load])

  const grouped = useMemo(() => {
    const map = new Map<number, RecruitmentApplicationListItem[]>()
    for (const p of positions) map.set(p.id, [])
    for (const app of applications) {
      const list = map.get(app.positionId) ?? []
      list.push(app)
      map.set(app.positionId, list)
    }
    return map
  }, [applications, positions])

  return (
    <section style={{ marginTop: 40 }}>
      <div style={sectionHeadingBlock}>
        <h2 style={sectionTitle}>Applications</h2>
        <p style={sectionHint}>Review submissions from students who applied to your open roles.</p>
      </div>

      <div style={toolbar}>
        <select
          value={positionFilter === '' ? '' : String(positionFilter)}
          onChange={(e) => setPositionFilter(e.target.value ? Number(e.target.value) : '')}
          style={selectStyle}
        >
          <option value="">All positions</option>
          {positions.map((p) => (
            <option key={p.id} value={p.id}>
              {p.roleTitle}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as RecruitmentApplicationStatus | '')}
          style={selectStyle}
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s || 'all'} value={s}>
              {s ? STATUS_LABELS[s] : 'All statuses'}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p style={{ color: assocDash.muted, display: 'flex', gap: 8, alignItems: 'center', fontSize: 14 }}>
          <Loader2 size={16} className="org-hub-spin" /> Loading applications…
        </p>
      ) : applications.length === 0 ? (
        <div style={{ ...assocCard, padding: 32, textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: 14, color: assocDash.muted, fontWeight: 500 }}>
            No applications yet for this filter.
          </p>
        </div>
      ) : positionFilter !== '' ? (
        <ApplicationTable campaignId={campaignId} items={applications} />
      ) : (
        positions.map((p) => {
          const items = grouped.get(p.id) ?? []
          if (items.length === 0) return null
          return (
            <div key={p.id} style={{ marginBottom: 28 }}>
              <h3 style={positionGroupTitle}>{p.roleTitle}</h3>
              <ApplicationTable campaignId={campaignId} items={items} />
            </div>
          )
        })
      )}
      <style>{`@keyframes org-hub-spin { to { transform: rotate(360deg); } } .org-hub-spin { animation: org-hub-spin 0.8s linear infinite; }`}</style>
    </section>
  )
}

function ApplicationTable({
  campaignId,
  items,
}: {
  campaignId: number
  items: RecruitmentApplicationListItem[]
}) {
  const [hoveredId, setHoveredId] = useState<number | null>(null)

  return (
    <div style={{ ...assocCard, padding: 0, overflow: 'hidden' }}>
      <div style={tableHead}>
        <span>Applicant</span>
        <span>Position</span>
        <span>Submitted</span>
        <span>Status</span>
        <span />
      </div>
      {items.map((app, index) => {
        const isHovered = hoveredId === app.id
        const isLast = index === items.length - 1
        return (
          <div
            key={app.id}
            style={{
              ...tableRow,
              borderBottom: isLast ? 'none' : tableRow.borderBottom,
              background: isHovered ? assocDash.bg : assocDash.surface,
            }}
            onMouseEnter={() => setHoveredId(app.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            <div>
              <p style={applicantName}>{app.studentName}</p>
              <p style={applicantMeta}>{app.studentEmail ?? app.studentMajor ?? '—'}</p>
              {app.previewAnswer ? <p style={applicantPreview}>{app.previewAnswer}</p> : null}
            </div>
            <span style={cellText}>{app.positionRoleTitle}</span>
            <span style={cellMuted}>{formatEventDate(app.submittedAt)}</span>
            <StatusBadge status={app.status} />
            <Link
              to={`/association/recruitment/${campaignId}/applications/${app.id}`}
              style={{
                ...viewLink,
                color: isHovered ? assocDash.accent : assocDash.accentDark,
              }}
            >
              View
            </Link>
          </div>
        )
      })}
    </div>
  )
}

function StatusBadge({ status }: { status: RecruitmentApplicationStatus }) {
  const colors =
    status === 'Accepted'
      ? { bg: '#ecfdf5', color: '#047857', border: '#bbf7d0' }
      : status === 'Rejected'
        ? { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' }
        : status === 'AiSuggested'
          ? { bg: assocDash.accentMuted, color: assocDash.accentDark, border: assocDash.accentBorder }
          : { bg: '#fffbeb', color: '#b45309', border: '#fde68a' }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '5px 11px',
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.02em',
        background: colors.bg,
        color: colors.color,
        border: `1px solid ${colors.border}`,
        whiteSpace: 'nowrap',
      }}
    >
      {STATUS_LABELS[status]}
    </span>
  )
}

const sectionHeadingBlock = { marginBottom: 18 }
const sectionTitle = {
  margin: 0,
  fontSize: 17,
  fontWeight: 800,
  fontFamily: assocDash.fontDisplay,
  letterSpacing: '-0.01em',
  color: assocDash.text,
}
const sectionHint = { margin: '6px 0 0', fontSize: 13, color: assocDash.muted, lineHeight: 1.5, fontWeight: 500 }
const toolbar = { display: 'flex', flexWrap: 'wrap' as const, gap: 10, marginBottom: 20 }
const selectStyle = {
  padding: '10px 14px',
  borderRadius: assocDash.radiusMd,
  border: `1px solid ${assocDash.border}`,
  fontSize: 13,
  fontFamily: 'inherit',
  background: assocDash.surface,
  color: assocDash.text,
  fontWeight: 500,
  minWidth: 160,
}
const positionGroupTitle = {
  margin: '0 0 12px',
  fontSize: 15,
  fontWeight: 700,
  fontFamily: assocDash.fontDisplay,
  color: assocDash.text,
  letterSpacing: '-0.01em',
}
const tableHead = {
  display: 'grid',
  gridTemplateColumns: '2fr 1fr 1fr auto auto',
  gap: 16,
  padding: '14px 20px',
  fontSize: 11,
  fontWeight: 700,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.06em',
  color: assocDash.subtle,
  borderBottom: `1px solid ${assocDash.border}`,
  background: assocDash.bg,
}
const tableRow = {
  display: 'grid',
  gridTemplateColumns: '2fr 1fr 1fr auto auto',
  gap: 16,
  padding: '18px 20px',
  alignItems: 'center',
  borderBottom: `1px solid ${assocDash.border}`,
  transition: 'background 0.15s ease',
}
const applicantName = { margin: 0, fontSize: 14, fontWeight: 700, color: assocDash.text, lineHeight: 1.35 }
const applicantMeta = { margin: '3px 0 0', fontSize: 12, color: assocDash.muted, fontWeight: 500, lineHeight: 1.4 }
const applicantPreview = {
  margin: '8px 0 0',
  fontSize: 12,
  color: assocDash.subtle,
  lineHeight: 1.45,
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical' as const,
  overflow: 'hidden',
}
const cellText = { fontSize: 13, fontWeight: 600, color: assocDash.textSecondary }
const cellMuted = { fontSize: 12, fontWeight: 500, color: assocDash.muted }
const viewLink = {
  fontSize: 13,
  fontWeight: 700,
  textDecoration: 'none',
  transition: 'color 0.15s ease',
}
