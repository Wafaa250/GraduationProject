/** Shared with web DoctorProfileEditPage — keep in sync. */
export const DOCTOR_ACADEMIC_RANKS = [
  "Lecturer",
  "Assistant Professor",
  "Associate Professor",
  "Professor",
] as const;

export const DOCTOR_PROJECT_AREAS = [
  "AI",
  "Machine Learning",
  "Software Engineering",
  "Cyber Security",
  "Networks",
  "Mobile Development",
  "Web Development",
] as const;

export function splitDoctorSkillList(value: string): string[] {
  return value
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

export function joinDoctorSkillList(values: string[]): string {
  return values.join(", ");
}
