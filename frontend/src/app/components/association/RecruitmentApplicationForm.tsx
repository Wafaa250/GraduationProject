import { useMemo, useState, type ChangeEvent } from 'react'
import { Loader2, Upload } from 'lucide-react'
import type { RecruitmentQuestion } from '../../../api/recruitmentCampaignsApi'
import { uploadRecruitmentApplicationFile, parseApiErrorMessage } from '../../../api/recruitmentApplicationsApi'
import { resolveApiFileUrl } from '../../../api/axiosInstance'
import {
  buildEmptyAnswerDrafts,
  defaultPlaceholder,
  fieldUsesOptions,
  normalizeFieldType,
  type ApplicationAnswerDraft,
} from '../../../utils/recruitmentFormFields'
import { assocDash } from '../../pages/association/dashboard/associationDashTokens'
import toast from 'react-hot-toast'

type Props = {
  organizationId: number
  campaignId: number
  questions: RecruitmentQuestion[]
  drafts: Record<number, ApplicationAnswerDraft>
  onChange: (drafts: Record<number, ApplicationAnswerDraft>) => void
  disabled?: boolean
}

export function RecruitmentApplicationForm({
  organizationId,
  campaignId,
  questions,
  drafts,
  onChange,
  disabled,
}: Props) {
  const sorted = useMemo(
    () => [...questions].sort((a, b) => a.displayOrder - b.displayOrder || a.id - b.id),
    [questions],
  )

  const patch = (questionId: number, patch: Partial<ApplicationAnswerDraft>) => {
    onChange({
      ...drafts,
      [questionId]: { ...drafts[questionId], ...patch, questionId },
    })
  }

  if (sorted.length === 0) {
    return (
      <p style={{ margin: 0, fontSize: 14, color: assocDash.muted }}>
        No application questions are configured for this role yet.
      </p>
    )
  }

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      {sorted.map((field, index) => (
        <FieldInput
          key={field.id}
          index={index + 1}
          total={sorted.length}
          field={field}
          draft={drafts[field.id] ?? buildEmptyAnswerDrafts([field])[field.id]}
          disabled={disabled}
          organizationId={organizationId}
          campaignId={campaignId}
          onPatch={(p) => patch(field.id, p)}
        />
      ))}
    </div>
  )
}

function FieldInput({
  field,
  draft,
  index,
  total,
  disabled,
  organizationId,
  campaignId,
  onPatch,
}: {
  field: RecruitmentQuestion
  draft: ApplicationAnswerDraft
  index: number
  total: number
  disabled?: boolean
  organizationId: number
  campaignId: number
  onPatch: (patch: Partial<ApplicationAnswerDraft>) => void
}) {
  const type = normalizeFieldType(field.questionType)
  const options = field.options?.filter((o) => o.trim()) ?? []
  const ph = field.placeholder?.trim() || defaultPlaceholder(type)
  const [uploading, setUploading] = useState(false)

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadRecruitmentApplicationFile(organizationId, campaignId, file)
      onPatch({ value: url })
      toast.success('File uploaded')
    } catch (err) {
      toast.error(parseApiErrorMessage(err))
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div style={fieldWrap}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
        <label style={labelStyle}>
          {field.questionTitle}
          {field.isRequired ? <span style={{ color: '#ef4444' }}> *</span> : null}
        </label>
        <span style={stepStyle}>
          {index} / {total}
        </span>
      </div>
      {field.helpText?.trim() ? <p style={helpStyle}>{field.helpText.trim()}</p> : null}
      {renderInput({
        type,
        ph,
        options,
        draft,
        disabled: disabled || uploading,
        uploading,
        onPatch,
        onFile: handleFile,
      })}
    </div>
  )
}

