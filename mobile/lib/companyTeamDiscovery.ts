import type { CompanyRequestTeamRecommendationMember } from "@/api/companyApi";

export function chemistryLabel(score: number): string {
  if (score >= 85) return "High chemistry";
  if (score >= 70) return "Strong fit";
  if (score >= 55) return "Balanced";
  return "Developing";
}

export function memberRoleExplanation(member: CompanyRequestTeamRecommendationMember): string {
  return (
    member.assignmentReason?.trim() ||
    (member.highlights.length > 0 ? member.highlights[0] : "")
  );
}

export function normalizeContactUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function displayContactValue(value: string): string {
  return value.replace(/^https?:\/\//i, "");
}
