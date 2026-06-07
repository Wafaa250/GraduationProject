import api, { resolveApiFileUrl } from "@/api/axiosInstance";
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

  return {
    id: pickNumber(record, "id", "Id"),
    ownerId: pickNumber(record, "ownerId", "OwnerId"),
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
    lookingForTeammates: pickBool(record, "lookingForTeammates", "LookingForTeammates") || undefined,
    supervisor: parseGradProjectSupervisor(record.supervisor ?? record.Supervisor),
    members,
    createdAt: pickString(record, "createdAt", "CreatedAt") || undefined,
    updatedAt: pickString(record, "updatedAt", "UpdatedAt") || undefined,
  };
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

/** GET /api/graduation-projects/{id}/abstract-file — supervisor or project owner. */
export async function getGraduationProjectAbstractFile(
  projectId: number,
): Promise<GradProjectAbstractFile | null> {
  try {
    const { data } = await api.get(`/graduation-projects/${projectId}/abstract-file`);
    return parseGradProjectAbstractFile(data);
  } catch {
    return null;
  }
}

/** GET /api/graduation-projects/{id}/members */
export async function getGraduationProjectMembers(
  projectId: number,
): Promise<GraduationProjectMembersResponse> {
  const { data } = await api.get(`/graduation-projects/${projectId}/members`);
  return parseGraduationProjectMembersResponse(data);
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
