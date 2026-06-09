import api from "./axiosInstance";
import {
  projectTypeToStage as projectTypeToStageFromLib,
  projectTypeLabel as projectTypeLabelFromLib,
} from "@/lib/graduationProjectTypes";

export {
  projectTypeLabel,
  projectTypeShortLabel,
  stageToProjectType,
  getGraduationProjectTypeOptions,
  getBrowseProjectTypeFilters,
  isProjectVisibleToStudent,
  getRegistrationGraduationCourses,
  isEngineeringFaculty,
  isComputerEngineeringMajor,
  resolveGraduationTrack,
  resolveGraduationProjectLabel,
  getGraduationSectionTitle,
  projectTypeForApi,
} from "@/lib/graduationProjectTypes";

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

export type GradProjectAbstractFile = {
  fileName: string;
  uploadedAt: string;
  downloadUrl: string;
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
  /** Total team capacity including owner (backend `PartnersCount`). */
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
  projectInterests?: string[];
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
  projectInterests?: string[];
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
  projectInterests?: string[];
};

export type GraduationProjectDraft = {
  payload: unknown | null;
  updatedAt: string | null;
};

export async function getGraduationProjectDraft(): Promise<GraduationProjectDraft> {
  const { data } = await api.get<{ payload?: unknown; updatedAt?: string | null }>(
    "/graduation-projects/draft",
  );
  return { payload: data?.payload ?? null, updatedAt: data?.updatedAt ?? null };
}

export async function saveGraduationProjectDraft(payload: unknown): Promise<GraduationProjectDraft> {
  const { data } = await api.put<{ payload?: unknown; updatedAt?: string | null }>(
    "/graduation-projects/draft",
    { payload },
  );
  return { payload: data?.payload ?? payload, updatedAt: data?.updatedAt ?? null };
}

export async function deleteGraduationProjectDraft(): Promise<void> {
  await api.delete("/graduation-projects/draft");
}

