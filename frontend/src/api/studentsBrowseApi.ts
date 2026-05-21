/**
 * Browse Students page — same backend contract as the legacy StudentsPage.
 *
 * Endpoints:
 * - GET /api/students/filters
 * - GET /api/students?search&university&major&skill  (server-side filters)
 * - GET /api/graduation-projects/{projectId}/available-students  (invite context;
 *   query params: search, university, major, skill (server-side on available-students;
 *   client-side filter kept as a safety net)
 * - GET /api/graduation-projects/{projectId}
 * - POST /api/graduation-projects/{projectId}/invite/{receiverProfileId}
 */

import api from "./axiosInstance";

/** Legacy page row — `profileId` is StudentProfile.Id (invite API). */
export type BrowseStudentDto = {
  userId: number;
  profileId: number;
  name: string;
  university: string;
  major: string;
  academicYear: string;
  skills: string[];
  matchScore: number;
  profilePicture: string | null;
  isMember: boolean;
  hasPendingInvite: boolean;
  canInvite: boolean;
  ownsGraduationProject: boolean;
};

export type BrowseStudentFiltersDto = {
  universities: string[];
  majors: string[];
  skills: string[];
};

export type BrowseStudentsQuery = {
  search?: string;
  university?: string;
  major?: string;
  skill?: string;
};

export type GraduationProjectBrowseContext = {
  name: string | null;
  isFull: boolean;
};

function asRecord(raw: unknown): Record<string, unknown> | null {
  if (raw == null || typeof raw !== "object") return null;
  return raw as Record<string, unknown>;
}

function stringList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((x) => String(x).trim()).filter(Boolean);
}

/** /students?projectId=5 — same parsing as legacy page (invalid → null). */
export function parseBrowseProjectId(
  raw: string | null | undefined,
): number | null {
  if (!raw) return null;
  const id = Number(raw);
  return Number.isFinite(id) && id > 0 ? id : null;
}

function buildQueryParams(query: BrowseStudentsQuery): URLSearchParams {
  const params = new URLSearchParams();
  const search = query.search?.trim();
  const university = query.university?.trim();
  const major = query.major?.trim();
  const skill = query.skill?.trim();
  if (search) params.set("search", search);
  if (university) params.set("university", university);
  if (major) params.set("major", major);
  if (skill) params.set("skill", skill);
  return params;
}

/**
 * Client-side filters for project-scoped lists (legacy web + mobile behavior).
 * GET /students uses server-side filtering instead.
 */
export function filterBrowseStudentsClientSide(
  rows: BrowseStudentDto[],
  query: BrowseStudentsQuery,
): BrowseStudentDto[] {
  let out = rows;
  const u = query.university?.trim();
  const m = query.major?.trim();
  const sk = query.skill?.trim();
  const term = query.search?.trim().toLowerCase();

  if (u) {
    const ul = u.toLowerCase();
    out = out.filter((r) => (r.university ?? "").trim().toLowerCase() === ul);
  }
  if (m) {
    const ml = m.toLowerCase();
    out = out.filter((r) => (r.major ?? "").trim().toLowerCase() === ml);
  }
  if (sk) {
    const skl = sk.toLowerCase();
    out = out.filter((r) =>
      r.skills.some((s) => s.toLowerCase() === skl),
    );
  }
  if (term) {
    out = out.filter((r) => {
      const name = (r.name ?? "").toLowerCase();
      const maj = (r.major ?? "").toLowerCase();
      const uni = (r.university ?? "").toLowerCase();
      const ay = (r.academicYear ?? "").toLowerCase();
      const skillHit = r.skills.some((s) => s.toLowerCase().includes(term));
      return (
        name.includes(term) ||
        maj.includes(term) ||
        uni.includes(term) ||
        ay.includes(term) ||
        skillHit
      );
    });
  }
  return out;
}

/** GET /api/students/filters */
export async function fetchBrowseStudentFilters(): Promise<BrowseStudentFiltersDto> {
  const res = await api.get<unknown>("/students/filters");
  const r = asRecord(res.data) ?? {};
  return {
    universities: stringList(r.universities ?? r.Universities),
    majors: stringList(r.majors ?? r.Majors),
    skills: stringList(r.skills ?? r.Skills),
  };
}

/** GET /api/graduation-projects/{projectId} */
export async function fetchGraduationProjectBrowseContext(
  projectId: number,
): Promise<GraduationProjectBrowseContext> {
  const res = await api.get<unknown>(`/graduation-projects/${projectId}`);
  const r = asRecord(res.data) ?? {};
  return {
    name: String(r.name ?? r.Name ?? "").trim() || null,
    isFull: Boolean(r.isFull ?? r.IsFull ?? false),
  };
}

