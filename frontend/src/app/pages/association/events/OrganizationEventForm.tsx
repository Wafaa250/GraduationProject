import { useState, type CSSProperties, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { OrganizationEventCoverUpload } from '../../../components/association/OrganizationEventCoverUpload'
import {
  ORGANIZATION_EVENT_CATEGORIES,
  ORGANIZATION_EVENT_TYPES,
  type CreateOrganizationEventPayload,
  type StudentOrganizationEvent,
} from '../../../../api/organizationEventsApi'
import { assocCard, assocDash } from '../dashboard/associationDashTokens'
import { datetimeLocalToIso, toDatetimeLocalValue } from './eventFormUtils'

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

export function OrganizationEventForm({
  mode,
  initialValues,
  submitLabel,
  cancelTo,
  saving,
  onSubmit,
}: Props) {
  const [form, setForm] = useState<EventFormValues>(initialValues ?? emptyValues)
  const [errors, setErrors] = useState<Record<string, string>>({})

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
    <form onSubmit={(e) => void handleSubmit(e)} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <FormSection title="Basic information">
        <Field label="Title" required error={errors.title}>
          <input
            style={inputStyle}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. Spring Hackathon 2026"
          />
        </Field>
        <Field label="Description" required error={errors.description}>
          <textarea
            style={{ ...inputStyle, minHeight: 120, resize: 'vertical' }}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="What is this event about? Who should attend?"
          />
        </Field>
      </FormSection>

      <FormSection title="Event classification">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <Field label="Event type" required error={errors.eventType}>
            <select
              style={inputStyle}
              value={form.eventType}
              onChange={(e) => setForm({ ...form, eventType: e.target.value })}
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
              style={inputStyle}
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
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

      <FormSection title="Time & location">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <Field label="Event date" required error={errors.eventDate}>
            <input
              type="datetime-local"
              style={inputStyle}
              value={form.eventDate}
              onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
            />
          </Field>
          <Field label="Registration deadline" error={errors.registrationDeadline}>
            <input
              type="datetime-local"
              style={inputStyle}
              value={form.registrationDeadline}
              onChange={(e) => setForm({ ...form, registrationDeadline: e.target.value })}
            />
            <span style={{ fontSize: 11, color: assocDash.muted, marginTop: 4, display: 'block' }}>
              Optional — must be before the event date
            </span>
          </Field>
        </div>
        <Field label="Location" error={errors.location}>
          <input
            style={inputStyle}
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            placeholder={form.isOnline ? 'Online link or platform (optional)' : 'Building, room, or address'}
            disabled={form.isOnline}
          />
        </Field>
        <label
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 14,
            fontWeight: 600,
            color: assocDash.text,
            cursor: 'pointer',
          }}
        >
          <input
            type="checkbox"
            checked={form.isOnline}
            onChange={(e) => setForm({ ...form, isOnline: e.target.checked, location: e.target.checked ? '' : form.location })}
          />
          This is an online event
        </label>
      </FormSection>

      <FormSection title="Optional details">
        <Field label="Max participants" error={errors.maxParticipants}>
          <input
            type="number"
            min={1}
            style={inputStyle}
            value={form.maxParticipants}
            onChange={(e) => setForm({ ...form, maxParticipants: e.target.value })}
            placeholder="Leave empty for no limit"
          />
        </Field>
        <Field label="Cover image">
          <OrganizationEventCoverUpload
            coverImageUrl={form.coverImageUrl}
            onCoverImageUrlChange={(url) => setForm({ ...form, coverImageUrl: url })}
            disabled={saving}
          />
        </Field>
      </FormSection>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, paddingTop: 4 }}>
        <button type="submit" disabled={saving} style={primaryBtn(saving)}>
          {saving ? 'Saving…' : submitLabel}
        </button>
        <Link to={cancelTo} style={secondaryBtn}>
          Cancel
        </Link>
      </div>

      {mode === 'create' && (
        <p style={{ margin: 0, fontSize: 12, color: assocDash.muted }}>
          Student registration and discovery will be available in a future release.
        </p>
      )}
    </form>
  )
}

function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section style={{ ...assocCard, padding: 24 }}>
      <h2
        style={{
          margin: '0 0 16px',
          fontSize: 15,
          fontWeight: 700,
          fontFamily: assocDash.fontDisplay,
          color: assocDash.text,
        }}
      >
        {title}
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>{children}</div>
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
  error?: string
  children: ReactNode
}) {
  return (
    <label style={{ display: 'block' }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: assocDash.text }}>
        {label}
        {required && <span style={{ color: '#ef4444' }}> *</span>}
        {!required && <span style={{ fontWeight: 400, color: assocDash.muted }}> (optional)</span>}
      </span>
      <div style={{ height: 8 }} />
      {children}
      {error && <p style={{ margin: '6px 0 0', fontSize: 12, color: '#b91c1c' }}>{error}</p>}
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

const secondaryBtn: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '10px 20px',
  borderRadius: assocDash.radiusMd,
  border: `1px solid ${assocDash.border}`,
  background: '#fff',
  color: assocDash.muted,
  fontSize: 14,
  fontWeight: 600,
  textDecoration: 'none',
  fontFamily: 'inherit',
}
