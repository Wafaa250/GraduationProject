import type {
  CourseEnrolledStudent,
  CourseProject,
  CourseProjectWithTeams,
} from "@/api/doctorCoursesApi";
import type { CourseTeamView, CourseWorkspaceBundle } from "@/hooks/useCourseWorkspace";

export function formatSectionSchedule(
  days: string[],
  timeFrom: string | null,
  timeTo: string | null,
): string {
  const dayLabel = days.length > 0 ? days.join(", ") : "Schedule not set";
  if (timeFrom && timeTo) return `${dayLabel} · ${timeFrom}–${timeTo}`;
  return dayLabel;
}

export function formatProjectSections(project: CourseProjectWithTeams): string {
  if (project.applyToAllSections) return "All sections";
  if (project.sections.length === 0) return "No sections";
  return project.sections.map((s) => s.sectionName).join(", ");
}

export function formatAiMode(mode: string): string {
  return mode === "student" ? "Student-led teams" : "Doctor generates teams";
}

export type StudentAssignmentContext = {
  label: string;
  detail: string | null;
  courseProjectId: number | null;
};

export function projectAppliesToSection(project: CourseProject, sectionId: number): boolean {
  if (project.applyToAllSections) return true;
  return project.sections.some((s) => s.sectionId === sectionId);
}

export function filterProjectsForSection(
  projects: CourseProjectWithTeams[],
  sectionId: number,
): CourseProjectWithTeams[] {
  return projects.filter((p) => projectAppliesToSection(p, sectionId));
}

export function filterStudentsForSection(
  students: CourseEnrolledStudent[],
  sectionId: number,
): CourseEnrolledStudent[] {
  return students.filter((s) => s.sectionId === sectionId);
}

export function filterTeamsForSection(teams: CourseTeamView[], projectIds: Set<number>): CourseTeamView[] {
  return teams.filter((t) => projectIds.has(t.courseProjectId));
}

export function getStudentAssignmentContext(
  student: CourseEnrolledStudent,
  bundle: Pick<CourseWorkspaceBundle, "teams"> | null,
): StudentAssignmentContext | null {
  if (!bundle) return null;

  for (const entry of bundle.teams) {
    const onTeam = entry.team.members.some((m) => m.studentId === student.studentId);
    if (onTeam) {
      return {
        label: entry.courseProjectTitle,
        detail: `Team ${entry.team.teamIndex + 1}`,
        courseProjectId: entry.courseProjectId,
      };
    }
  }

  return null;
}

export function parseStudentIdsText(text: string): string[] {
  return text
    .split(/[\n,;\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}
