import { useEffect, useState, type CSSProperties } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Calendar,
  Check,
  ClipboardList,
  FileText,
  Loader2,
  Pencil,
  RotateCcw,
  Sparkles,
  Users,
  X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { resolveApiFileUrl } from '../../../../api/axiosInstance'
import {
  getOrganizationRecruitmentCampaign,
  listRecruitmentCampaignQuestions,
  parseApiErrorMessage,
  parseSkillsList,
  type RecruitmentCampaign,
  type RecruitmentQuestion,
} from '../../../../api/recruitmentCampaignsApi'
import { countQuestionsForPosition } from '../../../../utils/recruitmentFormFields'
import {
  acceptRecruitmentApplication,
  analyzeRecruitmentApplicants,
  regenerateRecruitmentApplicants,
  rejectRecruitmentApplication,
  type RecruitmentApplicantAnalysisResponse,
  type RecruitmentApplicantAnalysisResult,
} from '../../../../api/recruitmentApplicationsApi'
import { OrganizationCampaignApplicationsSection } from '../../../components/association/OrganizationCampaignApplicationsSection'
import { AiRecruitmentCandidateCard } from '../../../components/association/AiRecruitmentCandidateCard'
import { positionApplicationFormPath } from '../../../components/association/PositionApplicationFormEditor'
import { AssociationDashboardLayout } from '../dashboard/AssociationDashboardLayout'
import { assocCard, assocDash } from '../dashboard/associationDashTokens'
import { formatEventDate } from '../events/eventFormUtils'
import { useAssociationShell } from '../events/useAssociationShell'

