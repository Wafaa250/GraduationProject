import { useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  Calendar,
  CalendarClock,
  Check,
  Circle,
  FileText,
  ImagePlus,
  MapPin,
  Tags,
  Users,
  Wifi,
} from 'lucide-react'
import { resolveApiFileUrl } from '@/api/axiosInstance'
import {
  OrganizationEventCoverUpload,
  type CoverUploadHandle,
} from '@/components/association/OrganizationEventCoverUpload'
import {
  ORGANIZATION_EVENT_CATEGORIES,
  ORGANIZATION_EVENT_TYPES,
  type CreateOrganizationEventPayload,
  type StudentOrganizationEvent,
} from '@/api/organizationEventsApi'
import { assocDash } from '../dashboard/associationDashTokens'
import '@/styles/association-event-form.css'
import {
  datetimeLocalToIso,
  formatDatetimeLocalDisplay,
  syncRegistrationDeadline,
  toDatetimeLocalValue,
} from './eventFormUtils'

export type EventFormValues = {
  title: string
  description: string
  eventType: string
  category: string
  location: string
  isOnline: boolean
  eventDate: string
  registrationDeadline: string
  maxParticipants: string
  coverImageUrl: string | null
}

const emptyValues: EventFormValues = {
  title: '',
  description: '',
  eventType: ORGANIZATION_EVENT_TYPES[0],
  category: ORGANIZATION_EVENT_CATEGORIES[0],
  location: '',
  isOnline: false,
  eventDate: '',
  registrationDeadline: '',
  maxParticipants: '',
  coverImageUrl: null,
}

export function eventToFormValues(event: StudentOrganizationEvent): EventFormValues {
  return {
    title: event.title,
    description: event.description,
    eventType: event.eventType,
    category: event.category,
    location: event.location ?? '',
    isOnline: event.isOnline,
    eventDate: toDatetimeLocalValue(event.eventDate),
    registrationDeadline: toDatetimeLocalValue(event.registrationDeadline),
    maxParticipants: event.maxParticipants != null ? String(event.maxParticipants) : '',
    coverImageUrl: event.coverImageUrl ?? null,
  }
}

type Props = {
  mode: 'create' | 'edit'
  initialValues?: EventFormValues
  submitLabel: string
  cancelTo: string
  saving: boolean
  onSubmit: (payload: CreateOrganizationEventPayload) => Promise<void>
}

type ReadinessItem = {
  id: string
  label: string
  done: boolean
  optional?: boolean
}

function buildReadiness(form: EventFormValues): ReadinessItem[] {
  return [
    { id: 'title', label: 'Event name', done: !!form.title.trim() },
    { id: 'description', label: 'Description', done: !!form.description.trim() },
    { id: 'date', label: 'Date & time', done: !!form.eventDate },
    { id: 'cover', label: 'Cover image', done: !!form.coverImageUrl, optional: true },
  ]
}

function requiredFieldsComplete(form: EventFormValues): boolean {
  return (
    !!form.title.trim() &&
    !!form.description.trim() &&
    !!form.eventType &&
    !!form.category &&
    !!form.eventDate
  )
}

