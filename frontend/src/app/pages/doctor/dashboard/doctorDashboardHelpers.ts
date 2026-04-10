import type { DashboardProject, DashboardSummary } from "../../../../api/dashboardApi";

export type ProjectHighlight = {
  name: string;
  role: string;
  memberCount: number;
  maxTeamSize: number;
  isFull: boolean;
};

export type SuggestionRow = {
  userId: number;
  name: string;
  major: string;
  university: string;
  matchScore: number;
  skills: string[];
};

function highlightFromDashboardProject(dp: DashboardProject): ProjectHighlight {
  return {
    name: dp.projectName,
    role: dp.role === "owner" ? "Owner" : "Member",
    memberCount: dp.memberCount,
    maxTeamSize: dp.maxTeamSize,
    isFull: dp.isFull,
  };
}

export function buildOverviewHighlight(
  summary: DashboardSummary | null,
  myProject: DashboardProject | null,
): ProjectHighlight | null {
  if (summary?.myProject) {
    return highlightFromDashboardProject(summary.myProject);
  }
  if (myProject) {
    return highlightFromDashboardProject(myProject);
  }
  return null;
}

export function buildOverviewSuggestions(summary: DashboardSummary | null): SuggestionRow[] {
  if (!summary?.suggestedTeammates?.length) return [];
  return summary.suggestedTeammates.slice(0, 8).map((t) => ({
    userId: t.userId,
    name: t.name,
    major: t.major,
    university: t.university,
    matchScore: t.matchScore,
    skills: t.skills ?? [],
  }));
}