export default function OrganizationRecruitmentCampaignDetailsPage() {
  const { campaignId } = useParams<{ campaignId: string }>()
  const navigate = useNavigate()
  const shell = useAssociationShell()
  const [campaign, setCampaign] = useState<RecruitmentCampaign | null>(null)
  const [questions, setQuestions] = useState<RecruitmentQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [aiAnalysisByPosition, setAiAnalysisByPosition] = useState<
    Record<number, RecruitmentApplicantAnalysisResponse | undefined>
  >({})
  const [aiAnalyzingPositionId, setAiAnalyzingPositionId] = useState<number | null>(null)
  const [decisionBusyApplicationId, setDecisionBusyApplicationId] = useState<number | null>(null)
  const [regenerateModalPositionId, setRegenerateModalPositionId] = useState<number | null>(null)
  const [regenerateSkills, setRegenerateSkills] = useState('')
  const [regenerateMajors, setRegenerateMajors] = useState('')
  const [regenerateMinMatch, setRegenerateMinMatch] = useState(70)
  const [regenerateExcludeRejected, setRegenerateExcludeRejected] = useState(true)
  const [rejectedStudentIdsByPosition, setRejectedStudentIdsByPosition] = useState<Record<number, number[]>>({})
  const [acceptedByPosition, setAcceptedByPosition] = useState<
    Record<number, RecruitmentApplicantAnalysisResult[]>
  >({})

  useEffect(() => {
    const id = Number(campaignId)
    if (!Number.isFinite(id)) {
      setLoading(false)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const [data, qs] = await Promise.all([
          getOrganizationRecruitmentCampaign(id),
          listRecruitmentCampaignQuestions(id),
        ])
        if (!cancelled) {
          setCampaign(data)
          setQuestions(qs)
        }
      } catch (err) {
        toast.error(parseApiErrorMessage(err))
        if (!cancelled) navigate('/organization/recruitment-campaigns')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [campaignId, navigate])

  function parseCommaList(value: string): string[] {
    return value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  }

  async function handleAiAnalyze(positionId: number) {
    const id = Number(campaignId)
    if (!campaign || !Number.isFinite(id)) return
    setAiAnalyzingPositionId(positionId)
    try {
      const data = await analyzeRecruitmentApplicants(id, positionId)
      setAiAnalysisByPosition((prev) => ({ ...prev, [positionId]: data }))
      if (data.results.length > 0) {
        toast.success(`Showing ${data.results.length} top AI match${data.results.length === 1 ? '' : 'es'}.`)
      }
    } catch (err) {
      toast.error(parseApiErrorMessage(err))
    } finally {
      setAiAnalyzingPositionId(null)
    }
  }

  async function handleRegenerate(positionId: number) {
    const id = Number(campaignId)
    if (!campaign || !Number.isFinite(id)) return
    setAiAnalyzingPositionId(positionId)
    setRegenerateModalPositionId(null)
    try {
      const excludeStudentIds = rejectedStudentIdsByPosition[positionId] ?? []
      const data = await regenerateRecruitmentApplicants(id, positionId, {
        excludeStudentIds,
        preferSkills: parseCommaList(regenerateSkills),
        preferMajors: parseCommaList(regenerateMajors),
        minMatch: regenerateMinMatch,
        excludeRejectedApplicants: regenerateExcludeRejected,
      })
      setAiAnalysisByPosition((prev) => ({ ...prev, [positionId]: data }))
      toast.success(
        data.results.length > 0
          ? `Found ${data.results.length} new candidate${data.results.length === 1 ? '' : 's'}.`
          : 'No additional candidates matched your filters.',
      )
    } catch (err) {
      toast.error(parseApiErrorMessage(err))
    } finally {
      setAiAnalyzingPositionId(null)
    }
  }

  async function handleAcceptCandidate(r: RecruitmentApplicantAnalysisResult, positionId: number) {
    setDecisionBusyApplicationId(r.applicationId)
    try {
      const res = await acceptRecruitmentApplication(r.applicationId)
      const acceptedRow: RecruitmentApplicantAnalysisResult = {
        ...r,
        status: 'Accepted',
        studentName: res.application.studentName,
      }
      setAcceptedByPosition((prev) => ({
        ...prev,
        [positionId]: [...(prev[positionId] ?? []).filter((x) => x.applicationId !== r.applicationId), acceptedRow],
      }))
      setAiAnalysisByPosition((prev) => {
        const current = prev[positionId]
        if (!current) return prev
        return {
          ...prev,
          [positionId]: {
            ...current,
            results: current.results.filter((x) => x.applicationId !== r.applicationId),
          },
        }
      })
      if (res.membershipKind === 'Leadership') {
        toast.success(
          res.addedToLeadershipShowcase
            ? 'Student added to your organization and leadership team.'
            : 'Student added to your organization (leadership roster updated).',
        )
      } else {
        toast.success(
          res.addedToOrganization
            ? 'Student added to your organization members.'
            : 'Application accepted.',
        )
      }
    } catch (err) {
      toast.error(parseApiErrorMessage(err))
    } finally {
      setDecisionBusyApplicationId(null)
    }
  }

  async function handleRejectCandidate(r: RecruitmentApplicantAnalysisResult, positionId: number) {
    setDecisionBusyApplicationId(r.applicationId)
    try {
      await rejectRecruitmentApplication(r.applicationId)
      setRejectedStudentIdsByPosition((prev) => ({
        ...prev,
        [positionId]: [...new Set([...(prev[positionId] ?? []), r.studentId])],
      }))
      setAiAnalysisByPosition((prev) => {
        const current = prev[positionId]
        if (!current) return prev
        return {
          ...prev,
          [positionId]: {
            ...current,
            results: current.results.filter((x) => x.applicationId !== r.applicationId),
          },
        }
      })
      toast.success('Applicant removed from shortlist.')
    } catch (err) {
      toast.error(parseApiErrorMessage(err))
    } finally {
      setDecisionBusyApplicationId(null)
    }
  }

  function openRegenerateModal(positionId: number) {
    setRegenerateModalPositionId(positionId)
    setRegenerateSkills('')
    setRegenerateMajors('')
    setRegenerateMinMatch(70)
    setRegenerateExcludeRejected(true)
  }

  const cover = campaign?.coverImageUrl ? resolveApiFileUrl(campaign.coverImageUrl) : null
  const positions = [...(campaign?.positions ?? [])].sort((a, b) => a.displayOrder - b.displayOrder)

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
        to="/organization/recruitment-campaigns"
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
        Back to campaigns
      </Link>

      {loading || shell.loading ? (
        <p style={{ color: assocDash.muted }}>Loading campaign…</p>
      ) : campaign ? (
        <>
          {aiAnalyzingPositionId !== null ? (
            <style>
              {`@keyframes skillswapAiPulse { 0%, 100% { opacity: 0.32 } 50% { opacity: 1 } }
              @keyframes skillswapAiScan { 0% { transform: translateX(-140%); } 100% { transform: translateX(260%); } }
              .skillswap-ai-shimmer { animation: skillswapAiPulse 1.05s ease-in-out infinite; }`}
            </style>
          ) : null}
          <div
            style={{
              borderRadius: 16,
              overflow: 'hidden',
              marginBottom: 24,
              border: `1px solid ${assocDash.border}`,
              background: cover
                ? `center/cover no-repeat url(${cover})`
                : `linear-gradient(135deg, ${assocDash.accentMuted}, #fff)`,
              minHeight: 180,
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: cover ? 'linear-gradient(to top, rgba(15,23,42,0.75), transparent 55%)' : 'none',
              }}
            />
            <div style={{ position: 'relative', padding: '40px 28px 24px', color: cover ? '#fff' : assocDash.text }}>
              {!campaign.isPublished ? (
                <span style={draftBadge}>Draft</span>
              ) : null}
              <h1 style={{ margin: campaign.isPublished ? 0 : '12px 0 0', fontSize: 28, fontWeight: 800 }}>
                {campaign.title}
              </h1>
            </div>
          </div>

          <Link
            to={`/organization/recruitment-campaigns/${campaign.id}/edit`}
            style={{
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
              marginBottom: 24,
            }}
          >
            <Pencil size={16} />
            Edit campaign
          </Link>

          <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
            <div style={{ ...assocCard, padding: 24 }}>
              <h2 style={sectionTitle}>Overview</h2>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: assocDash.text, whiteSpace: 'pre-wrap' }}>
                {campaign.description}
              </p>
              <p style={{ margin: '16px 0 0', fontSize: 13, color: assocDash.muted, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Calendar size={16} />
                Apply by {formatEventDate(campaign.applicationDeadline)}
              </p>
            </div>
          </div>

          <section style={{ marginTop: 28 }}>
            <h2 style={{ ...sectionTitle, marginBottom: 16 }}>Required positions ({positions.length})</h2>
            <div style={{ display: 'grid', gap: 14 }}>
              {positions.map((p) => {
                const skills = parseSkillsList(p.requiredSkills)
                return (
                  <article key={p.id} style={{ ...assocCard, padding: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
                      <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>{p.roleTitle}</h3>
                      <span style={countBadge}>
                        <Users size={14} />
                        {p.neededCount} needed
                      </span>
                    </div>
                    {p.description?.trim() ? <p style={body}>{p.description}</p> : null}
                    {p.requirements?.trim() ? (
                      <>
                        <p style={label}>Requirements</p>
                        <p style={body}>{p.requirements}</p>
                      </>
                    ) : null}
                    {skills.length > 0 ? (
                      <>
                        <p style={label}>Skills</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          {skills.map((s) => (
                            <span key={s} style={chip}>
                              {s}
                            </span>
                          ))}
                        </div>
                      </>
                    ) : null}
                    <Link
                      to={positionApplicationFormPath(campaign.id, p.id)}
                      style={formEditLink}
                    >
                      <ClipboardList size={16} />
                      {countQuestionsForPosition(questions, p.id) > 0
                        ? 'Edit application form'
                        : 'Create application form'}
                    </Link>
                    <div style={{ marginTop: 12 }}>
                      <button
                        type="button"
                        disabled={aiAnalyzingPositionId === p.id}
                        onClick={() => handleAiAnalyze(p.id)}
                        style={{
                          ...analyzeAiBtnPremium,
                          opacity: aiAnalyzingPositionId === p.id ? 0.88 : 1,
                          cursor: aiAnalyzingPositionId === p.id ? 'wait' : 'pointer',
                          boxShadow:
                            aiAnalyzingPositionId === p.id
                              ? '0 0 0 1px rgba(234,88,12,0.35), 0 8px 28px rgba(234,88,12,0.18)'
                              : analyzeAiBtnPremium.boxShadow,
                        }}
                      >
                        {aiAnalyzingPositionId === p.id ? (
                          <span className="skillswap-ai-shimmer" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                            <Loader2 size={17} />
                            AI is analyzing applicants…
                          </span>
                        ) : (
                          <>
                            <Sparkles size={17} />
                            Analyze applicants with AI
                          </>
                        )}
                      </button>
                      {aiAnalyzingPositionId === p.id ? (
                        <div style={aiScanLineWrap} aria-hidden>
                          <div style={aiScanLine} />
                        </div>
                      ) : null}
                    </div>
                    {aiAnalysisByPosition[p.id] || (acceptedByPosition[p.id]?.length ?? 0) > 0 ? (
                      <div style={aiResultsShell}>
                        <div style={aiResultsHeader}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Sparkles size={16} color={assocDash.accentDark} />
                            <span style={aiResultsHeaderText}>AI shortlist</span>
                          </div>
                          <span style={aiResultsSub}>
                            Ranked for this role · up to {p.neededCount} seat{p.neededCount === 1 ? '' : 's'}
                          </span>
                          <button
                            type="button"
                            style={regenerateBtn}
                            disabled={aiAnalyzingPositionId === p.id}
                            onClick={() => openRegenerateModal(p.id)}
                          >
                            <RotateCcw size={15} />
                            Regenerate candidates
                          </button>
                        </div>
                        {(acceptedByPosition[p.id] ?? []).map((r) => (
                          <AiRecruitmentCandidateCard
                            key={`accepted-${r.applicationId}`}
                            campaignId={campaign.id}
                            result={r}
                            variant="accepted"
                            busy={false}
                          />
                        ))}
                        {aiAnalysisByPosition[p.id] &&
                        aiAnalysisByPosition[p.id]!.results.length === 0 &&
                        (acceptedByPosition[p.id]?.length ?? 0) === 0 ? (
                          <p style={{ margin: 0, fontSize: 13, color: assocDash.muted, fontWeight: 600 }}>
                            No submitted applications for this position yet.
                          </p>
                        ) : (
                          (aiAnalysisByPosition[p.id]?.results ?? []).map((r, idx) => (
                            <AiRecruitmentCandidateCard
                              key={`${r.applicationId}-${idx}`}
                              campaignId={campaign.id}
                              result={r}
                              variant="suggested"
                              showBestPick={idx === 0 && (acceptedByPosition[p.id]?.length ?? 0) === 0}
                              busy={decisionBusyApplicationId === r.applicationId}
                              onAccept={() => handleAcceptCandidate(r, p.id)}
                              onReject={() => handleRejectCandidate(r, p.id)}
                            />
                          ))
                        )}
                      </div>
                    ) : null}
                  </article>
                )
              })}
            </div>
          </section>

          <OrganizationCampaignApplicationsSection campaignId={campaign.id} positions={positions} />

          {regenerateModalPositionId !== null ? (
            <div style={modalBackdrop} role="dialog" aria-modal="true">
              <div style={modalCard}>
                <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 800 }}>Regenerate candidates</h3>
                <p style={{ margin: '0 0 16px', fontSize: 13, color: assocDash.muted }}>
                  Refine AI suggestions. Rejected applicants stay excluded when the toggle is on.
                </p>
                <label style={modalLabel}>Preferred skills (comma-separated)</label>
                <input
                  type="text"
                  value={regenerateSkills}
                  onChange={(e) => setRegenerateSkills(e.target.value)}
                  style={modalInput}
                  placeholder="e.g. React, leadership"
                />
                <label style={modalLabel}>Preferred majors</label>
                <input
                  type="text"
                  value={regenerateMajors}
                  onChange={(e) => setRegenerateMajors(e.target.value)}
                  style={modalInput}
                  placeholder="e.g. Computer Science"
                />
                <label style={modalLabel}>Minimum match %</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={regenerateMinMatch}
                  onChange={(e) => setRegenerateMinMatch(Number(e.target.value) || 0)}
                  style={modalInput}
                />
                <label style={modalCheckRow}>
                  <input
                    type="checkbox"
                    checked={regenerateExcludeRejected}
                    onChange={(e) => setRegenerateExcludeRejected(e.target.checked)}
                  />
                  Exclude rejected applicants
                </label>
                <div style={{ display: 'flex', gap: 10, marginTop: 18, justifyContent: 'flex-end' }}>
                  <button type="button" style={modalCancelBtn} onClick={() => setRegenerateModalPositionId(null)}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    style={modalPrimaryBtn}
                    disabled={aiAnalyzingPositionId === regenerateModalPositionId}
                    onClick={() => handleRegenerate(regenerateModalPositionId)}
                  >
                    {aiAnalyzingPositionId === regenerateModalPositionId ? 'Regenerating…' : 'Regenerate'}
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </AssociationDashboardLayout>
  )
}

const sectionTitle: CSSProperties = {
  margin: '0 0 12px',
  fontSize: 16,
  fontWeight: 800,
  fontFamily: assocDash.fontDisplay,
}

const draftBadge: CSSProperties = {
  display: 'inline-block',
  fontSize: 11,
  fontWeight: 700,
  padding: '4px 10px',
  borderRadius: 8,
  background: 'rgba(255,255,255,0.2)',
  border: '1px solid rgba(255,255,255,0.35)',
}

const countBadge: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '6px 10px',
  borderRadius: 10,
  background: assocDash.accentMuted,
  border: `1px solid ${assocDash.accentBorder}`,
  fontSize: 12,
  fontWeight: 800,
  color: assocDash.accentDark,
}

const label: CSSProperties = {
  margin: '12px 0 4px',
  fontSize: 11,
  fontWeight: 800,
  color: assocDash.subtle,
  textTransform: 'uppercase',
}

const body: CSSProperties = { margin: 0, fontSize: 14, lineHeight: 1.6, color: assocDash.text }

const chip: CSSProperties = {
  padding: '4px 10px',
  borderRadius: 8,
  background: assocDash.accentMuted,
  border: `1px solid ${assocDash.accentBorder}`,
  fontSize: 12,
  fontWeight: 700,
  color: assocDash.accentDark,
}

const formEditLink: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  marginTop: 16,
  padding: '10px 16px',
  borderRadius: assocDash.radiusMd,
  border: `1px solid ${assocDash.accentBorder}`,
  background: assocDash.accentMuted,
  color: assocDash.accentDark,
  fontSize: 13,
  fontWeight: 700,
  textDecoration: 'none',
}

const analyzeAiBtnPremium: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
  width: '100%',
  marginTop: 0,
  padding: '13px 18px',
  borderRadius: 14,
  border: '1px solid rgba(234, 88, 12, 0.35)',
  background: 'linear-gradient(135deg, #fff7ed 0%, #ffffff 55%, #fffbeb 100%)',
  color: '#9a3412',
  fontSize: 14,
  fontWeight: 800,
  cursor: 'pointer',
  fontFamily: assocDash.font,
  boxShadow: '0 6px 22px rgba(15, 23, 42, 0.06)',
}

const aiScanLineWrap: CSSProperties = {
  marginTop: 10,
  height: 5,
  borderRadius: 999,
  overflow: 'hidden',
  background: 'linear-gradient(90deg, #e2e8f0, #f1f5f9)',
}

const aiScanLine: CSSProperties = {
  height: '100%',
  width: '40%',
  borderRadius: 999,
  background: 'linear-gradient(90deg, #fb923c, #ea580c)',
  animation: 'skillswapAiScan 1.35s ease-in-out infinite',
}

const aiResultsShell: CSSProperties = {
  marginTop: 20,
  padding: 18,
  borderRadius: 18,
  background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
  border: '1px solid rgba(148, 163, 184, 0.35)',
  boxShadow: '0 12px 40px rgba(15, 23, 42, 0.07)',
  position: 'relative',
  overflow: 'hidden',
}

const aiResultsHeader: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: 4,
  marginBottom: 16,
}

const aiResultsHeaderText: CSSProperties = {
  fontSize: 13,
  fontWeight: 900,
  color: assocDash.text,
  fontFamily: assocDash.fontDisplay,
  letterSpacing: 0.02,
  textTransform: 'uppercase',
}

const aiResultsSub: CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: assocDash.muted,
}

