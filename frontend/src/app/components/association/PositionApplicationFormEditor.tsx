import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ListPlus,
  Trash2,
} from 'lucide-react'
import toast from 'react-hot-toast'
import {
  createRecruitmentCampaignQuestion,
  deleteRecruitmentCampaignQuestion,
  listRecruitmentCampaignQuestions,
  parseApiErrorMessage,
  updateRecruitmentCampaignQuestion,
  type RecruitmentQuestion,
} from '../../../api/recruitmentCampaignsApi'
import {
  draftToPayload,
  emptyFieldDraft,
  fieldToDraft,
  fieldTypeLabel,
  fieldUsesOptions,
  filterQuestionsForPosition,
  validateFieldDraft,
  type FormFieldDraft,
} from '../../../utils/recruitmentFormFields'
import { ApplicationFormPreview } from './ApplicationFormPreview'
import { assocCard, assocDash } from '../../pages/association/dashboard/associationDashTokens'

const EDITOR_FIELD_TYPES = [
  'ShortText',
  'Paragraph',
  'Dropdown',
  'MultipleChoice',
  'CheckboxList',
  'FileUpload',
  'Url',
  'Email',
  'Date',
  'YesNo',
] as const

type Props = {
  campaignId: number
  positionId: number
  positionTitle: string
  backTo: string
  backLabel?: string
}

type Selection = number | 'new' | null

export function positionApplicationFormPath(campaignId: number, positionId: number) {
  return `/organization/recruitment-campaigns/${campaignId}/positions/${positionId}/form`
}

