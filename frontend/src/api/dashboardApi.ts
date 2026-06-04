import api from "./axiosInstance";

export type ProfileStrength = {
  score: number;
  hasProfilePicture: boolean;
  hasGeneralSkills: boolean;
  hasMajorSkills: boolean;
  hasBio: boolean;
  hasGpa: boolean;
};

export type SuggestedTeammate = {
  userId: number;
  profileId: number;
  name: string;
  major: string;
  university: string;
  academicYear: string;
  profilePicture: string | null;
  skills: string[];
  matchScore: number;
};

export type DashboardProject = {
  projectId: number;
  projectName: string;
  role: "owner" | "member";
  memberCount: number;
  maxTeamSize: number;
  isFull: boolean;
};

export type DashboardSummary = {
  name: string;
  major: string;
  university: string;
  academicYear: string;
  totalSkills: number;
  profileStrength: ProfileStrength;
  suggestedTeammates: SuggestedTeammate[];
  myProject: DashboardProject | null;
  suggestedTeammatesCount?: number;
  matchedGraduationProjectsCount?: number;
  bestTeammateMatchPercent?: number | null;
  pendingTeamInvitationsCount?: number;
};

export type StudentAiMatchStatus = {
  matchScorePercent: number;
  headline: string;
  insight: string;
  availabilityStatus: string;
  studentMatchCount: number;
  doctorMatchCount: number;
  companyMatchCount: number;
  associationMatchCount: number;
  profileStrengthScore: number;
  hasMatchInsights: boolean;
  showEmptyState: boolean;
};

function readMatchField<T>(raw: Record<string, unknown>, camel: string, pascal: string): T | undefined {
  if (raw[camel] !== undefined && raw[camel] !== null) return raw[camel] as T;
  if (raw[pascal] !== undefined && raw[pascal] !== null) return raw[pascal] as T;
  return undefined;
}

export async function getStudentAiMatchStatus(): Promise<StudentAiMatchStatus> {
  const { data } = await api.get<Record<string, unknown>>("/dashboard/match-status");
  const raw = data ?? {};
  return {
    matchScorePercent: Number(readMatchField<number>(raw, "matchScorePercent", "MatchScorePercent") ?? 0),
    headline: String(readMatchField<string>(raw, "headline", "Headline") ?? "").trim(),
    insight: String(readMatchField<string>(raw, "insight", "Insight") ?? "").trim(),
    availabilityStatus: String(
      readMatchField<string>(raw, "availabilityStatus", "AvailabilityStatus") ?? "",
    ).trim(),
    studentMatchCount: Number(readMatchField<number>(raw, "studentMatchCount", "StudentMatchCount") ?? 0),
    doctorMatchCount: Number(readMatchField<number>(raw, "doctorMatchCount", "DoctorMatchCount") ?? 0),
    companyMatchCount: Number(readMatchField<number>(raw, "companyMatchCount", "CompanyMatchCount") ?? 0),
    associationMatchCount: Number(
      readMatchField<number>(raw, "associationMatchCount", "AssociationMatchCount") ?? 0,
    ),
    profileStrengthScore: Number(
      readMatchField<number>(raw, "profileStrengthScore", "ProfileStrengthScore") ?? 0,
    ),
    hasMatchInsights: !!(readMatchField<boolean>(raw, "hasMatchInsights", "HasMatchInsights") ?? false),
    showEmptyState: !!(readMatchField<boolean>(raw, "showEmptyState", "ShowEmptyState") ?? false),
  };
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const { data } = await api.get<DashboardSummary>("/dashboard/summary");
  return data;
}
