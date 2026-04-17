import axios from "axios";
import { apiClient } from "./client";

export interface DoctorSupervisedProjectOwner {
  studentId: number;
  userId: number;
  name: string;
  university: string;
  major: string;
}

/** GET /api/doctors/me/supervised-projects — one item */
export interface DoctorSupervisedProject {
  projectId: number;
  name: string;
  /** Prefer for display: `abstract ?? description` */
  abstract?: string | null;
  description: string | null;
  requiredSkills: string[];
  partnersCount: number;
  memberCount: number;
  isFull: boolean;
  owner: DoctorSupervisedProjectOwner;
  createdAt: string;
}

/** GET /api/doctors/me/dashboard-summary */
export interface DoctorDashboardSummary {
  pendingRequestsCount: number;
  supervisedCount: number;
  pendingCancelCount: number;
}

export const doctorDashboardApi = {
  getProjects: () =>
    apiClient.get<DoctorSupervisedProject[]>("/doctors/me/supervised-projects"),

  getSummary: () =>
    apiClient.get<DoctorDashboardSummary>("/doctors/me/dashboard-summary"),

  resign: (projectId: number) =>
    apiClient.post(`/doctors/me/resign-supervision/${projectId}`),

  deleteSupervisedProject: (projectId: number) =>
    apiClient.delete(`/doctors/me/supervised-projects/${projectId}`),
};

/**
 * Tries DELETE /doctors/me/supervised-projects/{id}; on 404/405 falls back to
 * POST /doctors/me/resign-supervision/{id} (existing backend).
 */
export async function removeDoctorSupervision(projectId: number): Promise<void> {
  try {
    await doctorDashboardApi.deleteSupervisedProject(projectId);
  } catch (err) {
    const status = axios.isAxiosError(err) ? err.response?.status : undefined;
    if (status === 404 || status === 405) {
      await doctorDashboardApi.resign(projectId);
      return;
    }
    throw err;
  }
}