export function OrganizationEventForm({
  mode: _mode,
  initialValues,
  submitLabel,
  cancelTo,
  saving,
  onSubmit,
}: Props) {
  const [form, setForm] = useState<EventFormValues>(initialValues ?? emptyValues)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const readiness = useMemo(() => buildReadiness(form), [form])
  const requiredComplete = requiredFieldsComplete(form)
  const requiredCount = readiness.filter((item) => !item.optional).length
  const requiredDoneCount = readiness.filter((item) => !item.optional && item.done).length

  const patchForm = (patch: Partial<EventFormValues>) => {
    setForm((prev) => {
      const next = { ...prev, ...patch }
      if ('eventDate' in patch && patch.eventDate !== undefined) {
        next.registrationDeadline = syncRegistrationDeadline(
          next.eventDate,
          next.registrationDeadline,
        )
      }
      return next
    })
  }

  const validate = (): boolean => {
    const next: Record<string, string> = {}
    if (!form.title.trim()) next.title = 'Title is required.'
    if (!form.description.trim()) next.description = 'Description is required.'
    if (!form.eventType) next.eventType = 'Event type is required.'
    if (!form.category) next.category = 'Category is required.'
    if (!form.eventDate) next.eventDate = 'Event date is required.'

    const eventIso = datetimeLocalToIso(form.eventDate)
    const regIso = datetimeLocalToIso(form.registrationDeadline)
    if (form.registrationDeadline && regIso && eventIso && new Date(regIso) > new Date(eventIso)) {
      next.registrationDeadline = 'Registration deadline must be on or before the event date.'
    }

    if (form.maxParticipants.trim()) {
      const n = Number(form.maxParticipants)
      if (!Number.isInteger(n) || n < 1) next.maxParticipants = 'Max participants must be a positive number.'
    }

    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    const eventDate = datetimeLocalToIso(form.eventDate)
    if (!eventDate) {
      setErrors({ eventDate: 'Invalid event date.' })
      return
    }

    const payload: CreateOrganizationEventPayload = {
      title: form.title.trim(),
      description: form.description.trim(),
      eventType: form.eventType,
      category: form.category,
      location: form.location.trim() || undefined,
      isOnline: form.isOnline,
      eventDate,
      registrationDeadline: datetimeLocalToIso(form.registrationDeadline),
      coverImageUrl: form.coverImageUrl ?? undefined,
      maxParticipants: form.maxParticipants.trim()
        ? Number(form.maxParticipants)
        : undefined,
    }

    await onSubmit(payload)
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="event-form">
      <div className="event-form-layout">
        <div className="event-form-main">
          <FormSection tier="primary" title="Event basics" icon={FileText}>
            <Field label="Title" required error={errors.title}>
              <input
                className="event-form-input event-form-title-input"
                value={form.title}
                onChange={(e) => patchForm({ title: e.target.value })}
                placeholder="Spring Hackathon 2026"
              />
            </Field>
            <Field label="Description" required error={errors.description}>
              <textarea
                className="event-form-input event-form-textarea"
                value={form.description}
                onChange={(e) => patchForm({ description: e.target.value })}
                placeholder="What is this event about? Who should attend?"
              />
            </Field>
          </FormSection>

          <FormSection tier="secondary" title="Event classification" icon={Tags}>
            <div className="event-form-grid-2">
              <Field label="Event type" required error={errors.eventType}>
                <select
                  className="event-form-input event-form-select"
                  value={form.eventType}
                  onChange={(e) => patchForm({ eventType: e.target.value })}
                >
                  {ORGANIZATION_EVENT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Category" required error={errors.category}>
                <select
                  className="event-form-input event-form-select"
                  value={form.category}
                  onChange={(e) => patchForm({ category: e.target.value })}
                >
                  {ORGANIZATION_EVENT_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </FormSection>

          <FormSection tier="secondary" title="Schedule & registration" icon={CalendarClock}>
            <div className="event-form-grid-2">
              <Field label="Event date" required error={errors.eventDate}>
                <input
                  type="datetime-local"
                  className="event-form-input event-form-datetime"
                  value={form.eventDate}
                  onChange={(e) => patchForm({ eventDate: e.target.value })}
                />
              </Field>
              <Field label="Registration deadline" optional error={errors.registrationDeadline}>
                <input
                  type="datetime-local"
                  className="event-form-input event-form-datetime"
                  value={form.registrationDeadline}
                  max={form.eventDate || undefined}
                  disabled={!form.eventDate}
                  onChange={(e) => patchForm({ registrationDeadline: e.target.value })}
                />
              </Field>
            </div>
          </FormSection>

          <FormSection tier="secondary" title="Location & attendance" icon={MapPin}>
            <div className="event-form-online-row">
              <label className="event-form-toggle">
                <input
                  type="checkbox"
                  checked={form.isOnline}
                  onChange={(e) =>
                    patchForm({
                      isOnline: e.target.checked,
                      location: e.target.checked ? '' : form.location,
                    })
                  }
                />
                <span className="event-form-toggle-track" aria-hidden />
                <span className="event-form-toggle-label">Online event</span>
              </label>
            </div>
            <Field label="Location" optional error={errors.location}>
              <input
                className="event-form-input"
                value={form.location}
                onChange={(e) => patchForm({ location: e.target.value })}
                placeholder={form.isOnline ? 'Link or platform' : 'Building, room, or address'}
                disabled={form.isOnline}
              />
            </Field>
            <Field label="Max participants" optional error={errors.maxParticipants}>
              <div className="event-form-input-icon-wrap">
                <Users size={16} strokeWidth={2} className="event-form-input-icon" aria-hidden />
                <input
                  type="number"
                  min={1}
                  className="event-form-input event-form-input-with-icon"
                  value={form.maxParticipants}
                  onChange={(e) => patchForm({ maxParticipants: e.target.value })}
                  placeholder="No limit"
                />
              </div>
            </Field>
          </FormSection>
        </div>

        <EventFormWorkspace
          form={form}
          saving={saving}
          submitLabel={submitLabel}
          cancelTo={cancelTo}
          readiness={readiness}
          requiredComplete={requiredComplete}
          requiredDoneCount={requiredDoneCount}
          requiredCount={requiredCount}
          onCoverChange={(url) => patchForm({ coverImageUrl: url })}
        />
      </div>

      <div className="event-form-actions-mobile">
        <button
          type="submit"
          disabled={saving || !requiredComplete}
          className="event-form-submit"
        >
          {saving ? 'Saving…' : submitLabel}
        </button>
        <Link to={cancelTo} className="event-form-cancel">
          Cancel
        </Link>
      </div>

      <FormStyles />
    </form>
  )
}

function EventFormWorkspace({
  form,
  saving,
  submitLabel,
  cancelTo,
  readiness,
  requiredComplete,
  requiredDoneCount,
  requiredCount,
  onCoverChange,
}: {
  form: EventFormValues
  saving: boolean
  submitLabel: string
  cancelTo: string
  readiness: ReadinessItem[]
  requiredComplete: boolean
  requiredDoneCount: number
  requiredCount: number
  onCoverChange: (url: string | null) => void
}) {
  const coverRef = useRef<CoverUploadHandle>(null)
  const cover = form.coverImageUrl ? resolveApiFileUrl(form.coverImageUrl) : null
  const title = form.title.trim() || 'Untitled event'
  const description = form.description.trim()
  const eventWhen = formatDatetimeLocalDisplay(form.eventDate)
  const regWhen = formatDatetimeLocalDisplay(form.registrationDeadline)
  const locationLabel = form.isOnline
    ? 'Online event'
    : form.location.trim() || null
  const capacityLabel = form.maxParticipants.trim()
    ? `${form.maxParticipants} max`
    : null
  const hasMeta = !!(eventWhen || regWhen || locationLabel || form.isOnline || capacityLabel)

  return (
    <aside className="event-form-aside">
      <div className="event-form-workspace">
        <div className="event-form-workspace-label">Live preview</div>

        <div
          className={`event-form-preview${cover ? ' event-form-preview--cover' : ''}`}
          style={cover ? { backgroundImage: `url(${cover})` } : undefined}
        >
          <div className="event-form-preview-scrim" />
          {!cover && (
            <button
              type="button"
              className="event-form-preview-cover-cta"
              onClick={() => coverRef.current?.open()}
              disabled={saving}
            >
              <ImagePlus size={16} strokeWidth={2} />
              Add cover
            </button>
          )}
          {cover && (
            <div className="event-form-preview-cover-actions">
              <button
                type="button"
                className="event-form-preview-cover-btn"
                onClick={() => coverRef.current?.open()}
                disabled={saving}
              >
                Change
              </button>
              <button
                type="button"
                className="event-form-preview-cover-btn event-form-preview-cover-btn--remove"
                onClick={() => coverRef.current?.clear()}
                disabled={saving}
              >
                Remove
              </button>
            </div>
          )}
          <div className="event-form-preview-body">
            <div className="event-form-preview-badges">
              <span className="event-form-preview-badge">{form.eventType}</span>
              <span className="event-form-preview-badge event-form-preview-badge--muted">
                {form.category}
              </span>
            </div>
            <h3 className="event-form-preview-title">{title}</h3>
            {!hasMeta && !description && (
              <p className="event-form-preview-placeholder">
                Details appear here as you fill in the form
              </p>
            )}
          </div>
        </div>

        <OrganizationEventCoverUpload
          ref={coverRef}
          variant="headless"
          coverImageUrl={form.coverImageUrl}
          onCoverImageUrlChange={onCoverChange}
          disabled={saving}
        />

        {hasMeta && (
          <div className="event-form-preview-meta">
            {eventWhen && <PreviewMetaRow icon={Calendar} label="Event" value={eventWhen} />}
            {regWhen && (
              <PreviewMetaRow icon={CalendarClock} label="Registration closes" value={regWhen} />
            )}
            {(locationLabel || form.isOnline) && (
              <PreviewMetaRow
                icon={form.isOnline ? Wifi : MapPin}
                label="Location"
                value={locationLabel ?? 'Online event'}
              />
            )}
            {capacityLabel && (
              <PreviewMetaRow icon={Users} label="Capacity" value={capacityLabel} />
            )}
          </div>
        )}

        {description && (
          <p className="event-form-preview-desc">{description.length > 160 ? `${description.slice(0, 160)}…` : description}</p>
        )}

        <div className="event-form-readiness">
          <div className="event-form-readiness-head">
            <span className="event-form-readiness-title">Ready to publish</span>
            <span className="event-form-readiness-count">
              {requiredDoneCount}/{requiredCount}
            </span>
          </div>
          <div className="event-form-readiness-bar" aria-hidden>
            <div
              className="event-form-readiness-bar-fill"
              style={{ width: `${(requiredDoneCount / requiredCount) * 100}%` }}
            />
          </div>
          <ul className="event-form-readiness-list">
            {readiness.map((item) => (
              <li key={item.id} className="event-form-readiness-item">
                {item.done ? (
                  <Check size={14} strokeWidth={2.5} className="event-form-readiness-icon--done" />
                ) : (
                  <Circle size={14} strokeWidth={2} className="event-form-readiness-icon--todo" />
                )}
                <span className={item.done ? 'event-form-readiness-label--done' : undefined}>
                  {item.label}
                </span>
                {item.optional && <span className="event-form-readiness-optional">Optional</span>}
              </li>
            ))}
          </ul>
        </div>

        <div className="event-form-actions-card">
          <button
            type="submit"
            disabled={saving || !requiredComplete}
            className="event-form-submit"
          >
            {saving ? 'Saving…' : submitLabel}
          </button>
          <Link to={cancelTo} className="event-form-cancel">
            Cancel
          </Link>
        </div>
      </div>
    </aside>
  )
}

function PreviewMetaRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Calendar
  label: string
  value: string
}) {
  return (
    <div className="event-form-preview-meta-row">
      <Icon size={15} strokeWidth={2} aria-hidden />
      <div>
        <span className="event-form-preview-meta-label">{label}</span>
        <span className="event-form-preview-meta-value">{value}</span>
      </div>
    </div>
  )
}

