/** Frontend-only copy helpers for doctor dashboard display (no API changes). */

export const DEPARTMENT_NOT_SET = "Department not set";

const WORD_EXPANSIONS: Record<string, string> = {
  eng: "Engineering",
  engineering: "Engineering",
  comp: "Computer",
  computer: "Computer",
  cs: "Computer Science",
  it: "Information Technology",
  dept: "Department",
  sci: "Science",
};

/** Coerce API/profile values (undefined, null, number, etc.) to a safe string. */
export function safeText(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

function titleCaseWord(word: unknown): string {
  const raw = safeText(word);
  if (!raw) return "";
  const lower = raw.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!lower) return "";
  if (WORD_EXPANSIONS[lower]) return WORD_EXPANSIONS[lower];
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
}

/** "eyad" / "Eyad Ahmad" / undefined → "Dr. Eyad" */
export function formatDoctorGreeting(name?: string | null): string {
  const trimmed = safeText(name).trim();
  if (!trimmed) return "Doctor";
  const withoutPrefix = trimmed.replace(/^dr\.?\s+/i, "").trim();
  const first = withoutPrefix.split(/\s+/).filter(Boolean)[0] ?? withoutPrefix;
  if (!first) return "Doctor";
  const proper = first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
  return `Dr. ${proper}`;
}

function disciplineWords(
  specialization?: string | null,
  departmentOrFaculty?: string | null,
  extra?: string | null,
): string[] {
  const primary = safeText(specialization).trim();
  const secondary = safeText(departmentOrFaculty).trim();
  const tertiary = safeText(extra).trim();

  const source = primary || secondary || tertiary;
  if (!source) return [];

  const normalized = source.replace(/[·,|/]+/g, " ").replace(/\s+/g, " ").trim();
  return normalized.split(" ").filter(Boolean).map(titleCaseWord).filter(Boolean);
}

/** Hero line: "Computer Engineering" (no "Department" suffix). */
export function formatHeroDiscipline(
  specialization?: string | null,
  departmentOrFaculty?: string | null,
  extra?: string | null,
): string | null {
  const words = disciplineWords(specialization, departmentOrFaculty, extra);
  if (words.length === 0) return null;
  return words
    .filter((w) => !/^department$/i.test(w))
    .join(" ")
    .trim() || null;
}

/**
 * Formats specialization / department / faculty for display.
 * Returns "Department not set" when no usable value exists.
 */
export function formatDepartmentLine(
  specialization?: string | null,
  departmentOrFaculty?: string | null,
  extra?: string | null,
): string {
  const words = disciplineWords(specialization, departmentOrFaculty, extra);
  if (words.length === 0) return DEPARTMENT_NOT_SET;

  let label = words.join(" ");
  if (!/\bdepartment\b/i.test(label)) {
    label = `${label} Department`;
  }

  return label;
}

/** Shorter expertise label for chips; null when department is not set. */
export function formatExpertiseLine(
  specialization?: string | null,
  departmentOrFaculty?: string | null,
  extra?: string | null,
): string | null {
  const line = formatDepartmentLine(specialization, departmentOrFaculty, extra);
  if (line === DEPARTMENT_NOT_SET) return null;
  const short = line.replace(/\s+Department$/i, "").trim();
  return short || null;
}

