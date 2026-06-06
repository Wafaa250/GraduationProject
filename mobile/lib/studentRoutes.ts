/** Student route paths aligned with web ROUTES (paths.ts). */
export const STUDENT_ROUTES = {
  dashboard: "/dashboard",
  profile: "/profile",
  editProfile: "/edit-profile",
  following: "/following",
  studentCourses: "/courses",
  graduationProjectWorkspace: "/graduation-projects/workspace",
  createGraduationProject: "/graduation-projects/create",
} as const;

export function studentCoursePath(courseId: number): string {
  return `/courses/${courseId}`;
}

export function studentCourseProjectPath(courseId: number, projectId: number): string {
  return `/courses/${courseId}/projects/${projectId}`;
}

export function studentDirectoryProfilePath(userId: number): string {
  return `/students/${userId}`;
}
