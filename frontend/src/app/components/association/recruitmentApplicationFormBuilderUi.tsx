import type { CSSProperties, ReactNode } from 'react'
import { ChevronDown, ChevronUp, GripVertical, Pencil, Trash2 } from 'lucide-react'
import {
  FORM_FIELD_TYPES,
  defaultPlaceholder,
  fieldAppliesToLabel,
  fieldTypeLabel,
  fieldUsesOptions,
  getApplyScope,
  normalizeFieldType,
  type FormFieldDraft,
  type PositionOption,
} from '../../../utils/recruitmentFormFields'
import { assocDash } from '../../pages/association/dashboard/associationDashTokens'

export type FormFieldSummary = FormFieldDraft & {
  questionTitle: string
  questionType: string
  isRequired: boolean
  helpText?: string | null
}

export function FormBuilderSection({
  id,
  embedded,
  compact,
  title = 'Application form',
  subtitle,
  children,
  headerExtra,
}: {
  id?: string
  embedded?: boolean
  compact?: boolean
  title?: string
  subtitle?: string
  children: ReactNode
  headerExtra?: ReactNode
}) {
  return (
    <section id={id} style={embedded ? embeddedSection : compact ? compactSection : section}>
      <SectionHeadRow compact={compact}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={compact ? compactTitle : embedded ? embeddedTitle : titleStyle}>{title}</h2>
          <p style={sub}>
            {subtitle ??
              (compact
                ? 'Design fields for this role. Applicants also see shared campaign fields when they apply.'
                : 'Build your application form—add fields, reorder them, and target each to the whole campaign or a specific position.')}
          </p>
        </div>
        {headerExtra}
      </SectionHeadRow>
      <FieldStack>{children}</FieldStack>
    </section>
  )
}

function SectionHeadRow({ compact, children }: { compact?: boolean; children: ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: compact ? 12 : 16,
        marginBottom: compact ? 16 : 20,
        alignItems: 'flex-start',
      }}
    >
      {children}
    </div>
  )
}

function FieldStack({ children }: { children: ReactNode }) {
  return <div style={fieldStack}>{children}</div>
}

export function FieldSummaryCard({
  field,
  index,
  total,
  positions,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  disabled,
  deleting,
}: {
  field: FormFieldSummary
  index: number
  total: number
  positions: PositionOption[]
  onEdit: () => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  disabled?: boolean
  deleting?: boolean
}) {
  const type = fieldTypeLabel(field.questionType)
  const appliesTo = fieldAppliesToLabel(field, positions)

  return (
    <div style={summaryCard}>
      <div style={gripCol}>
        <GripVertical size={18} color={assocDash.muted} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={summaryTitle}>{field.questionTitle}</p>
        <p style={summaryMeta}>
          {type}
          <span style={metaDot}>·</span>
          {field.isRequired ? 'Required' : 'Optional'}
        </p>
        <p style={appliesRow}>
          <span style={appliesLabel}>Applies to:</span> {appliesTo}
        </p>
        {field.helpText?.trim() ? <p style={summaryHelp}>{field.helpText.trim()}</p> : null}
        <FieldPreviewSnippet field={field} />
      </div>
      <div style={summaryActions}>
        <ActionBtn onClick={onEdit} disabled={disabled} icon={<Pencil size={14} />}>
          Edit
        </ActionBtn>
        <ActionBtn onClick={onDelete} disabled={disabled || deleting} danger icon={<Trash2 size={14} />}>
          {deleting ? '…' : 'Delete'}
        </ActionBtn>
        <ActionBtn onClick={onMoveUp} disabled={disabled || index === 0} icon={<ChevronUp size={14} />}>
          Up
        </ActionBtn>
        <ActionBtn onClick={onMoveDown} disabled={disabled || index >= total - 1} icon={<ChevronDown size={14} />}>
          Down
        </ActionBtn>
      </div>
    </div>
  )
}