export function PositionApplicationFormEditor({
  campaignId,
  positionId,
  positionTitle,
  backTo,
  backLabel = 'Back to campaign',
}: Props) {
  const [allQuestions, setAllQuestions] = useState<RecruitmentQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selection, setSelection] = useState<Selection>(null)
  const [draft, setDraft] = useState<FormFieldDraft | null>(null)

  const questions = useMemo(
    () => filterQuestionsForPosition(allQuestions, positionId),
    [allQuestions, positionId],
  )

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await listRecruitmentCampaignQuestions(campaignId)
      setAllQuestions(data)
    } catch (err) {
      toast.error(parseApiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [campaignId])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (selection === 'new') {
      setDraft(emptyFieldDraft(questions.length, { positionId }))
      return
    }
    if (typeof selection === 'number') {
      const q = questions.find((x) => x.id === selection)
      setDraft(q ? fieldToDraft(q) : null)
      return
    }
    setDraft(null)
  }, [selection, questions])

  const selectedId = typeof selection === 'number' ? selection : null

  const startAdd = () => setSelection('new')

  const cancelEdit = () => {
    setSelection(null)
    setDraft(null)
  }

  const saveQuestion = async () => {
    if (!draft) return
    const err = validateFieldDraft(draft)
    if (err) {
      toast.error(err)
      return
    }
    setSaving(true)
    try {
      const payload = draftToPayload({ ...draft, positionId }, positionId)
      if (selection === 'new') {
        await createRecruitmentCampaignQuestion(campaignId, payload)
        toast.success('Question added')
      } else if (typeof selection === 'number') {
        await updateRecruitmentCampaignQuestion(campaignId, selection, payload)
        toast.success('Question saved')
      }
      await load()
      setSelection(null)
      setDraft(null)
    } catch (e) {
      toast.error(parseApiErrorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  const removeQuestion = async (id: number) => {
    if (!window.confirm('Remove this question from the application form?')) return
    setSaving(true)
    try {
      await deleteRecruitmentCampaignQuestion(campaignId, id)
      toast.success('Question removed')
      if (selection === id) cancelEdit()
      await load()
    } catch (e) {
      toast.error(parseApiErrorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  const moveQuestion = async (index: number, direction: -1 | 1) => {
    const next = index + direction
    if (next < 0 || next >= questions.length) return
    const a = questions[index]
    const b = questions[next]
    setSaving(true)
    try {
      await Promise.all([
        updateRecruitmentCampaignQuestion(campaignId, a.id, { displayOrder: b.displayOrder }),
        updateRecruitmentCampaignQuestion(campaignId, b.id, { displayOrder: a.displayOrder }),
      ])
      await load()
    } catch (e) {
      toast.error(parseApiErrorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  const title = positionTitle.trim() || 'Position'

  return (
    <div>
      <Link to={backTo} style={backLink}>
        <ArrowLeft size={16} />
        {backLabel}
      </Link>

      <header style={pageHeader}>
        <p style={eyebrow}>Application form</p>
        <h1 style={pageTitle}>{title} application form</h1>
        <p style={pageSub}>
          Design the form students will complete when applying for this role. The preview on the left
          shows exactly what applicants will see.
        </p>
      </header>

      {loading ? (
        <p style={{ color: assocDash.muted, fontSize: 14 }}>Loading form…</p>
      ) : (
        <div style={workspace}>
          <section style={previewPanel}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 12 }}>
              <h2 style={panelTitle}>Live preview</h2>
              <span style={previewBadge}>Student view</span>
            </div>
            <div style={previewCanvas}>
              <ApplicationFormPreview
                fields={questions}
                title="Application form"
                selectedFieldId={selectedId}
                onFieldClick={(id) => setSelection(id)}
                interactive
              />
            </div>
          </section>

          <aside style={sidebar}>
            <div style={sidebarSticky}>
              {selection != null && draft ? (
                <QuestionSettingsPanel
                  draft={draft}
                  onChange={(patch) => setDraft({ ...draft, ...patch })}
                  onSave={() => void saveQuestion()}
                  onCancel={cancelEdit}
                  onDelete={
                    typeof selection === 'number'
                      ? () => void removeQuestion(selection)
                      : undefined
                  }
                  onMoveUp={
                    typeof selection === 'number'
                      ? () => {
                          const idx = questions.findIndex((q) => q.id === selection)
                          if (idx > 0) void moveQuestion(idx, -1)
                        }
                      : undefined
                  }
                  onMoveDown={
                    typeof selection === 'number'
                      ? () => {
                          const idx = questions.findIndex((q) => q.id === selection)
                          if (idx >= 0 && idx < questions.length - 1) void moveQuestion(idx, 1)
                        }
                      : undefined
                  }
                  saving={saving}
                  isNew={selection === 'new'}
                  canMoveUp={
                    typeof selection === 'number' &&
                    questions.findIndex((q) => q.id === selection) > 0
                  }
                  canMoveDown={
                    typeof selection === 'number' &&
                    questions.findIndex((q) => q.id === selection) <
                      questions.length - 1
                  }
                />
              ) : (
                <div style={sidebarIdle}>
                  <h2 style={panelTitle}>Questions</h2>
                  <p style={sidebarHint}>
                    Click a question in the preview to edit it, or add a new question below.
                  </p>

                  {questions.length > 0 ? (
                    <ul style={questionList}>
                      {questions.map((q, index) => (
                        <li key={q.id}>
                          <button
                            type="button"
                            style={questionListBtn}
                            onClick={() => setSelection(q.id)}
                          >
                            <span style={questionListNum}>{index + 1}</span>
                            <span style={questionListText}>
                              {q.questionTitle}
                              <span style={questionListMeta}>
                                {fieldTypeLabel(q.questionType)}
                                {q.isRequired ? ' · Required' : ''}
                              </span>
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p style={emptyQuestions}>No questions yet — your form is empty.</p>
                  )}

                  <button type="button" onClick={startAdd} style={addQuestionBtn} disabled={saving}>
                    <ListPlus size={18} />
                    Add question
                  </button>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}

function QuestionSettingsPanel({
  draft,
  onChange,
  onSave,
  onCancel,
  onDelete,
  onMoveUp,
  onMoveDown,
  saving,
  isNew,
  canMoveUp,
  canMoveDown,
}: {
  draft: FormFieldDraft
  onChange: (patch: Partial<FormFieldDraft>) => void
  onSave: () => void
  onCancel: () => void
  onDelete?: () => void
  onMoveUp?: () => void
  onMoveDown?: () => void
  saving?: boolean
  isNew?: boolean
  canMoveUp?: boolean
  canMoveDown?: boolean
}) {
  const usesOptions = fieldUsesOptions(draft.questionType)

  return (
    <div style={settingsCard}>
      <h2 style={panelTitle}>{isNew ? 'New question' : 'Question settings'}</h2>

      <label style={fieldLabel}>
        Question label *
        <input
          style={input}
          value={draft.questionTitle}
          onChange={(e) => onChange({ questionTitle: e.target.value })}
          placeholder="e.g. Why do you want to join?"
          disabled={saving}
        />
      </label>

      <label style={fieldLabel}>
        Question type *
        <select
          style={input}
          value={draft.questionType}
          onChange={(e) =>
            onChange({
              questionType: e.target.value,
              options: fieldUsesOptions(e.target.value) ? draft.options : ['', ''],
            })
          }
          disabled={saving}
        >
          {EDITOR_FIELD_TYPES.map((t) => (
            <option key={t} value={t}>
              {fieldTypeLabel(t)}
            </option>
          ))}
        </select>
      </label>

      <label style={fieldLabel}>
        Help text
        <textarea
          style={{ ...input, minHeight: 72 }}
          value={draft.helpText}
          onChange={(e) => onChange({ helpText: e.target.value })}
          placeholder="Optional guidance below the label"
          disabled={saving}
        />
      </label>

      <label style={fieldLabel}>
        Placeholder
        <input
          style={input}
          value={draft.placeholder}
          onChange={(e) => onChange({ placeholder: e.target.value })}
          placeholder="Hint inside the field"
          disabled={saving}
        />
      </label>

      <label style={toggleRow}>
        <input
          type="checkbox"
          checked={draft.isRequired}
          onChange={(e) => onChange({ isRequired: e.target.checked })}
          disabled={saving}
        />
        <span>Required</span>
      </label>

      {usesOptions ? (
        <div style={{ marginBottom: 14 }}>
          <p style={optionsHead}>Answer options</p>
          {draft.options.map((opt, i) => (
            <div key={i} style={optionRow}>
              <span style={optNum}>{i + 1}</span>
              <input
                style={{ ...input, flex: 1 }}
                value={opt}
                onChange={(e) => {
                  const next = [...draft.options]
                  next[i] = e.target.value
                  onChange({ options: next })
                }}
                disabled={saving}
              />
              {draft.options.length > 2 ? (
                <button
                  type="button"
                  style={optRemove}
                  onClick={() => onChange({ options: draft.options.filter((_, j) => j !== i) })}
                  disabled={saving}
                >
                  ×
                </button>
              ) : null}
            </div>
          ))}
          <button
            type="button"
            style={addOptBtn}
            onClick={() => onChange({ options: [...draft.options, ''] })}
            disabled={saving}
          >
            + Add option
          </button>
        </div>
      ) : null}

      {!isNew && onMoveUp && onMoveDown ? (
        <div style={reorderRow}>
          <button type="button" style={iconBtn} onClick={onMoveUp} disabled={saving || !canMoveUp}>
            <ArrowUp size={16} /> Up
          </button>
          <button type="button" style={iconBtn} onClick={onMoveDown} disabled={saving || !canMoveDown}>
            <ArrowDown size={16} /> Down
          </button>
        </div>
      ) : null}

      <div style={actionRow}>
        <button type="button" onClick={onSave} disabled={saving} style={primaryBtn}>
          {saving ? 'Saving…' : isNew ? 'Add to form' : 'Save question'}
        </button>
        <button type="button" onClick={onCancel} disabled={saving} style={ghostBtn}>
          Cancel
        </button>
      </div>

      {!isNew && onDelete ? (
        <button type="button" onClick={onDelete} disabled={saving} style={deleteBtn}>
          <Trash2 size={16} />
          Delete question
        </button>
      ) : null}
    </div>
  )
}


const backLink: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  marginBottom: 20,
  fontSize: 13,
  fontWeight: 600,
  color: assocDash.accentDark,
  textDecoration: 'none',
}

const pageHeader: React.CSSProperties = { marginBottom: 28 }

const eyebrow: React.CSSProperties = {
  margin: 0,
  fontSize: 12,
  fontWeight: 700,
  color: assocDash.accent,
  textTransform: 'uppercase',
  letterSpacing: 0.6,
}

const pageTitle: React.CSSProperties = {
  margin: '8px 0 0',
  fontSize: 28,
  fontWeight: 800,
  fontFamily: assocDash.fontDisplay,
  color: assocDash.text,
  lineHeight: 1.2,
}

const pageSub: React.CSSProperties = {
  margin: '10px 0 0',
  fontSize: 15,
  color: assocDash.muted,
  lineHeight: 1.55,
  maxWidth: 720,
}

const workspace: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) minmax(300px, 360px)',
  gap: 24,
  alignItems: 'start',
}

const previewPanel: React.CSSProperties = {
  ...assocCard,
  padding: 0,
  overflow: 'hidden',
  minHeight: 480,
}

const panelTitle: React.CSSProperties = {
  margin: 0,
  fontSize: 16,
  fontWeight: 800,
  fontFamily: assocDash.fontDisplay,
  color: assocDash.text,
}

const previewBadge: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  padding: '4px 10px',
  borderRadius: 20,
  background: assocDash.accentMuted,
  color: assocDash.accentDark,
  border: `1px solid ${assocDash.accentBorder}`,
}

const previewCanvas: React.CSSProperties = {
  padding: 28,
  background: `linear-gradient(180deg, ${assocDash.bg} 0%, #fff 120px)`,
  minHeight: 400,
}

const sidebar: React.CSSProperties = { position: 'relative' }

const sidebarSticky: React.CSSProperties = { position: 'sticky', top: 16 }

const sidebarIdle: React.CSSProperties = {
  ...assocCard,
  padding: 22,
}

const sidebarHint: React.CSSProperties = {
  margin: '8px 0 16px',
  fontSize: 13,
  color: assocDash.muted,
  lineHeight: 1.5,
}

const settingsCard: React.CSSProperties = {
  ...assocCard,
  padding: 22,
  borderColor: assocDash.accentBorder,
}

const questionList: React.CSSProperties = {
  listStyle: 'none',
  margin: '0 0 16px',
  padding: 0,
  display: 'grid',
  gap: 8,
}

const questionListBtn: React.CSSProperties = {
  width: '100%',
  display: 'flex',
  gap: 10,
  alignItems: 'flex-start',
  padding: '12px 14px',
  borderRadius: 12,
  border: `1px solid ${assocDash.border}`,
  background: '#fff',
  cursor: 'pointer',
  fontFamily: 'inherit',
  textAlign: 'left',
}

const questionListNum: React.CSSProperties = {
  width: 22,
  height: 22,
  borderRadius: 6,
  background: assocDash.accentMuted,
  color: assocDash.accentDark,
  fontSize: 12,
  fontWeight: 800,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
}

const questionListText: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  fontSize: 14,
  fontWeight: 700,
  color: assocDash.text,
}

const questionListMeta: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  color: assocDash.muted,
}

const emptyQuestions: React.CSSProperties = {
  margin: '0 0 16px',
  fontSize: 13,
  color: assocDash.muted,
  fontStyle: 'italic',
}

const addQuestionBtn: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  width: '100%',
  padding: '12px 16px',
  borderRadius: assocDash.radiusMd,
  border: 'none',
  background: assocDash.gradient,
  color: '#fff',
  fontSize: 14,
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: 'inherit',
}

const fieldLabel: React.CSSProperties = {
  display: 'block',
  marginBottom: 14,
  fontSize: 13,
  fontWeight: 600,
  color: assocDash.text,
}

const input: React.CSSProperties = {
  display: 'block',
  width: '100%',
  marginTop: 8,
  padding: '10px 12px',
  borderRadius: 10,
  border: `1.5px solid ${assocDash.border}`,
  fontSize: 14,
  fontFamily: 'inherit',
  boxSizing: 'border-box',
}

const toggleRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  marginBottom: 14,
  fontSize: 14,
  fontWeight: 600,
}

const optionsHead: React.CSSProperties = {
  margin: '0 0 10px',
  fontSize: 13,
  fontWeight: 700,
  color: assocDash.text,
}

const optionRow: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  alignItems: 'center',
  marginBottom: 8,
}

const optNum: React.CSSProperties = {
  width: 20,
  fontSize: 12,
  fontWeight: 800,
  color: assocDash.muted,
  textAlign: 'center',
}

const optRemove: React.CSSProperties = {
  padding: '6px 10px',
  border: '1px solid #fecaca',
  borderRadius: 6,
  background: '#fff',
  color: '#b91c1c',
  cursor: 'pointer',
  fontFamily: 'inherit',
}

const addOptBtn: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: 8,
  border: `1px dashed ${assocDash.border}`,
  background: assocDash.bg,
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'inherit',
  width: '100%',
}

const reorderRow: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  marginBottom: 14,
}

const iconBtn: React.CSSProperties = {
  flex: 1,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  padding: '8px 10px',
  borderRadius: 8,
  border: `1px solid ${assocDash.border}`,
  background: '#fff',
  fontSize: 12,
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: 'inherit',
}

const actionRow: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 10,
  marginTop: 8,
}

const primaryBtn: React.CSSProperties = {
  flex: 1,
  padding: '11px 16px',
  borderRadius: assocDash.radiusMd,
  border: 'none',
  background: assocDash.gradient,
  color: '#fff',
  fontSize: 14,
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: 'inherit',
}

const ghostBtn: React.CSSProperties = {
  padding: '11px 16px',
  borderRadius: assocDash.radiusMd,
  border: `1px solid ${assocDash.border}`,
  background: '#fff',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'inherit',
}

const deleteBtn: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  width: '100%',
  marginTop: 12,
  padding: '10px',
  borderRadius: 10,
  border: '1px solid #fecaca',
  background: '#fff',
  color: '#b91c1c',
  fontSize: 13,
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: 'inherit',
}

