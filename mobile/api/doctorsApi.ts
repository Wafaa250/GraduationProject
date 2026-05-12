import api, { parseApiErrorMessage } from "./axiosInstance";

/** Public doctor card — mirrors `GET /api/doctors/{doctorId}` (doctorId = AspNetUsers.Id). */
export interface PublicDoctorProfileDetail {
  userId: number;
  profileId: number;
  name: string;
  email: string;
  profilePictureBase64: string | null;
  department: string;
  faculty: string;
  specialization: string;
  university: string;
  yearsOfExperience: number | null;
  linkedin: string;
  officeHours: string;
  bio: string;
  technicalSkills: string[];
  researchSkills: string[];
}

export interface PublicDoctorCourseRow {
  id: number;
  name: string;
  code: string;
  semester: string;
}

export interface DoctorPublicProjectRow {
  id: number;
  name: string;
  abstract: string;
  requiredSkills: string[];
  partnersCount: number;
  supervisorName: string;
  supervisorSpecialization: string;
}

function text(v: unknown): string {
  if (typeof v !== "string") return "";
  return v.trim();
}

function num(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function stringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string" && x.trim() !== "");
}

export function mapPublicDoctorFromApi(raw: unknown): PublicDoctorProfileDetail {
  const r = (raw ?? {}) as Record<string, unknown>;
  const user = (r.user ?? r.User ?? {}) as Record<string, unknown>;
  const dp = (r.doctorProfile ?? r.DoctorProfile ?? {}) as Record<string, unknown>;

  const userId = num(r.userId ?? r.UserId ?? user.userId ?? user.id ?? user.Id) ?? 0;
  const profileId = num(r.profileId ?? r.ProfileId ?? dp.profileId ?? dp.ProfileId ?? dp.id ?? dp.Id) ?? 0;

  return {
    userId,
    profileId,
    name: text(user.name ?? user.fullName ?? r.name) || "Doctor",
    email: text(user.email ?? r.email),
    profilePictureBase64: text(
      user.profilePictureBase64 ?? dp.profilePictureBase64 ?? r.profilePictureBase64,
    ) || null,
    department: text(dp.department ?? dp.Department ?? r.department),
    faculty: text(dp.faculty ?? dp.Faculty ?? r.faculty),
    specialization: text(dp.specialization ?? dp.Specialization ?? r.specialization),
    university: text(dp.university ?? dp.University ?? r.university),
    yearsOfExperience: num(dp.yearsOfExperience ?? dp.YearsOfExperience),
    linkedin: text(dp.linkedin ?? dp.Linkedin ?? r.linkedin),
    officeHours: text(dp.officeHours ?? dp.OfficeHours ?? r.officeHours),
    bio: text(dp.bio ?? dp.Bio ?? r.bio),
    technicalSkills: stringArray(dp.technicalSkills ?? dp.TechnicalSkills),
    researchSkills: stringArray(dp.researchSkills ?? dp.ResearchSkills),
  };
}

/** GET /api/doctors/{userId} — AllowAnonymous on server. */
export async function getPublicDoctorProfile(userId: number): Promise<PublicDoctorProfileDetail> {
  const { data } = await api.get<unknown>(`/doctors/${userId}`);
  const mapped = mapPublicDoctorFromApi(data);
  if (!mapped.userId || mapped.userId <= 0) {
    throw new Error("Doctor not found.");
  }
  return mapped;
}

/**
 * GET /api/doctors (authorized) — used to map DoctorProfile.Id → UserId for supervisor cards.
 */
export async function resolveDoctorUserIdByProfileId(profileId: number): Promise<number | null> {
  if (!Number.isFinite(profileId) || profileId <= 0) return null;
  try {
    const { data } = await api.get<unknown>("/doctors");
    if (!Array.isArray(data)) return null;
    for (const row of data) {
      const r = row as Record<string, unknown>;
      const pid = num(r.profileId ?? r.ProfileId ?? r.id ?? r.Id);
      if (pid === profileId) {
        const uid = num(r.userId ?? r.UserId);
        return uid != null && uid > 0 ? uid : null;
      }
    }
    return null;
  } catch {
    return null;
  }
}

function mapCourseRow(raw: unknown): PublicDoctorCourseRow | null {
  if (raw == null || typeof raw !== "object") return null;
  const c = raw as Record<string, unknown>;
  const id = num(c.courseId ?? c.id ?? c.Id ?? c.CourseId) ?? 0;
  if (id <= 0) return null;
  return {
    id,
    name: text(c.name ?? c.Name) || "Course",
    code: text(c.code ?? c.Code),
    semester: text(c.semester ?? c.Semester),
  };
}

/**
 * GET /api/courses?doctorId= — `doctorId` query matches `Course.DoctorId` (DoctorProfile.Id), not UserId.
 * Same query key as web; non-fatal if the route is unavailable.
 */
export async function getCoursesForDoctorPublic(doctorProfileId: number): Promise<PublicDoctorCourseRow[]> {
  try {
    const { data } = await api.get<unknown[]>("/courses", { params: { doctorId: doctorProfileId } });
    if (!Array.isArray(data)) return [];
    return data.map(mapCourseRow).filter((r): r is PublicDoctorCourseRow => r != null);
  } catch (err) {
    if (__DEV__) console.warn("[doctorsApi] courses:", parseApiErrorMessage(err));
    return [];
  }
}

function mapProjectRow(raw: unknown): DoctorPublicProjectRow | null {
  if (raw == null || typeof raw !== "object") return null;
  const p = raw as Record<string, unknown>;
  const id = num(p.id ?? p.Id) ?? 0;
  if (id <= 0) return null;
  const sup = (p.supervisor ?? p.Supervisor ?? null) as Record<string, unknown> | null;
  const supName = sup ? text(sup.name ?? sup.Name) : "";
  const supSpec = sup ? text(sup.specialization ?? sup.Specialization) : "";
  const skillsRaw = p.requiredSkills ?? p.RequiredSkills;
  const requiredSkills = Array.isArray(skillsRaw)
    ? skillsRaw.filter((x): x is string => typeof x === "string")
    : [];
  const pc = num(p.partnersCount ?? p.PartnersCount);
  return {
    id,
    name: text(p.name ?? p.title ?? p.Title) || "Project",
    abstract: text(p.abstract ?? p.Abstract ?? p.description ?? p.Description),
    requiredSkills,
    partnersCount: pc != null && pc > 0 ? pc : 0,
    supervisorName: supName,
    supervisorSpecialization: supSpec,
  };
}

/** GET /api/graduation-projects?doctorId= — doctorId is User.Id on server. */
export async function getGraduationProjectsForDoctorPublic(userId: number): Promise<DoctorPublicProjectRow[]> {
  try {
    const { data } = await api.get<unknown[]>("/graduation-projects", { params: { doctorId: userId } });
    if (!Array.isArray(data)) return [];
    return data.map(mapProjectRow).filter((r): r is DoctorPublicProjectRow => r != null);
  } catch (err) {
    if (__DEV__) console.warn("[doctorsApi] graduation-projects:", parseApiErrorMessage(err));
    return [];
  }
}