function renderInput(opts: {
  type: string
  ph: string
  options: string[]
  draft: ApplicationAnswerDraft
  disabled?: boolean
  uploading: boolean
  onPatch: (p: Partial<ApplicationAnswerDraft>) => void
  onFile: (e: ChangeEvent<HTMLInputElement>) => void
}) {
  const { type, ph, options, draft, disabled, uploading, onPatch, onFile } = opts
  const inputStyle = baseInput

  if (fieldUsesOptions(type) && type === 'CheckboxList') {
    return (
      <div style={{ display: 'grid', gap: 8 }}>
        {options.map((opt) => {
          const checked = draft.values.includes(opt)
          return (
            <label key={opt} style={choiceRow}>
              <input
                type="checkbox"
                checked={checked}
                disabled={disabled}
                onChange={() => {
                  const next = checked
                    ? draft.values.filter((v) => v !== opt)
                    : [...draft.values, opt]
                  onPatch({ values: next })
                }}
              />
              <span>{opt}</span>
            </label>
          )
        })}
      </div>
    )
  }

  if (type === 'Dropdown') {
    return (
      <select
        value={draft.value}
        disabled={disabled}
        onChange={(e) => onPatch({ value: e.target.value })}
        style={baseInput}
      >
        <option value="">{ph || 'Select an option'}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    )
  }

  if (fieldUsesOptions(type)) {
    return (
      <div style={{ display: 'grid', gap: 8 }}>
        {options.map((opt) => (
          <label key={opt} style={choiceRow}>
            <input
              type="radio"
              name={`q-${draft.questionId}`}
              checked={draft.value === opt}
              disabled={disabled}
              onChange={() => onPatch({ value: opt })}
            />
            <span>{opt}</span>
          </label>
        ))}
      </div>
    )
  }

  if (type === 'YesNo') {
    return (
      <div style={{ display: 'flex', gap: 12 }}>
        {['Yes', 'No'].map((opt) => (
          <label key={opt} style={choiceRow}>
            <input
              type="radio"
              name={`q-${draft.questionId}`}
              checked={draft.value === opt}
              disabled={disabled}
              onChange={() => onPatch({ value: opt })}
            />
            <span>{opt}</span>
          </label>
        ))}
      </div>
    )
  }

  if (type === 'Paragraph') {
    return (
      <textarea
        value={draft.value}
        disabled={disabled}
        placeholder={ph}
        rows={5}
        onChange={(e) => onPatch({ value: e.target.value })}
        style={{ ...inputStyle, minHeight: 120, resize: 'vertical' }}
      />
    )
  }

  if (type === 'FileUpload') {
    const fileUrl = draft.value?.trim()
    return (
      <div>
        <label style={fileLabel}>
          {uploading ? <Loader2 size={18} className="org-hub-spin" /> : <Upload size={18} />}
          <span>{uploading ? 'Uploading…' : 'Choose file'}</span>
          <input type="file" disabled={disabled} onChange={onFile} style={{ display: 'none' }} />
        </label>
        {fileUrl ? (
          <p style={{ margin: '10px 0 0', fontSize: 13, color: assocDash.accentDark }}>
            <a href={resolveApiFileUrl(fileUrl)} target="_blank" rel="noreferrer">
              View uploaded file
            </a>
          </p>
        ) : null}
      </div>
    )
  }

  const htmlType =
    type === 'Email' ? 'email' : type === 'Number' ? 'number' : type === 'Date' ? 'date' : type === 'Url' ? 'url' : 'text'

  return (
    <input
      type={htmlType}
      value={draft.value}
      disabled={disabled}
      placeholder={ph}
      onChange={(e) => onPatch({ value: e.target.value })}
      style={inputStyle}
    />
  )
}

const fieldWrap: React.CSSProperties = {
  padding: 16,
  borderRadius: 12,
  border: `1px solid ${assocDash.border}`,
  background: '#fff',
}

const labelStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  color: assocDash.text,
  lineHeight: 1.35,
}

const stepStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: assocDash.muted,
  flexShrink: 0,
}

const helpStyle: React.CSSProperties = {
  margin: '0 0 10px',
  fontSize: 13,
  color: assocDash.muted,
  lineHeight: 1.45,
}

const baseInput: React.CSSProperties = {
  width: '100%',
  padding: '11px 12px',
  borderRadius: 10,
  border: `1px solid ${assocDash.border}`,
  fontSize: 14,
  fontFamily: 'inherit',
  color: assocDash.text,
  boxSizing: 'border-box',
}

const choiceRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '10px 12px',
  borderRadius: 10,
  border: `1px solid ${assocDash.border}`,
  background: assocDash.bg,
  fontSize: 14,
  color: assocDash.text,
  cursor: 'pointer',
}

const fileLabel: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '12px 16px',
  borderRadius: 10,
  border: `1px dashed ${assocDash.accentBorder}`,
  background: assocDash.accentMuted,
  color: assocDash.accentDark,
  fontSize: 13,
  fontWeight: 700,
  cursor: 'pointer',
}
