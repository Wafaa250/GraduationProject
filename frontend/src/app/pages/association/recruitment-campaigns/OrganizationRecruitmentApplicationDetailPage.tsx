import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  getOrganizationRecruitmentApplication,
  parseApiErrorMessage,
  updateRecruitmentApplicationStatus,
  type RecruitmentApplicationDetail,
  type RecruitmentApplicationStatus,
} from '../../../../api/recruitmentApplicationsApi'
import { fieldTypeLabel, normalizeFieldType } from '../../../../utils/recruitmentFormFields'
import { AssociationDashboardLayout } from '../dashboard/AssociationDashboardLayout'
import { assocCard, assocDash } from '../dashboard/associationDashTokens'
import { formatEventDate } from '../events/eventFormUtils'
import { useAssociationShell } from '../events/useAssociationShell'

const STATUSES: RecruitmentApplicationStatus[] = ['Pending', 'Accepted', 'Rejected']

export default function OrganizationRecruitmentApplicationDetailPage() {
  const { campaignId, applicationId } = useParams<{ campaignId: string; applicationId: string }>()
  const navigate = useNavigate()
  const shell = useAssociationShell()
  const [app, setApp] = useState<RecruitmentApplicationDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusBusy, setStatusBusy] = useState(false)

  const campId = Number(campaignId)
  const appId = Number(applicationId)

  const load = useCallback(async () => {
    if (!Number.isFinite(campId) || !Number.isFinite(appId)) return
    setLoading(true)
    try {
      const data = await getOrganizationRecruitmentApplication(campId, appId)
      setApp(data)
    } catch (err) {
      toast.error(parseApiErrorMessage(err))
      navigate(`/organization/recruitment-campaigns/${campaignId}`)
    } finally {
      setLoading(false)
    }
  }, [campId, appId, campaignId, navigate])

  useEffect(() => {
    void load()
  }, [load])

  const handleStatus = async (status: RecruitmentApplicationStatus) => {
    if (!app) return
    setStatusBusy(true)
    try {
      const updated = await updateRecruitmentApplicationStatus(campId, app.id, status)
      setApp(updated)
      toast.success(`Marked as ${status}`)
    } catch (err) {
      toast.error(parseApiErrorMessage(err))
    } finally {
      setStatusBusy(false)
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
      <Link
        to={`/organization/recruitment-campaigns/${campaignId}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          marginBottom: 20,
          fontSize: 13,
          fontWeight: 600,
          color: assocDash.accentDark,
          textDecoration: 'none',
        }}
      >
        <ArrowLeft size={16} />
        Back to campaign
      </Link>

      {loading || shell.loading ? (
        <p style={{ color: assocDash.muted }}>Loading application…</p>
      ) : app ? (
        <>
          <div style={{ ...assocCard, padding: 24, marginBottom: 20 }}>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>{app.studentName}</h1>
            <p style={{ margin: '8px 0 0', fontSize: 14, color: assocDash.muted }}>
              Applied for {app.positionRoleTitle} · {app.campaignTitle}
            </p>
            <p style={{ margin: '6px 0 0', fontSize: 13, color: assocDash.muted }}>
              Submitted {formatEventDate(app.submittedAt)}
              {app.studentEmail ? ` · ${app.studentEmail}` : ''}
              {app.studentMajor ? ` · ${app.studentMajor}` : ''}
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 18 }}>
              {STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={statusBusy || app.status === s}
                  onClick={() => void handleStatus(s)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 10,
                    border: `1px solid ${app.status === s ? assocDash.accent : assocDash.border}`,
                    background: app.status === s ? assocDash.accentMuted : '#fff',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: statusBusy ? 'wait' : 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  {statusBusy && app.status !== s ? <Loader2 size={14} className="org-hub-spin" /> : null}{' '}
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div style={{ ...assocCard, padding: 24 }}>
            <h2 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 800 }}>Submitted answers</h2>
            <div style={{ display: 'grid', gap: 16 }}>
              {app.answers.map((a) => (
                <div
                  key={a.questionId}
                  style={{
                    padding: 16,
                    borderRadius: 12,
                    border: `1px solid ${assocDash.border}`,
                    background: assocDash.bg,
                  }}
                >
                  <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: assocDash.subtle, textTransform: 'uppercase' }}>
                    {fieldTypeLabel(normalizeFieldType(a.questionType))}
                  </p>
                  <p style={{ margin: '6px 0 8px', fontSize: 15, fontWeight: 700 }}>{a.questionTitle}</p>
                  {a.selectedValues && a.selectedValues.length > 0 ? (
                    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14, lineHeight: 1.6 }}>
                      {a.selectedValues.map((v) => (
                        <li key={v}>{v}</li>
                      ))}
                    </ul>
                  ) : (
                    <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{a.answerValue}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      ) : null}
      <style>{`@keyframes org-hub-spin { to { transform: rotate(360deg); } } .org-hub-spin { animation: org-hub-spin 0.8s linear infinite; }`}</style>
    </AssociationDashboardLayout>
  )
}
