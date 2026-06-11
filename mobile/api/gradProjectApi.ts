import api, { resolveApiFileUrl } from "@/api/axiosInstance";
import { listDoctorsDirectory, type DoctorDirectoryEntry } from "@/api/doctorDirectoryApi";
import { resolveGraduationProjectAbstractFile } from "@/lib/graduationProjectAbstractDocument";
import { projectTypeLabel as projectTypeLabelFromLib } from "@/lib/graduationProjectTypes";

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

function pickOptionalBool(raw: Record<string, unknown>, ...keys: string[]): boolean | undefined {
  for (const key of keys) {
    const value = raw[key];
    if (typeof value === "boolean") return value;
  }
  return undefined;
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

function parseGradProjectSupervisor(raw: unknown): GradProjectSupervisor | null {
  const record = asRecord(raw);
  if (!record) return null;
  const doctorId = pickNumber(record, "doctorId", "DoctorId");
  if (!doctorId) return null;
  return {
    doctorId,
    userId: pickNumber(record, "userId", "UserId"),
    name: pickString(record, "name", "Name"),
    email: pickNullableString(record, "email", "Email"),
    faculty: pickNullableString(record, "faculty", "Faculty"),
    university: pickNullableString(record, "university", "University"),
    specialization: pickNullableString(record, "specialization", "Specialization"),
    department: pickNullableString(record, "department", "Department"),
    profilePicture: pickNullableString(record, "profilePicture", "ProfilePicture"),
    assignedAt: pickNullableString(record, "assignedAt", "AssignedAt"),
  };
}

function parseGradProjectMember(raw: unknown): GradProjectMember | null {
  const record = asRecord(raw);
  if (!record) return null;
  const studentId = pickNumber(record, "studentId", "StudentId");
  if (!studentId) return null;
  const roleRaw = pickString(record, "role", "Role").toLowerCase();
  return {
    studentId,
    userId: pickNumber(record, "userId", "UserId"),
    name: pickString(record, "name", "Name"),
    email: pickString(record, "email", "Email") || undefined,
    university: pickString(record, "university", "University") || undefined,
    major: pickString(record, "major", "Major") || undefined,
    profilePicture: pickNullableString(record, "profilePicture", "ProfilePicture"),
    role: roleRaw === "leader" ? "leader" : "member",
    joinedAt: pickString(record, "joinedAt", "JoinedAt") || undefined,
  };
}

function parseGraduationProjectMember(raw: unknown): GraduationProjectMember | null {
  const record = asRecord(raw);
  if (!record) return null;
  const studentId = pickNumber(record, "studentId", "StudentId");
  if (!studentId) return null;
  return {
    studentId,
    userId: pickNumber(record, "userId", "UserId"),
    name: pickString(record, "name", "Name"),
    email: pickString(record, "email", "Email"),
    university: pickString(record, "university", "University"),
    major: pickString(record, "major", "Major"),
    role: pickString(record, "role", "Role") || "member",
  };
}

export type GradProjectPendingSupervisor = {
  doctorId: number;
  name: string;
  specialization?: string | null;
};

function normalizePendingSupervisor(raw: unknown): GradProjectPendingSupervisor | null {
  const record = asRecord(raw);
  if (!record) return null;
  const doctorId = pickNumber(record, "doctorId", "DoctorId");
  if (!doctorId) return null;
  return {
    doctorId,
    name: pickString(record, "name", "Name"),
    specialization: pickNullableString(record, "specialization", "Specialization"),
  };
}

export function normSupervisorRequestStatus(status?: string | null): string {
  return (status ?? "").trim().toLowerCase();
}

/** Stored total team capacity (including owner) → wizard desired team size. */
export function partnersCountToTeamSize(partnersCount: number): number {
  return Math.min(5, Math.max(1, partnersCount));
}

/** Wizard desired team size → stored total team capacity (including owner). */
export function teamSizeToPartnersCount(teamSize: number): number {
  return Math.min(10, Math.max(1, teamSize));
}

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
      project.abstractFileName ??
      pickNullableString(rawRecord, "abstractFileName", "AbstractFileName"),
    abstractFilePath:
      project.abstractFilePath ??
      pickNullableString(rawRecord, "abstractFilePath", "AbstractFilePath"),
    abstractFileUploadedAt:
      project.abstractFileUploadedAt ??
      pickNullableString(rawRecord, "abstractFileUploadedAt", "AbstractFileUploadedAt"),
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

export function parseGradProject(raw: unknown): GradProject {
  const record = asRecord(raw) ?? {};
  const membersRaw = record.members ?? record.Members;
  const members = Array.isArray(membersRaw)
    ? membersRaw.map(parseGradProjectMember).filter((m): m is GradProjectMember => m !== null)
    : [];
  const abstract = pickNullableString(record, "abstract", "Abstract");
  const projectTypeRaw = pickString(record, "projectType", "ProjectType").toUpperCase();
  const projectType =
    projectTypeRaw === "GP1" || projectTypeRaw === "GP2" || projectTypeRaw === "GP"
      ? projectTypeRaw
      : "GP";

  const parsed: GradProject = {
    id: pickNumber(record, "id", "Id"),
    ownerId: pickNumber(record, "ownerId", "OwnerId"),
    ownerUserId: pickNumber(record, "ownerUserId", "OwnerUserId") || undefined,
    ownerName: pickString(record, "ownerName", "OwnerName") || undefined,
    name: pickString(record, "name", "Name"),
    abstract,
    description: abstract,
    technologies: pickStringList(record, "technologies", "Technologies"),
    projectType,
    projectTypeLabel: pickNullableString(record, "projectTypeLabel", "ProjectTypeLabel") ?? undefined,
    ownerFaculty: pickNullableString(record, "ownerFaculty", "OwnerFaculty"),
    ownerMajor: pickNullableString(record, "ownerMajor", "OwnerMajor"),
    partnersCount: pickNumber(record, "partnersCount", "PartnersCount"),
    currentMembers: pickNumber(record, "currentMembers", "CurrentMembers"),
    remainingSeats: pickNumber(record, "remainingSeats", "RemainingSeats") || undefined,
    isFull: pickBool(record, "isFull", "IsFull"),
    isOwner: pickBool(record, "isOwner", "IsOwner") || undefined,
    requiredSkills: pickStringList(record, "requiredSkills", "RequiredSkills"),
    preferredRoles: pickStringList(record, "preferredRoles", "PreferredRoles"),
    requiredRoles: pickStringList(record, "requiredRoles", "RequiredRoles"),
    skillPriorities: pickStringList(record, "skillPriorities", "SkillPriorities"),
    lookingForTeammates:
      pickOptionalBool(record, "lookingForTeammates", "LookingForTeammates"),
    supervisor: parseGradProjectSupervisor(record.supervisor ?? record.Supervisor),
    supervisorRequestStatus:
      pickNullableString(record, "supervisorRequestStatus", "SupervisorRequestStatus") ?? null,
    pendingSupervisor: normalizePendingSupervisor(
      record.pendingSupervisor ?? record.PendingSupervisor,
    ),
    supervisorCancellationRequestStatus:
      pickNullableString(
        record,
        "supervisorCancellationRequestStatus",
        "SupervisorCancellationRequestStatus",
      ) ?? null,
    abstractFileName:
      pickNullableString(record, "abstractFileName", "AbstractFileName") ?? null,
    abstractFilePath:
      pickNullableString(record, "abstractFilePath", "AbstractFilePath") ?? null,
    abstractFileUploadedAt:
      pickNullableString(record, "abstractFileUploadedAt", "AbstractFileUploadedAt") ?? null,
    members,
    createdAt: pickString(record, "createdAt", "CreatedAt") || undefined,
    updatedAt: pickString(record, "updatedAt", "UpdatedAt") || undefined,
  };
  return normalizeGradProject(parsed);
}

function parseGraduationProjectMembersResponse(raw: unknown): GraduationProjectMembersResponse {
  const record = asRecord(raw) ?? {};
  const membersRaw = record.members ?? record.Members;
  const members = Array.isArray(membersRaw)
    ? membersRaw
        .map(parseGraduationProjectMember)
        .filter((m): m is GraduationProjectMember => m !== null)
    : [];

  return {
    projectId: pickNumber(record, "projectId", "ProjectId"),
    currentMembers: pickNumber(record, "currentMembers", "CurrentMembers"),
    totalCapacity: pickNumber(record, "totalCapacity", "TotalCapacity"),
    remainingSeats: pickNumber(record, "remainingSeats", "RemainingSeats"),
    isFull: pickBool(record, "isFull", "IsFull"),
    members,
  };
}

function parseGradProjectAbstractFile(raw: unknown): GradProjectAbstractFile | null {
  const record = asRecord(raw);
  if (!record) return null;
  const downloadUrl = resolveApiFileUrl(
    pickString(record, "downloadUrl", "DownloadUrl", "url", "Url"),
  );
  if (!downloadUrl) return null;
  return {
    fileName: pickString(record, "fileName", "FileName") || "Document",
    uploadedAt: pickString(record, "uploadedAt", "UploadedAt"),
    downloadUrl,
  };
}

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
  ownerUserId?: number;
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
  supervisorRequestStatus?: "pending" | "accepted" | "rejected" | string | null;
  pendingSupervisor?: GradProjectPendingSupervisor | null;
  supervisorCancellationRequestStatus?: "pending" | "approved" | "rejected" | string | null;
  abstractFileName?: string | null;
  abstractFilePath?: string | null;
  abstractFileUploadedAt?: string | null;
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
  hasPendingInvite?: boolean;
  isMember?: boolean;
  isOwner?: boolean;
  ownsGraduationProject?: boolean;
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
  ownsGraduationProject: boolean;
  isProjectFull: boolean;
  canInvite: boolean;
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

  const projectRaw = d.project ?? d.Project ?? null;
  const project = projectRaw ? parseGradProject(projectRaw) : null;
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

/** GET /api/graduation-projects — discovery list for browse. */
export async function listGraduationProjects(): Promise<GradProject[]> {
  const { data } = await api.get<unknown>("/graduation-projects");
  if (!Array.isArray(data)) return [];
  return data.map(parseGradProject);
}

export async function createGraduationProject(
  payload: CreateGraduationProjectPayload,
): Promise<GradProject> {
  const { data } = await api.post<unknown>("/graduation-projects", payload);
  return parseGradProject(data);
}

export async function updateGraduationProject(
  id: number,
  payload: UpdateGraduationProjectPayload,
): Promise<GradProject> {
  const { data } = await api.put<unknown>(`/graduation-projects/${id}`, payload);
  return parseGradProject(data);
}

export async function deleteGraduationProject(id: number): Promise<void> {
  await api.delete(`/graduation-projects/${id}`);
}

export type GradProjectAbstractFile = {
  fileName: string;
  uploadedAt: string;
  downloadUrl: string;
};

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

export async function getGraduationProjectById(projectId: number): Promise<GradProject> {
  const { data } = await api.get(`/graduation-projects/${projectId}`);
  return parseGradProject(data);
}

export async function joinGraduationProject(projectId: number): Promise<void> {
  await api.post(`/graduation-projects/${projectId}/join`);
}

/** GET /api/graduation-projects/{id}/abstract-file — with embedded-abstract fallback. */
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
    return parseGradProjectAbstractFile(data);
  } catch {
    return project ? resolveGraduationProjectAbstractFile(project) : null;
  }
}

