import { apiClient } from "./client";

/** Team member on a graduation project (leader | member). */
export interface SupervisorRequestTeamMember {
  studentId: number;
  name: string;
  role: string;
  major: string;
}

/** GET /api/doctors/me/requests — supervision requests for the logged-in doctor. */
export interface SupervisorRequest {
  requestId: number;
  project: {
    projectId: number;
    name: string;
    description?: string | null;
    requiredSkills: string[];
    projectType?: string;
    partnersCount?: number;
    memberCount?: number;
    members?: SupervisorRequestTeamMember[];
  };
  sender: {
    studentId: number;
    name: string;
    major: string;
    university: string;
  };
  status: string;
  createdAt: string;
  respondedAt?: string | null;
}

/** Used by mergeDoctorRequestRows when cancellation requests are included (optional). */
export interface SupervisorCancelRequestItem {
  requestId: number;
  projectName: string;
  studentName: string;
  status: string;
}

export async function getDoctorRequests(): Promise<SupervisorRequest[]> {
  const { data } = await apiClient.get<SupervisorRequest[]>("/doctors/me/requests");
  return Array.isArray(data) ? data : [];
}

/** POST /api/supervisor-requests/{id}/accept */
export async function acceptSupervisorRequest(id: number): Promise<void> {
  await apiClient.post(`/supervisor-requests/${id}/accept`);
}

/** POST /api/supervisor-requests/{id}/reject */
export async function rejectSupervisorRequest(id: number): Promise<void> {
  await apiClient.post(`/supervisor-requests/${id}/reject`);
}

/** GET /api/doctors/me/supervisor-cancel-requests */
export async function getDoctorSupervisorCancelRequests(): Promise<
  SupervisorCancelRequestItem[]
> {
  const { data } = await apiClient.get<SupervisorCancelRequestItem[]>(
    "/doctors/me/supervisor-cancel-requests",
  );
  return Array.isArray(data) ? data : [];
}

/** POST /api/supervisor-cancel-requests/{id}/accept */
export async function acceptSupervisorCancelRequest(id: number): Promise<void> {
  await apiClient.post(`/supervisor-cancel-requests/${id}/accept`);
}

/** POST /api/supervisor-cancel-requests/{id}/reject */
export async function rejectSupervisorCancelRequest(id: number): Promise<void> {
  await apiClient.post(`/supervisor-cancel-requests/${id}/reject`);
}

// ── Student project leader: recommended supervisors + request (graduation-projects routes) ──

/** GET /api/graduation-projects/{projectId}/recommended-supervisors */
export type Supervisor = {
  doctorId: number;
  userId: number;
  name: string;
  specialization: string;
  matchScore: number;
};

export async function getRecommendedSupervisors(projectId: number): Promise<Supervisor[]> {
  const { data } = await apiClient.get<unknown>(
    `/graduation-projects/${projectId}/recommended-supervisors`,
  );
  if (!Array.isArray(data)) return [];
  return data.map((raw: Record<string, unknown>) => ({
    doctorId: Number(raw.doctorId ?? raw.DoctorId ?? 0),
    userId: Number(raw.userId ?? raw.UserId ?? 0),
    name: String(raw.name ?? raw.Name ?? ""),
    specialization: String(raw.specialization ?? raw.Specialization ?? ""),
    matchScore: Number(raw.matchScore ?? raw.MatchScore ?? 0),
  }));
}

/** POST /api/graduation-projects/{projectId}/request-supervisor/{doctorId} */
export async function requestSupervisor(projectId: number, doctorId: number): Promise<void> {
  await apiClient.post(`/graduation-projects/${projectId}/request-supervisor/${doctorId}`);
}
