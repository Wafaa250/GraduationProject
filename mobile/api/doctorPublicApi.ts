import api from "./axiosInstance";

export type DoctorPublicProfile = {
  userId: number;
  profileId: number;
  supervisedStudentsCount?: number;
  activeProjectsCount?: number;
  completedProjectsCount?: number;
  user: {
    userId: number;
    name: string;
    email: string;
    profilePictureBase64?: string | null;
    role: string;
  };
  doctorProfile: {
    profileId: number;
    department: string;
    faculty?: string | null;
    specialization?: string | null;
    university?: string | null;
    yearsOfExperience?: number | null;
    linkedin?: string | null;
    officeHours?: string | null;
    bio?: string | null;
    academicRank?: string | null;
    profilePictureBase64?: string | null;
    technicalSkills: string[];
    researchSkills: string[];
    researchInterests?: string[];
    preferredProjectAreas?: string[];
  };
};

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

export async function getDoctorPublicProfile(userId: number): Promise<DoctorPublicProfile> {
  const { data } = await api.get<Record<string, unknown>>(`/doctors/${userId}`);
  const userRaw = (data.user ?? data.User) as Record<string, unknown> | undefined;
  const dpRaw = (data.doctorProfile ?? data.DoctorProfile) as Record<string, unknown> | undefined;

  return {
    userId: Number(data.userId ?? data.UserId ?? userRaw?.userId ?? userRaw?.UserId ?? 0),
    profileId: Number(data.profileId ?? data.ProfileId ?? dpRaw?.profileId ?? dpRaw?.ProfileId ?? 0),
    supervisedStudentsCount: Number(
      data.supervisedStudentsCount ?? data.SupervisedStudentsCount ?? 0,
    ),
    activeProjectsCount: Number(data.activeProjectsCount ?? data.ActiveProjectsCount ?? 0),
    completedProjectsCount: Number(
      data.completedProjectsCount ?? data.CompletedProjectsCount ?? 0,
    ),
    user: {
      userId: Number(userRaw?.userId ?? userRaw?.UserId ?? 0),
      name: String(userRaw?.name ?? userRaw?.Name ?? ""),
      email: String(userRaw?.email ?? userRaw?.Email ?? ""),
      profilePictureBase64: (userRaw?.profilePictureBase64 ??
        userRaw?.ProfilePictureBase64) as string | null | undefined,
      role: String(userRaw?.role ?? userRaw?.Role ?? "doctor"),
    },
    doctorProfile: {
      profileId: Number(dpRaw?.profileId ?? dpRaw?.ProfileId ?? 0),
      department: String(dpRaw?.department ?? dpRaw?.Department ?? ""),
      faculty: (dpRaw?.faculty ?? dpRaw?.Faculty) as string | null | undefined,
      specialization: (dpRaw?.specialization ?? dpRaw?.Specialization) as string | null | undefined,
      university: (dpRaw?.university ?? dpRaw?.University) as string | null | undefined,
      yearsOfExperience: (dpRaw?.yearsOfExperience ?? dpRaw?.YearsOfExperience) as
        | number
        | null
        | undefined,
      linkedin: (dpRaw?.linkedin ?? dpRaw?.Linkedin) as string | null | undefined,
      officeHours: (dpRaw?.officeHours ?? dpRaw?.OfficeHours) as string | null | undefined,
      bio: (dpRaw?.bio ?? dpRaw?.Bio) as string | null | undefined,
      academicRank: (dpRaw?.academicRank ?? dpRaw?.AcademicRank) as string | null | undefined,
      profilePictureBase64: (dpRaw?.profilePictureBase64 ??
        dpRaw?.ProfilePictureBase64) as string | null | undefined,
      technicalSkills: asStringArray(dpRaw?.technicalSkills ?? dpRaw?.TechnicalSkills),
      researchSkills: asStringArray(dpRaw?.researchSkills ?? dpRaw?.ResearchSkills),
      researchInterests: asStringArray(dpRaw?.researchInterests ?? dpRaw?.ResearchInterests),
      preferredProjectAreas: asStringArray(
        dpRaw?.preferredProjectAreas ?? dpRaw?.PreferredProjectAreas,
      ),
    },
  };
}
