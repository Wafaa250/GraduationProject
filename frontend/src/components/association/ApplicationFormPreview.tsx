import { useState, type CSSProperties, type ReactNode } from 'react'
import { Copy, Pencil, Plus, Trash2, Upload } from 'lucide-react'
import type { RecruitmentQuestion } from '@/api/recruitmentCampaignsApi'
import { defaultPlaceholder, normalizeFieldType } from '@/utils/recruitmentFormFields'
import { assocCard, assocDash } from '@/pages/association/dashboard/associationDashTokens'

type Props = {
  fields: RecruitmentQuestion[]
  inline?: boolean
  title?: string
  description?: string | null
  builderMode?: boolean
  previewOnly?: boolean
  selectedFieldId?: number | null
  hoveredFieldId?: number | null
  onFieldHover?: (fieldId: number | null) => void
  onFieldClick?: (fieldId: number) => void
  onFieldEdit?: (fieldId: number) => void
  onFieldDuplicate?: (fieldId: number) => void
  onFieldDelete?: (fieldId: number) => void
  onAddField?: () => void
  interactive?: boolean
  /** Builder empty-state copy when `builderMode` is on. */
  builderVariant?: 'event' | 'position'
}

export function ApplicationFormPreview({
  fields,
  inline,
  title = 'Application form',
  description,
  builderMode,
  previewOnly,
  selectedFieldId,
  hoveredFieldId,
  onFieldHover,
  onFieldClick,
  onFieldEdit,
  onFieldDuplicate,
  onFieldDelete,
  onAddField,
  interactive,
  builderVariant = 'event',
}: Props) {
  const sorted = [...fields].sort((a, b) => a.displayOrder - b.displayOrder)
  const shell = builderMode ? formShellBuilder : inline ? formShellInline : formShell
  const heading = builderMode ? formHeadingBuilder : formHeading
  const fieldGap = builderMode ? 28 : 20
  const showBuilderChrome = builderMode && interactive && !previewOnly

  if (sorted.length === 0) {
    return (
      <div style={builderMode ? emptyWrapBuilder : emptyWrap}>
        <p style={emptyTitle}>
          {builderMode
            ? builderVariant === 'position'
              ? 'Position application form'
              : 'Student registration form'
            : 'No questions yet'}
        </p>
        <p style={emptySub}>
          {builderMode
            ? builderVariant === 'position'
              ? 'This is what students will submit when applying for this role. Add your first question to begin.'
              : 'This is what students will submit when registering for your event. Add your first question to begin.'
            : 'Add questions from the editor panel. They will appear here exactly as students will see them.'}
        </p>
        {showBuilderChrome && onAddField ? (
          <button type="button" onClick={onAddField} style={emptyAddBtn}>
            <Plus size={16} />
            Add first question
          </button>
        ) : null}
      </div>
    )
  }

  return (
    <div style={shell}>
      <header style={builderMode ? formHeaderBuilder : undefined}>
        <h3 style={heading}>{title}</h3>
        {description?.trim() ? (
          <p style={builderMode ? formDescBuilder : formIntro}>{description.trim()}</p>
        ) : null}
        {!inline && !interactive && !description?.trim() ? (
          <p style={formIntro}>
            This is how your application will look. Fields are read-only until applications open.
          </p>
        ) : null}
      </header>
      <div style={{ display: 'grid', gap: fieldGap }}>
        {sorted.map((field) => (
          <PreviewField
            key={field.id}
            field={field}
            selected={interactive && selectedFieldId === field.id}
            hovered={showBuilderChrome && hoveredFieldId === field.id}
            interactive={interactive && !previewOnly}
            builderMode={builderMode}
            showToolbar={showBuilderChrome}
            previewOnly={previewOnly}
            onClick={onFieldClick ? () => onFieldClick(field.id) : undefined}
            onHover={onFieldHover}
            onEdit={onFieldEdit ? () => onFieldEdit(field.id) : undefined}
            onDuplicate={onFieldDuplicate ? () => onFieldDuplicate(field.id) : undefined}
            onDelete={onFieldDelete ? () => onFieldDelete(field.id) : undefined}
          />
        ))}
      </div>
      {showBuilderChrome && onAddField ? (
        <button type="button" onClick={onAddField} style={inlineAddBtn}>
          <Plus size={16} strokeWidth={2.25} />
          Add question
        </button>
      ) : null}
      {builderMode ? (
        <div style={submitStub}>
          <span style={{ ...submitStubBtn, ...(previewOnly ? submitStubBtnPreview : {}) }}>
            Submit registration
          </span>
        </div>
      ) : null}
    </div>
  )
}

