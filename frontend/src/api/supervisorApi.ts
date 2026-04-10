// src/api/supervisorApi.ts

import api from "./axiosInstance";

// ─── Types ───────────────────────────────────────────────────

export interface Supervisor {
  doctorId: number;
  name: string;
  specialization: string | null;
  matchScore: number;
}

export interface SupervisorRequest {
  requestId: number;
  project: {
    projectId: number;
    name: string;
    description: string | null;
    requiredSkills: string[];
  };
  sender: {
    studentId: number;
    name: string;
    major: string;
    university: string;
  };
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
  respondedAt: string | null;
}

// ─── Student Side ───────────────────────────────────────────

// GET recommended supervisors
export const getRecommendedSupervisors = async (
  projectId: number,
): Promise<Supervisor[]> => {
  const res = await api.get(
    `/graduation-projects/${projectId}/recommended-supervisors`,
  );
  return res.data;
};

// POST request supervisor
export const requestSupervisor = async (
  projectId: number,
  doctorId: number,
): Promise<{ message: string; requestId: number }> => {
  const res = await api.post(
    `/graduation-projects/${projectId}/request-supervisor/${doctorId}`,
  );
  return res.data;
};

// POST send supervisor cancellation request (leader/owner side)
export const requestSupervisorCancellation = async (
  projectId: number,
): Promise<{ message: string }> => {
  const res = await api.post(
    `/graduation-projects/${projectId}/request-supervisor-cancel`,
  );
  return res.data;
};

// Alias used by dashboard UI
export const sendCancellationRequest = async (
  projectId: number,
): Promise<{ message: string }> => {
  const res = await api.post(
    `/graduation-projects/${projectId}/request-supervisor-cancel`,
  );
  return res.data;
};

// ─── Doctor Side ───────────────────────────────────────────

function asRequestArray(data: unknown): SupervisorRequest[] {
  if (Array.isArray(data)) return data as SupervisorRequest[];
  return [];
}

// GET /api/doctors/me/requests — uses shared axios (Bearer token via interceptor)
export const getDoctorRequests = async (): Promise<SupervisorRequest[]> => {
  const res = await api.get<unknown>("/doctors/me/requests");
  return asRequestArray(res.data);
};

// Accept
export const acceptSupervisorRequest = async (id: number) => {
  const res = await api.post(`/supervisor-requests/${id}/accept`);
  return res.data;
};

// Reject
export const rejectSupervisorRequest = async (id: number) => {
  const res = await api.post(`/supervisor-requests/${id}/reject`);
  return res.data;
};

export interface SupervisorCancelRequestItem {
  requestId: number;
  projectId: number;
  projectName: string;
  studentName: string;
  status: string;
}

export const getDoctorSupervisorCancelRequests = async (): Promise<
  SupervisorCancelRequestItem[]
> => {
  const res = await api.get<unknown>("/doctors/me/supervisor-cancel-requests");
  return Array.isArray(res.data)
    ? (res.data as SupervisorCancelRequestItem[])
    : [];
};

export const acceptSupervisorCancelRequest = async (id: number) => {
  const res = await api.post(`/supervisor-cancel-requests/${id}/accept`);
  return res.data;
};

export const rejectSupervisorCancelRequest = async (id: number) => {
  const res = await api.post(`/supervisor-cancel-requests/${id}/reject`);
  return res.data;
};
