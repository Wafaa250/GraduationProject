export function formatSupervisorDoctorName(raw: string): string {
  const t = raw.trim();
  if (!t) return "—";
  if (/^dr\.?\s/i.test(t)) return t;
  return `Dr. ${t}`;
}