const aiMatchCardPremium: CSSProperties = {
  position: 'relative',
  padding: '18px 18px 16px',
  borderRadius: 16,
  border: '1px solid rgba(226, 232, 240, 0.95)',
  background: '#ffffff',
  marginBottom: 12,
  boxShadow: '0 4px 18px rgba(15, 23, 42, 0.04)',
}

const topPickRibbon: CSSProperties = {
  display: 'inline-block',
  marginBottom: 10,
  fontSize: 10,
  fontWeight: 900,
  letterSpacing: 0.08,
  textTransform: 'uppercase',
  color: '#fff',
  background: 'linear-gradient(90deg, #0f172a, #334155)',
  padding: '5px 10px',
  borderRadius: 8,
}

const matchScoreDock: CSSProperties = {
  flexShrink: 0,
  textAlign: 'right',
  padding: '8px 12px',
  borderRadius: 14,
  background: 'linear-gradient(145deg, #fff7ed, #ffedd5)',
  border: '1px solid rgba(251, 191, 36, 0.45)',
  minWidth: 88,
}

const matchScoreBig: CSSProperties = {
  fontSize: 26,
  fontWeight: 900,
  color: '#c2410c',
  lineHeight: 1,
  fontFamily: assocDash.fontDisplay,
}

const matchScorePct: CSSProperties = {
  fontSize: 14,
  fontWeight: 800,
  color: '#c2410c',
  marginLeft: 1,
}

