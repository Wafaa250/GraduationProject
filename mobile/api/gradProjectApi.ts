import api from "@/api/axiosInstance";
import { projectTypeLabel as projectTypeLabelFromLib } from "@/lib/graduationProjectTypes";

export type GradProjectMember = {
  studentId: number;
  userId: number;
  name: string;
  email?: string;
  university?: string;
  major?: string;
  profilePicture?: string | null;
  role: "leader" | "member";
  joinedAt?: string;
};

export type GradProjectSupervisor = {
  doctorId: number;
  userId: number;
  name: string;
  email?: string | null;
  faculty?: string | null;
  university?: string | null;
  specialization?: string | null;
  department?: string | null;
  profilePicture?: string | null;
  assignedAt?: string | null;
};

export type GradProject = {
  id: number;
  ownerId: number;
  ownerName?: string;
  name: string;
  abstract?: string | null;
  description?: string | null;
  technologies?: string[];
  projectType?: "GP1" | "GP2" | "GP";
  projectTypeLabel?: string;
  ownerFaculty?: string | null;
  ownerMajor?: string | null;
  partnersCount: number;
  currentMembers: number;
  remainingSeats?: number;
  isFull: boolean;
  isOwner?: boolean;
  requiredSkills?: string[];
  preferredRoles?: string[];
  requiredRoles?: string[];
  skillPriorities?: string[];
  lookingForTeammates?: boolean;
  supervisor?: GradProjectSupervisor | null;
  members: GradProjectMember[];
  createdAt?: string;
  updatedAt?: string;
};

export type CreateGraduationProjectPayload = {
  name: string;
  abstract?: string | null;
  projectType: "GP1" | "GP2" | "GP";
  requiredSkills: string[];
  preferredRoles?: string[];
  requiredRoles?: string[];
  skillPriorities?: string[];
  lookingForTeammates?: boolean;
  partnersCount: number;
};

export type UpdateGraduationProjectPayload = {
  name?: string;
  abstract?: string | null;
  projectType?: "GP1" | "GP2" | "GP";
  requiredSkills?: string[];
  preferredRoles?: string[];
  requiredRoles?: string[];
  skillPriorities?: string[];
  lookingForTeammates?: boolean;
  partnersCount?: number;
};

export type GradProjectRecommendedStudent = {
  studentId: number;
  name: string;
  major: string;
  university: string;
  skills: string[];
  matchScore: number;
  reason?: string;
};

function parseGraduationProjectsMyPayload(raw: unknown): {
  role: "owner" | "member" | null;
  project: GradProject | null;
} {
  const root =
    raw !== null &&
    typeof raw === "object" &&
    "data" in raw &&
    (raw as { data?: unknown }).data !== undefined
      ? (raw as { data: unknown }).data
      : raw;

  if (root === null || typeof root !== "object") {
    return { role: null, project: null };
  }

  const d = root as {
    project?: GradProject | null;
    Project?: GradProject | null;
    role?: string | null;
    Role?: string | null;
  };

  const project = d.project ?? d.Project ?? null;
  const roleRaw = d.role ?? d.Role;
  const role = roleRaw === "owner" || roleRaw === "member" ? roleRaw : null;

  return { role, project };
}

function normalizeMatchScore(score: number): number {
  if (!Number.isFinite(score)) return 0;
  if (score > 0 && score <= 1) return Math.round(score * 100);
  return Math.round(Math.min(100, Math.max(0, score)));
}

export async function getGraduationProjectsMyEnvelope(): Promise<{
  role: "owner" | "member" | null;
  project: GradProject | null;
}> {
  const { data } = await api.get("/graduation-projects/my");
  return parseGraduationProjectsMyPayload(data);
}

export async function createGraduationProject(
  payload: CreateGraduationProjectPayload,
): Promise<GradProject> {
  const { data } = await api.post<GradProject>("/graduation-projects", payload);
  return data;
}

export async function updateGraduationProject(
  id: number,
  payload: UpdateGraduationProjectPayload,
): Promise<GradProject> {
  const { data } = await api.put<GradProject>(`/graduation-projects/${id}`, payload);
  return data;
}

export async function deleteGraduationProject(id: number): Promise<void> {
  await api.delete(`/graduation-projects/${id}`);
}

export async function getRecommendedStudents(
  projectId: number,
): Promise<GradProjectRecommendedStudent[]> {
  const { data } = await api.post<
    {
      studentId: number;
      matchScore: number;
      reason?: string | null;
      name?: string;
      major?: string;
      university?: string;
      skills?: string[];
    }[]
  >("/ai/recommend-students", { projectId });

  const rows = Array.isArray(data) ? data : [];
  return rows
    .map((row) => ({
      studentId: row.studentId,
      name: row.name?.trim() || `Student #${row.studentId}`,
      major: row.major?.trim() ?? "",
      university: row.university?.trim() ?? "",
      skills: Array.isArray(row.skills) ? row.skills : [],
      matchScore: normalizeMatchScore(row.matchScore),
      reason: row.reason?.trim() || undefined,
    }))
    .filter((row) => row.matchScore > 0);
}

export async function inviteStudentToProject(
  projectId: number,
  receiverStudentId: number,
): Promise<void> {
  await api.post(`/graduation-projects/${projectId}/invite/${receiverStudentId}`);
}

export function deriveProjectStatus(project: GradProject): string {
  if (project.supervisor) {
    if (project.isFull) return "Completed";
    return "Supervisor assigned";
  }
  if (project.isFull) return "In progress";
  if (project.lookingForTeammates !== false) return "Waiting for members";
  return "In progress";
}

export function resolveProjectTypeLabel(project: {
  projectType?: string;
  projectTypeLabel?: string;
  ownerFaculty?: string | null;
  ownerMajor?: string | null;
}): string {
  if (project.projectTypeLabel?.trim()) return project.projectTypeLabel.trim();
  return projectTypeLabelFromLib(project.projectType, project.ownerFaculty, project.ownerMajor);
}