/** GET /api/graduation-projects/{id}/members */
export async function getGraduationProjectMembers(
  projectId: number,
): Promise<GraduationProjectMembersResponse> {
  const { data } = await api.get(`/graduation-projects/${projectId}/members`);
  return parseGraduationProjectMembersResponse(data);
}

function parseRecommendedStudentRows(data: unknown): GradProjectRecommendedStudent[] {
  if (!Array.isArray(data)) return [];
  const rows: GradProjectRecommendedStudent[] = [];
  for (const raw of data) {
    const record = asRecord(raw);
    if (!record) continue;
    const studentId = pickNumber(record, "studentId", "StudentId");
    if (!studentId) continue;
    const skillsRaw = record.skills ?? record.Skills;
    rows.push({
      studentId,
      name: pickString(record, "name", "Name") || `Student #${studentId}`,
      major: pickString(record, "major", "Major"),
      university: pickString(record, "university", "University"),
      skills: Array.isArray(skillsRaw)
        ? skillsRaw.filter((s): s is string => typeof s === "string" && s.trim().length > 0)
        : [],
      matchScore: normalizeMatchScore(pickNumber(record, "matchScore", "MatchScore")),
      hasPendingInvite: pickOptionalBool(record, "hasPendingInvite", "HasPendingInvite"),
      isMember: pickOptionalBool(record, "isMember", "IsMember"),
      isOwner: pickOptionalBool(record, "isOwner", "IsOwner"),
      ownsGraduationProject: pickOptionalBool(
        record,
        "ownsGraduationProject",
        "OwnsGraduationProject",
      ),
      canInvite: pickOptionalBool(record, "canInvite", "CanInvite"),
    });
  }
  return rows;
}