function FieldPreviewSnippet({ field }: { field: FormFieldSummary }) {
  const type = normalizeFieldType(field.questionType)
  const ph = field.placeholder?.trim() || defaultPlaceholder(type)
  const options = field.options?.filter((o) => o.trim()) ?? []

  return (
    <div style={previewSnippet}>
      {type === 'Paragraph' ? (
        <PreviewBox tall>{ph}</PreviewBox>
      ) : type === 'MultipleChoice' || type === 'CheckboxList' ? (
        <div style={{ display: 'grid', gap: 6 }}>
          {(options.length ? options : ['Option 1', 'Option 2']).slice(0, 3).map((opt) => (
            <div key={opt} style={previewChoiceRow}>
              <span style={type === 'CheckboxList' ? previewCheckbox : previewRadio} />
              <span style={{ fontSize: 12, color: assocDash.subtle }}>{opt}</span>
            </div>
          ))}
        </div>
      ) : type === 'YesNo' ? (
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={previewChoiceRow}>
            <span style={previewRadio} />
            <span style={{ fontSize: 12, color: assocDash.subtle }}>Yes</span>
          </div>
          <div style={previewChoiceRow}>
            <span style={previewRadio} />
            <span style={{ fontSize: 12, color: assocDash.subtle }}>No</span>
          </div>
        </div>
      ) : type === 'FileUpload' ? (
        <PreviewBox dashed>File upload</PreviewBox>
      ) : (
        <PreviewBox>{ph}</PreviewBox>
      )}
    </div>
  )
}

function PreviewBox({
  children,
  tall,
  dashed,
}: {
  children: ReactNode
  tall?: boolean
  dashed?: boolean
}) {
  return (
    <div
      style={{
        ...previewControl,
        minHeight: tall ? 56 : 36,
        borderStyle: dashed ? 'dashed' : 'solid',
      }}
    >
      {children}
    </div>
  )
}

export function ActionBtn({
  children,
  onClick,
  disabled,
  danger,
  icon,
}: {
  children: ReactNode
  onClick: () => void
  disabled?: boolean
  danger?: boolean
  icon?: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '7px 11px',
        borderRadius: 8,
        border: `1px solid ${danger ? '#fecaca' : assocDash.border}`,
        background: '#fff',
        fontSize: 12,
        fontWeight: 700,
        color: danger ? '#b91c1c' : assocDash.accentDark,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        fontFamily: 'inherit',
      }}
    >
      {icon}
      {children}
    </button>
  )
}

