import api from "./axiosInstance";

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
  specialization?: string | null;
  department?: string | null;
};

export type GradProject = {
  id: number;
  ownerId: number;
  ownerName?: string;
  name: string;
  abstract?: string | null;
  description?: string | null;
  projectType?: "GP1" | "GP2" | "GP";
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
  members: GradProjectMember[];
  createdAt?: string;
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
  switch (type) {
    case "GP1":
      return "gp1";
    case "GP2":
      return "gp2";
    default:
      return "gp";
  }
}

export async function getGraduationProjectsMyEnvelope(): Promise<{
  role: "owner" | "member" | null;
  project: GradProject | null;
}> {
  const { data } = await api.get("/graduation-projects/my");
  return parseGraduationProjectsMyPayload(data);
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

/** Inverse of create payload: partnersCount = teamSize - 1 */
export function partnersCountToTeamSize(partnersCount: number): number {
  return Math.min(5, Math.max(1, partnersCount + 1));
}

export type GradProjectRecommendedStudent = {
  studentId: number;
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

/** POST /api/ai/recommend-students — owner or team leader only. */
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

  // TEMP: debug recommend-students pipeline (remove after investigation)
  console.log("[recommend-students] exact response body", data);

  const mapped = rows.map((row) => ({
    studentId: row.studentId,
    name: row.name?.trim() || `Student #${row.studentId}`,
    major: row.major?.trim() ?? "",
    university: row.university?.trim() ?? "",
    skills: Array.isArray(row.skills) ? row.skills : [],
    matchScore: normalizeMatchScore(row.matchScore),
    reason: row.reason?.trim() || undefined,
  }));

  console.log("[recommend-students] candidate count before filtering", mapped.length);

  const filtered = mapped.filter((row) => row.matchScore > 0);

  console.log("[recommend-students] candidate count after matchScore > 0 filter", filtered.length);
  if (mapped.length > 0 && filtered.length === 0) {
    console.warn(
      "[recommend-students] matchScore > 0 filter removed all results",
      mapped.map((r) => ({ studentId: r.studentId, matchScore: r.matchScore })),
    );
  }

  return filtered;
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
 * POST /api/ai/recommend-supervisors + GET catalog merge
 * (same approach as mobile `enrichAiSupervisorsWithRecommended`).
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

  const catalogById = new Map(catalog.map((d) => [d.doctorId, d]));

  if (aiRows.length > 0) {
    return [...aiRows]
      .sort((a, b) => normalizeMatchScore(b.matchScore) - normalizeMatchScore(a.matchScore))
      .map((row) => {
        const meta = catalogById.get(row.doctorId);
        return {
          doctorId: row.doctorId,
          userId: meta?.userId,
          name: supervisorDisplayName(
            row.doctorId,
            row.doctorName,
            meta?.name,
          ),
          specialization:
            row.specialization.trim() || meta?.specialization?.trim() || "",
          matchScore: normalizeMatchScore(row.matchScore),
          reason: row.reason?.trim() || undefined,
        };
      });
  }

  return catalog
    .map((d) => ({
      ...d,
      name: supervisorDisplayName(d.doctorId, d.name),
    }))
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

export function projectTypeLabel(type?: string): string {
  switch (type) {
    case "GP1":
      return "Graduation Project I";
    case "GP2":
      return "Graduation Project II";
    case "GP":
      return "Graduation Project";
    default:
      return type ?? "Graduation Project";
  }
}