function parseAvailableStudentRows(data: unknown): ProjectAvailableStudent[] {
  if (!Array.isArray(data)) return [];
  const rows: ProjectAvailableStudent[] = [];
  for (const raw of data) {
    const record = asRecord(raw);
    if (!record) continue;
    const studentId = pickNumber(record, "studentId", "StudentId");
    if (!studentId) continue;
    const skillsRaw = record.skills ?? record.Skills;
    rows.push({
      studentId,
      userId: pickNumber(record, "userId", "UserId"),
      name: pickString(record, "name", "Name") || `Student #${studentId}`,
      major: pickString(record, "major", "Major"),
      university: pickString(record, "university", "University"),
      academicYear: pickString(record, "academicYear", "AcademicYear"),
      profilePicture: pickNullableString(record, "profilePicture", "ProfilePicture"),
      skills: Array.isArray(skillsRaw)
        ? skillsRaw.filter((s): s is string => typeof s === "string" && s.trim().length > 0)
        : [],
      matchScore: normalizeMatchScore(pickNumber(record, "matchScore", "MatchScore")),
      isMember: pickBool(record, "isMember", "IsMember"),
      hasPendingInvite: pickBool(record, "hasPendingInvite", "HasPendingInvite"),
      isOwner: pickBool(record, "isOwner", "IsOwner"),
      ownsGraduationProject: pickBool(
        record,
        "ownsGraduationProject",
        "OwnsGraduationProject",
      ),
      isProjectFull: pickBool(record, "isProjectFull", "IsProjectFull"),
      canInvite: pickBool(record, "canInvite", "CanInvite"),
    });
  }
  return rows;
}

