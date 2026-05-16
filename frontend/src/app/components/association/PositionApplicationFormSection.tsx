import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import type { LocalFormField, PositionOption } from '../../../utils/recruitmentFormFields'
import { RecruitmentApplicationFormBuilder } from './RecruitmentApplicationFormBuilder'
import { RecruitmentApplicationFormBuilderDraft } from './RecruitmentApplicationFormBuilderDraft'
import { assocDash } from '../../pages/association/dashboard/associationDashTokens'

type Props = {
  positionTitle: string
  positionKey: string
  positionId?: number
  positions: PositionOption[]
  disabled?: boolean
  campaignId?: number
  formFields?: LocalFormField[]
  onFormFieldsChange?: (fields: LocalFormField[]) => void
  onFormEditingChange?: (editing: boolean) => void
}

export function PositionApplicationFormSection({
  positionTitle,
  positionKey,
  positionId,
  positions,
  disabled,
  campaignId,
  formFields,
  onFormFieldsChange,
  onFormEditingChange,
}: Props) {
  const [open, setOpen] = useState(false)

  const scope = {
    type: 'position' as const,
    positionTitle: positionTitle.trim() || 'This position',
    positionId,
    positionKey: positionId == null ? positionKey : undefined,
  }

  return (
    <div style={{ marginTop: 8, borderTop: `1px solid ${assocDash.border}`, paddingTop: 14 }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          width: '100%',
          padding: '10px 12px',
          borderRadius: 10,
          border: `1px solid ${assocDash.accentBorder}`,
          background: assocDash.accentMuted,
          color: assocDash.accentDark,
          fontSize: 13,
          fontWeight: 700,
          cursor: disabled ? 'not-allowed' : 'pointer',
          fontFamily: 'inherit',
          textAlign: 'left',
        }}
      >
        {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        Position application form
      </button>

      {open ? (
        <div style={{ marginTop: 12 }}>
          {campaignId != null ? (
            <RecruitmentApplicationFormBuilder
              campaignId={campaignId}
              scope={scope}
              positions={positions}
              compact
            />
          ) : formFields && onFormFieldsChange ? (
            <RecruitmentApplicationFormBuilderDraft
              fields={formFields}
              onChange={onFormFieldsChange}
              onEditingChange={onFormEditingChange}
              disabled={disabled}
              scope={scope}
              positions={positions}
              compact
            />
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
