const PLACEHOLDER_TEXT = new Set([
  "string",
  "test",
  "null",
  "undefined",
  "n/a",
  "na",
  "none",
  "-",
  "—",
]);

/** Strip registration placeholders and junk so profile UI stays clean. */
export function sanitizeDoctorProfileText(value: string | null | undefined): string {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return "";
  if (PLACEHOLDER_TEXT.has(trimmed.toLowerCase())) return "";
  return trimmed;
}

export function sanitizeDoctorProfileList(values: string[] | null | undefined): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const raw of values ?? []) {
    const cleaned = sanitizeDoctorProfileText(raw);
    if (!cleaned) continue;
    const key = cleaned.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(cleaned);
  }

  return result;
}

export function uniqueDoctorProfileLabels(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const cleaned = sanitizeDoctorProfileText(value);
    if (!cleaned) continue;
    const key = cleaned.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(cleaned);
  }

  return result;
}
