import { useState, type CSSProperties, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { RecruitmentCampaignCoverUpload } from '../../../components/association/RecruitmentCampaignCoverUpload'
import {
  RecruitmentPositionsEditor,
  draftsToPayload,
  newPositionDraft,
  positionsFromCampaign,
  type PositionDraft,
} from '../../../components/association/RecruitmentPositionsEditor'
import type {
  CreateRecruitmentCampaignPayload,
  RecruitmentCampaign,
} from '../../../../api/recruitmentCampaignsApi'
import { assocCard, assocDash } from '../dashboard/associationDashTokens'
import { datetimeLocalToIso, toDatetimeLocalValue } from '../events/eventFormUtils'

export type CampaignFormValues = {
  title: string
  description: string
  applicationDeadline: string
  coverImageUrl: string | null
  isPublished: boolean
  positions: PositionDraft[]
}

function emptyValues(): CampaignFormValues {
  return {
    title: '',
    description: '',
    applicationDeadline: '',
    coverImageUrl: null,
    isPublished: true,
    positions: [newPositionDraft(0)],
  }
}

export function campaignToFormValues(campaign: RecruitmentCampaign): CampaignFormValues {
  return {
    title: campaign.title,
    description: campaign.description,
    applicationDeadline: toDatetimeLocalValue(campaign.applicationDeadline),
    coverImageUrl: campaign.coverImageUrl ?? null,
    isPublished: campaign.isPublished,
    positions:
      campaign.positions.length > 0
        ? positionsFromCampaign(campaign.positions)
        : [newPositionDraft(0)],
  }
}

type Props = {
  mode: 'create' | 'edit'
  initialValues?: CampaignFormValues
  submitLabel: string
  cancelTo: string
  saving: boolean
  onSubmit: (payload: CreateRecruitmentCampaignPayload) => Promise<void>
  campaignId?: number
}

export function RecruitmentCampaignForm({
  mode,
  initialValues,
  submitLabel,
  cancelTo,
  saving,
  onSubmit,
  campaignId,
}: Props) {
  const [form, setForm] = useState<CampaignFormValues>(initialValues ?? emptyValues())
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = (): boolean => {
    const next: Record<string, string> = {}
    if (!form.title.trim()) next.title = 'Title is required.'
    if (!form.description.trim()) next.description = 'Description is required.'
    if (!form.applicationDeadline) next.applicationDeadline = 'Application deadline is required.'
    else {
      const iso = datetimeLocalToIso(form.applicationDeadline)
      if (iso && new Date(iso) <= new Date()) {
        next.applicationDeadline = 'Application deadline must be in the future.'
      }
    }
    if (form.positions.length === 0) next.positions = 'Add at least one position.'
    form.positions.forEach((p, i) => {
      if (!p.roleTitle.trim()) next[`positions.${i}.roleTitle`] = 'Role title is required.'
    })
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    const deadline = datetimeLocalToIso(form.applicationDeadline)
    if (!deadline) return

    await onSubmit({
      title: form.title.trim(),
      description: form.description.trim(),
      applicationDeadline: deadline,
      coverImageUrl: form.coverImageUrl,
      isPublished: form.isPublished,
      positions: draftsToPayload(form.positions),
    })
  }

  return (
    <form onSubmit={handleSubmit} style={{ ...assocCard, padding: 28, display: 'grid', gap: 18 }}>
      <Field label="Campaign title" required error={errors.title}>
        <input
          style={inputStyle}
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="e.g. IEEE Recruitment Fall 2026"
          disabled={saving}
        />
      </Field>

      <Field label="Description" required error={errors.description}>
        <textarea
          style={{ ...inputStyle, minHeight: 120, resize: 'vertical' }}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Tell students about your recruitment campaign"
          disabled={saving}
        />
      </Field>

      <Field label="Application deadline" required error={errors.applicationDeadline}>
        <input
          style={inputStyle}
          type="datetime-local"
          value={form.applicationDeadline}
          onChange={(e) => setForm({ ...form, applicationDeadline: e.target.value })}
          disabled={saving}
        />
      </Field>

      <RecruitmentCampaignCoverUpload
        coverImageUrl={form.coverImageUrl}
        onCoverImageUrlChange={(url) => setForm({ ...form, coverImageUrl: url })}
        disabled={saving}
      />

      <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, fontWeight: 600 }}>
        <input
          type="checkbox"
          checked={form.isPublished}
          onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
          disabled={saving}
        />
        Publish on public organization profile
      </label>

      {errors.positions ? <p style={errStyle}>{errors.positions}</p> : null}

      <RecruitmentPositionsEditor
        positions={form.positions}
        onChange={(positions) => setForm({ ...form, positions })}
        disabled={saving}
        campaignId={campaignId}
      />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 8 }}>
        <button type="submit" disabled={saving} style={primaryBtn(saving)}>
          {saving ? 'Saving…' : submitLabel}
        </button>
        <Link to={cancelTo} style={ghostBtn}>
          Cancel
        </Link>
      </div>
      {mode === 'create' && (
        <p style={{ margin: 0, fontSize: 12, color: assocDash.muted, gridColumn: '1 / -1' }}>
          After creating the campaign, use each position&apos;s application form button to design
          questions students will answer when applying.
        </p>
      )}
    </form>
  )
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string
  required?: boolean
  error?: string
  children: ReactNode
}) {
  return (
    <label style={{ display: 'block' }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: assocDash.text }}>
        {label}
        {required ? <span style={{ color: '#ef4444' }}> *</span> : null}
      </span>
      <div style={{ height: 8 }} />
      {children}
      {error ? <span style={errStyle}>{error}</span> : null}
    </label>
  )
}

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '11px 14px',
  borderRadius: 10,
  border: `1.5px solid ${assocDash.border}`,
  fontSize: 14,
  fontFamily: 'inherit',
  boxSizing: 'border-box',
}

const errStyle: CSSProperties = { display: 'block', marginTop: 4, fontSize: 12, color: '#b91c1c' }

const primaryBtn = (disabled: boolean): CSSProperties => ({
  padding: '10px 20px',
  borderRadius: assocDash.radiusMd,
  border: 'none',
  background: assocDash.gradient,
  color: '#fff',
  fontSize: 14,
  fontWeight: 600,
  cursor: disabled ? 'not-allowed' : 'pointer',
  opacity: disabled ? 0.7 : 1,
  fontFamily: 'inherit',
})

const ghostBtn: CSSProperties = {
  padding: '10px 18px',
  borderRadius: assocDash.radiusMd,
  border: `1px solid ${assocDash.border}`,
  background: '#fff',
  color: assocDash.text,
  fontSize: 14,
  fontWeight: 600,
  textDecoration: 'none',
  display: 'inline-flex',
  alignItems: 'center',
}