function PreviewField({
  field,
  selected,
  hovered,
  interactive,
  builderMode,
  previewOnly,
  showToolbar,
  onClick,
  onHover,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  field: RecruitmentQuestion
  selected?: boolean
  hovered?: boolean
  interactive?: boolean
  builderMode?: boolean
  previewOnly?: boolean
  showToolbar?: boolean
  onClick?: () => void
  onHover?: (id: number | null) => void
  onEdit?: () => void
  onDuplicate?: () => void
  onDelete?: () => void
}) {
  const type = normalizeFieldType(field.questionType)
  const options = field.options?.filter((o) => o.trim()) ?? []
  const ph = field.placeholder?.trim() || defaultPlaceholder(type)
  const inputId = `preview-field-${field.id}`
  const labelId = `preview-label-${field.id}`
  const hasSingleControl =
    previewOnly && type !== 'MultipleChoice' && type !== 'CheckboxList' && type !== 'YesNo'
  const [textValue, setTextValue] = useState('')
  const [choiceValue, setChoiceValue] = useState('')
  const [checkedValues, setCheckedValues] = useState<string[]>([])

  const wrapperStyle: CSSProperties = {
    ...fieldBlock,
    ...(builderMode ? fieldBlockBuilder : {}),
    ...(interactive ? fieldBlockInteractive : {}),
    ...(builderMode && interactive ? fieldBlockInteractiveBuilder : {}),
    ...(selected ? (builderMode ? fieldBlockSelectedBuilder : fieldBlockSelected) : {}),
    ...(hovered && !selected ? fieldBlockHoverBuilder : {}),
    position: 'relative',
    textAlign: 'left' as const,
  }

  const toggleChecked = (opt: string, checked: boolean) => {
    setCheckedValues((prev) => (checked ? [...prev, opt] : prev.filter((v) => v !== opt)))
  }

  return (
    <div
      style={wrapperStyle}
      onMouseEnter={() => onHover?.(field.id)}
      onMouseLeave={() => onHover?.(null)}
      onClick={interactive ? onClick : undefined}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClick?.()
              }
            }
          : undefined
      }
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
    >
      {showToolbar && (hovered || selected) ? (
        <div
          style={fieldToolbar}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          {onEdit ? (
            <ToolbarBtn icon={<Pencil size={13} />} label="Edit" onClick={onEdit} />
          ) : null}
          {onDuplicate ? (
            <ToolbarBtn icon={<Copy size={13} />} label="Duplicate" onClick={onDuplicate} />
          ) : null}
          {onDelete ? (
            <ToolbarBtn icon={<Trash2 size={13} />} label="Delete" onClick={onDelete} danger />
          ) : null}
        </div>
      ) : null}
      <label
        id={previewOnly ? labelId : undefined}
        htmlFor={hasSingleControl ? inputId : undefined}
        style={builderMode ? labelStyleBuilder : labelStyle}
      >
        {field.questionTitle}
        {field.isRequired ? <span style={{ color: '#ef4444' }}> *</span> : null}
      </label>
      {field.helpText?.trim() ? (
        <p style={builderMode ? helpStyleBuilder : helpStyle}>{field.helpText.trim()}</p>
      ) : null}
      {previewOnly ? (
        renderInteractiveControl({
          type,
          placeholder: ph,
          options,
          builderMode,
          inputId,
          labelId,
          textValue,
          onTextChange: setTextValue,
          choiceValue,
          onChoiceChange: setChoiceValue,
          checkedValues,
          onToggleChecked: toggleChecked,
        })
      ) : (
        renderControl(type, ph, options, builderMode)
      )}
    </div>
  )
}

