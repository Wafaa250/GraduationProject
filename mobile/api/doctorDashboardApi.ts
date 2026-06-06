import api, { parseApiErrorMessage } from "./axiosInstance";

export type DoctorDashboardSummary = {
  pendingRequestsCount: number;
  supervisedCount: number;
  pendingCancelCount: number;
  supervisedStudentsCount: number;
  completedSupervisionsCount: number;
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

export type DoctorSupervisedProject = {
  projectId: number;
  name: string;
  description: string | null;
  projectType?: string;
  projectTypeLabel?: string;
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
    faculty?: string | null;
  };
  createdAt: string;
};

export async function getDoctorDashboardSummary(): Promise<DoctorDashboardSummary> {
  const { data } = await api.get<DoctorDashboardSummary>("/doctors/me/dashboard-summary");
  return {
    pendingRequestsCount: data?.pendingRequestsCount ?? 0,
    supervisedCount: data?.supervisedCount ?? 0,
    pendingCancelCount: data?.pendingCancelCount ?? 0,
    supervisedStudentsCount: data?.supervisedStudentsCount ?? 0,
    completedSupervisionsCount: data?.completedSupervisionsCount ?? 0,
  };
}

export async function getDoctorSupervisorRequests(): Promise<DoctorSupervisorRequest[]> {
  const { data } = await api.get<DoctorSupervisorRequest[]>("/doctors/me/requests");
  return Array.isArray(data) ? data : [];
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

export { parseApiErrorMessage };
