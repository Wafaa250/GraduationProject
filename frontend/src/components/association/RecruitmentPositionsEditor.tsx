import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ClipboardList,
  Pencil,
  Plus,
  Trash2,
  Users,
} from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'
import {
  listRecruitmentCampaignQuestions,
  type RecruitmentPositionInput,
} from '@/api/recruitmentCampaignsApi'
import { countQuestionsForPosition } from '@/utils/recruitmentFormFields'
import { assocCard, assocDash } from '@/pages/association/dashboard/associationDashTokens'
import { positionApplicationFormPath } from './PositionApplicationFormEditor'

export type PositionDraft = RecruitmentPositionInput & { _key: string }

export function newPositionDraft(): PositionDraft {
  return {
    _key: `pos-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    roleTitle: '',
    neededCount: 1,
    description: '',
    requirements: '',
    requiredSkills: '',
  }
}

export function positionsFromCampaign(
  positions: Array<{
    id: number
    roleTitle: string
    neededCount: number
    description?: string | null
    requirements?: string | null
    requiredSkills?: string | null
  }>,
): PositionDraft[] {
  return positions.map((p) => ({
    _key: `pos-${p.id}`,
    id: p.id,
    roleTitle: p.roleTitle,
    neededCount: p.neededCount,
    description: p.description ?? '',
    requirements: p.requirements ?? '',
    requiredSkills: p.requiredSkills ?? '',
  }))
}

export function draftsToPayload(drafts: PositionDraft[]): RecruitmentPositionInput[] {
  return drafts.map((d) => ({
    id: d.id ?? undefined,
    roleTitle: d.roleTitle.trim(),
    neededCount: Number.isFinite(d.neededCount) && d.neededCount >= 1 ? d.neededCount : 1,
    description: d.description?.trim() || null,
    requirements: d.requirements?.trim() || null,
    requiredSkills: d.requiredSkills?.trim() || null,
  }))
}

type Props = {
  positions: PositionDraft[]
  onChange: (next: PositionDraft[]) => void
  disabled?: boolean
  campaignId?: number
  positionErrors?: Record<string, string>
}

function parseSkills(value?: string | null): string[] {
  if (!value?.trim()) return []
  return value.split(',').map((s) => s.trim()).filter(Boolean)
}

export function RecruitmentPositionsEditor({
  positions,
  onChange,
  disabled,
  campaignId,
  positionErrors = {},
}: Props) {
  const [questionCounts, setQuestionCounts] = useState<Record<number, number>>({})
  const [editingKey, setEditingKey] = useState<string | null>(() => {
    const first = positions[0]
    return first && !first.roleTitle.trim() ? first._key : null
  })

  useEffect(() => {
    if (campaignId == null) return
    let cancelled = false
    void listRecruitmentCampaignQuestions(campaignId).then((questions) => {
      if (cancelled) return
      const counts: Record<number, number> = {}
      for (const pos of positions) {
        if (pos.id != null) counts[pos.id] = countQuestionsForPosition(questions, pos.id)
      }
      setQuestionCounts(counts)
    })
    return () => {
      cancelled = true
    }
  }, [campaignId, positions])

  const add = () => {
    const draft = newPositionDraft()
    onChange([...positions, draft])
    setEditingKey(draft._key)
  }

  const update = (key: string, patch: Partial<PositionDraft>) => {
    onChange(positions.map((p) => (p._key === key ? { ...p, ...patch } : p)))
  }

  const remove = (key: string) => {
    if (positions.length <= 1) return
    onChange(positions.filter((p) => p._key !== key))
    if (editingKey === key) setEditingKey(null)
  }

  const isEditing = (pos: PositionDraft) =>
    editingKey === pos._key || !pos.roleTitle.trim()

  return (
    <div className="open-positions-editor">
      <div className="open-positions-list">
        {positions.map((pos, index) => {
          const editing = isEditing(pos)
          const titleError = positionErrors[`positions.${index}.roleTitle`]
          const skills = parseSkills(pos.requiredSkills)

          return (
            <article
              key={pos._key}
              className={`open-position-card${editing ? ' open-position-card--editing' : ''}`}
              style={assocCard}
            >
              {editing ? (
                <PositionEditForm
                  pos={pos}
                  index={index}
                  titleError={titleError}
                  disabled={disabled}
                  canRemove={positions.length > 1}
                  campaignId={campaignId}
                  questionCount={pos.id != null ? questionCounts[pos.id] ?? 0 : 0}
                  onUpdate={(patch) => update(pos._key, patch)}
                  onRemove={() => remove(pos._key)}
                  onDone={() => {
                    if (pos.roleTitle.trim()) setEditingKey(null)
                  }}
                />
              ) : (
                <PositionSummaryCard
                  pos={pos}
                  skills={skills}
                  disabled={disabled}
                  canRemove={positions.length > 1}
                  campaignId={campaignId}
                  questionCount={pos.id != null ? questionCounts[pos.id] ?? 0 : 0}
                  onEdit={() => setEditingKey(pos._key)}
                  onRemove={() => remove(pos._key)}
                />
              )}
            </article>
          )
        })}

        <button
          type="button"
          onClick={add}
          disabled={disabled}
          className="open-position-add"
        >
          <span className="open-position-add-icon" aria-hidden>
            <Plus size={20} strokeWidth={2} />
          </span>
          <span className="open-position-add-copy">
            <strong>Add open position</strong>
            <small>Design Lead, Event Coordinator, Media Team Member…</small>
          </span>
        </button>
      </div>

      <EditorStyles />
    </div>
  )
}

function PositionSummaryCard({
  pos,
  skills,
  disabled,
  canRemove,
  campaignId,
  questionCount,
  onEdit,
  onRemove,
}: {
  pos: PositionDraft
  skills: string[]
  disabled?: boolean
  canRemove: boolean
  campaignId?: number
  questionCount: number
  onEdit: () => void
  onRemove: () => void
}) {
  return (
    <>
      <div className="open-position-card-top">
        <div className="open-position-card-title-row">
          <h3 className="open-position-card-title">{pos.roleTitle}</h3>
          <span className="open-position-openings">
            <Users size={14} strokeWidth={2} aria-hidden />
            {pos.neededCount} opening{pos.neededCount === 1 ? '' : 's'}
          </span>
        </div>
        <div className="open-position-card-actions">
          <button type="button" onClick={onEdit} disabled={disabled} className="open-position-action open-position-action--edit">
            <Pencil size={14} strokeWidth={2} />
            Edit
          </button>
          {canRemove ? (
            <button type="button" onClick={onRemove} disabled={disabled} className="open-position-action open-position-action--delete">
              <Trash2 size={14} strokeWidth={2} />
              Delete
            </button>
          ) : null}
        </div>
      </div>

      <div className="open-position-card-body">
        {pos.description?.trim() ? (
          <div className="open-position-field-block">
            <span className="open-position-field-label">Responsibilities</span>
            <p className="open-position-field-value">{pos.description}</p>
          </div>
        ) : null}
        {pos.requirements?.trim() ? (
          <div className="open-position-field-block">
            <span className="open-position-field-label">Requirements</span>
            <p className="open-position-field-value">{pos.requirements}</p>
          </div>
        ) : null}
        {skills.length > 0 ? (
          <div className="open-position-field-block">
            <span className="open-position-field-label">Skills</span>
            <div className="open-position-skills">
              {skills.map((s) => (
                <span key={s} className="open-position-skill-chip">{s}</span>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {campaignId != null && pos.id != null ? (
        <PositionFormLink
          campaignId={campaignId}
          positionId={pos.id}
          questionCount={questionCount}
          disabled={disabled}
        />
      ) : null}
    </>
  )
}

function PositionEditForm({
  pos,
  index,
  titleError,
  disabled,
  canRemove,
  campaignId,
  questionCount,
  onUpdate,
  onRemove,
  onDone,
}: {
  pos: PositionDraft
  index: number
  titleError?: string
  disabled?: boolean
  canRemove: boolean
  campaignId?: number
  questionCount: number
  onUpdate: (patch: Partial<PositionDraft>) => void
  onRemove: () => void
  onDone: () => void
}) {
  return (
    <>
      <div className="open-position-edit-header">
        <span className="open-position-edit-badge">Position {index + 1}</span>
        <div className="open-position-card-actions">
          {pos.roleTitle.trim() ? (
            <button type="button" onClick={onDone} disabled={disabled} className="open-position-action open-position-action--edit">
              Done
            </button>
          ) : null}
          {canRemove ? (
            <button type="button" onClick={onRemove} disabled={disabled} className="open-position-action open-position-action--delete">
              <Trash2 size={14} strokeWidth={2} />
              Delete
            </button>
          ) : null}
        </div>
      </div>

      <div className="open-position-edit-grid">
        <Field label="Position title" required error={titleError}>
          <input
            style={inputStyle}
            value={pos.roleTitle}
            onChange={(e) => onUpdate({ roleTitle: e.target.value })}
            placeholder="e.g. Design Lead, Media Team Member"
            disabled={disabled}
          />
        </Field>
        <Field label="Openings" required>
          <input
            style={inputStyle}
            type="number"
            min={1}
            value={String(pos.neededCount)}
            onChange={(e) =>
              onUpdate({ neededCount: Math.max(1, parseInt(e.target.value, 10) || 1) })
            }
            disabled={disabled}
          />
        </Field>
        <Field label="Responsibilities" optional className="open-position-edit-span-2">
          <textarea
            style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
            value={pos.description ?? ''}
            onChange={(e) => onUpdate({ description: e.target.value })}
            placeholder="What will this team member do?"
            disabled={disabled}
          />
        </Field>
        <Field label="Requirements" optional className="open-position-edit-span-2">
          <textarea
            style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
            value={pos.requirements ?? ''}
            onChange={(e) => onUpdate({ requirements: e.target.value })}
            placeholder="Experience, availability, year level, etc."
            disabled={disabled}
          />
        </Field>
        <Field label="Skills" optional hint="Comma-separated" className="open-position-edit-span-2">
          <input
            style={inputStyle}
            value={pos.requiredSkills ?? ''}
            onChange={(e) => onUpdate({ requiredSkills: e.target.value })}
            placeholder="Canva, public speaking, event planning"
            disabled={disabled}
          />
        </Field>
      </div>

      {campaignId != null && pos.id != null ? (
        <PositionFormLink
          campaignId={campaignId}
          positionId={pos.id}
          questionCount={questionCount}
          disabled={disabled}
        />
      ) : campaignId != null ? (
        <p style={formHintStyle}>
          Save the opportunity first, then return here to design this position&apos;s application form.
        </p>
      ) : null}
    </>
  )
}

function PositionFormLink({
  campaignId,
  positionId,
  questionCount,
  disabled,
}: {
  campaignId: number
  positionId: number
  questionCount: number
  disabled?: boolean
}) {
  const hasForm = questionCount > 0
  const label = hasForm ? 'Edit application form' : 'Create application form'
  const meta = hasForm
    ? `${questionCount} question${questionCount === 1 ? '' : 's'}`
    : 'No questions yet'

  if (disabled) {
    return (
      <div style={formLinkWrap}>
        <span style={{ ...formLinkBtn, opacity: 0.6, cursor: 'not-allowed' }}>
          <ClipboardList size={18} />
          {label}
        </span>
        <span style={formLinkMeta}>{meta}</span>
      </div>
    )
  }

  return (
    <div style={formLinkWrap}>
      <Link to={positionApplicationFormPath(campaignId, positionId)} style={formLinkBtn}>
        <ClipboardList size={18} />
        {label}
      </Link>
      <span style={formLinkMeta}>{meta}</span>
    </div>
  )
}

function Field({
  label,
  required,
  optional,
  hint,
  error,
  className,
  children,
}: {
  label: string
  required?: boolean
  optional?: boolean
  hint?: string
  error?: string
  className?: string
  children: ReactNode
}) {
  return (
    <label className={className} style={{ display: 'block', fontSize: 13, fontWeight: 600, color: assocDash.text }}>
      {label}
      {required ? <span style={{ color: '#ef4444' }}> *</span> : null}
      {optional ? <span style={{ fontWeight: 400, color: assocDash.muted }}> (optional)</span> : null}
      {hint ? (
        <span style={{ display: 'block', fontWeight: 400, color: assocDash.muted, fontSize: 11 }}>
          {hint}
        </span>
      ) : null}
      <div style={{ height: 8 }} />
      {children}
      {error ? <span style={errStyle}>{error}</span> : null}
    </label>
  )
}

function EditorStyles() {
  return (
    <style>{`
      .open-positions-list {
        display: flex;
        flex-direction: column;
        gap: 14px;
      }

      .open-position-card {
        padding: 20px 22px;
        transition: box-shadow 0.15s ease, border-color 0.15s ease;
      }

      .open-position-card--editing {
        border-color: ${assocDash.accentBorder};
        box-shadow: 0 4px 20px rgba(245, 158, 11, 0.08);
      }

      .open-position-card-top {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
        margin-bottom: 14px;
      }

      .open-position-card-title-row {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 10px;
        min-width: 0;
      }

      .open-position-card-title {
        margin: 0;
        font-size: 17px;
        font-weight: 800;
        font-family: ${assocDash.fontDisplay};
        color: ${assocDash.text};
        letter-spacing: -0.01em;
      }

      .open-position-openings {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        font-size: 12px;
        font-weight: 700;
        padding: 5px 10px;
        border-radius: 999px;
        background: ${assocDash.accentMuted};
        border: 1px solid ${assocDash.accentBorder};
        color: ${assocDash.accentDark};
      }

      .open-position-card-actions {
        display: flex;
        gap: 8px;
        flex-shrink: 0;
      }

      .open-position-action {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        padding: 7px 12px;
        border-radius: 8px;
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
        font-family: inherit;
        border: 1px solid transparent;
        transition: background 0.15s ease;
      }

      .open-position-action--edit {
        border-color: ${assocDash.border};
        background: ${assocDash.surface};
        color: ${assocDash.text};
      }

      .open-position-action--edit:hover:not(:disabled) {
        background: ${assocDash.bg};
      }

      .open-position-action--delete {
        border-color: #fecaca;
        background: #fff;
        color: #b91c1c;
      }

      .open-position-action--delete:hover:not(:disabled) {
        background: #fef2f2;
      }

      .open-position-action:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .open-position-card-body {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .open-position-field-block {
        padding: 12px 14px;
        border-radius: 10px;
        background: ${assocDash.bg};
        border: 1px solid ${assocDash.border};
      }

      .open-position-field-label {
        display: block;
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: ${assocDash.subtle};
        margin-bottom: 6px;
      }

      .open-position-field-value {
        margin: 0;
        font-size: 14px;
        line-height: 1.55;
        color: ${assocDash.textSecondary};
        white-space: pre-wrap;
      }

      .open-position-skills {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }

      .open-position-skill-chip {
        font-size: 12px;
        font-weight: 600;
        padding: 4px 10px;
        border-radius: 8px;
        background: ${assocDash.surface};
        border: 1px solid ${assocDash.accentBorder};
        color: ${assocDash.accentDark};
      }

      .open-position-edit-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 16px;
      }

      .open-position-edit-badge {
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        color: ${assocDash.accentDark};
        padding: 5px 10px;
        border-radius: 8px;
        background: ${assocDash.accentMuted};
        border: 1px solid ${assocDash.accentBorder};
      }

      .open-position-edit-grid {
        display: grid;
        grid-template-columns: 1fr 120px;
        gap: 14px;
      }

      .open-position-edit-span-2 {
        grid-column: 1 / -1;
      }

      .open-position-add {
        display: flex;
        align-items: center;
        gap: 14px;
        width: 100%;
        padding: 18px 20px;
        border-radius: ${assocDash.radiusLg}px;
        border: 2px dashed ${assocDash.accentBorder};
        background: linear-gradient(135deg, ${assocDash.accentMuted} 0%, #fff 100%);
        cursor: pointer;
        font-family: inherit;
        text-align: left;
        transition: border-color 0.15s ease, background 0.15s ease;
      }

      .open-position-add:hover:not(:disabled) {
        border-color: ${assocDash.accent};
        background: ${assocDash.accentMuted};
      }

      .open-position-add:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .open-position-add-icon {
        width: 44px;
        height: 44px;
        border-radius: 12px;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: ${assocDash.surface};
        border: 1px solid ${assocDash.accentBorder};
        color: ${assocDash.accentDark};
      }

      .open-position-add-copy strong {
        display: block;
        font-size: 14px;
        font-weight: 700;
        color: ${assocDash.accentDark};
        margin-bottom: 2px;
      }

      .open-position-add-copy small {
        display: block;
        font-size: 12px;
        color: ${assocDash.muted};
      }

      @media (max-width: 560px) {
        .open-position-edit-grid {
          grid-template-columns: 1fr;
        }
        .open-position-card-top {
          flex-direction: column;
        }
      }
    `}</style>
  )
}

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 10,
  border: `1.5px solid ${assocDash.border}`,
  fontSize: 14,
  fontFamily: 'inherit',
  boxSizing: 'border-box',
}

const errStyle: CSSProperties = { display: 'block', marginTop: 4, fontSize: 12, color: '#b91c1c' }

const formLinkWrap: CSSProperties = {
  marginTop: 16,
  paddingTop: 14,
  borderTop: `1px dashed ${assocDash.border}`,
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
}

const formLinkBtn: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  padding: '11px 16px',
  borderRadius: assocDash.radiusMd,
  border: `1px solid ${assocDash.accentBorder}`,
  background: assocDash.accentMuted,
  color: assocDash.accentDark,
  fontSize: 14,
  fontWeight: 700,
  textDecoration: 'none',
  fontFamily: 'inherit',
}

const formLinkMeta: CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: assocDash.muted,
}

const formHintStyle: CSSProperties = {
  margin: '4px 0 0',
  paddingTop: 12,
  borderTop: `1px dashed ${assocDash.border}`,
  fontSize: 12,
  color: assocDash.muted,
  lineHeight: 1.5,
}
