/** Central route path constants — aligned with legacy App.tsx student flow. */
export const ROUTES = {
  home: "/",
  login: "/login",
  register: "/register",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
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
  /** Discover open graduation projects (students without a team). */
  browseProjects: "/browse-projects",
  /** Student enrolled courses workspace. */
  studentCourses: "/courses",
  studentCourseDetail: "/courses/:courseId",
  studentCourseProjectDetail: "/courses/:courseId/projects/:projectId",
  /** Student direct messages. */
  studentMessages: "/messages",
  studentMessageThread: "/messages/:conversationId",
  /** Student account and preferences. */
  settings: "/settings",
  /** Doctor hub */
  doctorDashboard: "/doctor/dashboard",
  doctorProfile: "/doctor/profile",
  doctorEditProfile: "/doctor/edit-profile",
  doctorMessages: "/doctor/messages",
  doctorMessageThread: "/doctor/messages/:conversationId",
  doctorRequests: "/doctor/requests",
  doctorProjects: "/doctor/projects",
  doctorProjectDetail: "/doctor/projects/:projectId",
  doctorProjectChat: "/doctor/projects/:projectId/chat",
  doctorCourses: "/doctor/courses",
  doctorCreateCourse: "/doctor/courses/create",
  doctorCourseDetail: "/doctor/courses/:courseId",
  doctorSectionDetail: "/doctor/courses/:courseId/sections/:sectionId",
  doctorCourseProjectDetail:
    "/doctor/courses/:courseId/sections/:sectionId/projects/:projectId",
  doctorStudentProfile: "/doctor/students/:userId",
  doctorSettings: "/doctor/settings",
} as const;

export function doctorStudentPath(userId: number) {
  return `/doctor/students/${userId}`;
}

export function doctorProjectPath(projectId: number) {
  return `/doctor/projects/${projectId}`;
}

export function doctorProjectChatPath(projectId: number) {
  return `/doctor/projects/${projectId}/chat`;
}

export function doctorCoursePath(courseId: number) {
  return `/doctor/courses/${courseId}`;
}

export function doctorSectionPath(courseId: number, sectionId: number) {
  return `/doctor/courses/${courseId}/sections/${sectionId}`;
}

export function doctorCourseProjectPath(
  courseId: number,
  sectionId: number,
  projectId: number,
) {
  return `/doctor/courses/${courseId}/sections/${sectionId}/projects/${projectId}`;
}

export function doctorMessageThreadPath(conversationId: number) {
  return `/doctor/messages/${conversationId}`;
}

export function studentMessageThreadPath(conversationId: number) {
  return `/messages/${conversationId}`;
}

export function studentCoursePath(courseId: number) {
  return `/courses/${courseId}`;
}

export function studentCourseProjectPath(courseId: number, projectId: number) {
  return `/courses/${courseId}/projects/${projectId}`;
}