/** GET /api/graduation-projects/{projectId}/recommended-students */
export async function getRecommendedStudents(
  projectId: number,
): Promise<GradProjectRecommendedStudent[]> {
  const { data } = await api.get(`/graduation-projects/${projectId}/recommended-students`);
  return parseRecommendedStudentRows(data);
}

function supervisorDisplayName(doctorId: number, ...candidates: (string | undefined)[]): string {
  for (const value of candidates) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }
  return `Doctor #${doctorId}`;
}

function parseCatalogSupervisorRows(data: unknown): GradProjectRecommendedSupervisor[] {
  if (!Array.isArray(data)) return [];
  const rows: GradProjectRecommendedSupervisor[] = [];
  for (const raw of data) {
    const record = asRecord(raw);
    if (!record) continue;
    const doctorId = pickNumber(record, "doctorId", "DoctorId");
    if (!doctorId) continue;
    const userId = pickNumber(record, "userId", "UserId");
    rows.push({
      doctorId,
      userId: userId > 0 ? userId : undefined,
      name: pickString(record, "name", "Name"),
      specialization: pickString(record, "specialization", "Specialization"),
      matchScore: normalizeMatchScore(pickNumber(record, "matchScore", "MatchScore")),
    });
  }
  return rows;
}

function parseAiSupervisorRows(data: unknown): {
  doctorId: number;
  matchScore: number;
  reason?: string | null;
  doctorName: string;
  specialization: string;
}[] {
  if (!Array.isArray(data)) return [];
  const rows: {
    doctorId: number;
    matchScore: number;
    reason?: string | null;
    doctorName: string;
    specialization: string;
  }[] = [];
  for (const raw of data) {
    const record = asRecord(raw);
    if (!record) continue;
    const doctorId = pickNumber(record, "doctorId", "DoctorId");
    if (!doctorId) continue;
    const reasonRaw = record.reason ?? record.Reason;
    rows.push({
      doctorId,
      matchScore: pickNumber(record, "matchScore", "MatchScore"),
      reason: typeof reasonRaw === "string" ? reasonRaw : null,
      doctorName: pickString(record, "doctorName", "DoctorName", "name", "Name"),
      specialization: pickString(record, "specialization", "Specialization"),
    });
  }
  return rows;
}

