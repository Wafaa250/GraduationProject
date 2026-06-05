export type GraduationProjectType = "GP1" | "GP2" | "GP";

export type GraduationTrack = "general" | "engineering" | "computer-engineering";

export const GRADUATION_PROJECT_TYPE = {
  GP1: "GP1",
  GP2: "GP2",
  GP: "GP",
} as const satisfies Record<string, GraduationProjectType>;

export function isEngineeringFaculty(faculty: string | null | undefined): boolean {
  if (!faculty?.trim()) return false;
  return faculty.trim().toLowerCase().includes("engineering");
}

export function isComputerEngineeringMajor(majorOrDepartment: string | null | undefined): boolean {
  if (!majorOrDepartment?.trim()) return false;
  const m = majorOrDepartment.trim().toLowerCase();
  return m === "computer engineering" || m.includes("computer engineering");
}

export function resolveGraduationTrack(
  faculty: string | null | undefined,
  major: string | null | undefined,
): GraduationTrack {
  if (!isEngineeringFaculty(faculty)) return "general";
  if (isComputerEngineeringMajor(major)) return "computer-engineering";
  return "engineering";
}

export function normalizeProjectType(type: string | null | undefined): GraduationProjectType {
  const t = (type ?? GRADUATION_PROJECT_TYPE.GP).trim().toUpperCase();
  if (t === GRADUATION_PROJECT_TYPE.GP1) return GRADUATION_PROJECT_TYPE.GP1;
  if (t === GRADUATION_PROJECT_TYPE.GP2) return GRADUATION_PROJECT_TYPE.GP2;
  return GRADUATION_PROJECT_TYPE.GP;
}

export function getGraduationSectionTitle(
  faculty: string | null | undefined,
  major: string | null | undefined,
): string {
  return resolveGraduationTrack(faculty, major) === "general"
    ? "Graduation Project"
    : "Graduation Projects";
}

export function projectTypeLabel(
  type: string | null | undefined,
  faculty?: string | null,
  major?: string | null,
): string {
  const normalized = normalizeProjectType(type);
  const track = resolveGraduationTrack(faculty, major);

  if (track === "general") return "Graduation Project";

  if (track === "computer-engineering") {
    if (normalized === GRADUATION_PROJECT_TYPE.GP1) return "Graduation Project 1 (Software)";
    if (normalized === GRADUATION_PROJECT_TYPE.GP2) return "Graduation Project 2 (Hardware)";
    return "Graduation Project";
  }

  if (normalized === GRADUATION_PROJECT_TYPE.GP1) return "Graduation Project 1";
  if (normalized === GRADUATION_PROJECT_TYPE.GP2) return "Graduation Project 2";
  return "Graduation Project";
}
