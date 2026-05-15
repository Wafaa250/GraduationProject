import api, { parseApiErrorMessage } from "./axiosInstance";

export interface StudentBrowseFilters {
  universities: string[];
  majors: string[];
  skills: string[];
}

export interface StudentBrowseRow {
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
  /** Set by GET /graduation-projects/{id}/available-students (server-computed invite eligibility). */
  canInvite?: boolean;
  /** True when the student owns any graduation project (server: available-students). */
  ownsGraduationProject?: boolean;
}

export type StudentListQuery = {
  search?: string;
  university?: string;
  major?: string;
  skill?: string;
};

function devApiFail(context: string, err: unknown): void {
  if (__DEV__) {
    console.warn(`[studentsApi] ${context}:`, parseApiErrorMessage(err));
  }
}

function stringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string" && x.trim() !== "");
}

/** GET /api/students/filters */
export async function getStudentBrowseFilters(): Promise<StudentBrowseFilters> {
  const url = "/students/filters";
  try {
    const { data } = await api.get<unknown>(url);
    if (data == null || typeof data !== "object") {
      return { universities: [], majors: [], skills: [] };
    }
    const d = data as Record<string, unknown>;
    return {
      universities: stringArray(d.universities ?? d.Universities),
      majors: stringArray(d.majors ?? d.Majors),
      skills: stringArray(d.skills ?? d.Skills),
    };
  } catch (err) {
    devApiFail(`GET ${url}`, err);
    throw err;
  }
}

function toParams(q: StudentListQuery): string {
  const p = new URLSearchParams();
  if (q.search?.trim()) p.set("search", q.search.trim());
  if (q.university?.trim()) p.set("university", q.university.trim());
  if (q.major?.trim()) p.set("major", q.major.trim());
  if (q.skill?.trim()) p.set("skill", q.skill.trim());
  const s = p.toString();
  return s ? `?${s}` : "";
}

/**
 * Client-side filters for browse rows.
 * Backend GET .../available-students does not accept query params; the web app still sends them
 * and expects filtering — we mirror that here for project-scoped lists.
 * GET /api/students applies these filters server-side; this helper is not used there.
 */
function filterStudentBrowseRows(rows: StudentBrowseRow[], q: StudentListQuery): StudentBrowseRow[] {
  let out = rows;
  const u = q.university?.trim();
  const m = q.major?.trim();
  const sk = q.skill?.trim();
  const term = q.search?.trim().toLowerCase();

  if (u) {
    out = out.filter((r) => (r.university ?? "").trim() === u);
  }
  if (m) {
    out = out.filter((r) => (r.major ?? "").trim() === m);
  }
  if (sk) {
    const skl = sk.toLowerCase();
    out = out.filter((r) => r.skills.some((s) => s.toLowerCase() === skl));
  }
  if (term) {
    out = out.filter((r) => {
      const name = (r.name ?? "").toLowerCase();
      const maj = (r.major ?? "").toLowerCase();
      const uni = (r.university ?? "").toLowerCase();
      const ay = (r.academicYear ?? "").toLowerCase();
      const skillHit = r.skills.some((s) => s.toLowerCase().includes(term));
      return name.includes(term) || maj.includes(term) || uni.includes(term) || ay.includes(term) || skillHit;
    });
  }
  return out;
}

function mapGenericStudent(raw: unknown): StudentBrowseRow | null {
  if (raw == null || typeof raw !== "object") return null;
  const s = raw as Record<string, unknown>;
  const userId = Number(s.userId ?? s.UserId);
  const profileId = Number(s.profileId ?? s.studentId ?? s.StudentId ?? s.ProfileId);
  const skillsRaw = s.skills ?? s.Skills;
  const skills = Array.isArray(skillsRaw)
    ? skillsRaw.filter((x): x is string => typeof x === "string")
    : [];
  if (!Number.isFinite(userId) || !Number.isFinite(profileId) || profileId <= 0) return null;
  const pic = s.profilePicture ?? s.ProfilePicture;
  return {
    userId,
    profileId,
    name: String(s.name ?? s.Name ?? ""),
    university: String(s.university ?? s.University ?? ""),
    major: String(s.major ?? s.Major ?? ""),
    academicYear: String(s.academicYear ?? s.AcademicYear ?? ""),
    skills,
    matchScore: Number(s.matchScore ?? s.MatchScore ?? 0),
    profilePicture: typeof pic === "string" ? pic : null,
    isMember: Boolean(s.isMember ?? s.IsMember ?? false),
    hasPendingInvite: Boolean(s.hasPendingInvite ?? s.HasPendingInvite ?? false),
  };
}