const matchScoreLbl: CSSProperties = {
  display: 'block',
  marginTop: 4,
  fontSize: 10,
  fontWeight: 800,
  color: assocDash.muted,
  textTransform: 'uppercase',
}

const bulletListPremium: CSSProperties = {
  margin: 0,
  paddingLeft: 18,
  fontSize: 13,
  lineHeight: 1.55,
  color: assocDash.text,
  fontWeight: 500,
}

const aiReasonBox: CSSProperties = {
  marginTop: 14,
  padding: '12px 14px',
  borderRadius: 12,
  background: 'linear-gradient(120deg, rgba(248, 250, 252, 0.9), rgba(255, 251, 235, 0.65))',
  border: '1px solid rgba(226, 232, 240, 0.9)',
}

const aiReasonLabel: CSSProperties = {
  margin: '0 0 6px',
  fontSize: 10,
  fontWeight: 900,
  color: assocDash.subtle,
  textTransform: 'uppercase',
  letterSpacing: 0.06,
}

const aiReasonText: CSSProperties = {
  margin: 0,
  fontSize: 14,
  lineHeight: 1.55,
  color: assocDash.text,
  fontWeight: 600,
  fontStyle: 'italic',
}

const aiActionRow: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 10,
  marginTop: 16,
}

const aiOutlineAction: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '10px 14px',
  borderRadius: 12,
  border: `1px solid ${assocDash.border}`,
  background: assocDash.surface,
  color: assocDash.text,
  fontSize: 13,
  fontWeight: 700,
  textDecoration: 'none',
}

