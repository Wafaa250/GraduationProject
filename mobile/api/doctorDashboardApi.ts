import { getDoctorMe } from "@/api/meApi";
import {
  computeDoctorSupervisorAiCompatibility,
  doctorExpertiseFromMe,
} from "@/lib/doctorSupervisorCompatibility";
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
  const [requestsResult, meResult] = await Promise.allSettled([
    api.get<DoctorSupervisorRequest[]>("/doctors/me/requests"),
    getDoctorMe(),
  ]);

  if (requestsResult.status === "rejected") {
    throw requestsResult.reason;
  }

  const requests = Array.isArray(requestsResult.value.data)
    ? requestsResult.value.data
    : [];

  const expertise =
    meResult.status === "fulfilled"
      ? doctorExpertiseFromMe(meResult.value)
      : { specialization: "", technicalSkills: [], researchSkills: [] };

  return requests.map((request) => ({
    ...request,
    aiCompatibility: computeDoctorSupervisorAiCompatibility(
      request.project?.requiredSkills,
      expertise,
    ),
  }));
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
  const { data } = await api.get("/doctors/me/supervised-projects");
  const rows = Array.isArray(data) ? data : [];
  return rows.map(normalizeSupervisedProject).filter((p): p is DoctorSupervisedProject => p !== null);
}

function asRecord(raw: unknown): Record<string, unknown> | null {
  return raw !== null && typeof raw === "object" ? (raw as Record<string, unknown>) : null;
}

function pickString(raw: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = raw[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function pickNullableString(raw: Record<string, unknown>, ...keys: string[]): string | null {
  const value = pickString(raw, ...keys);
  return value || null;
}

function pickNumber(raw: Record<string, unknown>, ...keys: string[]): number {
  for (const key of keys) {
    const value = raw[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() && !Number.isNaN(Number(value))) {
      return Number(value);
    }
  }
  return 0;
}

function pickBool(raw: Record<string, unknown>, ...keys: string[]): boolean {
  for (const key of keys) {
    const value = raw[key];
    if (typeof value === "boolean") return value;
  }
  return false;
}

function pickStringList(raw: Record<string, unknown>, ...keys: string[]): string[] {
  for (const key of keys) {
    const value = raw[key];
    if (Array.isArray(value)) {
      return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
    }
  }
  return [];
}

function normalizeSupervisedProject(raw: unknown): DoctorSupervisedProject | null {
  const record = asRecord(raw);
  if (!record) return null;

  const projectId = pickNumber(record, "projectId", "ProjectId");
  if (!projectId) return null;

  const ownerRaw = asRecord(record.owner ?? record.Owner) ?? {};
  const studentId = pickNumber(ownerRaw, "studentId", "StudentId");

  return {
    projectId,
    name: pickString(record, "name", "Name"),
    description: pickNullableString(record, "description", "Description"),
    projectType: pickString(record, "projectType", "ProjectType") || undefined,
    projectTypeLabel: pickNullableString(record, "projectTypeLabel", "ProjectTypeLabel") ?? undefined,
    requiredSkills: pickStringList(record, "requiredSkills", "RequiredSkills"),
    preferredRoles: pickStringList(record, "preferredRoles", "PreferredRoles"),
    partnersCount: pickNumber(record, "partnersCount", "PartnersCount"),
    memberCount: pickNumber(record, "memberCount", "MemberCount"),
    isFull: pickBool(record, "isFull", "IsFull"),
    createdAt: pickString(record, "createdAt", "CreatedAt"),
    owner: {
      studentId,
      userId: pickNumber(ownerRaw, "userId", "UserId"),
      name: pickString(ownerRaw, "name", "Name"),
      university: pickString(ownerRaw, "university", "University"),
      major: pickString(ownerRaw, "major", "Major"),
      faculty: pickNullableString(ownerRaw, "faculty", "Faculty"),
    },
  };
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

export async function getDoctorSupervisorCancelRequests(): Promise<DoctorSupervisorCancelRequest[]> {
  const { data } = await api.get<DoctorSupervisorCancelRequest[]>(
    "/doctors/me/supervisor-cancel-requests",
  );
  return Array.isArray(data) ? data : [];
}

export async function acceptSupervisorCancelRequest(requestId: number): Promise<void> {
  await api.post(`/supervisor-cancel-requests/${requestId}/accept`);
}

export async function rejectSupervisorCancelRequest(requestId: number): Promise<void> {
  await api.post(`/supervisor-cancel-requests/${requestId}/reject`);
}

export { parseApiErrorMessage };
