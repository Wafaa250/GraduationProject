import { useEffect, useState, type CSSProperties } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CalendarClock,
  ClipboardList,
  Loader2,
  Pencil,
  RotateCcw,
  Sparkles,
  UserRound,
  Users,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { resolveApiFileUrl } from '@/api/axiosInstance'
import {
  getOrganizationRecruitmentCampaign,
  listRecruitmentCampaignQuestions,
  parseApiErrorMessage,
  parseSkillsList,
  type RecruitmentCampaign,
  type RecruitmentQuestion,
} from '@/api/recruitmentCampaignsApi'
import { countQuestionsForPosition } from '@/utils/recruitmentFormFields'
import { sortByLeadershipRole } from '@/utils/leadershipRoleSort'
import {
  acceptRecruitmentApplication,
  analyzeRecruitmentApplicants,
  regenerateRecruitmentApplicants,
  rejectRecruitmentApplication,
  type RecruitmentApplicantAnalysisResponse,
  type RecruitmentApplicantAnalysisResult,
} from '@/api/recruitmentApplicationsApi'
import { OrganizationCampaignApplicationsSection } from '@/components/association/OrganizationCampaignApplicationsSection'
import { AiRecruitmentCandidateCard } from '@/components/association/AiRecruitmentCandidateCard'
import { positionApplicationFormPath } from '@/components/association/PositionApplicationFormEditor'
import { AssociationDashboardLayout } from '../dashboard/AssociationDashboardLayout'
import { assocCard, assocDash } from '../dashboard/associationDashTokens'
import {
  formatEventDate,
  formatRegistrationCloseDate,
  getRegistrationDeadlineStatus,
} from '../events/eventFormUtils'
import { useAssociationShell } from '../events/useAssociationShell'

