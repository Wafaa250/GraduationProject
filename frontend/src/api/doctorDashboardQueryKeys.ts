/** Shared TanStack Query key for GET /api/doctors/me/supervised-projects (Requests ↔ My Projects sync). */
export const supervisedProjectsQueryKey = ["supervised-projects"] as const;

/** Query keys for doctor dashboard server state. */
export const doctorDashboardKeys = {
  requests: ["doctor", "me", "requests"] as const,
  supervisedProjects: supervisedProjectsQueryKey,
  dashboardSummary: ["doctor", "dashboard", "summary"] as const,
  dashboardMyProject: ["doctor", "dashboard", "my-project"] as const,
};
