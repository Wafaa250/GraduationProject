import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardList, Plus, Trash2 } from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'
import {
  listRecruitmentCampaignQuestions,
  type RecruitmentPositionInput,
} from '../../../api/recruitmentCampaignsApi'
import { countQuestionsForPosition } from '../../../utils/recruitmentFormFields'
import { assocCard, assocDash } from '../../pages/association/dashboard/associationDashTokens'
import { positionApplicationFormPath } from './PositionApplicationFormEditor'

export type PositionDraft = RecruitmentPositionInput & { _key: string }

export function newPositionDraft(order: number): PositionDraft {
  return {
    _key: `pos-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    roleTitle: '',
    neededCount: 1,
    description: '',
    requirements: '',
    requiredSkills: '',
    displayOrder: order,
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
    displayOrder: number
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
    displayOrder: p.displayOrder,
  }))
}

export function draftsToPayload(drafts: PositionDraft[]): RecruitmentPositionInput[] {
  return drafts.map((d, index) => ({
    id: d.id ?? undefined,
    roleTitle: d.roleTitle.trim(),
    neededCount: Number.isFinite(d.neededCount) && d.neededCount >= 1 ? d.neededCount : 1,
    description: d.description?.trim() || null,
    requirements: d.requirements?.trim() || null,
    requiredSkills: d.requiredSkills?.trim() || null,
    displayOrder: d.displayOrder ?? index,
  }))
}

type Props = {
  positions: PositionDraft[]
  onChange: (next: PositionDraft[]) => void
  disabled?: boolean
  campaignId?: number
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

export function RecruitmentPositionsEditor({
  positions,
  onChange,
  disabled,
  campaignId,
}: Props) {
  const [questionCounts, setQuestionCounts] = useState<Record<number, number>>({})

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

  const add = () => onChange([...positions, newPositionDraft(positions.length)])

  const update = (key: string, patch: Partial<PositionDraft>) => {
    onChange(positions.map((p) => (p._key === key ? { ...p, ...patch } : p)))
  }

  const remove = (key: string) => {
    if (positions.length <= 1) return
    onChange(positions.filter((p) => p._key !== key))
  }

  return (
    <div>
      <div style={{ display: 'grid', gap: 16 }}>
        <div>
          <h3
            style={{
              margin: '0 0 6px',
              fontSize: 16,
              fontWeight: 700,
              fontFamily: assocDash.fontDisplay,
              color: assocDash.text,
            }}
          >
            Required positions
          </h3>
          <p style={{ margin: 0, fontSize: 13, color: assocDash.muted, lineHeight: 1.5 }}>
            Define each role, then design a dedicated application form per position.
          </p>
        </div>

        {positions.map((pos, index) => (
          <div key={pos._key} style={{ ...assocCard, padding: 20, display: 'grid', gap: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: assocDash.accentDark }}>
                Position {index + 1}
              </span>
              {positions.length > 1 ? (
                <button
                  type="button"
                  onClick={() => remove(pos._key)}
                  disabled={disabled}
                  style={removeBtnStyle}
                >
                  <Trash2 size={14} />
                  Remove
                </button>
              ) : null}
            </div>
            <Field label="Role title" required>
              <input
                style={inputStyle}
                value={pos.roleTitle}
                onChange={(e) => update(pos._key, { roleTitle: e.target.value })}
                placeholder="e.g. Graphic Designer, Organizer"
                disabled={disabled}
              />
            </Field>
            <Field label="Needed count" required>
              <input
                style={inputStyle}
                type="number"
                min={1}
                value={String(pos.neededCount)}
                onChange={(e) =>
                  update(pos._key, {
                    neededCount: Math.max(1, parseInt(e.target.value, 10) || 1),
                  })
                }
                disabled={disabled}
              />
            </Field>
            <Field label="Description" optional>
              <textarea
                style={{ ...inputStyle, minHeight: 72, resize: 'vertical' }}
                value={pos.description ?? ''}
                onChange={(e) => update(pos._key, { description: e.target.value })}
                placeholder="What will this person do?"
                disabled={disabled}
              />
            </Field>
            <Field label="Requirements" optional>
              <textarea
                style={{ ...inputStyle, minHeight: 72, resize: 'vertical' }}
                value={pos.requirements ?? ''}
                onChange={(e) => update(pos._key, { requirements: e.target.value })}
                placeholder="Experience, availability, etc."
                disabled={disabled}
              />
            </Field>
            <Field label="Required skills" optional hint="Comma-separated">
              <input
                style={inputStyle}
                value={pos.requiredSkills ?? ''}
                onChange={(e) => update(pos._key, { requiredSkills: e.target.value })}
                placeholder="Canva, Photoshop, Creativity"
                disabled={disabled}
              />
            </Field>
            <Field label="Display order" optional>
              <input
                style={inputStyle}
                type="number"
                value={String(pos.displayOrder ?? index)}
                onChange={(e) =>
                  update(pos._key, { displayOrder: parseInt(e.target.value, 10) || index })
                }
                disabled={disabled}
              />
            </Field>

            {campaignId != null && pos.id != null ? (
              <PositionFormLink
                campaignId={campaignId}
                positionId={pos.id}
                questionCount={questionCounts[pos.id] ?? 0}
                disabled={disabled}
              />
            ) : campaignId != null ? (
              <p style={formHintStyle}>
                Save the campaign first, then return here to design this position&apos;s application
                form.
              </p>
            ) : null}
          </div>
        ))}

        <button type="button" onClick={add} disabled={disabled} style={addBtnStyle}>
          <Plus size={18} />
          Add position
        </button>
      </div>
    </div>
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
  children,
}: {
  label: string
  required?: boolean
  optional?: boolean
  hint?: string
  children: ReactNode
}) {
  return (
    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: assocDash.text }}>
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
    </label>
  )
}

const addBtnStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  padding: '12px 18px',
  borderRadius: assocDash.radiusMd,
  border: `1px dashed ${assocDash.accentBorder}`,
  background: assocDash.accentMuted,
  color: assocDash.accentDark,
  fontSize: 14,
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: 'inherit',
}

const removeBtnStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '6px 10px',
  borderRadius: 8,
  border: '1px solid #fecaca',
  background: '#fff',
  color: '#b91c1c',
  fontSize: 12,
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: 'inherit',
}

const formLinkWrap: CSSProperties = {
  marginTop: 4,
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

