/** Central route path constants — aligned with legacy App.tsx student flow. */
export const ROUTES = {
  home: "/",
  login: "/login",
  changePassword: "/change-password",
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
} as const;

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
  matches: "/company/matches",
  discover: "/company/discover",
  collaborations: "/company/collaborations",
  messages: "/company/messages",
  profile: "/company/profile",
  members: "/company/members",
  saved: "/company/saved",
  settings: "/company/settings",
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
