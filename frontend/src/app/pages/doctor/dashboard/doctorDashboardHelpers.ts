import type { DashboardProject, DashboardSummary } from "../../../../api/dashboardApi";
import type { DoctorSupervisedProject } from "../../../../api/doctorDashboardApi";
import type { RequestRow } from "../doctorDashboardTypes";

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

export type RecentActivityItem = {
  id: string;
  kind: "request" | "team" | "recommendation";
  title: string;
  detail: string;
  sortKey: number;
};

/** Activity feed from data already loaded on the dashboard (no mock events). */
export function buildRecentActivity(
  pendingRequests: RequestRow[],
  supervisedTeams: DoctorSupervisedProject[],
  suggestions: SuggestionRow[],
): RecentActivityItem[] {
  const items: RecentActivityItem[] = [];

  for (const r of pendingRequests) {
    items.push({
      id: `req-${r.kind}-${r.requestId}`,
      kind: "request",
      title:
        r.kind === "supervision" ? "Supervision request" : "End-supervision request",
      detail: `${r.projectName || "Project"} · ${r.studentName || "Student"}`,
      sortKey: r.requestId,
    });
  }

  for (const t of supervisedTeams) {
    const at = Date.parse(t.createdAt);
    items.push({
      id: `team-${t.projectId}`,
      kind: "team",
      title: "Supervised team",
      detail: t.name,
      sortKey: Number.isFinite(at) ? at : t.projectId,
    });
  }

  for (const s of suggestions) {
    items.push({
      id: `ai-${s.userId}`,
      kind: "recommendation",
      title: "AI recommendation",
      detail: `${s.name} · ${s.matchScore}% match`,
      sortKey: s.matchScore,
    });
  }

  return items
    .sort((a, b) => b.sortKey - a.sortKey)
    .slice(0, 6);
}

/** Sum of member counts across supervised teams (API does not expose a unique-student total). */
export function countActiveStudentsAcrossTeams(projects: DoctorSupervisedProject[]): number {
  return projects.reduce((sum, p) => sum + (p.memberCount > 0 ? p.memberCount : 0), 0);
}

