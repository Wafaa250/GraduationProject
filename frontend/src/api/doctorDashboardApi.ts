import api, { parseApiErrorMessage } from "./axiosInstance";

export type DoctorDashboardSummary = {
  pendingRequestsCount: number;
  supervisedCount: number;
  pendingCancelCount: number;
};

export type DoctorSupervisorRequestMember = {
  studentId: number;
  name: string;
  role: string;
  major: string;
  academicYear?: string;
  initials?: string;
};

export type DoctorSupervisorAiCompatibility = {
  score: number;
  matches: string[];
};

export type DoctorSupervisorRequestHistoryItem = {
  event: string;
  at: string;
};

export type DoctorSupervisorRequest = {
  requestId: number;
  requestCode?: string;
  project: {
    projectId: number;
    name: string;
    description: string | null;
    requiredSkills: string[];
    technologies?: string[];
    preferredRoles: string[];
    projectType: string;
    stage?: string;
    partnersCount: number;
    memberCount: number;
    faculty?: string | null;
    department?: string | null;
    members: DoctorSupervisorRequestMember[];
  };
  sender: {
    studentId: number;
    userId?: number;
    name: string;
    major: string;
    university: string;
    faculty?: string;
    academicYear?: string;
    gpa?: number | null;
    initials?: string;
  };
  status: string;
  createdAt: string;
  respondedAt: string | null;
  doctorResponseNote?: string | null;
  aiCompatibility?: DoctorSupervisorAiCompatibility;
  history?: DoctorSupervisorRequestHistoryItem[];
};

export type DoctorSupervisorRequestsSummary = {
  pendingCount: number;
  acceptedCount: number;
  rejectedCount: number;
  totalCount: number;
};

export type DoctorSupervisedProject = {
  projectId: number;
  name: string;
  description: string | null;
  requiredSkills: string[];
  preferredRoles: string[];
  partnersCount: number;
  memberCount: number;
  isFull: boolean;
  owner: {
    studentId: number;
    userId: number;
    name: string;
    university: string;
    major: string;
  };
  createdAt: string;
};

export async function getDoctorDashboardSummary(): Promise<DoctorDashboardSummary> {
  const { data } = await api.get<DoctorDashboardSummary>("/doctors/me/dashboard-summary");
  return {
    pendingRequestsCount: data?.pendingRequestsCount ?? 0,
    supervisedCount: data?.supervisedCount ?? 0,
    pendingCancelCount: data?.pendingCancelCount ?? 0,
  };
}

export async function getDoctorSupervisorRequests(): Promise<DoctorSupervisorRequest[]> {
  const { data } = await api.get<DoctorSupervisorRequest[]>("/doctors/me/requests");
  return Array.isArray(data) ? data : [];
}

export async function getDoctorSupervisorRequestsSummary(): Promise<DoctorSupervisorRequestsSummary> {
  const { data } = await api.get<DoctorSupervisorRequestsSummary>("/doctors/me/requests-summary");
  return {
    pendingCount: data?.pendingCount ?? 0,
    acceptedCount: data?.acceptedCount ?? 0,
    rejectedCount: data?.rejectedCount ?? 0,
    totalCount: data?.totalCount ?? 0,
  };
}

export async function getDoctorSupervisedProjects(): Promise<DoctorSupervisedProject[]> {
  const { data } = await api.get<DoctorSupervisedProject[]>("/doctors/me/supervised-projects");
  return Array.isArray(data) ? data : [];
}

export async function acceptSupervisorRequest(
  requestId: number,
  feedback?: string,
): Promise<void> {
  const body = feedback?.trim() ? { feedback: feedback.trim() } : undefined;
  await api.post(`/supervisor-requests/${requestId}/accept`, body);
}

export async function rejectSupervisorRequest(
  requestId: number,
  feedback?: string,
): Promise<void> {
  const body = feedback?.trim() ? { feedback: feedback.trim() } : undefined;
  await api.post(`/supervisor-requests/${requestId}/reject`, body);
}

export async function resignDoctorSupervision(projectId: number): Promise<void> {
  await api.post(`/doctors/me/resign-supervision/${projectId}`);
}

export type DoctorSupervisorCancelRequest = {
  requestId: number;
  projectId: number;
  projectName: string;
  studentName: string;
  status: string;
};

/** GET /api/doctors/me/supervisor-cancel-requests */
export async function getDoctorSupervisorCancelRequests(): Promise<DoctorSupervisorCancelRequest[]> {
  const { data } = await api.get<DoctorSupervisorCancelRequest[]>("/doctors/me/supervisor-cancel-requests");
  return Array.isArray(data) ? data : [];
}

/** POST /api/supervisor-cancel-requests/{id}/accept */
export async function acceptSupervisorCancelRequest(requestId: number): Promise<void> {
  await api.post(`/supervisor-cancel-requests/${requestId}/accept`);
}

/** POST /api/supervisor-cancel-requests/{id}/reject */
export async function rejectSupervisorCancelRequest(requestId: number): Promise<void> {
  await api.post(`/supervisor-cancel-requests/${requestId}/reject`);
}

export { parseApiErrorMessage };
