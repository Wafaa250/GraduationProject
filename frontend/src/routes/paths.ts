/** Central route path constants — aligned with legacy App.tsx student flow. */
export const ROUTES = {
  home: "/",
  login: "/login",
  changePassword: "/change-password",
  register: "/register",
  forgotPassword: "/forgot-password",
  forgotPasswordVerify: "/forgot-password/verify",
  forgotPasswordNew: "/forgot-password/new-password",
  forgotPasswordSuccess: "/forgot-password/success",
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
  /** Owner browse/invite students for their graduation project. */
  browseProjectStudents: "/graduation-projects/browse-students",
  /** Student enrolled courses workspace. */
  studentCourses: "/courses",
  studentCourseDetail: "/courses/:courseId",
  studentCourseProjectDetail: "/courses/:courseId/projects/:projectId",
  /** Communication Hub — university community feed. */
  communicationHub: "/feed",
  /** Public student directory profile (by user id). */
  studentDirectoryProfile: (userId: number | string) => `/students/${userId}`,
  /** Public doctor profile (by user id). */
  doctorPublicProfile: (userId: number | string) => `/doctors/${userId}`,
  /** Organization profile in visitor/read-only mode (same page as owner). */
  organizationPublicProfile: (organizationId: number | string) =>
    `/organizations/${organizationId}`,
  /** Company profile in visitor/read-only mode (same page as owner). */
  companyPublicProfile: (companyProfileId: number | string) =>
    `/companies/${companyProfileId}`,
  /** Student read-only view of a published company opportunity (Communication Hub). */
  companyOpportunityDetail: (
    companyProfileId: number | string,
    requestId: number | string,
  ) => `/opportunities/companies/${companyProfileId}/${requestId}`,
  /** Companies and associations the student follows. */
  following: "/following",
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

export function browseProjectStudentsPath(projectId: number) {
  return `${ROUTES.browseProjectStudents}?projectId=${projectId}`;
}
/** Company workspace (post-login, role === company). */
export const COMPANY_ROUTES = {
  root: "/company",
  dashboard: "/company",
  requests: "/company/requests",
  requestDetail: (id: number | string) => `/company/requests/${id}`,
  editRequest: (id: number | string) => `/company/requests/${id}/edit`,
  requestRecommendations: (id: number | string) =>
    `/company/requests/${id}/recommendations`,
  studentDiscoveryProfile: (
    requestId: number | string,
    studentProfileId: number | string,
    teamId?: number | string,
  ) => {
    const base = `/company/requests/${requestId}/students/${studentProfileId}`;
    if (teamId != null && teamId !== "") {
      return `${base}?teamId=${teamId}`;
    }
    return base;
  },
  teamDiscoveryProfile: (requestId: number | string, teamId: number | string) =>
    `/company/requests/${requestId}/teams/${teamId}`,
  newRequest: "/company/requests/new",
  talentRequestDetail: (talentRequestId: number | string, companyProfileId: number | string) =>
    `/company/talent-requests/${talentRequestId}?companyId=${companyProfileId}`,
  matches: "/company/matches",
  discover: "/company/discover",
  collaborations: "/company/collaborations",
  messages: "/company/messages",
  profile: "/company/profile",
  members: "/company/members",
  saved: "/company/saved",
  settings: "/company/settings",
  themeShowcase: "/company/themes",
} as const;

/** Student association workspace (post-login, association role). */
export const ASSOCIATION_ROUTES = {
  dashboard: "/association/dashboard",
  events: "/association/events",
  eventCreate: "/association/events/create",
  eventDetail: (eventId: number | string) => `/association/events/${eventId}`,
  eventEdit: (eventId: number | string) => `/association/events/${eventId}/edit`,
  eventRegistrationForm: (eventId: number | string) =>
    `/association/events/${eventId}/registration-form`,
  eventRegistrationDetail: (eventId: number | string, registrationId: number | string) =>
    `/association/events/${eventId}/registrations/${registrationId}`,
  recruitment: "/association/recruitment",
  recruitmentCreate: "/association/recruitment/create",
  recruitmentDetail: (campaignId: number | string) => `/association/recruitment/${campaignId}`,
  recruitmentEdit: (campaignId: number | string) =>
    `/association/recruitment/${campaignId}/edit`,
  recruitmentApplication: (
    campaignId: number | string,
    applicationId: number | string,
  ) => `/association/recruitment/${campaignId}/applications/${applicationId}`,
  recruitmentPositionForm: (campaignId: number | string, positionId: number | string) =>
    `/association/recruitment/${campaignId}/positions/${positionId}/form`,
  leadership: "/association/leadership",
  profile: "/association/profile",
  settings: "/association/settings",
} as const;
