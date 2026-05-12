import api from "./axiosInstance";

/** Same rules as web `normalizeSkillStringList` (UserContext). */
export function normalizeSkillStringList(raw: unknown): string[] {
  if (raw == null) return [];
  if (typeof raw === "string") {
    return raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item: unknown) => {
      if (typeof item === "string") return item.trim();
      if (item && typeof item === "object") {
        const o = item as Record<string, unknown>;
        const s = o.label ?? o.name ?? o.skill ?? o.title;
        return s != null ? String(s).trim() : "";
      }
      return String(item).trim();
    })
    .filter(Boolean);
}

export interface StudentEditProfileSnapshot {
  userId: number;
  faculty: string;
  university: string;
  major: string;
  academicYear: string;
  gpa: string;
  fullName: string;
  bio: string;
  availability: string;
  lookingFor: string;
  github: string;
  linkedin: string;
  portfolio: string;
  languages: string[];
  roles: string[];
  technicalSkills: string[];
  tools: string[];
  profilePictureBase64: string | null;
}

/**
 * Body for PUT /api/profile — mirrors web `EditProfilePage` payload.
 * Text fields are sent as strings (including `""`) so `ProfileController` applies updates
 * (`if (dto.Bio != null)` etc.); omitting or sending JSON `null` would skip clearing a field.
 */
export interface PutStudentProfileBody {
  fullName: string;
  bio: string;
  availability: string;
  lookingFor: string;
  github: string;
  linkedin: string;
  portfolio: string;
  languages: string[];
  roles: string[];
  technicalSkills: string[];
  tools: string[];
  /** Merged unique list — web sends it; backend ignores unknown property. */
  skills: string[];
  profilePictureBase64: string | null;
}

export async function fetchStudentEditProfileSnapshot(): Promise<StudentEditProfileSnapshot> {
  const { data } = await api.get<unknown>("/me");
  if (data == null || typeof data !== "object") {
    throw new Error("Invalid profile response.");
  }
  const d = data as Record<string, unknown>;
  const role = String(d.role ?? "").toLowerCase();
  if (role === "doctor") {
    throw new Error("Use the doctor profile editor.");
  }
  const userId = Number(d.userId ?? d.id ?? 0);
  if (!Number.isFinite(userId) || userId <= 0) {
    throw new Error("Invalid profile response.");
  }
  const gpaRaw = d.gpa;
  const gpaStr = gpaRaw != null && String(gpaRaw).trim() !== "" ? String(gpaRaw).trim() : "";

  return {
    userId,
    faculty: d.faculty != null ? String(d.faculty) : "",
    university: d.university != null ? String(d.university) : "",
    major: d.major != null ? String(d.major) : "",
    academicYear: d.academicYear != null ? String(d.academicYear) : "",
    gpa: gpaStr,
    fullName: String(d.name ?? d.fullName ?? ""),
    bio: d.bio != null ? String(d.bio) : "",
    availability: d.availability != null ? String(d.availability) : "",
    lookingFor: d.lookingFor != null ? String(d.lookingFor) : "",
    github: d.github != null ? String(d.github) : "",
    linkedin: d.linkedin != null ? String(d.linkedin) : "",
    portfolio: d.portfolio != null ? String(d.portfolio) : "",
    languages: normalizeSkillStringList(d.languages),
    roles: normalizeSkillStringList(d.roles ?? d.generalSkills),
    technicalSkills: normalizeSkillStringList(d.technicalSkills ?? d.majorSkills),
    tools: normalizeSkillStringList(d.tools),
    profilePictureBase64: pickPic(d.profilePictureBase64, d.profilePicture),
  };
}

export async function putStudentProfile(body: PutStudentProfileBody): Promise<void> {
  await api.put("/profile", body);
}

export interface StudentProfileView {
  userId: number;
  name: string;
  email: string;
  role: string;
  university?: string;
  faculty?: string;
  major?: string;
  academicYear?: string;
  gpa?: string;
  generalSkills: string[];
  majorSkills: string[];
  profilePic: string | null;
}

