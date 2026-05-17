import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Clock, Loader2, X } from 'lucide-react'
import toast from 'react-hot-toast'
import type { RecruitmentPosition, RecruitmentQuestion } from '../../../api/recruitmentCampaignsApi'
import {
  getMyRecruitmentApplication,
  parseApiErrorMessage,
  submitRecruitmentApplication,
  type StudentApplicationStatus,
} from '../../../api/recruitmentApplicationsApi'
import {
  buildEmptyAnswerDrafts,
  draftsToSubmissionPayload,
  estimateApplicationMinutes,
  getStudentApplicationQuestions,
  validateApplicationAnswers,
  type ApplicationAnswerDraft,
} from '../../../utils/recruitmentFormFields'
import { RecruitmentApplicationForm } from './RecruitmentApplicationForm'
import { assocDash } from '../../pages/association/dashboard/associationDashTokens'

type Props = {
  organizationId: number
  campaignId: number
  position: RecruitmentPosition
  questions: RecruitmentQuestion[]
}

const isStudentRole = () => (localStorage.getItem('role') ?? '').toLowerCase() === 'student'

export function RecruitmentPositionApplyPanel({ organizationId, campaignId, position, questions }: Props) {
  const navigate = useNavigate()
  const isStudent = isStudentRole()
  const formQuestions = useMemo(
    () => getStudentApplicationQuestions(questions, position.id),
    [questions, position.id],
  )
  const questionCount = formQuestions.length
  const estimatedMin = estimateApplicationMinutes(questionCount)

  const [status, setStatus] = useState<StudentApplicationStatus | null>(null)
  const [statusLoading, setStatusLoading] = useState(isStudent)
  const [formOpen, setFormOpen] = useState(false)
  const [drafts, setDrafts] = useState<Record<number, ApplicationAnswerDraft>>(() =>
    buildEmptyAnswerDrafts(formQuestions),
  )
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const loadStatus = useCallback(async () => {
    if (!isStudent) {
      setStatusLoading(false)
      return
    }
    setStatusLoading(true)
    try {
      const data = await getMyRecruitmentApplication(organizationId, campaignId, position.id)
      setStatus(data)
      if (data.hasSubmitted) setSubmitted(true)
    } catch {
      setStatus(null)
    } finally {
      setStatusLoading(false)
    }
  }, [isStudent, organizationId, campaignId, position.id])

  useEffect(() => {
    void loadStatus()
  }, [loadStatus])

  useEffect(() => {
    setDrafts(buildEmptyAnswerDrafts(formQuestions))
  }, [formQuestions])

  const handleApplyClick = () => {
    if (!isStudent) {
      toast.error('Sign in as a student to apply.')
      navigate('/login')
      return
    }
    if (questionCount === 0) {
      toast.error('This position does not have an application form yet.')
      return
    }
    setFormOpen(true)
  }

  const handleSubmit = async () => {
    const err = validateApplicationAnswers(formQuestions, drafts)
    if (err) {
      toast.error(err)
      return
    }
    setSubmitting(true)
    try {
      const payload = draftsToSubmissionPayload(formQuestions, drafts)
      const res = await submitRecruitmentApplication(
        organizationId,
        campaignId,
        position.id,
        payload,
      )
      setSubmitted(true)
      setStatus({
        hasSubmitted: true,
        applicationId: res.applicationId,
        status: res.status,
        submittedAt: res.submittedAt,
      })
      setFormOpen(false)
      toast.success(res.message)
    } catch (e) {
      toast.error(parseApiErrorMessage(e))
    } finally {
      setSubmitting(false)
    }
  }

  if (statusLoading) {
    return (
      <div style={panelWrap}>
        <p style={{ margin: 0, fontSize: 13, color: assocDash.muted, display: 'flex', gap: 8, alignItems: 'center' }}>
          <Loader2 size={16} className="org-hub-spin" /> Checking application status…
        </p>
      </div>
    )
  }

  if (submitted || status?.hasSubmitted) {
    return (
      <div style={successWrap}>
        <CheckCircle2 size={22} color="#047857" />
        <div>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#047857' }}>Application submitted</p>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: assocDash.muted }}>
            Status: {status?.status ?? 'Pending'}
            {status?.submittedAt
              ? ` · ${new Date(status.submittedAt).toLocaleString()}`
              : ''}
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div style={panelWrap}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: assocDash.text }}>Apply for this role</p>
        <p style={{ margin: '8px 0 0', fontSize: 13, color: assocDash.muted, lineHeight: 1.5 }}>
          Complete this application form to apply for {position.roleTitle}.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 14 }}>
          <span style={metaChip}>
            <Clock size={14} />
            {questionCount} question{questionCount === 1 ? '' : 's'}
          </span>
          {estimatedMin > 0 ? (
            <span style={metaChip}>~{estimatedMin} min to complete</span>
          ) : null}
        </div>
        <button type="button" style={applyBtn} onClick={handleApplyClick} disabled={questionCount === 0}>
          Apply now
        </button>
        {!isStudent ? (
          <p style={{ margin: '10px 0 0', fontSize: 12, color: assocDash.muted }}>
            Student account required to submit an application.
          </p>
        ) : null}
      </div>

      {formOpen ? (
        <div style={modalBackdrop} role="presentation" onClick={() => !submitting && setFormOpen(false)}>
          <div
            style={modalCard}
            role="dialog"
            aria-modal
            aria-labelledby={`apply-${position.id}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={modalHeader}>
              <div>
                <h3 id={`apply-${position.id}`} style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>
                  Application — {position.roleTitle}
                </h3>
                <p style={{ margin: '6px 0 0', fontSize: 13, color: assocDash.muted }}>
                  {questionCount} questions · ~{estimatedMin} min
                </p>
              </div>
              <button
                type="button"
                style={closeBtn}
                onClick={() => setFormOpen(false)}
                disabled={submitting}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div style={modalBody}>
              <RecruitmentApplicationForm
                organizationId={organizationId}
                campaignId={campaignId}
                questions={formQuestions}
                drafts={drafts}
                onChange={setDrafts}
                disabled={submitting}
              />
            </div>

            <div style={modalFooter}>
              <button type="button" style={cancelBtn} onClick={() => setFormOpen(false)} disabled={submitting}>
                Cancel
              </button>
              <button type="button" style={submitBtn} onClick={() => void handleSubmit()} disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 size={16} className="org-hub-spin" /> Submitting…
                  </>
                ) : (
                  'Submit application'
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <style>{`
        @keyframes org-hub-spin { to { transform: rotate(360deg); } }
        .org-hub-spin { animation: org-hub-spin 0.8s linear infinite; }
      `}</style>
    </>
  )
}

const panelWrap: React.CSSProperties = {
  marginTop: 20,
  padding: 18,
  borderRadius: 14,
  border: `1px solid ${assocDash.accentBorder}`,
  background: `linear-gradient(135deg, ${assocDash.accentMuted} 0%, #fff 100%)`,
}

const successWrap: React.CSSProperties = {
  ...panelWrap,
  display: 'flex',
  alignItems: 'flex-start',
  gap: 12,
  borderColor: '#a7f3d0',
  background: '#ecfdf5',
}

const metaChip: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '6px 10px',
  borderRadius: 8,
  fontSize: 12,
  fontWeight: 600,
  background: '#fff',
  border: `1px solid ${assocDash.border}`,
  color: assocDash.muted,
}

const applyBtn: React.CSSProperties = {
  marginTop: 16,
  padding: '11px 18px',
  borderRadius: 10,
  border: 'none',
  background: assocDash.accent,
  color: '#fff',
  fontSize: 14,
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: 'inherit',
}

const modalBackdrop: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 1000,
  background: 'rgba(15,23,42,0.45)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 20,
}

const modalCard: React.CSSProperties = {
  width: 'min(640px, 100%)',
  maxHeight: 'min(90vh, 820px)',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: 16,
  background: '#fff',
  boxShadow: '0 24px 64px rgba(15,23,42,0.2)',
  overflow: 'hidden',
}

const modalHeader: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 12,
  padding: '20px 22px 12px',
  borderBottom: `1px solid ${assocDash.border}`,
}

const modalBody: React.CSSProperties = {
  padding: '16px 22px',
  overflowY: 'auto',
  flex: 1,
}

const modalFooter: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 10,
  padding: '14px 22px 18px',
  borderTop: `1px solid ${assocDash.border}`,
}

const closeBtn: React.CSSProperties = {
  border: 'none',
  background: assocDash.bg,
  borderRadius: 8,
  padding: 8,
  cursor: 'pointer',
  color: assocDash.muted,
}

const cancelBtn: React.CSSProperties = {
  padding: '10px 16px',
  borderRadius: 10,
  border: `1px solid ${assocDash.border}`,
  background: '#fff',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'inherit',
}

const submitBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '10px 18px',
  borderRadius: 10,
  border: 'none',
  background: assocDash.accent,
  color: '#fff',
  fontSize: 13,
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: 'inherit',
}