export async function uploadGraduationProjectAbstractFile(
  projectId: number,
  fileName: string,
  fileBase64: string,
): Promise<GradProjectAbstractFile> {
  const { data } = await api.post<GradProjectAbstractFile>(
    `/graduation-projects/${projectId}/abstract-file`,
    { fileName, fileBase64 },
  );
  return data;
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

/** DELETE /api/graduation-projects/{id} — owner only. */
export async function deleteGraduationProject(id: number): Promise<void> {
  await api.delete(`/graduation-projects/${id}`);
}

export function projectTypeToStage(type?: string): string {
  return projectTypeToStageFromLib(type);
}

export async function getGraduationProjectsMyEnvelope(): Promise<{
  role: "owner" | "member" | null;
  project: GradProject | null;
}> {
  const { data } = await api.get("/graduation-projects/my");
  return parseGraduationProjectsMyPayload(data);
}

/** GET /api/graduation-projects — discovery list for browse. */
export async function listGraduationProjects(): Promise<GradProject[]> {
  const { data } = await api.get<GradProject[]>("/graduation-projects");
  return Array.isArray(data) ? data : [];
}

/** POST /api/graduation-projects/{id}/join */
export async function joinGraduationProject(projectId: number): Promise<void> {
  await api.post(`/graduation-projects/${projectId}/join`);
}

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

/** Stored total team capacity (including owner) → wizard desired team size. */
export function partnersCountToTeamSize(partnersCount: number): number | null {
  if (!Number.isFinite(partnersCount) || partnersCount < 1) return null;
  return Math.min(5, partnersCount);
}

/** Wizard desired team size → stored total team capacity (including owner). */
export function teamSizeToPartnersCount(teamSize: number | null | undefined): number {
  if (teamSize == null || !Number.isFinite(teamSize) || teamSize < 1) return 0;
  return Math.min(10, Math.max(1, teamSize));
}

export type GradProjectRecommendedStudent = {
  studentId: number;
  userId?: number;
  name: string;
  major: string;
  university: string;
  skills: string[];
  matchScore: number;
  reason?: string;
};

export type GradProjectRecommendedSupervisor = {
  doctorId: number;
  userId?: number;
  name: string;
  specialization: string;
  matchScore: number;
  reason?: string;
};

export async function getGraduationProjectById(projectId: number): Promise<GradProject> {
  const { data } = await api.get<GradProject>(`/graduation-projects/${projectId}`);
  return data;
}

/** GET /api/graduation-projects/{id}/abstract-file — supervisor or project owner. */
export async function getGraduationProjectAbstractFile(
  projectId: number,
): Promise<GradProjectAbstractFile | null> {
  try {
    const { data } = await api.get<GradProjectAbstractFile>(
      `/graduation-projects/${projectId}/abstract-file`,
    );
    return data?.downloadUrl ? data : null;
  } catch {
    return null;
  }
}

export type GraduationProjectMember = {
  studentId: number;
  userId: number;
  name: string;
  email: string;
  university: string;
  major: string;
  role: string;
};

export type GraduationProjectMembersResponse = {
  projectId: number;
  currentMembers: number;
  totalCapacity: number;
  remainingSeats: number;
  isFull: boolean;
  members: GraduationProjectMember[];
};

/** GET /api/graduation-projects/{id}/members */
export async function getGraduationProjectMembers(
  projectId: number,
): Promise<GraduationProjectMembersResponse> {
  const { data } = await api.get<GraduationProjectMembersResponse>(
    `/graduation-projects/${projectId}/members`,
  );
  return data;
}

function normalizeMatchScore(score: number): number {
  if (!Number.isFinite(score)) return 0;
  if (score > 0 && score <= 1) return Math.round(score * 100);
  return Math.round(Math.min(100, Math.max(0, score)));
}

const PLACEHOLDER_STUDENT_NAME = /^student #\d+$/i;

function isValidStudentRecommendation(row: GradProjectRecommendedStudent): boolean {
  const name = row.name?.trim() ?? "";
  if (!row.studentId || row.studentId <= 0) return false;
  if (!name || PLACEHOLDER_STUDENT_NAME.test(name)) return false;
  return Number.isFinite(row.matchScore);
}

/** POST /api/ai/recommend-students — owner or team leader only. */
export async function getRecommendedStudents(
  projectId: number,
): Promise<GradProjectRecommendedStudent[]> {
  const { data } = await api.post<
    {
      studentId: number;
      userId?: number;
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
      userId: row.userId && row.userId > 0 ? row.userId : undefined,
      name: row.name?.trim() ?? "",
      major: row.major?.trim() ?? "",
      university: row.university?.trim() ?? "",
      skills: Array.isArray(row.skills) ? row.skills : [],
      matchScore: normalizeMatchScore(row.matchScore),
      reason: row.reason?.trim() || undefined,
    }))
    .filter(isValidStudentRecommendation)
    .filter((row) => row.matchScore >= 1);
}

const PLACEHOLDER_DOCTOR_NAME = /^doctor #\d+$/i;

export function isValidSupervisorRecommendation(
  row: GradProjectRecommendedSupervisor,
): boolean {
  const name = row.name?.trim() ?? "";
  const reason = row.reason?.trim() ?? "";

  if (!row.doctorId || row.doctorId <= 0) return false;
  if (!row.userId || row.userId <= 0) return false;
  if (!name || PLACEHOLDER_DOCTOR_NAME.test(name)) return false;
  if (/^unknown doctor$/i.test(name)) return false;
  if (!Number.isFinite(row.matchScore)) return false;
  if (!reason) return false;
  return true;
}

function parseSupervisorApiRow(raw: Record<string, unknown>): GradProjectRecommendedSupervisor | null {
  const doctorId = Number(raw.doctorId ?? raw.DoctorId ?? 0);
  const userId = Number(raw.userId ?? raw.UserId ?? 0);
  if (!doctorId) return null;

  const reasonRaw = raw.reason ?? raw.Reason;
  return {
    doctorId,
    userId: userId > 0 ? userId : undefined,
    name: String(raw.doctorName ?? raw.DoctorName ?? raw.name ?? raw.Name ?? "").trim(),
    specialization: String(raw.specialization ?? raw.Specialization ?? "").trim(),
    matchScore: normalizeMatchScore(Number(raw.matchScore ?? raw.MatchScore ?? 0)),
    reason: typeof reasonRaw === "string" ? reasonRaw.trim() : undefined,
  };
}

