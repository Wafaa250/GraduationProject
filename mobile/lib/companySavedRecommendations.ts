import type {
  CompanySavedStudentRecommendation,
  CompanySavedTeamRecommendation,
} from "@/api/companyApi";

export type SavedRequestGroup = {
  companyRequestId: number;
  requestTitle: string;
  students: CompanySavedStudentRecommendation[];
  teams: CompanySavedTeamRecommendation[];
  latestSavedAt: string;
};

export function formatSavedAt(value: string): string {
  try {
    return new Date(value).toLocaleDateString(undefined, {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export function savedSummary(students: number, teams: number): string {
  const parts: string[] = [];
  if (students > 0) parts.push(`${students} student${students === 1 ? "" : "s"} saved`);
  if (teams > 0) parts.push(`${teams} team${teams === 1 ? "" : "s"} saved`);
  return parts.join(" · ");
}

export function buildSavedRequestGroups(
  students: CompanySavedStudentRecommendation[],
  teams: CompanySavedTeamRecommendation[],
): SavedRequestGroup[] {
  const map = new Map<number, SavedRequestGroup>();

  for (const item of students) {
    const existing = map.get(item.companyRequestId);
    if (existing) {
      existing.students.push(item);
      if (item.savedAt > existing.latestSavedAt) existing.latestSavedAt = item.savedAt;
    } else {
      map.set(item.companyRequestId, {
        companyRequestId: item.companyRequestId,
        requestTitle: item.requestTitle,
        students: [item],
        teams: [],
        latestSavedAt: item.savedAt,
      });
    }
  }

  for (const item of teams) {
    const existing = map.get(item.companyRequestId);
    if (existing) {
      existing.teams.push(item);
      if (item.savedAt > existing.latestSavedAt) existing.latestSavedAt = item.savedAt;
    } else {
      map.set(item.companyRequestId, {
        companyRequestId: item.companyRequestId,
        requestTitle: item.requestTitle,
        students: [],
        teams: [item],
        latestSavedAt: item.savedAt,
      });
    }
  }

  return Array.from(map.values()).sort(
    (a, b) => new Date(b.latestSavedAt).getTime() - new Date(a.latestSavedAt).getTime(),
  );
}