const regenerateBtn: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  marginTop: 10,
  padding: '9px 14px',
  borderRadius: 12,
  border: `1px solid ${assocDash.accentBorder}`,
  background: assocDash.surface,
  color: assocDash.accentDark,
  fontSize: 13,
  fontWeight: 700,
  cursor: 'pointer',
}

const modalBackdrop: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(15, 23, 42, 0.45)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 20,
  zIndex: 50,
}

const modalCard: CSSProperties = {
  width: '100%',
  maxWidth: 440,
  padding: 22,
  borderRadius: 16,
  background: '#fff',
  border: `1px solid ${assocDash.border}`,
  boxShadow: '0 20px 50px rgba(15, 23, 42, 0.18)',
}

const modalLabel: CSSProperties = {
  display: 'block',
  margin: '12px 0 6px',
  fontSize: 12,
  fontWeight: 700,
  color: assocDash.subtle,
}

const modalInput: CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 10,
  border: `1px solid ${assocDash.border}`,
  fontSize: 14,
  boxSizing: 'border-box',
}

const modalCheckRow: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  marginTop: 14,
  fontSize: 13,
  fontWeight: 600,
  color: assocDash.text,
}

const modalCancelBtn: CSSProperties = {
  padding: '10px 14px',
  borderRadius: 10,
  border: `1px solid ${assocDash.border}`,
  background: assocDash.surface,
  fontWeight: 700,
  cursor: 'pointer',
}

const modalPrimaryBtn: CSSProperties = {
  padding: '10px 16px',
  borderRadius: 10,
  border: 'none',
  background: assocDash.gradient,
  color: '#fff',
  fontWeight: 800,
  cursor: 'pointer',
}

const aiPrimaryAction: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '10px 16px',
  borderRadius: 12,
  background: assocDash.gradient,
  color: '#fff',
  fontSize: 13,
  fontWeight: 800,
  textDecoration: 'none',
  boxShadow: '0 8px 22px rgba(234, 88, 12, 0.25)',
}