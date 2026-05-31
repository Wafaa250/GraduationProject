import type { StudentDiscoveryContact } from "@/types/studentDiscoveryContact";

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
  bio: string;
  skills: string[];
  tools: string[];
  projectInterests: string[];
  contact: StudentDiscoveryContact;
};
