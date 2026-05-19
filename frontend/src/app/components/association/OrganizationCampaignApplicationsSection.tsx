import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import type { RecruitmentPosition } from '../../../api/recruitmentCampaignsApi'
import {
  listOrganizationRecruitmentApplications,
  parseApiErrorMessage,
  type RecruitmentApplicationListItem,
  type RecruitmentApplicationStatus,
} from '../../../api/recruitmentApplicationsApi'
import { assocCard, assocDash } from '../../pages/association/dashboard/associationDashTokens'
import { formatEventDate } from '../../pages/association/events/eventFormUtils'

const STATUS_OPTIONS: Array<RecruitmentApplicationStatus | ''> = [
  '',
  'Pending',
  'AiSuggested',
  'Accepted',
  'Rejected',
]

type Props = {
  campaignId: number
  positions: RecruitmentPosition[]
}

export function OrganizationCampaignApplicationsSection({ campaignId, positions }: Props) {
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
    } catch (err) {
      toast.error(parseApiErrorMessage(err))
      setApplications([])
    } finally {
      setLoading(false)
    }
  }, [campaignId, positionFilter, statusFilter])

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
    <section style={{ marginTop: 36 }}>
      <h2 style={sectionTitle}>Applications</h2>
      <p style={sectionHint}>Review submissions from students who applied to your open roles.</p>

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
              {s || 'All statuses'}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p style={{ color: assocDash.muted, display: 'flex', gap: 8, alignItems: 'center' }}>
          <Loader2 size={16} className="org-hub-spin" /> Loading applications…
        </p>
      ) : applications.length === 0 ? (
        <div style={{ ...assocCard, padding: 28, textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: 14, color: assocDash.muted }}>No applications yet for this filter.</p>
        </div>
      ) : positionFilter !== '' ? (
        <ApplicationTable campaignId={campaignId} items={applications} />
      ) : (
        positions.map((p) => {
          const items = grouped.get(p.id) ?? []
          if (items.length === 0) return null
          return (
            <div key={p.id} style={{ marginBottom: 24 }}>
              <h3 style={positionTitle}>{p.roleTitle}</h3>
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
  return (
    <div style={{ ...assocCard, padding: 0, overflow: 'hidden' }}>
      <div style={tableHead}>
        <span>Applicant</span>
        <span>Position</span>
        <span>Submitted</span>
        <span>Status</span>
        <span />
      </div>
      {items.map((app) => (
        <div key={app.id} style={tableRow}>
          <div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>{app.studentName}</p>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: assocDash.muted }}>
              {app.studentEmail ?? app.studentMajor ?? '—'}
            </p>
            {app.previewAnswer ? (
              <p style={{ margin: '6px 0 0', fontSize: 12, color: assocDash.subtle }}>{app.previewAnswer}</p>
            ) : null}
          </div>
          <span style={{ fontSize: 13 }}>{app.positionRoleTitle}</span>
          <span style={{ fontSize: 12, color: assocDash.muted }}>{formatEventDate(app.submittedAt)}</span>
          <StatusBadge status={app.status} />
          <Link
            to={`/organization/recruitment-campaigns/${campaignId}/applications/${app.id}`}
            style={viewLink}
          >
            View
          </Link>
        </div>
      ))}
    </div>
  )
}

function StatusBadge({ status }: { status: RecruitmentApplicationStatus }) {
  const colors =
    status === 'Accepted'
      ? { bg: '#ecfdf5', color: '#047857', border: '#a7f3d0' }
      : status === 'Rejected'
        ? { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' }
        : status === 'AiSuggested'
          ? { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' }
          : { bg: '#fffbeb', color: '#b45309', border: '#fde68a' }
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '4px 10px',
        borderRadius: 8,
        fontSize: 11,
        fontWeight: 700,
        background: colors.bg,
        color: colors.color,
        border: `1px solid ${colors.border}`,
      }}
    >
      {status}
    </span>
  )
}

const sectionTitle = { margin: '0 0 6px', fontSize: 18, fontWeight: 800, fontFamily: assocDash.fontDisplay }
const sectionHint = { margin: '0 0 16px', fontSize: 13, color: assocDash.muted }
const toolbar = { display: 'flex', flexWrap: 'wrap' as const, gap: 10, marginBottom: 16 }
const selectStyle = {
  padding: '9px 12px',
  borderRadius: 10,
  border: `1px solid ${assocDash.border}`,
  fontSize: 13,
  fontFamily: 'inherit',
  background: '#fff',
}
const positionTitle = { margin: '0 0 10px', fontSize: 15, fontWeight: 700, color: assocDash.text }
const tableHead = {
  display: 'grid',
  gridTemplateColumns: '2fr 1fr 1fr auto auto',
  gap: 12,
  padding: '12px 16px',
  fontSize: 11,
  fontWeight: 800,
  textTransform: 'uppercase' as const,
  letterSpacing: 0.4,
  color: assocDash.subtle,
  borderBottom: `1px solid ${assocDash.border}`,
  background: assocDash.bg,
}
const tableRow = {
  display: 'grid',
  gridTemplateColumns: '2fr 1fr 1fr auto auto',
  gap: 12,
  padding: '14px 16px',
  alignItems: 'center',
  borderBottom: `1px solid ${assocDash.border}`,
}
const viewLink = {
  fontSize: 13,
  fontWeight: 700,
  color: assocDash.accentDark,
  textDecoration: 'none',
}
