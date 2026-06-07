export const COMPANY_ROUTES = {
  dashboard: "/company/dashboard",
  requests: "/company/requests",
  requestDetail: (id: number) => `/company/requests/${id}`,
  requestRecommendations: (id: number) => `/company/requests/${id}/recommendations`,
  editRequest: (id: number) => `/company/requests/${id}/edit`,
  newRequest: "/company/requests/new",
  saved: "/company/saved",
  workspace: "/company/workspace",
  profile: "/company/profile",
  editProfile: "/company/edit-profile",
  members: "/company/members",
  settings: "/company/settings",
  themeShowcase: "/company/themes",
  notifications: "/company/notifications",
  studentDiscoveryProfile: (requestId: number, studentProfileId: number, teamId?: number) => {
    const base = `/company/discovery/${requestId}/students/${studentProfileId}`;
    return teamId != null ? `${base}?teamId=${teamId}` : base;
  },
  teamDiscoveryProfile: (requestId: number, teamId: number) =>
    `/company/discovery/${requestId}/teams/${teamId}`,
} as const;

export type CompanyMetricKey = "requests" | "students" | "teams" | "members";