function ToolbarBtn({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: ReactNode
  label: string
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...toolbarBtn,
        ...(danger ? toolbarBtnDanger : {}),
      }}
    >
      {icon}
      {label}
    </button>
  )
}

function renderControl(type: string, placeholder: string, options: string[], builderMode?: boolean): ReactNode {
  const base = builderMode ? controlBaseBuilder : controlBase
  const choice = builderMode ? choiceRowBuilder : choiceRow

  switch (type) {
    case 'Paragraph':
      return (
        <div style={{ ...base, minHeight: builderMode ? 128 : 100, lineHeight: 1.55, alignItems: 'flex-start' }}>
          {placeholder}
        </div>
      )
    case 'MultipleChoice':
      return (
        <div style={{ display: 'grid', gap: builderMode ? 10 : 8 }}>
          {options.length === 0 ? (
            <span style={muted}>No options configured</span>
          ) : (
            options.map((opt) => (
              <label key={opt} style={choice}>
                <span style={radio} />
                <span>{opt}</span>
              </label>
            ))
          )}
        </div>
      )
    case 'CheckboxList':
      return (
        <div style={{ display: 'grid', gap: builderMode ? 10 : 8 }}>
          {options.map((opt) => (
            <label key={opt} style={choice}>
              <span style={checkbox} />
              <span>{opt}</span>
            </label>
          ))}
        </div>
      )
    case 'Dropdown':
      return (
        <div style={{ ...base, flexDirection: 'row', justifyContent: 'space-between' }}>
          <span>{options[0] ?? 'Select an option'}</span>
          <span style={{ color: assocDash.muted, fontSize: 12 }}>▼</span>
        </div>
      )
    case 'YesNo':
      return (
        <div style={{ display: 'flex', gap: 12 }}>
          <label style={choice}>
            <span style={radio} />
            <span>Yes</span>
          </label>
          <label style={choice}>
            <span style={radio} />
            <span>No</span>
          </label>
        </div>
      )
    case 'FileUpload':
      return (
        <div style={{ ...fileBox, ...(builderMode ? fileBoxBuilder : {}) }}>
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
        <div style={{ ...base, flexDirection: 'row', justifyContent: 'space-between' }}>
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
      return <div style={base}>{placeholder}</div>
  }
}

type InteractiveControlProps = {
  type: string
  placeholder: string
  options: string[]
  builderMode?: boolean
  inputId: string
  labelId: string
  textValue: string
  onTextChange: (value: string) => void
  choiceValue: string
  onChoiceChange: (value: string) => void
  checkedValues: string[]
  onToggleChecked: (option: string, checked: boolean) => void
}

function renderInteractiveControl({
  type,
  placeholder,
  options,
  builderMode,
  inputId,
  labelId,
  textValue,
  onTextChange,
  choiceValue,
  onChoiceChange,
  checkedValues,
  onToggleChecked,
}: InteractiveControlProps): ReactNode {
  const inputStyle = builderMode ? inputInteractiveBuilder : inputInteractive
  const selectStyle = builderMode ? selectInteractiveBuilder : selectInteractive
  const choice = builderMode ? choiceRowInteractiveBuilder : choiceRowInteractive

  switch (type) {
    case 'Paragraph':
      return (
        <textarea
          id={inputId}
          value={textValue}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder={placeholder}
          rows={5}
          style={{ ...inputStyle, minHeight: builderMode ? 128 : 100, resize: 'vertical' as const, lineHeight: 1.55 }}
        />
      )
    case 'MultipleChoice':
      return (
        <div
          style={{ display: 'grid', gap: builderMode ? 10 : 8 }}
          role="radiogroup"
          aria-labelledby={labelId}
        >
          {options.length === 0 ? (
            <span style={muted}>No options configured</span>
          ) : (
            options.map((opt) => (
              <label key={opt} style={choice}>
                <input
                  type="radio"
                  name={inputId}
                  value={opt}
                  checked={choiceValue === opt}
                  onChange={() => onChoiceChange(opt)}
                  style={nativeChoiceInput}
                />
                <span>{opt}</span>
              </label>
            ))
          )}
        </div>
      )
    case 'CheckboxList':
      return (
        <div style={{ display: 'grid', gap: builderMode ? 10 : 8 }}>
          {options.length === 0 ? (
            <span style={muted}>No options configured</span>
          ) : (
            options.map((opt) => (
              <label key={opt} style={choice}>
                <input
                  type="checkbox"
                  value={opt}
                  checked={checkedValues.includes(opt)}
                  onChange={(e) => onToggleChecked(opt, e.target.checked)}
                  style={nativeChoiceInput}
                />
                <span>{opt}</span>
              </label>
            ))
          )}
        </div>
      )
    case 'Dropdown':
      if (options.length === 0) {
        return <span style={muted}>No options configured</span>
      }
      return (
        <select
          id={inputId}
          value={choiceValue}
          onChange={(e) => onChoiceChange(e.target.value)}
          style={selectStyle}
        >
          <option value="" disabled>
            {placeholder || 'Select an option'}
          </option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      )
    case 'YesNo':
      return (
        <div
          style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}
          role="radiogroup"
          aria-labelledby={labelId}
        >
          {(['Yes', 'No'] as const).map((opt) => (
            <label key={opt} style={choice}>
              <input
                type="radio"
                name={inputId}
                value={opt}
                checked={choiceValue === opt}
                onChange={() => onChoiceChange(opt)}
                style={nativeChoiceInput}
              />
              <span>{opt}</span>
            </label>
          ))}
        </div>
      )
    case 'FileUpload':
      return (
        <label style={{ ...fileBox, ...(builderMode ? fileBoxBuilder : {}), cursor: 'pointer' }}>
          <Upload size={22} color={assocDash.accent} />
          <input
            id={inputId}
            type="file"
            style={hiddenFileInput}
            onChange={() => undefined}
          />
          <span style={{ fontSize: 13, fontWeight: 600, color: assocDash.muted, marginTop: 8 }}>
            {placeholder}
          </span>
        </label>
      )
    case 'Date':
      return (
        <input
          id={inputId}
          type="date"
          value={textValue}
          onChange={(e) => onTextChange(e.target.value)}
          style={inputStyle}
        />
      )
    case 'Number':
      return (
        <input
          id={inputId}
          type="number"
          value={textValue}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder={placeholder}
          style={inputStyle}
        />
      )
    case 'Email':
      return (
        <input
          id={inputId}
          type="email"
          value={textValue}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder={placeholder}
          style={inputStyle}
          autoComplete="email"
        />
      )
    case 'Phone':
      return (
        <input
          id={inputId}
          type="tel"
          value={textValue}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder={placeholder}
          style={inputStyle}
          autoComplete="tel"
        />
      )
    case 'Url':
      return (
        <input
          id={inputId}
          type="url"
          value={textValue}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder={placeholder}
          style={inputStyle}
          autoComplete="url"
        />
      )
    case 'ShortText':
    default:
      return (
        <input
          id={inputId}
          type="text"
          value={textValue}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder={placeholder}
          style={inputStyle}
        />
      )
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

const formShellBuilder: CSSProperties = {
  width: '100%',
  maxWidth: 640,
  backgroundColor: '#fff',
  borderRadius: 24,
  border: `1px solid ${assocDash.border}`,
  boxShadow: '0 24px 48px rgba(15, 23, 42, 0.08), 0 4px 16px rgba(15, 23, 42, 0.04)',
  padding: '44px 48px 40px',
  display: 'grid',
  gap: 32,
}

const formShellInline: CSSProperties = { display: 'grid', gap: 20 }

const formHeaderBuilder: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  paddingBottom: 4,
}

const formHeading: CSSProperties = {
  margin: '0 0 16px',
  fontSize: 20,
  fontWeight: 800,
  fontFamily: assocDash.fontDisplay,
  color: assocDash.text,
}

const formHeadingBuilder: CSSProperties = {
  margin: 0,
  fontSize: 28,
  fontWeight: 800,
  fontFamily: assocDash.fontDisplay,
  color: assocDash.text,
  letterSpacing: '-0.025em',
  lineHeight: 1.15,
}

const formDescBuilder: CSSProperties = {
  margin: 0,
  fontSize: 15,
  color: assocDash.muted,
  lineHeight: 1.6,
}

const formIntro: CSSProperties = {
  margin: 0,
  fontSize: 13,
  color: assocDash.muted,
  lineHeight: 1.5,
  paddingBottom: 4,
  borderBottom: `1px solid ${assocDash.border}`,
}

const fieldBlock: CSSProperties = { display: 'grid', gap: 6 }
const fieldBlockBuilder: CSSProperties = { gap: 8 }

const fieldBlockInteractive: CSSProperties = {
  width: '100%',
  padding: 14,
  margin: 0,
  borderRadius: 12,
  border: '2px solid transparent',
  background: 'transparent',
  cursor: 'pointer',
  fontFamily: 'inherit',
  transition: 'border-color 0.18s, background 0.18s, box-shadow 0.18s',
}

const fieldBlockInteractiveBuilder: CSSProperties = {
  padding: '18px 20px',
  borderRadius: 16,
  border: '1.5px solid #e8edf2',
  background: '#fff',
}

const fieldBlockHoverBuilder: CSSProperties = {
  borderColor: '#cbd5e1',
  boxShadow: '0 4px 16px rgba(15, 23, 42, 0.06)',
}

const fieldBlockSelected: CSSProperties = {
  borderColor: assocDash.accentBorder,
  background: assocDash.accentMuted,
}

const fieldBlockSelectedBuilder: CSSProperties = {
  borderColor: assocDash.accent,
  background: 'rgba(255, 251, 235, 0.9)',
  boxShadow: '0 0 0 4px rgba(245, 158, 11, 0.12)',
}

const fieldToolbar: CSSProperties = {
  position: 'absolute',
  top: 10,
  right: 10,
  display: 'flex',
  gap: 4,
  padding: 4,
  borderRadius: 10,
  background: '#fff',
  border: `1px solid ${assocDash.border}`,
  boxShadow: '0 4px 12px rgba(15, 23, 42, 0.1)',
  zIndex: 2,
}

const toolbarBtn: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: '5px 8px',
  borderRadius: 7,
  border: 'none',
  background: 'transparent',
  fontSize: 11,
  fontWeight: 600,
  color: assocDash.textSecondary,
  cursor: 'pointer',
  fontFamily: 'inherit',
}