/** POST /ai/recommend-supervisors + GET catalog merge (web parity). */
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
  const directory: DoctorDirectoryEntry[] =
    directorySettled.status === "fulfilled" ? directorySettled.value : [];

  const catalogById = new Map(catalog.map((d) => [d.doctorId, d]));
  const doctorsByProfileId = new Map(directory.map((d) => [d.profileId, d]));

  if (aiRows.length > 0) {
    return [...aiRows]
      .sort((a, b) => normalizeMatchScore(b.matchScore) - normalizeMatchScore(a.matchScore))
      .map((row) => {
        const meta = catalogById.get(row.doctorId);
        const dir = doctorsByProfileId.get(row.doctorId);
        return {
          doctorId: row.doctorId,
          userId: meta?.userId ?? (dir?.userId && dir.userId > 0 ? dir.userId : undefined),
          name: supervisorDisplayName(row.doctorId, row.doctorName, meta?.name, dir?.name),
          specialization:
            row.specialization.trim() ||
            meta?.specialization?.trim() ||
            dir?.specialization?.trim() ||
            "",
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
        specialization: d.specialization?.trim() || dir?.specialization?.trim() || "",
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore);
}

export async function getAvailableStudents(
  projectId: number,
): Promise<ProjectAvailableStudent[]> {
  const { data } = await api.get<unknown>(
    `/graduation-projects/${projectId}/available-students`,
  );
  return parseAvailableStudentRows(data);
}

export async function leaveGraduationProject(projectId: number): Promise<{ message: string }> {
  const { data } = await api.delete<{ message: string }>(`/graduation-projects/${projectId}/leave`);
  return data;
}

export async function removeProjectMember(
  projectId: number,
  memberStudentId: number,
): Promise<{ message: string; currentMembers: number }> {
  const { data } = await api.delete<{ message: string; currentMembers: number }>(
    `/graduation-projects/${projectId}/members/${memberStudentId}`,
  );
  return data;
}

export async function changeProjectLeader(
  projectId: number,
  memberStudentId: number,
): Promise<{ message: string; newLeaderId: number }> {
  const { data } = await api.put<{ message: string; newLeaderId: number }>(
    `/graduation-projects/${projectId}/change-leader/${memberStudentId}`,
  );
  return data;
}

export async function requestProjectSupervisor(
  projectId: number,
  doctorId: number,
): Promise<void> {
  await api.post(`/graduation-projects/${projectId}/request-supervisor/${doctorId}`);
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
