import type { DoctorCourseWithStats } from "@/api/doctorCoursesApi";

export const SECTION_DAY_OPTIONS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

export type SectionDay = (typeof SECTION_DAY_OPTIONS)[number];

export type CourseListCardModel = {
  courseId: number;
  name: string;
  code: string;
  semester: string | null;
  sections: number;
  students: number;
  projects: number;
};

export function mapCourseToListCard(course: DoctorCourseWithStats): CourseListCardModel {
  return {
    courseId: course.courseId,
    name: course.name,
    code: course.code,
    semester: course.semester,
    sections: course.sections,
    students: course.students,
    projects: course.projects,
  };
}

export function formatDayLabel(day: string): string {
  return day.slice(0, 3).toUpperCase();
}

export function courseSubtitle(course: Pick<CourseListCardModel, "code" | "semester">): string {
  const parts = [course.code].filter(Boolean);
  if (course.semester?.trim()) parts.push(course.semester.trim());
  return parts.join(" · ");
}

export function isAcceptedRosterFile(name: string): boolean {
  const lower = name.toLowerCase();
  return (
    lower.endsWith(".csv") ||
    lower.endsWith(".xlsx") ||
    lower.endsWith(".docx") ||
    lower.endsWith(".pdf")
  );
}

export function importResultSummary(result: {
  added: number;
  parsedCount: number;
  skipped: string[];
  invalidIds: string[];
}): string {
  const parts = [`${result.added} added`, `${result.parsedCount} parsed`];
  if (result.skipped.length > 0) parts.push(`${result.skipped.length} skipped`);
  if (result.invalidIds.length > 0) parts.push(`${result.invalidIds.length} invalid`);
  return parts.join(" · ");
}

export function addStudentsResultSummary(result: {
  added: number;
  notFound: string[];
  alreadyEnrolled: string[];
}): string {
  const parts = [`${result.added} added`];
  if (result.alreadyEnrolled.length > 0) {
    parts.push(`${result.alreadyEnrolled.length} already enrolled`);
  }
  if (result.notFound.length > 0) {
    parts.push(`${result.notFound.length} not found`);
  }
  return parts.join(" · ");
}