/** Maps ProjectAvailableStudentDto → BrowseStudentDto (legacy + PascalCase). */
function mapAvailableStudent(raw: unknown): BrowseStudentDto | null {
  const s = asRecord(raw);
  if (!s) return null;
  const profileId = Number(s.studentId ?? s.StudentId ?? 0);
  const userId = Number(s.userId ?? s.UserId ?? 0);
  if (!Number.isFinite(profileId) || profileId <= 0 || !Number.isFinite(userId)) {
    return null;
  }
  const canRaw = s.canInvite ?? s.CanInvite;
  return {
    userId,
    profileId,
    name: String(s.name ?? s.Name ?? "").trim(),
    university: String(s.university ?? s.University ?? "").trim(),
    major: String(s.major ?? s.Major ?? "").trim(),
    academicYear: String(s.academicYear ?? s.AcademicYear ?? "").trim(),
    skills: stringList(s.skills ?? s.Skills),
    matchScore:
      typeof s.matchScore === "number"
        ? s.matchScore
        : Number(s.MatchScore ?? 0) || 0,
    profilePicture: (s.profilePicture ?? s.ProfilePicture ?? null) as string | null,
    isMember: Boolean(s.isMember ?? s.IsMember),
    hasPendingInvite: Boolean(s.hasPendingInvite ?? s.HasPendingInvite),
    canInvite: typeof canRaw === "boolean" ? canRaw : true,
    ownsGraduationProject: Boolean(
      s.ownsGraduationProject ?? s.OwnsGraduationProject,
    ),
  };
}

/** Maps GET /api/students row → BrowseStudentDto (legacy + PascalCase). */
function mapListedStudent(raw: unknown): BrowseStudentDto | null {
  const s = asRecord(raw);
  if (!s) return null;
  const profileId = Number(s.profileId ?? s.ProfileId ?? s.studentId ?? s.StudentId ?? 0);
  const userId = Number(s.userId ?? s.UserId ?? 0);
  if (!Number.isFinite(profileId) || profileId <= 0 || !Number.isFinite(userId)) {
    return null;
  }
  return {
    userId,
    profileId,
    name: String(s.name ?? s.Name ?? "").trim(),
    university: String(s.university ?? s.University ?? "").trim(),
    major: String(s.major ?? s.Major ?? "").trim(),
    academicYear: String(s.academicYear ?? s.AcademicYear ?? "").trim(),
    skills: stringList(s.skills ?? s.Skills),
    matchScore:
      typeof s.matchScore === "number"
        ? s.matchScore
        : Number(s.MatchScore ?? 0) || 0,
    profilePicture: (s.profilePicture ?? s.ProfilePicture ?? null) as string | null,
    isMember: Boolean(s.isMember ?? s.IsMember),
    hasPendingInvite: Boolean(s.hasPendingInvite ?? s.HasPendingInvite),
    canInvite: true,
    ownsGraduationProject: false,
  };
}

function hasBrowseQueryFilters(query: BrowseStudentsQuery): boolean {
  return Boolean(
    query.search?.trim() ||
      query.university?.trim() ||
      query.major?.trim() ||
      query.skill?.trim(),
  );
}

/**
 * Project browse with active filters: list from GET /students (server filters),
 * overlay invite flags from available-students when present.
 */
async function fetchProjectBrowseWithFilters(
  query: BrowseStudentsQuery,
  projectId: number,
): Promise<BrowseStudentDto[]> {
  const params = buildQueryParams(query);
  const qs = params.toString();

  const [listedRes, availRes] = await Promise.all([
    api.get<unknown[]>(`/students${qs ? `?${qs}` : ""}`),
    api.get<unknown[]>(
      `/graduation-projects/${projectId}/available-students${qs ? `?${qs}` : ""}`,
    ),
  ]);

  const listed = (Array.isArray(listedRes.data) ? listedRes.data : [])
    .map(mapListedStudent)
    .filter((row): row is BrowseStudentDto => row != null);

  const availByProfile = new Map<number, BrowseStudentDto>();
  for (const raw of Array.isArray(availRes.data) ? availRes.data : []) {
    const row = mapAvailableStudent(raw);
    if (row) availByProfile.set(row.profileId, row);
  }

  return listed.map((s) => {
    const a = availByProfile.get(s.profileId);
    if (!a) {
      return {
        ...s,
        isMember: false,
        hasPendingInvite: false,
        canInvite: true,
        ownsGraduationProject: false,
      };
    }
    const skills = a.skills.length > 0 ? a.skills : s.skills;
    const matchScore = Math.max(a.matchScore, s.matchScore);
    return {
      ...s,
      skills,
      matchScore,
      isMember: a.isMember,
      hasPendingInvite: a.hasPendingInvite,
      canInvite: a.canInvite,
      ownsGraduationProject: a.ownsGraduationProject,
    };
  });
}

/**
 * Loads students for the browse page.
 * With `projectId` + filters: /students + available-students overlay.
 * With `projectId` only: available-students (default: owner's major).
 * Without project: GET /students.
 */
export async function fetchBrowseStudents(
  query: BrowseStudentsQuery,
  projectId: number | null,
): Promise<BrowseStudentDto[]> {
  const params = buildQueryParams(query);
  const qs = params.toString();

  if (projectId) {
    if (hasBrowseQueryFilters(query)) {
      try {
        return await fetchProjectBrowseWithFilters(query, projectId);
      } catch {
        /* fall through to available-students only */
      }
    }

    const res = await api.get<unknown[]>(
      `/graduation-projects/${projectId}/available-students${qs ? `?${qs}` : ""}`,
    );
    const rows = (Array.isArray(res.data) ? res.data : [])
      .map(mapAvailableStudent)
      .filter((row): row is BrowseStudentDto => row != null);
    return filterBrowseStudentsClientSide(rows, query);
  }

  const res = await api.get<unknown[]>(`/students${qs ? `?${qs}` : ""}`);
  const raw = Array.isArray(res.data) ? res.data : [];
  return raw
    .map(mapListedStudent)
    .filter((row): row is BrowseStudentDto => row != null);
}
