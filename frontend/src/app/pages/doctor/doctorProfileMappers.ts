import { normalizeSkillStringList } from "../../../context/UserContext";

export type DoctorProfileViewModel = {
  userId: number;
  fullName: string;
  email: string;
  title: string;
  department: string;
  university: string;
  bio: string;
  faculty: string;
  specialization: string;
  yearsOfExperience: string;
  linkedin: string;
  officeHours: string;
  profilePictureBase64: string | null;
  technicalSkills: string[];
  researchSkills: string[];
};

export function displayProfileValue(value?: string | null): string {
  if (value == null) return "—";
  const text = String(value).trim();
  return text.length > 0 ? text : "—";
}

export function mapDoctorProfileFromApi(data: unknown): DoctorProfileViewModel {
  const root =
    data != null && typeof data === "object"
      ? ((data as Record<string, unknown>).doctor ??
        (data as Record<string, unknown>).Doctor ??
        data) as Record<string, unknown>
      : {};
  const user =
    (root.user ?? root.User ?? root) as Record<string, unknown>;
  const dp = (root.doctorProfile ?? root.DoctorProfile ?? {}) as Record<string, unknown>;

  return {
    userId: Number(user.id ?? root.userId ?? 0),
    fullName: String(user.name ?? user.fullName ?? ""),
    email: String(user.email ?? ""),
    faculty: String(dp.faculty ?? dp.Faculty ?? ""),
    department: String(dp.department ?? dp.Department ?? ""),
    specialization: String(dp.specialization ?? dp.Specialization ?? ""),
    yearsOfExperience:
      dp.yearsOfExperience != null ? String(dp.yearsOfExperience) : "",
    title: String(
      dp.title ??
        (String(user.role ?? "").toLowerCase() === "doctor" ? "Doctor" : "Professor"),
    ),
    university: String(dp.university ?? dp.University ?? user.university ?? ""),
    bio: String(dp.bio ?? user.bio ?? ""),
    linkedin: String(dp.linkedin ?? dp.Linkedin ?? user.linkedin ?? ""),
    officeHours: String(dp.officeHours ?? dp.OfficeHours ?? ""),
    profilePictureBase64:
      (user.profilePictureBase64 as string | null | undefined) ??
      (dp.profilePictureBase64 as string | null | undefined) ??
      null,
    technicalSkills: normalizeSkillStringList(dp.technicalSkills ?? dp.TechnicalSkills),
    researchSkills: normalizeSkillStringList(dp.researchSkills ?? dp.ResearchSkills),
  };
}

export function doctorProfileInitials(fullName: string): string {
  const n = (fullName || "DR").trim();
  return n
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
