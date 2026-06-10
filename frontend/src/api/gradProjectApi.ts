import { resolveGraduationProjectAbstractFile } from "@/lib/graduationProjectAbstractDocument";
import api, { resolveApiFileUrl } from "./axiosInstance";
import {
  listDoctorsDirectory,
  type DoctorDirectoryEntry,
} from "@/api/doctorDirectoryApi";
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

export type GradProjectPendingSupervisor = {
  doctorId: number;
  name: string;
  specialization?: string | null;
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
  /** When backend exposes stored abstract file metadata (optional). */
  abstractFileName?: string | null;
  abstractFilePath?: string | null;
  abstractFileUploadedAt?: string | null;
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
  supervisor?: GradProjectSupervisor | null;
  /** Outstanding supervision request status from GET /graduation-projects/my. */
  supervisorRequestStatus?: "pending" | "accepted" | "rejected" | string | null;
  /** Doctor targeted when supervisorRequestStatus is pending. */
  pendingSupervisor?: GradProjectPendingSupervisor | null;
  supervisorCancellationRequestStatus?:
    | "pending"
    | "approved"
    | "rejected"
    | string
    | null;
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

export function normSupervisorRequestStatus(status?: string | null): string {
  return (status ?? "").trim().toLowerCase();
}

function pickOptionalString(
  raw: Record<string, unknown>,
  ...keys: string[]
): string | null {
  for (const key of keys) {
    const value = raw[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function normalizePendingSupervisor(
  raw: GradProjectPendingSupervisor | null | undefined,
): GradProjectPendingSupervisor | null {
  if (!raw || typeof raw !== "object") return null;
  const doctorId = Number(
    (raw as GradProjectPendingSupervisor & { DoctorId?: number }).doctorId ??
      (raw as { DoctorId?: number }).DoctorId,
  );
  if (!Number.isFinite(doctorId) || doctorId <= 0) return null;
  const name =
    (raw as GradProjectPendingSupervisor & { Name?: string }).name ??
    (raw as { Name?: string }).Name ??
    "";
  const specialization =
    (raw as GradProjectPendingSupervisor & { Specialization?: string | null }).specialization ??
    (raw as { Specialization?: string | null }).Specialization ??
    null;
  return { doctorId, name, specialization };
}

/** Normalize project payloads from GET /my and GET /{id} (camelCase or PascalCase). */
export function normalizeGradProject(project: GradProject): GradProject {
  const raw = project as GradProject & {
    SupervisorRequestStatus?: string | null;
    PendingSupervisor?: GradProjectPendingSupervisor | null;
    SupervisorCancellationRequestStatus?: string | null;
    AbstractFileName?: string | null;
    AbstractFilePath?: string | null;
    AbstractFileUploadedAt?: string | null;
  };

  const rawRecord = raw as unknown as Record<string, unknown>;

  return {
    ...project,
    abstractFileName:
      project.abstractFileName ?? pickOptionalString(rawRecord, "abstractFileName", "AbstractFileName"),
    abstractFilePath:
      project.abstractFilePath ?? pickOptionalString(rawRecord, "abstractFilePath", "AbstractFilePath"),
    abstractFileUploadedAt:
      project.abstractFileUploadedAt ??
      pickOptionalString(rawRecord, "abstractFileUploadedAt", "AbstractFileUploadedAt"),
    supervisorRequestStatus:
      project.supervisorRequestStatus ?? raw.SupervisorRequestStatus ?? null,
    pendingSupervisor: normalizePendingSupervisor(
      project.pendingSupervisor ?? raw.PendingSupervisor,
    ),
    supervisorCancellationRequestStatus:
      project.supervisorCancellationRequestStatus ??
      raw.SupervisorCancellationRequestStatus ??
      null,
  };
}

export function getPendingSupervisorDoctorId(
  project: GradProject | null | undefined,
): number | null {
  if (!project || project.supervisor) return null;
  if (normSupervisorRequestStatus(project.supervisorRequestStatus) !== "pending") {
    return null;
  }
  const doctorId = project.pendingSupervisor?.doctorId;
  return typeof doctorId === "number" && doctorId > 0 ? doctorId : null;
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

  const projectRaw = d.project ?? d.Project ?? null;
  const project = projectRaw ? normalizeGradProject(projectRaw) : null;
  const roleRaw = d.role ?? d.Role;
  const role = roleRaw === "owner" || roleRaw === "member" ? roleRaw : null;

  return { role, project };
}

/** Stored total team capacity (including owner) → wizard desired team size. */
export function partnersCountToTeamSize(partnersCount: number): number {
  return Math.min(5, Math.max(1, partnersCount));
}

/** Wizard desired team size → stored total team capacity (including owner). */
export function teamSizeToPartnersCount(teamSize: number): number {
  return Math.min(10, Math.max(1, teamSize));
}

export type GradProjectRecommendedStudent = {
  studentId: number;
  name: string;
  major: string;
  university: string;
  skills: string[];
  matchScore: number;
  /** Not returned by GET recommended-students; omitted unless present elsewhere. */
  reason?: string;
  hasPendingInvite?: boolean;
  isMember?: boolean;
  canInvite?: boolean;
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
  return normalizeGradProject(data);
}

function parseAbstractFileApiResponse(data: unknown): GradProjectAbstractFile | null {
  if (!data || typeof data !== "object") return null;
  const raw = data as Record<string, unknown>;
  const downloadUrl = resolveApiFileUrl(
    (raw.downloadUrl ?? raw.DownloadUrl ?? raw.url ?? raw.Url) as string | undefined,
  );
  if (!downloadUrl) return null;
  const fileName =
    (typeof raw.fileName === "string" && raw.fileName) ||
    (typeof raw.FileName === "string" && raw.FileName) ||
    "Document";
  const uploadedAt =
    (typeof raw.uploadedAt === "string" && raw.uploadedAt) ||
    (typeof raw.UploadedAt === "string" && raw.UploadedAt) ||
    new Date().toISOString();
  return { fileName, uploadedAt, downloadUrl };
}

/** GET /api/graduation-projects/{id}/abstract-file — falls back to project.abstract metadata. */
export async function getGraduationProjectAbstractFile(
  projectId: number,
  project?: GradProject | null,
): Promise<GradProjectAbstractFile | null> {
  if (project) {
    const fromProject = resolveGraduationProjectAbstractFile(project);
    if (fromProject) return fromProject;
  }

  try {
    const { data } = await api.get(`/graduation-projects/${projectId}/abstract-file`);
    return parseAbstractFileApiResponse(data);
  } catch {
    return project ? resolveGraduationProjectAbstractFile(project) : null;
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
  /** True when the authenticated student is the project owner (StudentProfile.Id). */
  isOwner?: boolean;
  /** True when the authenticated student has role "leader" on the team. */
  isLeader?: boolean;
  members: GraduationProjectMember[];
};

/** DELETE /api/graduation-projects/{id}/members/{memberId} */
export type RemoveMemberResponse = {
  message: string;
  currentMembers: number;
};

/** PUT /api/graduation-projects/{projectId}/change-leader/{memberId} */
export type ChangeLeaderResponse = {
  message: string;
  newLeaderId: number;
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

/** DELETE /api/graduation-projects/{id}/leave — non-leader members only. */
export async function leaveGraduationProject(projectId: number): Promise<{ message: string }> {
  const { data } = await api.delete<{ message: string }>(`/graduation-projects/${projectId}/leave`);
  return data;
}

/**
 * DELETE /api/graduation-projects/{projectId}/members/{memberId}
 * memberId = StudentProfile.Id (same as member.studentId in GET /members).
 */
export async function removeProjectMember(
  projectId: number,
  memberStudentId: number,
): Promise<RemoveMemberResponse> {
  const { data } = await api.delete<RemoveMemberResponse>(
    `/graduation-projects/${projectId}/members/${memberStudentId}`,
  );
  return data;
}

/**
 * PUT /api/graduation-projects/{projectId}/change-leader/{memberId}
 * memberId = StudentProfile.Id of the new leader.
 */
export async function changeProjectLeader(
  projectId: number,
  memberStudentId: number,
): Promise<ChangeLeaderResponse> {
  const { data } = await api.put<ChangeLeaderResponse>(
    `/graduation-projects/${projectId}/change-leader/${memberStudentId}`,
  );
  return data;
}

function normalizeMatchScore(score: number): number {
  if (!Number.isFinite(score)) return 0;
  if (score > 0 && score <= 1) return Math.round(score * 100);
  return Math.round(Math.min(100, Math.max(0, score)));
}

function parseRecommendedStudentRows(data: unknown): GradProjectRecommendedStudent[] {
  if (!Array.isArray(data)) return [];
  const rows: GradProjectRecommendedStudent[] = [];
  for (const raw of data) {
    if (!raw || typeof raw !== "object") continue;
    const r = raw as Record<string, unknown>;
    const studentId = Number(r.studentId ?? r.StudentId ?? 0);
    if (!Number.isFinite(studentId) || studentId <= 0) continue;
    const skillsRaw = r.skills ?? r.Skills;
    const hasPendingInviteRaw = r.hasPendingInvite ?? r.HasPendingInvite;
    const isMemberRaw = r.isMember ?? r.IsMember;
    const canInviteRaw = r.canInvite ?? r.CanInvite;
    rows.push({
      studentId,
      name: String(r.name ?? r.Name ?? "").trim(),
      major: String(r.major ?? r.Major ?? "").trim(),
      university: String(r.university ?? r.University ?? "").trim(),
      skills: Array.isArray(skillsRaw) ? skillsRaw.map((s) => String(s).trim()).filter(Boolean) : [],
      matchScore: normalizeMatchScore(Number(r.matchScore ?? r.MatchScore ?? 0)),
      hasPendingInvite:
        typeof hasPendingInviteRaw === "boolean" ? hasPendingInviteRaw : undefined,
      isMember: typeof isMemberRaw === "boolean" ? isMemberRaw : undefined,
      canInvite: typeof canInviteRaw === "boolean" ? canInviteRaw : undefined,
    });
  }
  return rows;
}

/**
 * GET /api/graduation-projects/{projectId}/recommended-students
 *
 * Project owner only; students ranked by skill match vs. required skills (OLD parity).
 */
export async function getRecommendedStudents(
  projectId: number,
): Promise<GradProjectRecommendedStudent[]> {
  const { data } = await api.get(`/graduation-projects/${projectId}/recommended-students`);
  return parseRecommendedStudentRows(data);
}

type ParsedAiSupervisorRow = {
  doctorId: number;
  matchScore: number;
  reason?: string | null;
  doctorName: string;
  specialization: string;
};

function supervisorDisplayName(doctorId: number, ...candidates: (string | undefined)[]): string {
  for (const value of candidates) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }
  return `Doctor #${doctorId}`;
}

function firstTrimmedSpecialization(...values: (string | undefined | null)[]): string {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }
  return "";
}

function directoryByProfileId(
  directory: DoctorDirectoryEntry[],
): Map<number, DoctorDirectoryEntry> {
  return new Map(directory.map((entry) => [entry.profileId, entry]));
}

function parseAiSupervisorRows(data: unknown): ParsedAiSupervisorRow[] {
  if (!Array.isArray(data)) return [];
  const rows: ParsedAiSupervisorRow[] = [];
  for (const raw of data) {
    if (!raw || typeof raw !== "object") continue;
    const r = raw as Record<string, unknown>;
    const doctorId = Number(r.doctorId ?? r.DoctorId ?? 0);
    if (!doctorId) continue;
    const reasonRaw = r.reason ?? r.Reason;
    rows.push({
      doctorId,
      matchScore: Number(r.matchScore ?? r.MatchScore ?? 0),
      reason: typeof reasonRaw === "string" ? reasonRaw : null,
      doctorName: String(r.doctorName ?? r.DoctorName ?? r.name ?? r.Name ?? "").trim(),
      specialization: String(r.specialization ?? r.Specialization ?? "").trim(),
    });
  }
  return rows;
}

function parseCatalogSupervisorRows(data: unknown): GradProjectRecommendedSupervisor[] {
  if (!Array.isArray(data)) return [];
  const rows: GradProjectRecommendedSupervisor[] = [];
  for (const raw of data) {
    if (!raw || typeof raw !== "object") continue;
    const r = raw as Record<string, unknown>;
    const doctorId = Number(r.doctorId ?? r.DoctorId ?? 0);
    if (!doctorId) continue;
    const userId = Number(r.userId ?? r.UserId ?? 0);
    rows.push({
      doctorId,
      userId: userId > 0 ? userId : undefined,
      name: String(r.name ?? r.Name ?? "").trim(),
      specialization: String(r.specialization ?? r.Specialization ?? "").trim(),
      matchScore: normalizeMatchScore(Number(r.matchScore ?? r.MatchScore ?? 0)),
    });
  }
  return rows;
}

/** GET /api/graduation-projects/{projectId}/recommended-supervisors — project leader only. */
export async function getRecommendedSupervisorsCatalog(
  projectId: number,
): Promise<GradProjectRecommendedSupervisor[]> {
  const { data } = await api.get(`/graduation-projects/${projectId}/recommended-supervisors`);
  return parseCatalogSupervisorRows(data);
}

/**
 * POST /api/ai/recommend-supervisors + GET catalog merge, enriched by GET /api/doctors
 * when catalog rows are missing (same approach as mobile `enrichAiSupervisorsWithRecommended`).
 */
export async function getRecommendedSupervisors(
  projectId: number,
): Promise<GradProjectRecommendedSupervisor[]> {
  const [aiSettled, catalogSettled, directorySettled] = await Promise.allSettled([
    api.post("/ai/recommend-supervisors", { projectId }),
    api.get(`/graduation-projects/${projectId}/recommended-supervisors`),
    listDoctorsDirectory(),
  ]);

  const aiRows =
    aiSettled.status === "fulfilled" ? parseAiSupervisorRows(aiSettled.value.data) : [];
  const catalog =
    catalogSettled.status === "fulfilled"
      ? parseCatalogSupervisorRows(catalogSettled.value.data)
      : [];
  const directory =
    directorySettled.status === "fulfilled" ? directorySettled.value : [];

  const catalogById = new Map(catalog.map((d) => [d.doctorId, d]));
  const doctorsByProfileId = directoryByProfileId(directory);

  if (aiRows.length > 0) {
    return [...aiRows]
      .sort((a, b) => normalizeMatchScore(b.matchScore) - normalizeMatchScore(a.matchScore))
      .map((row) => {
        const meta = catalogById.get(row.doctorId);
        const dir = doctorsByProfileId.get(row.doctorId);
        return {
          doctorId: row.doctorId,
          userId: meta?.userId ?? (dir?.userId && dir.userId > 0 ? dir.userId : undefined),
          name: supervisorDisplayName(
            row.doctorId,
            row.doctorName,
            meta?.name,
            dir?.name,
          ),
          specialization: firstTrimmedSpecialization(
            row.specialization,
            meta?.specialization,
            dir?.specialization,
          ),
          matchScore: normalizeMatchScore(row.matchScore),
          reason: row.reason?.trim() || undefined,
        };
      });
  }

  return catalog
    .map((d) => {
      const dir = doctorsByProfileId.get(d.doctorId);
      return {
        ...d,
        userId: d.userId ?? (dir?.userId && dir.userId > 0 ? dir.userId : undefined),
        name: supervisorDisplayName(d.doctorId, d.name, dir?.name),
        specialization: firstTrimmedSpecialization(d.specialization, dir?.specialization),
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore);
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

/** GET /api/graduation-projects/{projectId}/available-students — project owner only. */
export type ProjectAvailableStudent = {
  studentId: number;
  userId: number;
  name: string;
  major: string;
  university: string;
  academicYear: string;
  profilePicture?: string | null;
  skills: string[];
  matchScore: number;
  isMember: boolean;
  hasPendingInvite: boolean;
  isOwner: boolean;
  isProjectFull: boolean;
  canInvite: boolean;
};

export async function getAvailableStudents(
  projectId: number,
): Promise<ProjectAvailableStudent[]> {
  const { data } = await api.get<ProjectAvailableStudent[]>(
    `/graduation-projects/${projectId}/available-students`,
  );
  return Array.isArray(data) ? data : [];
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