export function FieldEditor({
  draft,
  onChange,
  onSave,
  onCancel,
  saving,
  title,
  isNew,
  positions,
  lockScope,
}: {
  draft: FormFieldDraft
  onChange: (patch: Partial<FormFieldDraft>) => void
  onSave: () => void
  onCancel: () => void
  saving?: boolean
  title: string
  isNew?: boolean
  positions: PositionOption[]
  lockScope?: boolean
}) {
  const usesOptions = fieldUsesOptions(draft.questionType)
  const scope = getApplyScope(draft)
  const selectedPositionKey =
    draft.positionKey ??
    (draft.positionId != null
      ? positions.find((p) => p.id === draft.positionId)?.key ?? ''
      : positions[0]?.key ?? '')

  const setScope = (next: 'campaign' | 'position') => {
    if (next === 'campaign') {
      onChange({ positionId: null, positionKey: null })
      return
    }
    const first = positions[0]
    if (!first) return
    onChange({
      positionId: first.id ?? null,
      positionKey: first.id == null ? first.key : null,
    })
  }

  return (
    <div style={editorCard}>
      <p style={editorTitle}>{title}</p>

      <Field label="Field label" required>
        <input
          style={input}
          value={draft.questionTitle}
          onChange={(e) => onChange({ questionTitle: e.target.value })}
          placeholder="e.g. Why do you want to join?"
          disabled={saving}
        />
      </Field>

      <Field label="Field type" required>
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
          {FORM_FIELD_TYPES.map((t) => (
            <option key={t} value={t}>
              {fieldTypeLabel(t)}
            </option>
          ))}
        </select>
      </Field>

      {!lockScope ? (
        <Field label="Apply this field to" required>
          <select
            style={input}
            value={scope}
            onChange={(e) => setScope(e.target.value as 'campaign' | 'position')}
            disabled={saving || positions.length === 0}
          >
            <option value="campaign">Entire campaign (shared form)</option>
            <option value="position">Specific position</option>
          </select>
        </Field>
      ) : null}

      {scope === 'position' && !lockScope ? (
        <Field label="Position" required>
          <select
            style={input}
            value={selectedPositionKey}
            onChange={(e) => {
              const pos = positions.find((p) => p.key === e.target.value)
              if (!pos) return
              onChange({
                positionId: pos.id ?? null,
                positionKey: pos.id == null ? pos.key : null,
              })
            }}
            disabled={saving}
          >
            {positions.map((p) => (
              <option key={p.key} value={p.key}>
                {p.roleTitle.trim() || 'Untitled position'}
              </option>
            ))}
          </select>
        </Field>
      ) : null}

      {lockScope ? (
        <p style={lockedScopeNote}>
          Applies to: <strong>{fieldAppliesToLabel(draft, positions)}</strong>
        </p>
      ) : null}

      <Field label="Description / help text" optional>
        <textarea
          style={{ ...input, minHeight: 72 }}
          value={draft.helpText}
          onChange={(e) => onChange({ helpText: e.target.value })}
          placeholder="Optional guidance shown below the label"
          disabled={saving}
        />
      </Field>

      <Field label="Placeholder" optional>
        <input
          style={input}
          value={draft.placeholder}
          onChange={(e) => onChange({ placeholder: e.target.value })}
          placeholder="Hint text inside the field"
          disabled={saving}
        />
      </Field>

      <label style={toggleRow}>
        <input
          type="checkbox"
          checked={draft.isRequired}
          onChange={(e) => onChange({ isRequired: e.target.checked })}
          disabled={saving}
        />
        <span>Required field</span>
      </label>

      {usesOptions ? (
        <div>
          <p style={optionsHead}>Options</p>
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
                placeholder={`Option ${i + 1}`}
                disabled={saving}
              />
              <button
                type="button"
                disabled={saving || draft.options.length <= 2}
                onClick={() => {
                  if (i > 0) {
                    const next = [...draft.options]
                    ;[next[i - 1], next[i]] = [next[i], next[i - 1]]
                    onChange({ options: next })
                  }
                }}
                style={optMove}
                title="Move up"
              >
                ↑
              </button>
              <button
                type="button"
                disabled={saving || draft.options.length <= 2}
                onClick={() => {
                  if (i < draft.options.length - 1) {
                    const next = [...draft.options]
                    ;[next[i], next[i + 1]] = [next[i + 1], next[i]]
                    onChange({ options: next })
                  }
                }}
                style={optMove}
                title="Move down"
              >
                ↓
              </button>
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
            style={addOpt}
            onClick={() => onChange({ options: [...draft.options, ''] })}
            disabled={saving}
          >
            + Add option
          </button>
        </div>
      ) : null}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 16 }}>
        <button type="button" onClick={onSave} disabled={saving} style={saveBtn}>
          {saving ? 'Saving…' : isNew ? 'Add field' : 'Save field'}
        </button>
        <button type="button" onClick={onCancel} disabled={saving} style={cancelBtn}>
          Cancel
        </button>
      </div>
    </div>
  )
}

