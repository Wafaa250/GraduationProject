import type { CourseStudent } from "@/api/studentCoursesApi";
import type { StudentCourseProject } from "@/api/studentCoursesApi";

export function asText(value: unknown, fallback = "—"): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

export function formatSectionSchedule(
  days: string[] | undefined,
  from?: string | null,
  to?: string | null,
): string {
  const dayPart = Array.isArray(days) && days.length > 0 ? days.join(", ") : "Schedule not specified";
  if (!from || !to) return dayPart;
  return `${dayPart} · ${from} - ${to}`;
}

export function getStudentProfileIdFromUser(user: unknown): number | null {
  if (user == null || typeof user !== "object") return null;
  const obj = user as Record<string, unknown>;
  const raw =
    obj.profileId ?? obj.ProfileId ?? obj.studentProfileId ?? obj.StudentProfileId;
  return typeof raw === "number" && Number.isFinite(raw) ? raw : null;
}

export function getCourseStudentProfileId(student: CourseStudent): number | null {
  const row = student as CourseStudent & { id?: number; Id?: number };
  const raw = row.studentId ?? row.StudentId ?? row.id ?? row.Id;
  return typeof raw === "number" && Number.isFinite(raw) ? raw : null;
}

export function getAuthUserIdFromMe(user: unknown): number | null {
  if (user == null || typeof user !== "object") return null;
  const o = user as Record<string, unknown>;
  const raw = o.id ?? o.Id;
  return typeof raw === "number" && Number.isFinite(raw) ? raw : null;
}

/** Mirrors web StudentCoursesPage project assignment detection. */
export function computeIsDoctorAssignedProject(project: StudentCourseProject): boolean {
  const modeText = String(
    project.teamFormationMode ??
      project.assignmentMode ??
      project.teamMode ??
      project.formationMode ??
      "",
  )
    .trim()
    .toLowerCase();
  const doctorAssignedByMode =
    modeText.includes("doctor") || modeText.includes("ai") || modeText.includes("auto");
  const studentAssignedByMode =
    modeText.includes("student") || modeText.includes("manual") || modeText.includes("self");
  if (typeof project.isDoctorAssigned === "boolean") return project.isDoctorAssigned;
  if (typeof project.allowStudentSelection === "boolean") return !project.allowStudentSelection;
  if (doctorAssignedByMode) return true;
  if (studentAssignedByMode) return false;
  return project.aiMode === "doctor";
}