function FormSection({
  tier,
  title,
  icon: Icon,
  children,
}: {
  tier: 'primary' | 'secondary'
  title: string
  icon: typeof FileText
  children: ReactNode
}) {
  return (
    <section className={`event-form-section event-form-section--${tier}`}>
      <div className="event-form-section-header">
        <div
          className={`event-form-section-icon${tier === 'primary' ? ' event-form-section-icon--primary' : ''}`}
          aria-hidden
        >
          <Icon size={tier === 'primary' ? 18 : 16} strokeWidth={2} />
        </div>
        <h2
          className={`event-form-section-title${tier === 'primary' ? ' event-form-section-title--primary' : ''}`}
        >
          {title}
        </h2>
      </div>
      <div className="event-form-fields">{children}</div>
    </section>
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
  optional?: boolean
  error?: string
  children: ReactNode
}) {
  return (
    <label style={{ display: 'block' }}>
      <span className="event-form-field-label">
        {label}
        {required && <span className="event-form-field-required"> *</span>}
      </span>
      {children}
      {error && <p className="event-form-field-error">{error}</p>}
    </label>
  )
}

function FormStyles() {
  return (
    <style>{`
      .event-form-layout {
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        gap: 24px;
        align-items: start;
      }
      @media (min-width: 960px) {
        .event-form-layout {
          grid-template-columns: minmax(0, 1fr) 340px;
          gap: 32px;
        }
      }
      .event-form-main {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .event-form-aside {
        display: flex;
        flex-direction: column;
      }
      @media (min-width: 960px) {
        .event-form-aside {
          position: sticky;
          top: 16px;
        }
      }
      .event-form-workspace {
        background: ${assocDash.surface};
        border-radius: ${assocDash.radiusLg}px;
        border: 1px solid ${assocDash.border};
        box-shadow: ${assocDash.shadowLg};
        overflow: hidden;
      }
      .event-form-workspace-label {
        padding: 14px 18px 0;
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0.07em;
        text-transform: uppercase;
        color: ${assocDash.subtle};
      }
      .event-form-preview {
        position: relative;
        margin: 12px 14px 0;
        border-radius: 12px;
        overflow: hidden;
        min-height: 168px;
        background: linear-gradient(145deg, ${assocDash.accentMuted} 0%, #fff 42%, #fff 100%);
        border: 1px solid ${assocDash.border};
        background-size: cover;
        background-position: center;
      }
      .event-form-preview--cover {
        min-height: 180px;
        border-color: transparent;
      }
      .event-form-preview-scrim {
        position: absolute;
        inset: 0;
        background: linear-gradient(to top, rgba(15, 23, 42, 0.72) 0%, rgba(15, 23, 42, 0.08) 58%);
        pointer-events: none;
      }
      .event-form-preview:not(.event-form-preview--cover) .event-form-preview-scrim {
        display: none;
      }
      .event-form-preview-cover-cta {
        position: absolute;
        top: 12px;
        right: 12px;
        z-index: 2;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 7px 12px;
        border-radius: 999px;
        border: 1.5px dashed ${assocDash.accentBorder};
        background: rgba(255, 255, 255, 0.92);
        color: ${assocDash.accentDark};
        font-size: 12px;
        font-weight: 600;
        font-family: inherit;
        cursor: pointer;
        transition: background 0.15s ease, border-color 0.15s ease;
      }
      .event-form-preview-cover-cta:hover:not(:disabled) {
        background: #fff;
        border-color: ${assocDash.accent};
      }
      .event-form-preview-cover-cta:disabled {
        opacity: 0.55;
        cursor: not-allowed;
      }
      .event-form-preview-cover-actions {
        position: absolute;
        top: 12px;
        right: 12px;
        z-index: 2;
        display: flex;
        gap: 6px;
      }
      .event-form-preview-cover-btn {
        padding: 6px 10px;
        border-radius: 8px;
        border: 1px solid rgba(255, 255, 255, 0.35);
        background: rgba(15, 23, 42, 0.45);
        color: #fff;
        font-size: 11px;
        font-weight: 600;
        font-family: inherit;
        cursor: pointer;
        backdrop-filter: blur(4px);
      }
      .event-form-preview-cover-btn:hover:not(:disabled) {
        background: rgba(15, 23, 42, 0.62);
      }
      .event-form-preview-cover-btn--remove {
        color: #fecaca;
        border-color: rgba(254, 202, 202, 0.45);
      }
      .event-form-preview-cover-btn:disabled {
        opacity: 0.55;
        cursor: not-allowed;
      }
      .event-form-preview-body {
        position: relative;
        padding: 44px 16px 16px;
        color: ${assocDash.text};
      }
      .event-form-preview--cover .event-form-preview-body {
        padding-top: 72px;
        color: #fff;
      }
      .event-form-preview-badges {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-bottom: 10px;
      }
      .event-form-preview-badge {
        padding: 3px 9px;
        border-radius: 999px;
        font-size: 11px;
        font-weight: 600;
        background: ${assocDash.accentMuted};
        color: ${assocDash.accentDark};
        border: 1px solid ${assocDash.accentBorder};
      }
      .event-form-preview--cover .event-form-preview-badge {
        background: rgba(255, 255, 255, 0.16);
        color: #fff;
        border-color: rgba(255, 255, 255, 0.28);
        backdrop-filter: blur(4px);
      }
      .event-form-preview-badge--muted {
        background: ${assocDash.bg};
        color: ${assocDash.muted};
        border-color: ${assocDash.border};
      }
      .event-form-preview--cover .event-form-preview-badge--muted {
        background: rgba(255, 255, 255, 0.1);
        color: rgba(255, 255, 255, 0.88);
        border-color: rgba(255, 255, 255, 0.2);
      }
      .event-form-preview-title {
        margin: 0;
        font-family: ${assocDash.fontDisplay};
        font-size: 20px;
        font-weight: 700;
        line-height: 1.25;
        letter-spacing: -0.02em;
      }
      .event-form-preview-placeholder {
        margin: 8px 0 0;
        font-size: 13px;
        font-style: italic;
        line-height: 1.45;
        color: ${assocDash.subtle};
      }
      .event-form-preview--cover .event-form-preview-placeholder {
        color: rgba(255, 255, 255, 0.78);
      }
      .event-form-preview-meta {
        padding: 14px 18px 0;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .event-form-preview-meta-row {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        color: ${assocDash.subtle};
      }
      .event-form-preview-meta-row > div {
        display: flex;
        flex-direction: column;
        gap: 1px;
        min-width: 0;
      }
      .event-form-preview-meta-label {
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: ${assocDash.subtle};
      }
      .event-form-preview-meta-value {
        font-size: 13px;
        font-weight: 500;
        line-height: 1.4;
        color: ${assocDash.text};
      }
      .event-form-preview-desc {
        margin: 0;
        padding: 12px 18px 0;
        font-size: 13px;
        line-height: 1.55;
        color: ${assocDash.muted};
      }
      .event-form-readiness {
        margin: 16px 14px 0;
        padding: 14px;
        border-radius: 12px;
        background: ${assocDash.bg};
        border: 1px solid ${assocDash.border};
      }
      .event-form-readiness-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 10px;
        padding-bottom: 10px;
        border-bottom: 1px solid ${assocDash.border};
      }
      .event-form-readiness-title {
        font-size: 13px;
        font-weight: 600;
        color: ${assocDash.text};
      }
      .event-form-readiness-count {
        font-size: 12px;
        font-weight: 700;
        color: ${assocDash.accentDark};
        font-variant-numeric: tabular-nums;
      }
      .event-form-readiness-bar {
        display: none;
      }
      .event-form-readiness-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .event-form-readiness-item {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        color: ${assocDash.muted};
      }
      .event-form-readiness-icon--done {
        color: ${assocDash.accentDark};
        flex-shrink: 0;
      }
      .event-form-readiness-icon--todo {
        color: ${assocDash.border};
        flex-shrink: 0;
      }
      .event-form-readiness-label--done {
        color: ${assocDash.textSecondary};
      }
      .event-form-readiness-optional {
        margin-left: auto;
        font-size: 11px;
        font-weight: 500;
        color: ${assocDash.subtle};
      }
      .event-form-section--primary {
        background: ${assocDash.surface};
        border-radius: ${assocDash.radiusLg}px;
        border: 1px solid ${assocDash.border};
        box-shadow: ${assocDash.shadowLg};
        padding: 32px;
        border-top: 3px solid ${assocDash.accent};
      }
      .event-form-section--secondary {
        background: ${assocDash.surface};
        border-radius: ${assocDash.radiusMd}px;
        border: 1px solid ${assocDash.border};
        padding: 20px 22px;
      }
      .event-form-section-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 20px;
      }
      .event-form-section--primary .event-form-section-header {
        margin-bottom: 24px;
      }
      .event-form-section-icon {
        flex-shrink: 0;
        width: 34px;
        height: 34px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: ${assocDash.accentDark};
        background: ${assocDash.accentMuted};
        border: 1px solid ${assocDash.accentBorder};
      }
      .event-form-section-icon--primary {
        width: 40px;
        height: 40px;
        border-radius: 11px;
      }
      .event-form-section-title {
        margin: 0;
        font-size: 15px;
        font-weight: 600;
        line-height: 1.3;
        color: ${assocDash.text};
      }
      .event-form-section-title--primary {
        font-family: ${assocDash.fontDisplay};
        font-size: 20px;
        font-weight: 700;
        letter-spacing: -0.02em;
      }
      .event-form-fields {
        display: flex;
        flex-direction: column;
        gap: 18px;
      }
      .event-form-section--primary .event-form-fields {
        gap: 22px;
      }
      .event-form-grid-2 {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;
      }
      .event-form-field-label {
        display: block;
        font-size: 12px;
        font-weight: 600;
        line-height: 1.35;
        letter-spacing: 0.02em;
        color: ${assocDash.label};
        margin-bottom: 7px;
        text-transform: uppercase;
      }
      .event-form-field-required {
        color: #ef4444;
        text-transform: none;
      }
      .event-form-field-error {
        margin: 6px 0 0;
        font-size: 12px;
        line-height: 1.4;
        color: #b91c1c;
        font-weight: 500;
      }
      .event-form-input {
        width: 100%;
        padding: 12px 14px;
        border-radius: 10px;
        border: 1.5px solid ${assocDash.border};
        background: ${assocDash.surface};
        font-size: 14px;
        line-height: 1.45;
        color: ${assocDash.text};
        font-family: inherit;
        box-sizing: border-box;
        transition: border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
      }
      .event-form-title-input {
        font-family: ${assocDash.fontDisplay};
        font-size: 20px;
        font-weight: 600;
        letter-spacing: -0.02em;
        padding: 14px 16px;
      }
      .event-form-input:hover:not(:disabled) {
        border-color: ${assocDash.subtle};
      }
      .event-form-input:focus {
        outline: none;
        border-color: ${assocDash.accent};
        box-shadow: 0 0 0 3px ${assocDash.accentMuted};
      }
      .event-form-input:disabled {
        background: ${assocDash.bg};
        color: ${assocDash.subtle};
        cursor: not-allowed;
        opacity: 0.75;
      }
      .event-form-textarea {
        min-height: 132px;
        resize: vertical;
      }
      .event-form-select {
        appearance: none;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 12px center;
        padding-right: 36px;
        cursor: pointer;
      }
      .event-form-datetime {
        color-scheme: light;
      }
      .event-form-input-icon-wrap {
        position: relative;
      }
      .event-form-input-icon {
        position: absolute;
        left: 14px;
        top: 50%;
        transform: translateY(-50%);
        color: ${assocDash.subtle};
        pointer-events: none;
      }
      .event-form-input-with-icon {
        padding-left: 40px;
      }
      .event-form-online-row {
        margin-bottom: 2px;
      }
      .event-form-toggle {
        display: inline-flex;
        align-items: center;
        gap: 12px;
        cursor: pointer;
        user-select: none;
      }
      .event-form-toggle input {
        position: absolute;
        opacity: 0;
        width: 0;
        height: 0;
      }
      .event-form-toggle-track {
        position: relative;
        width: 44px;
        height: 24px;
        border-radius: 999px;
        background: ${assocDash.border};
        flex-shrink: 0;
        transition: background 0.2s ease;
      }
      .event-form-toggle-track::after {
        content: '';
        position: absolute;
        top: 3px;
        left: 3px;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: #fff;
        box-shadow: 0 1px 3px rgba(15, 23, 42, 0.15);
        transition: transform 0.2s ease;
      }
      .event-form-toggle input:checked + .event-form-toggle-track {
        background: ${assocDash.accent};
      }
      .event-form-toggle input:checked + .event-form-toggle-track::after {
        transform: translateX(20px);
      }
      .event-form-toggle input:focus-visible + .event-form-toggle-track {
        box-shadow: 0 0 0 3px ${assocDash.accentMuted};
      }
      .event-form-toggle-label {
        font-size: 14px;
        font-weight: 600;
        color: ${assocDash.text};
      }
      .event-form-actions-card {
        padding: 14px;
        border-top: 1px solid ${assocDash.border};
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .event-form-submit {
        width: 100%;
        padding: 13px 20px;
        border-radius: ${assocDash.radiusMd}px;
        border: none;
        background: ${assocDash.gradient};
        color: #fff;
        font-size: 14px;
        font-weight: 600;
        font-family: inherit;
        cursor: pointer;
        transition: opacity 0.15s ease, transform 0.1s ease;
      }
      .event-form-submit:hover:not(:disabled) {
        opacity: 0.95;
      }
      .event-form-submit:active:not(:disabled) {
        transform: scale(0.99);
      }
      .event-form-submit:disabled {
        opacity: 0.45;
        cursor: not-allowed;
      }
      .event-form-cancel {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        padding: 11px 20px;
        border-radius: ${assocDash.radiusMd}px;
        border: none;
        background: transparent;
        color: ${assocDash.muted};
        font-size: 13px;
        font-weight: 600;
        text-decoration: none;
        font-family: inherit;
        transition: color 0.15s ease, background 0.15s ease;
      }
      .event-form-cancel:hover {
        color: ${assocDash.text};
        background: ${assocDash.bg};
      }
      .event-form-actions-mobile {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 24px;
      }
      .event-form-actions-mobile .event-form-submit,
      .event-form-actions-mobile .event-form-cancel {
        width: auto;
        flex: 1;
        min-width: 140px;
      }
      @media (min-width: 960px) {
        .event-form-actions-mobile {
          display: none;
        }
      }
    `}</style>
  )
}
