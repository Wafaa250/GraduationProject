export function toDatetimeLocalValue(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function datetimeLocalToIso(value: string): string | undefined {
  if (!value.trim()) return undefined
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return undefined
  return d.toISOString()
}

export function formatEventDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatEventDateLine(iso: string): { date: string; time: string } | null {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return {
    date: d.toLocaleDateString(undefined, {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }),
    time: d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }),
  }
}

export function formatRegistrationCloseDate(iso: string): string | null {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export type RegistrationDeadlineStatus = 'open' | 'closing-soon' | 'closed'

export function getRegistrationDeadlineStatus(
  deadline: string | null | undefined,
): RegistrationDeadlineStatus | null {
  if (!deadline) return null
  const d = new Date(deadline)
  if (Number.isNaN(d.getTime())) return null
  const ms = d.getTime() - Date.now()
  if (ms <= 0) return 'closed'
  if (ms <= 48 * 60 * 60 * 1000) return 'closing-soon'
  return 'open'
}

/** Format a datetime-local input value for display in previews. */
export function formatDatetimeLocalDisplay(value: string): string | null {
  const iso = datetimeLocalToIso(value)
  if (!iso) return null
  return formatEventDate(iso)
}

/** Clear registration deadline when it falls after the event date. */
export function syncRegistrationDeadline(
  eventDate: string,
  registrationDeadline: string,
): string {
  if (!eventDate || !registrationDeadline) return registrationDeadline
  if (new Date(registrationDeadline) > new Date(eventDate)) return ''
  return registrationDeadline
}

export function isRegistrationDeadlineValid(eventDate: string, registrationDeadline: string): boolean {
  if (!registrationDeadline) return true
  if (!eventDate) return false
  return new Date(registrationDeadline) <= new Date(eventDate)
}
