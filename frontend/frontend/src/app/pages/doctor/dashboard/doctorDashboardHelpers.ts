import type { DashboardProject, DashboardSummary } from "../../../../api/dashboardApi";
import type { DoctorSupervisedProject } from "../../../../api/doctorDashboardApi";

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

/** When the logged-in user is a doctor, dashboard summary has no student project — use first supervised project. */
export function buildOverviewHighlightFromSupervised(
  projects: DoctorSupervisedProject[],
): ProjectHighlight | null {
  const first = projects[0];
  if (!first) return null;
  return {
    name: first.name,
    role: "Supervisor",
    memberCount: first.memberCount,
    maxTeamSize: first.partnersCount,
    isFull: first.isFull,
  };
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
