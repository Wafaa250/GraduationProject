import type { CourseTeamMember } from "@/api/doctorCoursesApi";

export function getTeamLeadMemberId(members: CourseTeamMember[]): number | null {
  if (members.length === 0) return null;
  const scored = members.filter((m) => typeof m.matchScore === "number");
  if (scored.length > 0) {
    return scored.reduce((best, m) =>
      (m.matchScore ?? 0) > (best.matchScore ?? 0) ? m : best,
    ).studentId;
  }
  return members[0]?.studentId ?? null;
}