const toolbarBtnDanger: CSSProperties = {
  color: '#b91c1c',
}

const labelStyle: CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  color: assocDash.text,
  lineHeight: 1.35,
}

const labelStyleBuilder: CSSProperties = {
  fontSize: 15,
  fontWeight: 700,
  color: assocDash.text,
  lineHeight: 1.35,
  letterSpacing: '-0.01em',
}

const helpStyle: CSSProperties = {
  margin: 0,
  fontSize: 13,
  color: assocDash.muted,
  lineHeight: 1.45,
}

const helpStyleBuilder: CSSProperties = {
  margin: 0,
  fontSize: 13,
  color: assocDash.subtle,
  lineHeight: 1.5,
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

const controlBaseBuilder: CSSProperties = {
  padding: '14px 16px',
  borderRadius: 12,
  border: '1.5px solid #e2e8f0',
  backgroundColor: '#f8fafc',
  fontSize: 14,
  color: '#94a3b8',
}

const inputInteractive: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '12px 14px',
  borderRadius: 10,
  border: `1.5px solid ${assocDash.border}`,
  backgroundColor: '#fff',
  fontSize: 14,
  color: assocDash.text,
  fontFamily: 'inherit',
  outline: 'none',
}

const inputInteractiveBuilder: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '14px 16px',
  borderRadius: 12,
  border: '1.5px solid #e2e8f0',
  backgroundColor: '#fff',
  fontSize: 14,
  color: assocDash.text,
  fontFamily: 'inherit',
  outline: 'none',
}