function Field({
  label,
  required,
  optional,
  children,
}: {
  label: string
  required?: boolean
  optional?: boolean
  children: ReactNode
}) {
  return (
    <label style={{ display: 'block', marginBottom: 14 }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: assocDash.text }}>
        {label}
        {required ? <span style={{ color: '#ef4444' }}> *</span> : null}
        {optional ? <span style={{ fontWeight: 400, color: assocDash.muted }}> (optional)</span> : null}
      </span>
      <div style={{ height: 8 }} />
      {children}
    </label>
  )
}

export const section: CSSProperties = {
  padding: 28,
  marginTop: 24,
  borderRadius: 16,
  border: `1px solid ${assocDash.accentBorder}`,
  background: `linear-gradient(180deg, ${assocDash.accentMuted} 0%, #fff 140px)`,
}

export const compactSection: CSSProperties = {
  marginTop: 16,
  padding: 18,
  borderRadius: 14,
  border: `1px solid ${assocDash.border}`,
  backgroundColor: assocDash.bg,
}

export const embeddedSection: CSSProperties = {
  marginTop: 4,
  paddingTop: 24,
  borderTop: `2px solid ${assocDash.accentBorder}`,
  gridColumn: '1 / -1',
}

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: 20,
  fontWeight: 800,
  fontFamily: assocDash.fontDisplay,
  color: assocDash.text,
}

const embeddedTitle: CSSProperties = {
  margin: 0,
  fontSize: 17,
  fontWeight: 800,
  fontFamily: assocDash.fontDisplay,
  color: assocDash.text,
}

const compactTitle: CSSProperties = {
  margin: 0,
  fontSize: 15,
  fontWeight: 800,
  fontFamily: assocDash.fontDisplay,
  color: assocDash.text,
}

const sub: CSSProperties = {
  margin: '8px 0 0',
  fontSize: 14,
  color: assocDash.muted,
  lineHeight: 1.55,
  maxWidth: 640,
}

const fieldStack: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
}

export const addFieldBtn: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '11px 16px',
  borderRadius: assocDash.radiusMd,
  border: 'none',
  background: assocDash.gradient,
  color: '#fff',
  fontSize: 14,
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: 'inherit',
  flexShrink: 0,
}

export const empty: CSSProperties = {
  textAlign: 'center',
  padding: '36px 24px',
  borderRadius: 14,
  border: `2px dashed ${assocDash.accentBorder}`,
  backgroundColor: '#fff',
  marginBottom: 8,
}

export const emptyTitle: CSSProperties = { margin: '0 0 8px', fontSize: 17, fontWeight: 800, color: assocDash.text }
export const emptySub: CSSProperties = {
  margin: '0 0 20px',
  fontSize: 14,
  color: assocDash.muted,
  lineHeight: 1.5,
  maxWidth: 420,
  marginInline: 'auto',
}

const summaryCard: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 12,
  alignItems: 'flex-start',
  padding: '20px 20px 20px 12px',
  borderRadius: 14,
  border: `1px solid ${assocDash.border}`,
  backgroundColor: '#fff',
  marginBottom: 12,
  boxShadow: '0 2px 8px rgba(15,23,42,0.05)',
}

const gripCol: CSSProperties = {
  paddingTop: 4,
  paddingLeft: 4,
  opacity: 0.45,
  flexShrink: 0,
}

const summaryTitle: CSSProperties = {
  margin: 0,
  fontSize: 16,
  fontWeight: 800,
  color: assocDash.text,
  lineHeight: 1.35,
}

const summaryMeta: CSSProperties = {
  margin: '6px 0 0',
  fontSize: 13,
  fontWeight: 600,
  color: assocDash.accentDark,
}

const metaDot: CSSProperties = { margin: '0 6px', opacity: 0.5 }

const appliesRow: CSSProperties = {
  margin: '8px 0 0',
  fontSize: 12,
  fontWeight: 600,
  color: assocDash.muted,
}

const appliesLabel: CSSProperties = {
  fontWeight: 800,
  color: assocDash.subtle,
  textTransform: 'uppercase',
  letterSpacing: 0.3,
  fontSize: 10,
  marginRight: 6,
}