function parseAiSupervisorRows(data: unknown): GradProjectRecommendedSupervisor[] {
  if (!Array.isArray(data)) return [];
  const rows: GradProjectRecommendedSupervisor[] = [];
  for (const raw of data) {
    if (!raw || typeof raw !== "object") continue;
    const parsed = parseSupervisorApiRow(raw as Record<string, unknown>);
    if (parsed) rows.push(parsed);
  }
  return rows.filter(isValidSupervisorRecommendation);
}

function parseCatalogSupervisorRows(data: unknown): GradProjectRecommendedSupervisor[] {
  if (!Array.isArray(data)) return [];
  const rows: GradProjectRecommendedSupervisor[] = [];
  for (const raw of data) {
    if (!raw || typeof raw !== "object") continue;
    const parsed = parseSupervisorApiRow(raw as Record<string, unknown>);
    if (parsed) rows.push(parsed);
  }
  return rows.filter(isValidSupervisorRecommendation);
}

/** GET /api/graduation-projects/{projectId}/recommended-supervisors — project leader only. */
export async function getRecommendedSupervisorsCatalog(
  projectId: number,
): Promise<GradProjectRecommendedSupervisor[]> {
  const { data } = await api.get(`/graduation-projects/${projectId}/recommended-supervisors`);
  return parseCatalogSupervisorRows(data);
}

/**
 * POST /api/ai/recommend-supervisors with GET catalog fallback.
 * Only returns doctors with a real profile (name, userId, specialization, reason).
 */
export async function getRecommendedSupervisors(
  projectId: number,
): Promise<GradProjectRecommendedSupervisor[]> {
  const [aiSettled, catalogSettled] = await Promise.allSettled([
    api.post("/ai/recommend-supervisors", { projectId }),
    api.get(`/graduation-projects/${projectId}/recommended-supervisors`),
  ]);

  const aiRows =
    aiSettled.status === "fulfilled" ? parseAiSupervisorRows(aiSettled.value.data) : [];
  const catalog =
    catalogSettled.status === "fulfilled"
      ? parseCatalogSupervisorRows(catalogSettled.value.data)
      : [];

  const rows =
    aiRows.length > 0
      ? [...aiRows].sort(
          (a, b) => normalizeMatchScore(b.matchScore) - normalizeMatchScore(a.matchScore),
        )
      : [...catalog].sort((a, b) => b.matchScore - a.matchScore);

  if (import.meta.env.DEV) {
    console.info("[SupervisorRecommendationTrace] recommendations_received", {
      projectId,
      aiStatus: aiSettled.status,
      catalogStatus: catalogSettled.status,
      aiRawCount: aiSettled.status === "fulfilled" && Array.isArray(aiSettled.value.data)
        ? aiSettled.value.data.length
        : 0,
      catalogRawCount: catalogSettled.status === "fulfilled" && Array.isArray(catalogSettled.value.data)
        ? catalogSettled.value.data.length
        : 0,
      parsedCount: rows.length,
      doctors: rows.map((r) => ({
        doctorId: r.doctorId,
        name: r.name,
        matchScore: r.matchScore,
      })),
    });
  }

  return rows;
}

/** Human-readable project lifecycle status from API fields. */
export function deriveProjectStatus(project: GradProject): string {
  if (project.supervisor) {
    if (project.isFull) return "Completed";
    return "Supervisor assigned";
  }
  if (project.isFull) return "In progress";
  if (project.lookingForTeammates !== false) return "Waiting for members";
  return "In progress";
}

/** POST /api/graduation-projects/{projectId}/invite/{receiverId} — owner only. */
export async function inviteStudentToProject(
  projectId: number,
  receiverStudentId: number,
): Promise<void> {
  await api.post(`/graduation-projects/${projectId}/invite/${receiverStudentId}`);
}

/** POST /api/graduation-projects/{projectId}/request-supervisor/{doctorId} — leader only. */
export async function requestProjectSupervisor(
  projectId: number,
  doctorId: number,
): Promise<void> {
  await api.post(`/graduation-projects/${projectId}/request-supervisor/${doctorId}`);
}

/** Prefer API label; fall back to faculty/major-aware helper. */
export function resolveProjectTypeLabel(
  project: { projectType?: string; projectTypeLabel?: string; ownerFaculty?: string | null; ownerMajor?: string | null },
): string {
  if (project.projectTypeLabel?.trim()) return project.projectTypeLabel.trim();
  return projectTypeLabelFromLib(project.projectType, project.ownerFaculty, project.ownerMajor);
}