const selectInteractive: CSSProperties = {
  ...inputInteractive,
  cursor: 'pointer',
  appearance: 'auto',
}

const selectInteractiveBuilder: CSSProperties = {
  ...inputInteractiveBuilder,
  cursor: 'pointer',
  appearance: 'auto',
}

const choiceRowInteractive: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '10px 12px',
  borderRadius: 10,
  border: `1px solid ${assocDash.border}`,
  backgroundColor: '#fff',
  fontSize: 14,
  color: assocDash.text,
  cursor: 'pointer',
}

const choiceRowInteractiveBuilder: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '12px 14px',
  borderRadius: 12,
  border: '1.5px solid #e2e8f0',
  backgroundColor: '#fff',
  fontSize: 14,
  color: assocDash.textSecondary,
  cursor: 'pointer',
}

const nativeChoiceInput: CSSProperties = {
  width: 16,
  height: 16,
  margin: 0,
  flexShrink: 0,
  cursor: 'pointer',
}

const hiddenFileInput: CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
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

const choiceRowBuilder: CSSProperties = {
  padding: '12px 14px',
  borderRadius: 12,
  border: '1.5px solid #e2e8f0',
  backgroundColor: '#fff',
  fontSize: 14,
  color: assocDash.textSecondary,
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

const fileBoxBuilder: CSSProperties = {
  minHeight: 120,
  borderRadius: 14,
  backgroundColor: '#fffbeb',
}

const muted: CSSProperties = { fontSize: 13, color: assocDash.muted }

const inlineAddBtn: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  width: '100%',
  padding: '14px 16px',
  borderRadius: 14,
  border: `1.5px dashed ${assocDash.border}`,
  background: '#fafbfc',
  color: assocDash.muted,
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'inherit',
  transition: 'border-color 0.15s, background 0.15s',
}