const summaryHelp: CSSProperties = {
  margin: '8px 0 0',
  fontSize: 13,
  color: assocDash.muted,
  lineHeight: 1.4,
}

const previewSnippet: CSSProperties = {
  marginTop: 12,
  paddingTop: 12,
  borderTop: `1px solid ${assocDash.border}`,
}

const previewControl: CSSProperties = {
  padding: '8px 12px',
  borderRadius: 8,
  border: `1px solid ${assocDash.border}`,
  backgroundColor: assocDash.bg,
  fontSize: 12,
  color: assocDash.subtle,
  lineHeight: 1.4,
}

const previewChoiceRow: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '6px 10px',
  borderRadius: 8,
  border: `1px solid ${assocDash.border}`,
  backgroundColor: '#fff',
}

const previewRadio: CSSProperties = {
  width: 14,
  height: 14,
  borderRadius: 7,
  border: `2px solid ${assocDash.border}`,
  flexShrink: 0,
}

const previewCheckbox: CSSProperties = {
  width: 14,
  height: 14,
  borderRadius: 3,
  border: `2px solid ${assocDash.border}`,
  flexShrink: 0,
}

const summaryActions: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
  alignItems: 'center',
  width: '100%',
  justifyContent: 'flex-end',
  marginTop: 4,
}

const editorCard: CSSProperties = {
  padding: 22,
  borderRadius: 14,
  border: `2px solid ${assocDash.accentBorder}`,
  backgroundColor: '#fff',
  marginBottom: 12,
  boxShadow: '0 4px 16px rgba(99,102,241,0.08)',
}

const editorTitle: CSSProperties = {
  margin: '0 0 18px',
  fontSize: 13,
  fontWeight: 800,
  color: assocDash.accentDark,
  textTransform: 'uppercase',
  letterSpacing: 0.5,
}

const lockedScopeNote: CSSProperties = {
  margin: '0 0 14px',
  padding: '10px 12px',
  borderRadius: 10,
  backgroundColor: assocDash.accentMuted,
  fontSize: 13,
  color: assocDash.text,
  lineHeight: 1.45,
}

const input: CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 10,
  border: `1.5px solid ${assocDash.border}`,
  fontSize: 14,
  fontFamily: 'inherit',
  boxSizing: 'border-box',
}

const toggleRow: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  fontSize: 14,
  fontWeight: 600,
  marginBottom: 14,
}

const optionsHead: CSSProperties = {
  margin: '0 0 10px',
  fontSize: 13,
  fontWeight: 700,
  color: assocDash.text,
}

const optionRow: CSSProperties = {
  display: 'flex',
  gap: 8,
  marginBottom: 8,
  alignItems: 'center',
}

const optNum: CSSProperties = {
  width: 22,
  fontSize: 12,
  fontWeight: 800,
  color: assocDash.muted,
  textAlign: 'center',
}

const optMove: CSSProperties = {
  padding: '6px 8px',
  borderRadius: 6,
  border: `1px solid ${assocDash.border}`,
  background: '#fff',
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: 12,
}

const optRemove: CSSProperties = {
  padding: '6px 10px',
  borderRadius: 6,
  border: '1px solid #fecaca',
  background: '#fff',
  color: '#b91c1c',
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: 'inherit',
}

const addOpt: CSSProperties = {
  padding: '8px 12px',
  borderRadius: 8,
  border: `1px dashed ${assocDash.border}`,
  background: assocDash.bg,
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'inherit',
}

const saveBtn: CSSProperties = {
  padding: '10px 18px',
  borderRadius: assocDash.radiusMd,
  border: 'none',
  background: assocDash.gradient,
  color: '#fff',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'inherit',
}

const cancelBtn: CSSProperties = {
  padding: '10px 18px',
  borderRadius: assocDash.radiusMd,
  border: `1px solid ${assocDash.border}`,
  background: '#fff',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'inherit',
}