/** Vertical rhythm between major page sections. */
const sectionGap = 40
const blockGap = 24

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
  const [applicationsCount, setApplicationsCount] = useState<number | null>(null)

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
        if (!cancelled) navigate('/association/recruitment')
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
          ? `Found ${data.results.length} new applicant${data.results.length === 1 ? '' : 's'}.`
          : 'No additional applicants matched your filters.',
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
  const positions = sortByLeadershipRole(campaign?.positions ?? [])
  const totalOpenings = positions.reduce((sum, p) => sum + p.neededCount, 0)
  const deadlineStatus = campaign ? getRegistrationDeadlineStatus(campaign.applicationDeadline) : null
  const deadlineLabel = campaign ? formatRegistrationCloseDate(campaign.applicationDeadline) : null
  const statusChip = !campaign
    ? null
    : !campaign.isPublished
      ? { label: 'Draft', tone: 'neutral' as const }
      : deadlineStatus === 'closed'
        ? { label: 'Closed', tone: 'closed' as const }
        : deadlineStatus === 'closing-soon'
          ? { label: 'Closing soon', tone: 'warn' as const }
          : { label: 'Open', tone: 'open' as const }

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
        to="/association/recruitment"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          marginBottom: 24,
          fontSize: 13,
          fontWeight: 600,
          color: assocDash.accentDark,
          textDecoration: 'none',
        }}
      >
        <ArrowLeft size={16} />
        Back to opportunities
      </Link>

      {loading || shell.loading ? (
        <p style={{ color: assocDash.muted }}>Loading opportunity…</p>
      ) : campaign ? (
        <>
          {aiAnalyzingPositionId !== null ? (
            <style>
              {`@keyframes skillswapAiPulse { 0%, 100% { opacity: 0.32 } 50% { opacity: 1 } }
              @keyframes skillswapAiScan { 0% { transform: translateX(-140%); } 100% { transform: translateX(260%); } }
              .skillswap-ai-shimmer { animation: skillswapAiPulse 1.05s ease-in-out infinite; }`}
            </style>
          ) : null}
          <div style={{ ...assocCard, padding: 0, overflow: 'hidden', marginBottom: blockGap }}>
            <div
              style={{
                minHeight: cover ? 140 : 0,
                background: cover
                  ? `center/cover no-repeat url(${cover})`
                  : assocDash.accentMuted,
                borderBottom: cover ? 'none' : `1px solid ${assocDash.border}`,
              }}
            />
            <div style={{ padding: '28px 28px 24px' }}>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 16,
                  marginBottom: 18,
                }}
              >
                <div style={{ flex: '1 1 280px', minWidth: 0 }}>
                  <h1
                    style={{
                      margin: 0,
                      fontSize: 28,
                      fontWeight: 800,
                      fontFamily: assocDash.fontDisplay,
                      letterSpacing: '-0.02em',
                      lineHeight: 1.2,
                      color: assocDash.text,
                    }}
                  >
                    {campaign.title}
                  </h1>
                  {statusChip ? (
                    <div style={metaChipRow}>
                      <MetaChip
                        label={statusChip.label}
                        icon={ClipboardList}
                        tone={statusChip.tone}
                      />
                      <MetaChip
                        label={`${positions.length} position${positions.length === 1 ? '' : 's'}`}
                        icon={Users}
                        tone="neutral"
                      />
                      <MetaChip
                        label={`${totalOpenings} opening${totalOpenings === 1 ? '' : 's'}`}
                        icon={UserRound}
                        tone="neutral"
                      />
                      <MetaChip
                        label={
                          applicationsCount === null
                            ? 'Loading applicants…'
                            : `${applicationsCount} applicant${applicationsCount === 1 ? '' : 's'}`
                        }
                        icon={Users}
                        tone="neutral"
                      />
                      {deadlineLabel ? (
                        <MetaChip
                          label={`Apply by ${deadlineLabel}`}
                          icon={CalendarClock}
                          tone={deadlineStatus === 'closed' ? 'closed' : deadlineStatus === 'closing-soon' ? 'warn' : 'neutral'}
                        />
                      ) : null}
                    </div>
                  ) : null}
                </div>
                <Link to={`/association/recruitment/${campaign.id}/edit`} style={editOpportunityBtn}>
                  <Pencil size={16} />
                  Edit opportunity
                </Link>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: sectionGap }}>
            <div style={{ ...assocCard, padding: '26px 28px' }}>
              <h2 style={sectionTitle}>Overview</h2>
              <p style={overviewBody}>{campaign.description}</p>
              <div style={deadlineInfoRow}>
                <span style={deadlineInfoIcon} aria-hidden>
                  <CalendarClock size={16} strokeWidth={2.25} />
                </span>
                <div>
                  <p style={deadlineInfoLabel}>Application deadline</p>
                  <p style={deadlineInfoValue}>Apply by {formatEventDate(campaign.applicationDeadline)}</p>
                </div>
              </div>
            </div>
          </div>

          <section style={{ marginBottom: sectionGap }}>
            <div style={sectionHeadingBlock}>
              <h2 style={sectionTitle}>Open positions</h2>
              <p style={sectionSubtitle}>
                {positions.length} role{positions.length === 1 ? '' : 's'} · {totalOpenings} total opening
                {totalOpenings === 1 ? '' : 's'}
              </p>
            </div>
            <div style={{ display: 'grid', gap: 20 }}>
              {positions.map((p) => {
                const skills = parseSkillsList(p.requiredSkills)
                return (
                  <article key={p.id} style={positionCard}>
                    <div style={positionCardHeader}>
                      <h3 style={positionTitle}>{p.roleTitle}</h3>
                      <span style={countBadge}>
                        <Users size={14} strokeWidth={2.25} />
                        {p.neededCount} opening{p.neededCount === 1 ? '' : 's'}
                      </span>
                    </div>
                    {p.description?.trim() ? (
                      <p style={{ ...body, marginBottom: 18 }}>{p.description}</p>
                    ) : null}
                    {p.requirements?.trim() ? (
                      <div style={requirementsPanel}>
                        <p style={panelLabel}>Requirements</p>
                        <p style={panelBody}>{p.requirements}</p>
                      </div>
                    ) : null}
                    {skills.length > 0 ? (
                      <div style={{ marginTop: p.requirements?.trim() ? 16 : 0 }}>
                        <p style={panelLabel}>Skills</p>
                        <div style={skillTagRow}>
                          {skills.map((s) => (
                            <span key={s} style={skillTag}>
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    <div style={positionCardDivider} />
                    <Link
                      to={positionApplicationFormPath(campaign.id, p.id)}
                      style={formEditLink}
                    >
                      <ClipboardList size={16} strokeWidth={2.25} />
                      {countQuestionsForPosition(questions, p.id) > 0
                        ? 'Edit application form'
                        : 'Create application form'}
                    </Link>
                    <div style={{ marginTop: 18 }}>
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
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <Sparkles size={15} color={assocDash.accentDark} strokeWidth={2.25} />
                              <span style={aiResultsHeaderText}>AI shortlist</span>
                            </div>
                            <span style={aiResultsSub}>
                              Ranked for this role · up to {p.neededCount} seat{p.neededCount === 1 ? '' : 's'}
                            </span>
                          </div>
                          <button
                            type="button"
                            style={regenerateBtn}
                            disabled={aiAnalyzingPositionId === p.id}
                            onClick={() => openRegenerateModal(p.id)}
                          >
                            <RotateCcw size={15} />
                            Regenerate suggestions
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

          <OrganizationCampaignApplicationsSection
            campaignId={campaign.id}
            positions={positions}
            onApplicationsCountChange={setApplicationsCount}
          />

          {regenerateModalPositionId !== null ? (
            <div style={modalBackdrop} role="dialog" aria-modal="true">
              <div style={modalCard}>
                <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 800 }}>Regenerate suggestions</h3>
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

function MetaChip({
  label,
  icon: Icon,
  tone,
}: {
  label: string
  icon: typeof Users
  tone: 'open' | 'warn' | 'closed' | 'neutral'
}) {
  const toneStyle =
    tone === 'open'
      ? metaChipOpen
      : tone === 'warn'
        ? metaChipWarn
        : tone === 'closed'
          ? metaChipClosed
          : metaChipNeutral

  return (
    <span style={{ ...metaChip, ...toneStyle }}>
      <Icon size={13} strokeWidth={2.25} aria-hidden />
      {label}
    </span>
  )
}

const sectionTitle: CSSProperties = {
  margin: 0,
  fontSize: 17,
  fontWeight: 800,
  fontFamily: assocDash.fontDisplay,
  letterSpacing: '-0.01em',
  color: assocDash.text,
}

const sectionSubtitle: CSSProperties = {
  margin: '6px 0 0',
  fontSize: 13,
  fontWeight: 500,
  color: assocDash.muted,
  lineHeight: 1.45,
}

const sectionHeadingBlock: CSSProperties = {
  marginBottom: 20,
}

const metaChipRow: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
  marginTop: 16,
}

const metaChip: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '6px 12px',
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 600,
  lineHeight: 1.3,
}

const metaChipNeutral: CSSProperties = {
  background: assocDash.bg,
  color: assocDash.textSecondary,
  border: `1px solid ${assocDash.border}`,
}

const metaChipOpen: CSSProperties = {
  background: '#ecfdf5',
  color: '#047857',
  border: '1px solid #bbf7d0',
}

const metaChipWarn: CSSProperties = {
  background: assocDash.accentMuted,
  color: assocDash.accentDark,
  border: `1px solid ${assocDash.accentBorder}`,
}

const metaChipClosed: CSSProperties = {
  background: '#f1f5f9',
  color: assocDash.muted,
  border: `1px solid ${assocDash.border}`,
}

const editOpportunityBtn: CSSProperties = {
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
  flexShrink: 0,
  fontFamily: 'inherit',
}

const overviewBody: CSSProperties = {
  margin: '0 0 22px',
  fontSize: 15,
  lineHeight: 1.7,
  color: assocDash.textSecondary,
  whiteSpace: 'pre-wrap',
}

const deadlineInfoRow: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 12,
  padding: '14px 16px',
  borderRadius: assocDash.radiusMd,
  background: assocDash.bg,
  border: `1px solid ${assocDash.border}`,
}

const deadlineInfoIcon: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 36,
  height: 36,
  borderRadius: 10,
  background: assocDash.accentMuted,
  border: `1px solid ${assocDash.accentBorder}`,
  color: assocDash.accentDark,
  flexShrink: 0,
}

const deadlineInfoLabel: CSSProperties = {
  margin: 0,
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: assocDash.subtle,
}

const deadlineInfoValue: CSSProperties = {
  margin: '4px 0 0',
  fontSize: 14,
  fontWeight: 600,
  color: assocDash.text,
  lineHeight: 1.4,
}

const positionCard: CSSProperties = {
  ...assocCard,
  padding: '24px 26px 26px',
  boxShadow: assocDash.shadow,
}

const positionCardHeader: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 14,
  marginBottom: 14,
}

const positionTitle: CSSProperties = {
  margin: 0,
  fontSize: 18,
  fontWeight: 800,
  fontFamily: assocDash.fontDisplay,
  letterSpacing: '-0.02em',
  color: assocDash.text,
  lineHeight: 1.25,
}

const positionCardDivider: CSSProperties = {
  height: 1,
  background: assocDash.border,
  margin: '20px 0 18px',
}

const requirementsPanel: CSSProperties = {
  padding: '14px 16px',
  borderRadius: assocDash.radiusMd,
  background: assocDash.bg,
  border: `1px solid ${assocDash.border}`,
}

const panelLabel: CSSProperties = {
  margin: '0 0 8px',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: assocDash.subtle,
}

const panelBody: CSSProperties = {
  margin: 0,
  fontSize: 14,
  lineHeight: 1.6,
  color: assocDash.textSecondary,
}

const skillTagRow: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
}

const skillTag: CSSProperties = {
  padding: '6px 12px',
  borderRadius: 999,
  background: assocDash.accentMuted,
  border: `1px solid ${assocDash.accentBorder}`,
  fontSize: 12,
  fontWeight: 600,
  color: assocDash.accentDark,
  lineHeight: 1.2,
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

const body: CSSProperties = { margin: 0, fontSize: 14, lineHeight: 1.65, color: assocDash.textSecondary }

const formEditLink: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '10px 16px',
  borderRadius: assocDash.radiusMd,
  border: `1px solid ${assocDash.accentBorder}`,
  background: assocDash.surface,
  color: assocDash.accentDark,
  fontSize: 13,
  fontWeight: 700,
  textDecoration: 'none',
  transition: 'background 0.15s ease, border-color 0.15s ease',
}

const analyzeAiBtnPremium: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
  width: '100%',
  marginTop: 0,
  padding: '14px 18px',
  borderRadius: assocDash.radiusMd,
  border: `1px solid ${assocDash.accentBorder}`,
  background: assocDash.accentMuted,
  color: assocDash.accentDark,
  fontSize: 14,
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: assocDash.font,
  boxShadow: assocDash.shadow,
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
  marginTop: 22,
  padding: '20px 20px 16px',
  borderRadius: assocDash.radiusLg,
  background: assocDash.bg,
  border: `1px solid ${assocDash.border}`,
  boxShadow: assocDash.shadow,
}

const aiResultsHeader: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  marginBottom: 18,
  paddingBottom: 16,
  borderBottom: `1px solid ${assocDash.border}`,
}

const aiResultsHeaderText: CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: assocDash.text,
  fontFamily: assocDash.fontDisplay,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
}

const aiResultsSub: CSSProperties = {
  display: 'block',
  marginTop: 4,
  fontSize: 13,
  fontWeight: 500,
  color: assocDash.muted,
}

const regenerateBtn: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '9px 14px',
  borderRadius: assocDash.radiusMd,
  border: `1px solid ${assocDash.border}`,
  background: assocDash.surface,
  color: assocDash.accentDark,
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'inherit',
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
