export function formatEventDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatRegistrationCloseDate(iso: string): string | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export type RegistrationDeadlineStatus = "open" | "closing-soon" | "closed";

export function getRegistrationDeadlineStatus(
  deadline: string | null | undefined,
): RegistrationDeadlineStatus | null {
  if (!deadline) return null;
  const d = new Date(deadline);
  if (Number.isNaN(d.getTime())) return null;
  const ms = d.getTime() - Date.now();
  if (ms <= 0) return "closed";
  if (ms <= 48 * 60 * 60 * 1000) return "closing-soon";
  return "open";
}

export function isRegistrationDeadlineValid(eventDate: string, registrationDeadline: string): boolean {
  if (!registrationDeadline) return true;
  if (!eventDate) return false;
  return new Date(registrationDeadline) <= new Date(eventDate);
}
