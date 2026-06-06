/** Doctor route paths aligned with web ROUTES (paths.ts). */
export const DOCTOR_ROUTES = {
  dashboard: "/doctor/dashboard",
  requests: "/doctor/requests",
  projects: "/doctor/projects",
  courses: "/doctor/courses",
  messages: "/doctor/messages",
  notifications: "/doctor/notifications",
  profile: "/doctor/profile",
  editProfile: "/doctor/edit-profile",
  settings: "/doctor/settings",
} as const;

export function doctorProjectPath(projectId: number): string {
  return `/doctor/projects/${projectId}`;
}

export function doctorCoursePath(courseId: number): string {
  return `/doctor/courses/${courseId}`;
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