const emptyAddBtn: CSSProperties = {
  ...inlineAddBtn,
  maxWidth: 220,
  margin: '20px auto 0',
  borderColor: assocDash.accentBorder,
  background: assocDash.accentMuted,
  color: assocDash.accentDark,
}

const submitStub: CSSProperties = {
  paddingTop: 8,
  borderTop: `1px solid ${assocDash.border}`,
}

const submitStubBtn: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '13px 28px',
  borderRadius: 12,
  background: assocDash.gradient,
  color: '#fff',
  fontSize: 14,
  fontWeight: 700,
  opacity: 0.9,
}

const submitStubBtnPreview: CSSProperties = {
  opacity: 1,
  boxShadow: '0 4px 14px rgba(234, 88, 12, 0.28)',
}

const emptyWrap: CSSProperties = {
  ...assocCard,
  padding: 32,
  textAlign: 'center',
  backgroundColor: assocDash.accentMuted,
  borderStyle: 'dashed',
}

const emptyWrapBuilder: CSSProperties = {
  width: '100%',
  maxWidth: 640,
  padding: '56px 40px',
  textAlign: 'center',
  backgroundColor: '#fff',
  borderRadius: 24,
  border: '2px dashed #e2e8f0',
  boxShadow: '0 16px 40px rgba(15, 23, 42, 0.06)',
}

const emptyTitle: CSSProperties = {
  margin: '0 0 8px',
  fontSize: 18,
  fontWeight: 800,
  fontFamily: assocDash.fontDisplay,
  color: assocDash.text,
}

const emptySub: CSSProperties = {
  margin: 0,
  fontSize: 14,
  color: assocDash.muted,
  lineHeight: 1.55,
  maxWidth: 380,
  marginInline: 'auto',
}
