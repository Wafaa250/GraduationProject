import type { CompanyRequestRecommendationItem } from "@/api/companyApi";

export type RecommendationCandidate = {
  id: string;
  studentProfileId: number;
  name: string;
  university: string;
  year: string;
  major: string;
  matchScore: number;
  matchingSkills: string[];
  insights: string[];
};

export function mapRecommendationToCandidate(
  item: CompanyRequestRecommendationItem,
): RecommendationCandidate {
  const skills = item.student.skills ?? [];
  const insightLines = item.highlights.length > 0 ? item.highlights : [item.reasonSummary];
  const matchingSkills = skills.slice(0, 4);

  return {
    id: `rec-${item.id}`,
    studentProfileId: item.student.studentProfileId,
    name: item.student.name,
    university: item.student.university ?? "—",
    year: item.student.academicYear ?? "—",
    major: item.student.major ?? item.student.faculty ?? "—",
    matchScore: item.score,
    matchingSkills: matchingSkills.length > 0 ? matchingSkills : skills.slice(0, 4),
    insights: insightLines.slice(0, 4),
  };
}
