/** Normalize course id from enrolled-course or list payloads (matches web `getCourseId`). */
export function getCourseId(course: unknown): number | null {
  if (course == null || typeof course !== "object") return null;
  const c = course as Record<string, unknown>;
  const raw =
    c.courseId ??
    c.CourseId ??
    c.id ??
    c.Id ??
    c.courseID ??
    (c.course as Record<string, unknown> | undefined)?.id ??
    (c.course as Record<string, unknown> | undefined)?.courseId ??
    c.value;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}
