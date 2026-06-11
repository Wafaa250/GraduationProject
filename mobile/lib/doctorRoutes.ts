/** Doctor route paths aligned with web ROUTES (paths.ts). */
export const DOCTOR_ROUTES = {
  dashboard: "/doctor/dashboard",
  requests: "/doctor/requests",
  projects: "/doctor/projects",
  courses: "/doctor/courses",
  createCourse: "/doctor/courses/create",
  messages: "/doctor/messages",
  notifications: "/doctor/notifications",
  profile: "/doctor/profile",
  editProfile: "/doctor/edit-profile",
  settings: "/doctor/settings",
} as const;

export function doctorProjectPath(projectId: number): string {
  return `/doctor/projects/${projectId}`;
}

export function doctorProjectChatPath(projectId: number): string {
  return `/doctor/projects/chat/${projectId}`;
}

export function doctorCoursePath(courseId: number): string {
  return `/doctor/courses/${courseId}`;
}

export function doctorCreateCoursePath(): string {
  return DOCTOR_ROUTES.createCourse;
}

export function doctorSectionPath(courseId: number, sectionId: number): string {
  return `/doctor/courses/${courseId}/sections/${sectionId}`;
}

export function doctorCourseProjectPath(
  courseId: number,
  sectionId: number,
  projectId: number,
): string {
  return `/doctor/courses/${courseId}/sections/${sectionId}/projects/${projectId}`;
}

export function doctorMessageThreadPath(conversationId: number): string {
  return `/doctor/messages/${conversationId}`;
}

export function doctorStudentProfilePath(userId: number): string {
  return `/doctor/students/${userId}`;
}

export type DoctorMetricKey = "pending" | "active" | "courses" | "students" | "messages";

export function doctorMetricRoute(key: DoctorMetricKey): string {
  switch (key) {
    case "pending":
      return DOCTOR_ROUTES.requests;
    case "active":
    case "students":
      return DOCTOR_ROUTES.projects;
    case "courses":
      return DOCTOR_ROUTES.courses;
    case "messages":
      return DOCTOR_ROUTES.messages;
    default:
      return DOCTOR_ROUTES.dashboard;
  }
}
