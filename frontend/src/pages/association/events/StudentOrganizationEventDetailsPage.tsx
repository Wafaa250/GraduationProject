import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  Calendar,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  MapPin,
  Wifi,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { resolveApiFileUrl } from '@/api/axiosInstance'
import type { EventRegistrationField } from '@/api/eventRegistrationFormApi'
import {
  getMyEventRegistration,
  submitEventRegistration,
  parseApiErrorMessage,
  type EventRegistrationAnswerInput,
} from '@/api/eventRegistrationsApi'
import { getPublicOrganizationEvent } from '@/api/organizationsPublicApi'
import type { PublicOrganizationEventDetail } from '@/api/organizationsPublicApi'
import { ROUTES } from '@/routes/paths'
import {
  eventFieldUsesOptions,
  normalizeEventFieldType,
} from '@/utils/eventRegistrationFormFields'
import {
  formatEventDate,
  formatRegistrationCloseDate,
  getRegistrationDeadlineStatus,
} from './eventFormUtils'
import '@/styles/student-event-detail.css'

function orgInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'OR'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

export default function StudentOrganizationEventDetailsPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const orgIdFromQuery = Number(searchParams.get('orgId') ?? 0)
  const numericEventId = Number(eventId)

  const [event, setEvent] = useState<PublicOrganizationEventDetail | null>(null)
  const [registrationFields, setRegistrationFields] = useState<EventRegistrationField[]>([])
  const [loading, setLoading] = useState(true)
  const [hasRegistered, setHasRegistered] = useState(false)
  const [registrationStatusLoading, setRegistrationStatusLoading] = useState(false)
  const [showRegistrationForm, setShowRegistrationForm] = useState(false)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [checkboxAnswers, setCheckboxAnswers] = useState<Record<number, string[]>>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!Number.isFinite(numericEventId) || orgIdFromQuery <= 0) {
      setLoading(false)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const pub = await getPublicOrganizationEvent(orgIdFromQuery, numericEventId)
        if (!cancelled) {
          setEvent(pub)
          setRegistrationFields(pub.registrationForm?.fields ?? [])
        }
      } catch (err) {
        toast.error(parseApiErrorMessage(err))
        if (!cancelled) navigate(ROUTES.communicationHub)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [numericEventId, navigate, orgIdFromQuery])

  useEffect(() => {
    if (!Number.isFinite(numericEventId) || orgIdFromQuery <= 0) return
    let cancelled = false
    setRegistrationStatusLoading(true)
    void getMyEventRegistration(orgIdFromQuery, numericEventId)
      .then((s) => {
        if (!cancelled) setHasRegistered(!!s.hasSubmitted)
      })
      .catch(() => {
        if (!cancelled) setHasRegistered(false)
      })
      .finally(() => {
        if (!cancelled) setRegistrationStatusLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [numericEventId, orgIdFromQuery])

  const registrationClosed = useMemo(() => {
    return getRegistrationDeadlineStatus(event?.registrationDeadline ?? null) === 'closed'
  }, [event?.registrationDeadline])

  const canRegister =
    !hasRegistered &&
    registrationFields.length > 0 &&
    !registrationClosed &&
    !registrationStatusLoading

  const cover = event?.coverImageUrl ? resolveApiFileUrl(event.coverImageUrl) : null
  const regCloseLabel = event?.registrationDeadline
    ? formatRegistrationCloseDate(event.registrationDeadline)
    : null

  const handleSubmit = async () => {
    if (!event || orgIdFromQuery <= 0) return
    setSubmitting(true)
    try {
      const payload: EventRegistrationAnswerInput[] = registrationFields.map((f) => {
        const type = normalizeEventFieldType(f.fieldType)
        if (type === 'CheckboxList') {
          return { fieldId: f.id, values: checkboxAnswers[f.id] ?? [] }
        }
        return { fieldId: f.id, value: answers[f.id] ?? '' }
      })
      await submitEventRegistration(orgIdFromQuery, event.id, payload)
      toast.success('Registration submitted successfully')
      setHasRegistered(true)
      setShowRegistrationForm(false)
    } catch (err) {
      toast.error(parseApiErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const registerStatusPill = hasRegistered
    ? { label: 'Registered', className: 'student-event-detail__status-pill--done' }
    : registrationClosed
      ? { label: 'Closed', className: 'student-event-detail__status-pill--closed' }
      : registrationFields.length === 0
        ? { label: 'Unavailable', className: 'student-event-detail__status-pill--closed' }
        : { label: 'Open', className: 'student-event-detail__status-pill--open' }

  return (
    <div className="student-hub min-h-full bg-hero px-4 py-6 sm:px-6">
      <div className="student-event-detail">
        <Link
          to={ROUTES.communicationHub}
          className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-opacity hover:opacity-80"
        >
          <ArrowLeft size={16} aria-hidden />
          Back to Communication Hub
        </Link>

        {loading ? (
          <div className="hub-card p-8">
            <div className="student-event-detail__loading">
              <span className="student-event-detail__loading-spinner" aria-hidden />
              Loading event…
            </div>
          </div>
        ) : event ? (
          <article className="student-event-detail__card">
            <div
              className={`student-event-detail__hero${cover ? ' student-event-detail__hero--cover' : ''}`}
            >
              {cover ? (
                <>
                  <img src={cover} alt="" className="student-event-detail__hero-img" />
                  <div className="student-event-detail__hero-overlay" aria-hidden />
                </>
              ) : null}
              <div className="student-event-detail__hero-badges">
                <span
                  className={`student-event-detail__badge${cover ? ' student-event-detail__badge--on-dark' : ''}`}
                >
                  {event.eventType}
                </span>
                {event.category ? (
                  <span
                    className={`student-event-detail__badge${cover ? ' student-event-detail__badge--on-dark' : ''}`}
                  >
                    {event.category}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="student-event-detail__body">
              <div className="student-event-detail__org">
                <div className="student-event-detail__org-avatar">
                  {event.organizationLogoUrl ? (
                    <img
                      src={resolveApiFileUrl(event.organizationLogoUrl) ?? event.organizationLogoUrl}
                      alt=""
                    />
                  ) : (
                    orgInitials(event.organizationName)
                  )}
                </div>
                <div>
                  <p className="student-event-detail__org-label">Hosted by</p>
                  <p className="student-event-detail__org-name">{event.organizationName}</p>
                </div>
              </div>

              <h1 className="student-event-detail__title">{event.title}</h1>

              <div className="student-event-detail__meta-grid">
                <div className="student-event-detail__meta-item">
                  <Calendar size={16} className="student-event-detail__meta-icon" aria-hidden />
                  <div>
                    <p className="student-event-detail__meta-label">Event date</p>
                    <p className="student-event-detail__meta-value">{formatEventDate(event.eventDate)}</p>
                  </div>
                </div>
                <div className="student-event-detail__meta-item">
                  {event.isOnline ? (
                    <Wifi size={16} className="student-event-detail__meta-icon" aria-hidden />
                  ) : (
                    <MapPin size={16} className="student-event-detail__meta-icon" aria-hidden />
                  )}
                  <div>
                    <p className="student-event-detail__meta-label">
                      {event.isOnline ? 'Format' : 'Location'}
                    </p>
                    <p className="student-event-detail__meta-value">
                      {event.isOnline ? 'Online event' : event.location?.trim() || 'Location TBD'}
                    </p>
                  </div>
                </div>
                {event.registrationDeadline ? (
                  <div className="student-event-detail__meta-item">
                    <CalendarClock size={16} className="student-event-detail__meta-icon" aria-hidden />
                    <div>
                      <p className="student-event-detail__meta-label">Registration closes</p>
                      <p className="student-event-detail__meta-value">{regCloseLabel ?? '—'}</p>
                    </div>
                  </div>
                ) : null}
              </div>

              <section className="student-event-detail__about">
                <h2 className="student-event-detail__section-title">About this event</h2>
                <p className="student-event-detail__description">{event.description}</p>
              </section>

              <section className="student-event-detail__register" aria-labelledby="event-register-heading">
                <div className="student-event-detail__register-head">
                  <div>
                    <div className="student-event-detail__register-title-row">
                      <ClipboardList size={20} className="student-event-detail__register-icon" aria-hidden />
                      <h2 id="event-register-heading" className="student-event-detail__register-title">
                        Event registration
                      </h2>
                    </div>
                    <p className="student-event-detail__register-sub">
                      {event.registrationForm?.title?.trim()
                        ? event.registrationForm.title
                        : 'Complete the form below to reserve your spot.'}
                    </p>
                  </div>
                  {!registrationStatusLoading ? (
                    <span className={`student-event-detail__status-pill ${registerStatusPill.className}`}>
                      {registerStatusPill.label}
                    </span>
                  ) : null}
                </div>

                {registrationStatusLoading ? (
                  <div className="student-event-detail__loading">
                    <span className="student-event-detail__loading-spinner" aria-hidden />
                    Checking your registration status…
                  </div>
                ) : hasRegistered ? (
                  <div className="student-event-detail__registered-banner">
                    <CheckCircle2 size={22} strokeWidth={2.25} aria-hidden />
                    <div>
                      <p className="student-event-detail__registered-title">You&apos;re registered</p>
                      <p className="student-event-detail__registered-sub">
                        Your responses were submitted. The organization will contact you if needed.
                      </p>
                    </div>
                  </div>
                ) : registrationFields.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Registration is not open for this event yet.
                  </p>
                ) : registrationClosed ? (
                  <p className="text-sm text-muted-foreground">
                    Registration has closed for this event.
                  </p>
                ) : (
                  <>
                    {!showRegistrationForm ? (
                      <div className="student-event-detail__actions">
                        <button
                          type="button"
                          className="student-ws-btn-primary"
                          onClick={() => setShowRegistrationForm(true)}
                        >
                          Register for this event
                        </button>
                      </div>
                    ) : (
                      <div className="student-event-detail__form-panel">
                        <div className="student-event-detail__field-gap">
                          <StudentEventRegistrationFields
                            fields={registrationFields}
                            answers={answers}
                            checkboxAnswers={checkboxAnswers}
                            onAnswerChange={(fieldId, value) =>
                              setAnswers((prev) => ({ ...prev, [fieldId]: value }))
                            }
                            onCheckboxToggle={(fieldId, option, checked) =>
                              setCheckboxAnswers((prev) => {
                                const current = prev[fieldId] ?? []
                                const next = checked
                                  ? [...current, option]
                                  : current.filter((v) => v !== option)
                                return { ...prev, [fieldId]: next }
                              })
                            }
                          />
                        </div>
                        <div className="student-event-detail__actions">
                          <button
                            type="button"
                            className="student-ws-btn-primary"
                            disabled={submitting || !canRegister}
                            onClick={() => void handleSubmit()}
                          >
                            {submitting ? 'Submitting…' : 'Submit registration'}
                          </button>
                          <button
                            type="button"
                            className="text-sm font-semibold text-muted-foreground hover:text-foreground"
                            onClick={() => setShowRegistrationForm(false)}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </section>
            </div>
          </article>
        ) : null}
      </div>
    </div>
  )
}

function StudentEventRegistrationFields({
  fields,
  answers,
  checkboxAnswers,
  onAnswerChange,
  onCheckboxToggle,
}: {
  fields: EventRegistrationField[]
  answers: Record<number, string>
  checkboxAnswers: Record<number, string[]>
  onAnswerChange: (fieldId: number, value: string) => void
  onCheckboxToggle: (fieldId: number, option: string, checked: boolean) => void
}) {
  const sorted = [...fields].sort((a, b) => a.displayOrder - b.displayOrder)

  return (
    <>
      {sorted.map((field) => {
        const type = normalizeEventFieldType(field.fieldType)
        const label = (
          <span className="block text-sm font-semibold text-foreground">
            {field.label}
            {field.isRequired ? <span className="text-primary"> *</span> : null}
          </span>
        )

        if (type === 'Paragraph') {
          return (
            <label key={field.id} className="block">
              {label}
              <textarea
                className="student-ws-input mt-1.5 min-h-[96px] w-full"
                placeholder={field.placeholder ?? undefined}
                value={answers[field.id] ?? ''}
                onChange={(e) => onAnswerChange(field.id, e.target.value)}
              />
            </label>
          )
        }

        if (type === 'CheckboxList' && field.options?.length) {
          return (
            <fieldset key={field.id} className="block border-0 p-0">
              {label}
              <div className="mt-2 space-y-2 rounded-lg border border-border bg-secondary/40 p-3">
                {field.options.map((opt) => (
                  <label key={opt} className="flex cursor-pointer items-center gap-2.5 text-sm">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                      checked={(checkboxAnswers[field.id] ?? []).includes(opt)}
                      onChange={(e) => onCheckboxToggle(field.id, opt, e.target.checked)}
                    />
                    {opt}
                  </label>
                ))}
              </div>
            </fieldset>
          )
        }

        if (eventFieldUsesOptions(type) && field.options?.length) {
          return (
            <label key={field.id} className="block">
              {label}
              <select
                className="student-ws-input mt-1.5 w-full"
                value={answers[field.id] ?? ''}
                onChange={(e) => onAnswerChange(field.id, e.target.value)}
              >
                <option value="">Select an option</option>
                {field.options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </label>
          )
        }

        if (type === 'YesNo') {
          return (
            <label key={field.id} className="block">
              {label}
              <select
                className="student-ws-input mt-1.5 w-full"
                value={answers[field.id] ?? ''}
                onChange={(e) => onAnswerChange(field.id, e.target.value)}
              >
                <option value="">Select</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </label>
          )
        }

        const inputType =
          type === 'Email'
            ? 'email'
            : type === 'Number'
              ? 'number'
              : type === 'Date'
                ? 'date'
                : type === 'Url'
                  ? 'url'
                  : 'text'

        return (
          <label key={field.id} className="block">
            {label}
            <input
              type={inputType}
              className="student-ws-input mt-1.5 w-full"
              placeholder={field.placeholder ?? undefined}
              value={answers[field.id] ?? ''}
              onChange={(e) => onAnswerChange(field.id, e.target.value)}
            />
            {field.helpText ? (
              <span className="mt-1.5 block text-xs text-muted-foreground">{field.helpText}</span>
            ) : null}
          </label>
        )
      })}
    </>
  )
}