/** GET /api/students — generic browse (query params match StudentsController.GetStudents). */
export async function getStudentsList(query: StudentListQuery): Promise<StudentBrowseRow[]> {
  const url = `/students${toParams(query)}`;
  try {
    const { data } = await api.get<unknown[]>(url);
    if (!Array.isArray(data)) return [];
    const rows = data.map(mapGenericStudent).filter((r): r is StudentBrowseRow => r != null);
    if (__DEV__) {
      console.log(`[studentsApi] GET ${url} → ${rows.length} students`);
    }
    return rows;
  } catch (err) {
    devApiFail(`GET ${url}`, err);
    throw err;
  }
}

function mapProjectAvailableRow(s: Record<string, unknown>): StudentBrowseRow | null {
  const profileId = Number(s.studentId ?? s.StudentId ?? 0);
  const userId = Number(s.userId ?? s.UserId ?? 0);
  if (!Number.isFinite(profileId) || profileId <= 0 || !Number.isFinite(userId) || userId <= 0) return null;

  const skillsRaw = s.skills ?? s.Skills;
  const skills = Array.isArray(skillsRaw)
    ? skillsRaw.filter((x: unknown): x is string => typeof x === "string")
    : [];

  const pic = s.profilePicture ?? s.ProfilePicture;
  const canRaw = s.canInvite ?? s.CanInvite;
  const ownsRaw = s.ownsGraduationProject ?? s.OwnsGraduationProject;

  return {
    userId,
    profileId,
    name: String(s.name ?? s.Name ?? ""),
    university: String(s.university ?? s.University ?? ""),
    major: String(s.major ?? s.Major ?? ""),
    academicYear: String(s.academicYear ?? s.AcademicYear ?? ""),
    skills,
    matchScore: Number(s.matchScore ?? s.MatchScore ?? 0),
    profilePicture: typeof pic === "string" ? pic : null,
    isMember: Boolean(s.isMember ?? s.IsMember ?? false),
    hasPendingInvite: Boolean(s.hasPendingInvite ?? s.HasPendingInvite ?? false),
    canInvite: typeof canRaw === "boolean" ? canRaw : undefined,
    ownsGraduationProject: typeof ownsRaw === "boolean" ? ownsRaw : undefined,
  };
}

/**
 * GET /api/graduation-projects/{projectId}/available-students
 * (StudentProjectController — no search/filter query parameters on the server.)
 * Filters in `query` are applied client-side to match the web Students page behavior.
 */
export async function getAvailableStudentsForProject(
  projectId: number,
  query: StudentListQuery,
): Promise<StudentBrowseRow[]> {
  /** Same query string as web `StudentsPage` (server may ignore until filters are implemented). */
  const qs = toParams(query);
  const url = `/graduation-projects/${projectId}/available-students${qs}`;
  try {
    const { data } = await api.get<unknown[]>(url);
    if (!Array.isArray(data)) return [];
    const rows = data
      .filter((x): x is Record<string, unknown> => x != null && typeof x === "object")
      .map((row) => mapProjectAvailableRow(row))
      .filter((r): r is StudentBrowseRow => r != null);

    const filtered = filterStudentBrowseRows(rows, query);
    if (__DEV__) {
      console.log(`[studentsApi] GET ${url} → ${rows.length} rows, ${filtered.length} after client filters`);
    }
    return filtered;
  } catch (err) {
    devApiFail(`GET ${url}`, err);
    throw err;
  }
}

/**
 * Maps StudentProfile.Id → AspNetUsers.Id using GET /api/students (authorized),
 * for links that only have profile id (e.g. AI recommended students).
 */
export async function resolveStudentUserIdByProfileId(profileId: number): Promise<number | null> {
  if (!Number.isFinite(profileId) || profileId <= 0) return null;
  try {
    const rows = await getStudentsList({});
    const row = rows.find((r) => r.profileId === profileId);
    return row != null && row.userId > 0 ? row.userId : null;
  } catch {
    return null;
  }
}
