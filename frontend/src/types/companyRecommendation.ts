/** UI-only placeholder types for candidate recommendations (pre–AI matching API). */

export type RecommendationAvailability = "Available" | "Limited" | "Busy";

export type RecommendationCandidate = {
  id: string;
  name: string;
  university: string;
  year: string;
  major: string;
  matchScore: number;
  matchingSkills: string[];
  insights: string[];
  availability: RecommendationAvailability;
  bio: string;
  skills: string[];
  tools: string[];
  projectInterests: string[];
};
