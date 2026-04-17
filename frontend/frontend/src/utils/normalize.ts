export function getCourseId(course: any): number | null {
  const raw =
    course?.courseId ??
    course?.CourseId ??
    course?.id ??
    course?.Id ??
    course?.courseID ??
    course?.course?.id ??
    course?.course?.courseId ??
    course?.value;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}
