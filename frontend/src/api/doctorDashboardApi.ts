import { apiClient } from "./client";
import { parseApiErrorMessage } from "./axiosInstance";
import type { DoctorSupervisedProject } from "../app/pages/doctor/doctorDashboardTypes";

/** Treat as empty state, not an error banner (wrong profile context on some routes). */
export function doctorShouldHideApiError(err: unknown): boolean {
  const msg = parseApiErrorMessage(err).toLowerCase().replace(/\.+$/g, "").trim();
  return msg.includes("student profile not found");
}

function parseOwner(raw: unknown): DoctorSupervisedProject["owner"] | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const studentId = Number(o.studentId ?? o.StudentId);
  const userId = Number(o.userId ?? o.UserId);
  const name = String(o.name ?? o.Name ?? "");
  if (!Number.isFinite(studentId) || !Number.isFinite(userId)) return null;
  return {
    studentId,
    userId,
    name,
    university: String(o.university ?? o.University ?? ""),
    major: String(o.major ?? o.Major ?? ""),
  };
}

function parseRequiredSkills(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map((s) => String(s)).filter(Boolean);
  if (typeof raw === "string") {
    try {
      const p = JSON.parse(raw) as unknown;
      return Array.isArray(p) ? p.map((s) => String(s)).filter(Boolean) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function normalizeSupervisedProject(raw: unknown): DoctorSupervisedProject | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const projectId = Number(r.projectId ?? r.ProjectId ?? r.id ?? r.Id);
  const name = String(r.name ?? r.Name ?? "").trim();
  if (!Number.isFinite(projectId) || !name) return null;
  const desc = r.description ?? r.Description;
  const owner = parseOwner(r.owner ?? r.Owner);
  if (!owner) return null;
  const skills = parseRequiredSkills(r.requiredSkills ?? r.RequiredSkills);
  const partnersCount = Number(r.partnersCount ?? r.PartnersCount ?? 0);
  const memberCount = Number(
    r.memberCount ?? r.MemberCount ?? r.currentMembers ?? r.CurrentMembers ?? 0,
  );
  return {
    projectId,
    name,
    description: desc == null || desc === "" ? null : String(desc),
    requiredSkills: skills,
    partnersCount,
    memberCount,
    isFull: Boolean(r.isFull ?? r.IsFull ?? (partnersCount > 0 && memberCount >= partnersCount)),
    owner,
    createdAt: String(r.createdAt ?? r.CreatedAt ?? ""),
  };
}

/** GET /api/doctors/me/supervised-projects */
export async function getDoctorSupervisedProjects(): Promise<DoctorSupervisedProject[]> {
  const res = await apiClient.get<unknown>("/doctors/me/supervised-projects");
  const data = res.data;
  if (!Array.isArray(data)) return [];
  const out: DoctorSupervisedProject[] = [];
  for (const row of data) {
    const p = normalizeSupervisedProject(row);
    if (p) out.push(p);
  }
  return out;
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
};
