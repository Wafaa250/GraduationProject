import type { CSSProperties, ReactNode } from 'react'
import { Upload } from 'lucide-react'
import type { RecruitmentQuestion } from '../../../api/recruitmentCampaignsApi'
import { defaultPlaceholder, normalizeFieldType } from '../../../utils/recruitmentFormFields'
import { assocCard, assocDash } from '../../pages/association/dashboard/associationDashTokens'

type Props = {
  fields: RecruitmentQuestion[]
  /** Render inside the campaign ad card without an extra outer shell. */
  inline?: boolean
  title?: string
  selectedFieldId?: number | null
  onFieldClick?: (fieldId: number) => void
  interactive?: boolean
}

export function ApplicationFormPreview({
  fields,
  inline,
  title = 'Application form',
  selectedFieldId,
  onFieldClick,
  interactive,
}: Props) {
  const sorted = [...fields].sort((a, b) => a.displayOrder - b.displayOrder)

  if (sorted.length === 0) {
    return (
      <div style={emptyWrap}>
        <p style={emptyTitle}>No questions yet</p>
        <p style={emptySub}>
          Add questions from the editor panel. They will appear here exactly as students will see
          them.
        </p>
      </div>
    )
  }

  return (
    <div style={inline ? formShellInline : formShell}>
      <h3 style={formHeading}>{title}</h3>
      {!inline && !interactive ? (
        <p style={formIntro}>
          This is how your application will look. Fields are read-only until applications open.
        </p>
      ) : null}
      {sorted.map((field) => (
        <PreviewField
          key={field.id}
          field={field}
          selected={interactive && selectedFieldId === field.id}
          interactive={interactive}
          onClick={onFieldClick ? () => onFieldClick(field.id) : undefined}
        />
      ))}
    </div>
  )
}

function PreviewField({
  field,
  selected,
  interactive,
  onClick,
}: {
  field: RecruitmentQuestion
  selected?: boolean
  interactive?: boolean
  onClick?: () => void
}) {
  const type = normalizeFieldType(field.questionType)
  const options = field.options?.filter((o) => o.trim()) ?? []
  const ph = field.placeholder?.trim() || defaultPlaceholder(type)

  const Wrapper = interactive ? 'button' : 'div'
  const wrapperProps = interactive
    ? {
        type: 'button' as const,
        onClick,
        style: {
          ...fieldBlock,
          ...fieldBlockInteractive,
          ...(selected ? fieldBlockSelected : {}),
        },
      }
    : { style: fieldBlock }

  return (
    <Wrapper {...wrapperProps}>
      <label style={labelStyle}>
        {field.questionTitle}
        {field.isRequired ? <span style={{ color: '#ef4444' }}> *</span> : null}
      </label>
      {field.helpText?.trim() ? <p style={helpStyle}>{field.helpText.trim()}</p> : null}
      {renderControl(type, ph, options)}
    </Wrapper>
  )
}

function renderControl(type: string, placeholder: string, options: string[]): ReactNode {
  switch (type) {
    case 'Paragraph':
      return <div style={{ ...controlBase, minHeight: 100, lineHeight: 1.5 }}>{placeholder}</div>
    case 'MultipleChoice':
      return (
        <div style={{ display: 'grid', gap: 8 }}>
          {options.length === 0 ? (
            <span style={muted}>No options configured</span>
          ) : (
            options.map((opt) => (
              <label key={opt} style={choiceRow}>
                <span style={radio} />
                <span>{opt}</span>
              </label>
            ))
          )}
        </div>
      )
    case 'CheckboxList':
      return (
        <div style={{ display: 'grid', gap: 8 }}>
          {options.map((opt) => (
            <label key={opt} style={choiceRow}>
              <span style={checkbox} />
              <span>{opt}</span>
            </label>
          ))}
        </div>
      )
    case 'Dropdown':
      return (
        <div style={{ ...controlBase, flexDirection: 'row', justifyContent: 'space-between' }}>
          <span>{options[0] ?? 'Select an option'}</span>
          <span style={{ color: assocDash.muted, fontSize: 12 }}>▼</span>
        </div>
      )
    case 'YesNo':
      return (
        <div style={{ display: 'flex', gap: 12 }}>
          <label style={choiceRow}>
            <span style={radio} />
            <span>Yes</span>
          </label>
          <label style={choiceRow}>
            <span style={radio} />
            <span>No</span>
          </label>
        </div>
      )
    case 'FileUpload':
      return (
        <div style={fileBox}>
          <Upload size={22} color={assocDash.accent} />
          <span style={{ fontSize: 13, fontWeight: 600, color: assocDash.muted, marginTop: 8 }}>
            {placeholder}
          </span>
          <span style={{ fontSize: 11, color: assocDash.subtle, marginTop: 4 }}>
            File uploads enabled when applications launch
          </span>
        </div>
      )
    case 'Date':
      return (
        <div style={{ ...controlBase, flexDirection: 'row', justifyContent: 'space-between' }}>
          <span>{placeholder}</span>
          <span style={{ fontSize: 12, color: assocDash.muted }}>📅</span>
        </div>
      )
    case 'Number':
    case 'Email':
    case 'Phone':
    case 'Url':
    case 'ShortText':
    default:
      return <div style={controlBase}>{placeholder}</div>
  }
}

