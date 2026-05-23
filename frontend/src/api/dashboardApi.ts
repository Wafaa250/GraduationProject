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

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const { data } = await api.get<DashboardSummary>("/dashboard/summary");
  return data;
}
