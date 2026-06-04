import { useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { CalendarClock, Eye, Sparkles } from 'lucide-react'
import { RecruitmentCampaignCoverUpload } from '@/components/association/RecruitmentCampaignCoverUpload'
import {
  RecruitmentPositionsEditor,
  draftsToPayload,
  newPositionDraft,
  positionsFromCampaign,
  type PositionDraft,
} from '@/components/association/RecruitmentPositionsEditor'
import type {
  CreateRecruitmentCampaignPayload,
  RecruitmentCampaign,
} from '@/api/recruitmentCampaignsApi'
import { assocDash, assocType } from '../dashboard/associationDashTokens'
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
    positions: [newPositionDraft()],
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
        : [newPositionDraft()],
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
    if (form.positions.length === 0) next.positions = 'Add at least one open position.'
    form.positions.forEach((p, i) => {
      if (!p.roleTitle.trim()) next[`positions.${i}.roleTitle`] = 'Position title is required.'
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
    <form onSubmit={handleSubmit} className="opportunity-form">
      <section className="opportunity-hero-card">
        <div className="opportunity-hero-card-accent" aria-hidden />
        <div className="opportunity-hero-card-inner">
          <div className="opportunity-hero-card-header">
            <div className="opportunity-hero-card-icon" aria-hidden>
              <Sparkles size={18} strokeWidth={2} />
            </div>
            <div>
              <h2 style={{ ...assocType.sectionTitle, margin: 0 }}>Opportunity details</h2>
              <p style={{ ...assocType.sectionDesc, margin: '4px 0 0' }}>
                Tell students what this leadership opportunity is about and when applications close.
              </p>
            </div>
          </div>

          <div className="opportunity-hero-grid">
            <div className="opportunity-hero-fields">
              <Field label="Title" required error={errors.title}>
                <input
                  className="opportunity-input opportunity-input-title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Fall 2026 Executive Board Applications"
                  disabled={saving}
                />
              </Field>

              <Field label="Description" required error={errors.description}>
                <textarea
                  className="opportunity-input opportunity-textarea"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe the opportunity — who should apply, what teams are forming, and what students will gain."
                  disabled={saving}
                />
              </Field>

              <Field label="Application deadline" required error={errors.applicationDeadline}>
                <div className="opportunity-input-icon-wrap">
                  <CalendarClock size={16} strokeWidth={2} className="opportunity-input-icon" aria-hidden />
                  <input
                    className="opportunity-input opportunity-input-with-icon"
                    type="datetime-local"
                    value={form.applicationDeadline}
                    onChange={(e) => setForm({ ...form, applicationDeadline: e.target.value })}
                    disabled={saving}
                  />
                </div>
              </Field>

              <label className="opportunity-visibility">
                <input
                  type="checkbox"
                  className="opportunity-visibility-check"
                  checked={form.isPublished}
                  onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                  disabled={saving}
                />
                <span className="opportunity-visibility-track" aria-hidden />
                <span className="opportunity-visibility-copy">
                  <Eye size={15} strokeWidth={2} aria-hidden />
                  <span>
                    <strong>Publish on public organization profile</strong>
                    <small>Students can discover and apply from your organization page</small>
                  </span>
                </span>
              </label>
            </div>

            <div className="opportunity-hero-cover">
              <RecruitmentCampaignCoverUpload
                coverImageUrl={form.coverImageUrl}
                onCoverImageUrlChange={(url) => setForm({ ...form, coverImageUrl: url })}
                disabled={saving}
                variant="hero"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="opportunity-positions-section">
        <div className="opportunity-positions-header">
          <div>
            <h2 style={{ ...assocType.sectionTitle, margin: 0 }}>Open positions</h2>
            <p style={{ ...assocType.sectionDesc, margin: '6px 0 0' }}>
              Define each role students can apply for — committee seats, team leads, and volunteer positions.
            </p>
          </div>
          <span className="opportunity-positions-count">
            {form.positions.length} position{form.positions.length === 1 ? '' : 's'}
          </span>
        </div>

        {errors.positions ? <p className="opportunity-field-error">{errors.positions}</p> : null}

        <RecruitmentPositionsEditor
          positions={form.positions}
          onChange={(positions) => setForm({ ...form, positions })}
          disabled={saving}
          campaignId={campaignId}
          positionErrors={errors}
        />
      </section>

      <footer className="opportunity-form-footer">
        <div className="opportunity-form-actions">
          <button type="submit" disabled={saving} className="opportunity-submit">
            {saving ? 'Saving…' : submitLabel}
          </button>
          <Link to={cancelTo} className="opportunity-cancel">
            Cancel
          </Link>
        </div>
        {mode === 'create' && (
          <p className="opportunity-form-hint">
            After creating the opportunity, use each position&apos;s application form button to design
            questions students will answer when applying.
          </p>
        )}
      </footer>

      <FormStyles />
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
    <label className="opportunity-field">
      <span className="opportunity-field-label">
        {label}
        {required ? <span className="opportunity-required"> *</span> : null}
      </span>
      {children}
      {error ? <span className="opportunity-field-error">{error}</span> : null}
    </label>
  )
}

function FormStyles() {
  return (
    <style>{`
      .opportunity-form {
        display: flex;
        flex-direction: column;
        gap: 28px;
      }

      .opportunity-hero-card {
        position: relative;
        border-radius: ${assocDash.radiusLg}px;
        border: 1px solid ${assocDash.border};
        background: ${assocDash.surface};
        box-shadow: ${assocDash.shadowLg};
        overflow: hidden;
      }

      .opportunity-hero-card-accent {
        height: 4px;
        background: ${assocDash.gradient};
      }

      .opportunity-hero-card-inner {
        padding: 28px;
      }

      .opportunity-hero-card-header {
        display: flex;
        align-items: flex-start;
        gap: 14px;
        margin-bottom: 24px;
      }

      .opportunity-hero-card-icon {
        width: 40px;
        height: 40px;
        border-radius: 12px;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: ${assocDash.accentMuted};
        border: 1px solid ${assocDash.accentBorder};
        color: ${assocDash.accentDark};
      }

      .opportunity-hero-grid {
        display: grid;
        grid-template-columns: 1fr 280px;
        gap: 28px;
        align-items: start;
      }

      .opportunity-hero-fields {
        display: flex;
        flex-direction: column;
        gap: 18px;
        min-width: 0;
      }

      .opportunity-hero-cover {
        min-width: 0;
      }

      .opportunity-field {
        display: block;
      }

      .opportunity-field-label {
        display: block;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: ${assocDash.label};
        margin-bottom: 8px;
      }

      .opportunity-required {
        color: ${assocDash.error};
      }

      .opportunity-input {
        width: 100%;
        padding: 12px 14px;
        border-radius: 12px;
        border: 1.5px solid ${assocDash.border};
        font-size: 14px;
        font-family: inherit;
        box-sizing: border-box;
        color: ${assocDash.text};
        background: ${assocDash.surface};
        transition: border-color 0.15s ease, box-shadow 0.15s ease;
      }

      .opportunity-input:focus {
        outline: none;
        border-color: ${assocDash.accent};
        box-shadow: ${assocDash.focusShadow};
      }

      .opportunity-input-title {
        font-size: 16px;
        font-weight: 600;
        letter-spacing: -0.01em;
      }

      .opportunity-textarea {
        min-height: 120px;
        resize: vertical;
        line-height: 1.55;
      }

      .opportunity-input-icon-wrap {
        position: relative;
      }

      .opportunity-input-icon {
        position: absolute;
        left: 14px;
        top: 50%;
        transform: translateY(-50%);
        color: ${assocDash.subtle};
        pointer-events: none;
      }

      .opportunity-input-with-icon {
        padding-left: 40px;
      }

      .opportunity-visibility {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 14px 16px;
        border-radius: 12px;
        border: 1px solid ${assocDash.border};
        background: ${assocDash.bg};
        cursor: pointer;
        margin-top: 4px;
      }

      .opportunity-visibility-check {
        position: absolute;
        opacity: 0;
        width: 0;
        height: 0;
      }

      .opportunity-visibility-track {
        width: 40px;
        height: 22px;
        border-radius: 999px;
        background: ${assocDash.border};
        flex-shrink: 0;
        margin-top: 2px;
        position: relative;
        transition: background 0.2s ease;
      }

      .opportunity-visibility-track::after {
        content: '';
        position: absolute;
        top: 3px;
        left: 3px;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: ${assocDash.surface};
        box-shadow: ${assocDash.shadow};
        transition: transform 0.2s ease;
      }

      .opportunity-visibility-check:checked + .opportunity-visibility-track {
        background: ${assocDash.accent};
      }

      .opportunity-visibility-check:checked + .opportunity-visibility-track::after {
        transform: translateX(18px);
      }

      .opportunity-visibility-copy {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        font-size: 14px;
        color: ${assocDash.textSecondary};
      }

      .opportunity-visibility-copy strong {
        display: block;
        font-weight: 600;
        color: ${assocDash.text};
        margin-bottom: 2px;
      }

      .opportunity-visibility-copy small {
        display: block;
        font-size: 12px;
        color: ${assocDash.muted};
        line-height: 1.4;
      }

      .opportunity-positions-section {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .opportunity-positions-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
      }

      .opportunity-positions-count {
        flex-shrink: 0;
        font-size: 12px;
        font-weight: 700;
        padding: 6px 12px;
        border-radius: 999px;
        background: ${assocDash.accentMuted};
        border: 1px solid ${assocDash.accentBorder};
        color: ${assocDash.accentDark};
      }

      .opportunity-form-footer {
        padding-top: 8px;
        border-top: 1px solid ${assocDash.border};
      }

      .opportunity-form-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
      }

      .opportunity-submit {
        padding: 12px 24px;
        border-radius: ${assocDash.radiusMd}px;
        border: none;
        background: ${assocDash.gradient};
        color: #fff;
        font-size: 14px;
        font-weight: 700;
        cursor: pointer;
        font-family: inherit;
        box-shadow: ${assocDash.shadow};
        transition: opacity 0.15s ease, transform 0.15s ease;
      }

      .opportunity-submit:hover:not(:disabled) {
        transform: translateY(-1px);
      }

      .opportunity-submit:disabled {
        opacity: 0.65;
        cursor: not-allowed;
      }

      .opportunity-cancel {
        padding: 12px 20px;
        border-radius: ${assocDash.radiusMd}px;
        border: 1px solid ${assocDash.border};
        background: ${assocDash.surface};
        color: ${assocDash.text};
        font-size: 14px;
        font-weight: 600;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
      }

      .opportunity-form-hint {
        margin: 14px 0 0;
        font-size: 12px;
        color: ${assocDash.muted};
        line-height: 1.5;
      }

      .opportunity-field-error {
        display: block;
        margin-top: 6px;
        font-size: 12px;
        color: ${assocDash.error};
        font-weight: 500;
      }

      @media (max-width: 820px) {
        .opportunity-hero-grid {
          grid-template-columns: 1fr;
        }
        .opportunity-hero-cover {
          order: -1;
        }
      }
    `}</style>
  )
}
