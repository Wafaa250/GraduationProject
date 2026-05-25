/** Central route path constants — aligned with legacy App.tsx student flow. */
export const ROUTES = {
  home: "/",
  login: "/login",
  register: "/register",
  registerAssociation: "/register/association",
  /** Post-login landing for students (Student Dashboard). */
  dashboard: "/dashboard",
  /** Authenticated student profile view. */
  profile: "/profile",
  /** Student profile edit form. */
  editProfile: "/edit-profile",
  /** Create graduation project wizard (student). */
  createGraduationProject: "/graduation-projects/create",
  /** Graduation project workspace (student owner/member). */
  graduationProjectWorkspace: "/graduation-projects/workspace",
  /** Doctor hub */
  doctorDashboard: "/doctor/dashboard",
  doctorProfile: "/doctor/profile",
  doctorEditProfile: "/doctor/edit-profile",
  doctorNotifications: "/doctor/notifications",
  doctorMessages: "/doctor/messages",
  doctorMessageThread: "/doctor/messages/:conversationId",
  doctorRequests: "/doctor/requests",
  doctorProjects: "/doctor/projects",
  doctorProjectDetail: "/doctor/projects/:projectId",
  doctorCourses: "/doctor/courses",
  doctorCourseDetail: "/doctor/courses/:courseId",
  doctorStudentProfile: "/doctor/students/:userId",
} as const;

export function doctorStudentPath(userId: number) {
  return `/doctor/students/${userId}`;
}

export function doctorProjectPath(projectId: number) {
  return `/doctor/projects/${projectId}`;
}

export function doctorCoursePath(courseId: number) {
  return `/doctor/courses/${courseId}`;
}

export function doctorMessageThreadPath(conversationId: number) {
  return `/doctor/messages/${conversationId}`;
}
