import { apiClient } from "./client";
import type { DoctorSupervisedProject } from "../app/pages/doctor/doctorDashboardTypes";

/** GET /api/doctors/me/supervised-projects */
export async function getDoctorSupervisedProjects(): Promise<DoctorSupervisedProject[]> {
  const { data } = await apiClient.get<DoctorSupervisedProject[]>("/doctors/me/supervised-projects");
  return Array.isArray(data) ? data : [];
}

/**
 * POST /api/doctors/me/resign-supervision/{projectId}
 * Doctor resigns supervision (explicit resign route).
 */
export async function resignDoctorSupervision(projectId: number) {
  await apiClient.post(`/doctors/me/resign-supervision/${projectId}`);
}

/**
 * Remove doctor supervision for a project. Tries DELETE first; falls back to
 * POST resign when the API only implements the legacy route.
 */
export async function removeDoctorSupervision(projectId: number) {
  try {
    return await apiClient.delete(`/doctors/me/supervised-projects/${projectId}`);
  } catch (err: unknown) {
    const status = (err as { response?: { status?: number } })?.response?.status;
    if (status === 404 || status === 405) {
      return apiClient.post(`/doctors/me/resign-supervision/${projectId}`);
    }
    throw err;
  }
}

export const doctorDashboardApi = {
  removeSupervision: removeDoctorSupervision,
  resignSupervision: resignDoctorSupervision,
};