export interface PublicGraduationProjectRow {
  id: number;
  name: string;
  abstract: string;
}

/** Richer project row for public student profile (matches web `StudentPublicProfilePage` project cards). */
export interface PublicStudentProjectViewerRow {
  id: number;
  name: string;
  abstract: string;
  requiredSkills: string[];
  partnersCount: number;
}

function mapPublicStudentProjectViewer(p: Record<string, unknown>): PublicStudentProjectViewerRow | null {
  const id = Number(p.id ?? p.Id ?? 0);
  if (!Number.isFinite(id) || id <= 0) return null;
  const skillsRaw = p.requiredSkills ?? p.RequiredSkills ?? p.skills ?? p.Skills;
  const requiredSkills = Array.isArray(skillsRaw)
    ? skillsRaw.filter((x): x is string => typeof x === "string")
    : [];
  const pc = Number(p.partnersCount ?? p.PartnersCount ?? 0);
  return {
    id,
    name: String(p.name ?? p.title ?? p.Title ?? "Untitled Project"),
    abstract: String(p.abstract ?? p.description ?? p.Abstract ?? p.Description ?? ""),
    requiredSkills,
    partnersCount: Number.isFinite(pc) && pc > 0 ? pc : 0,
  };
}

/**
 * GET /api/graduation-projects?studentId=… — same as web public student page; includes requiredSkills & partnersCount.
 */
export async function getGraduationProjectsForStudentPublicViewer(
  studentIdOrUserId: number,
): Promise<PublicStudentProjectViewerRow[]> {
  const { data } = await api.get<unknown[]>("/graduation-projects", {
    params: { studentId: studentIdOrUserId },
  });
  if (!Array.isArray(data)) return [];
  return data
    .filter((x): x is Record<string, unknown> => x != null && typeof x === "object")
    .map((x) => mapPublicStudentProjectViewer(x))
    .filter((r): r is PublicStudentProjectViewerRow => r != null);
}

function pickPic(...candidates: unknown[]): string | null {
  for (const c of candidates) {
    if (typeof c === "string" && c.trim() !== "") return c;
  }
  return null;
}

/** GET /api/me — current user (student branch expected by Profile UI). */
export async function getMyStudentProfileFromMe(): Promise<StudentProfileView> {
  const { data } = await api.get<unknown>("/me");
  if (data == null || typeof data !== "object") {
    throw new Error("Invalid profile response.");
  }
  const d = data as Record<string, unknown>;
  const role = String(d.role ?? "").toLowerCase();
  if (role === "doctor") {
    throw new Error("Open your profile from the doctor dashboard.");
  }
  const userId = Number(d.userId ?? d.id ?? 0);
  if (!Number.isFinite(userId) || userId <= 0) {
    throw new Error("Invalid profile response.");
  }
  return {
    userId,
    name: String(d.name ?? d.fullName ?? ""),
    email: String(d.email ?? ""),
    role: String(d.role ?? "student"),
    university: d.university != null ? String(d.university) : undefined,
    faculty: d.faculty != null ? String(d.faculty) : undefined,
    major: d.major != null ? String(d.major) : undefined,
    academicYear: d.academicYear != null ? String(d.academicYear) : undefined,
    gpa: d.gpa != null && d.gpa !== "" ? String(d.gpa) : undefined,
    generalSkills: normalizeSkillStringList(d.generalSkills ?? d.roles),
    majorSkills: normalizeSkillStringList(d.majorSkills ?? d.technicalSkills),
    profilePic: pickPic(d.profilePictureBase64, d.profilePicture),
  };
}

/** Full public student profile from GET /api/students/{userId} (flat JSON, matches web StudentProfilePage). */
export interface PublicStudentProfileDetail {
  userId: number;
  profileId: number;
  name: string;
  email: string;
  studentId: string;
  university: string;
  faculty: string;
  major: string;
  academicYear: string;
  gpa: number | null;
  bio: string;
  availability: string;
  lookingFor: string;
  github: string;
  linkedin: string;
  portfolio: string;
  profilePictureBase64: string | null;
  languages: string[];
  roles: string[];
  technicalSkills: string[];
  tools: string[];
  matchScore: number | null;
}