const formShell: CSSProperties = {
  backgroundColor: assocDash.surface,
  borderRadius: 16,
  border: `1px solid ${assocDash.border}`,
  padding: 24,
  display: 'grid',
  gap: 20,
}

const formHeading: CSSProperties = {
  margin: '0 0 16px',
  fontSize: 20,
  fontWeight: 800,
  fontFamily: assocDash.fontDisplay,
  color: assocDash.text,
}

const formIntro: CSSProperties = {
  margin: 0,
  fontSize: 13,
  color: assocDash.muted,
  lineHeight: 1.5,
  paddingBottom: 4,
  borderBottom: `1px solid ${assocDash.border}`,
}

const fieldBlock: CSSProperties = { display: 'grid', gap: 6, textAlign: 'left' as const }

const fieldBlockInteractive: CSSProperties = {
  width: '100%',
  padding: 14,
  margin: 0,
  borderRadius: 12,
  border: `2px solid transparent`,
  background: 'transparent',
  cursor: 'pointer',
  fontFamily: 'inherit',
  transition: 'border-color 0.15s, background 0.15s',
}

const fieldBlockSelected: CSSProperties = {
  borderColor: assocDash.accentBorder,
  background: assocDash.accentMuted,
}

const labelStyle: CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  color: assocDash.text,
  lineHeight: 1.35,
}

const helpStyle: CSSProperties = {
  margin: 0,
  fontSize: 13,
  color: assocDash.muted,
  lineHeight: 1.45,
}

const controlBase: CSSProperties = {
  padding: '12px 14px',
  borderRadius: 10,
  border: `1.5px solid ${assocDash.border}`,
  backgroundColor: assocDash.bg,
  fontSize: 14,
  color: assocDash.subtle,
  fontWeight: 500,
  display: 'flex',
  alignItems: 'center',
}

const choiceRow: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '10px 12px',
  borderRadius: 10,
  border: `1px solid ${assocDash.border}`,
  backgroundColor: assocDash.bg,
  fontSize: 14,
  color: assocDash.text,
  cursor: 'default',
}

const radio: CSSProperties = {
  width: 16,
  height: 16,
  borderRadius: 8,
  border: `2px solid ${assocDash.border}`,
  flexShrink: 0,
}

const checkbox: CSSProperties = {
  width: 16,
  height: 16,
  borderRadius: 4,
  border: `2px solid ${assocDash.border}`,
  flexShrink: 0,
}

const fileBox: CSSProperties = {
  ...controlBase,
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 100,
  borderStyle: 'dashed',
  backgroundColor: assocDash.accentMuted,
}

const muted: CSSProperties = { fontSize: 13, color: assocDash.muted }

const emptyWrap: CSSProperties = {
  ...assocCard,
  padding: 32,
  textAlign: 'center',
  backgroundColor: assocDash.accentMuted,
  borderStyle: 'dashed',
}

const emptyTitle: CSSProperties = {
  margin: '0 0 8px',
  fontSize: 16,
  fontWeight: 800,
  color: assocDash.text,
}

const emptySub: CSSProperties = {
  margin: 0,
  fontSize: 14,
  color: assocDash.muted,
  lineHeight: 1.5,
}

const formShellInline: CSSProperties = { display: 'grid', gap: 20 }