function numOrNull(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function matchScoreFromApi(v: unknown): number | null {
  if (v == null) return null;
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.min(Math.round(n), 100);
}

/**
 * GET /api/students/{userId} — same payload as web `StudentProfilePage` (flat object).
 * `userId` is AspNetUsers.Id.
 */
export async function getPublicStudentProfileDetail(userId: number): Promise<PublicStudentProfileDetail> {
  const { data } = await api.get<unknown>(`/students/${userId}`);
  if (data == null || typeof data !== "object") {
    throw new Error("Student not found.");
  }
  const d = data as Record<string, unknown>;
  const uid = Number(d.userId ?? d.id ?? 0);
  if (!Number.isFinite(uid) || uid <= 0) {
    throw new Error("Student not found.");
  }
  const profileId = Number(d.profileId ?? d.studentProfileId ?? 0);
  if (!Number.isFinite(profileId) || profileId <= 0) {
    throw new Error("Student not found.");
  }

  const pic = pickPic(d.profilePictureBase64, d.profilePicture, d.ProfilePictureBase64);

  return {
    userId: uid,
    profileId,
    name: String(d.name ?? d.fullName ?? ""),
    email: String(d.email ?? ""),
    studentId: String(d.studentId ?? d.universityStudentId ?? ""),
    university: String(d.university ?? ""),
    faculty: String(d.faculty ?? ""),
    major: String(d.major ?? ""),
    academicYear: String(d.academicYear ?? ""),
    gpa: numOrNull(d.gpa),
    bio: String(d.bio ?? ""),
    availability: String(d.availability ?? ""),
    lookingFor: String(d.lookingFor ?? ""),
    github: String(d.github ?? ""),
    linkedin: String(d.linkedin ?? ""),
    portfolio: String(d.portfolio ?? ""),
    profilePictureBase64: pic,
    languages: normalizeSkillStringList(d.languages),
    roles: normalizeSkillStringList(d.roles ?? d.generalSkills),
    technicalSkills: normalizeSkillStringList(d.technicalSkills ?? d.majorSkills),
    tools: normalizeSkillStringList(d.tools),
    matchScore: matchScoreFromApi(d.matchScore),
  };
}

/**
 * GET /api/students/{userId} — same flat JSON as web profile-by-id and `StudentProfilePage`.
 * Maps to `StudentProfileView` for `ProfilePage` (public mode).
 */
export async function getStudentProfileByUserId(userId: number): Promise<StudentProfileView> {
  const d = await getPublicStudentProfileDetail(userId);
  const gpaStr = d.gpa != null ? String(d.gpa) : undefined;
  return {
    userId: d.userId,
    name: d.name || "Student",
    email: d.email,
    role: "student",
    university: d.university.trim() !== "" ? d.university : undefined,
    faculty: d.faculty.trim() !== "" ? d.faculty : undefined,
    major: d.major.trim() !== "" ? d.major : undefined,
    academicYear: d.academicYear.trim() !== "" ? d.academicYear : undefined,
    gpa: gpaStr,
    generalSkills: d.roles,
    majorSkills: d.technicalSkills,
    profilePic: d.profilePictureBase64,
  };
}

/**
 * GET /api/graduation-projects?studentId=…
 * Backend accepts StudentProfile.Id or UserId and resolves owner projects.
 */
export async function getGraduationProjectsForStudentFilter(studentIdOrUserId: number): Promise<PublicGraduationProjectRow[]> {
  const { data } = await api.get<unknown[]>("/graduation-projects", {
    params: { studentId: studentIdOrUserId },
  });
  if (!Array.isArray(data)) return [];
  return data
    .filter((x): x is Record<string, unknown> => x != null && typeof x === "object")
    .map((p) => ({
      id: Number(p.id ?? p.Id ?? 0),
      name: String(p.name ?? p.title ?? "Untitled Project"),
      abstract: String(p.abstract ?? p.description ?? ""),
    }))
    .filter((p) => p.id > 0);
}
