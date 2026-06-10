import type { ProjectAvailableStudent } from "@/api/gradProjectApi";

export const BEST_MATCH_SCORE_THRESHOLD = 60;

export type StudentBrowseFilters = {
  search: string;
  university: string;
  major: string;
  skill: string;
};

export function filterAvailableStudents(
  students: ProjectAvailableStudent[],
  filters: StudentBrowseFilters,
): ProjectAvailableStudent[] {
  const q = filters.search.trim().toLowerCase();
  return students.filter((s) => {
    if (filters.university && s.university !== filters.university) return false;
    if (filters.major && s.major !== filters.major) return false;
    if (
      filters.skill &&
      !s.skills.some((sk) => sk.toLowerCase() === filters.skill.toLowerCase())
    ) {
      return false;
    }
    if (q) {
      const hay = [s.name, s.major, s.university, s.academicYear, ...s.skills]
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function splitStudentsByMatchScore(students: ProjectAvailableStudent[]): {
  recommended: ProjectAvailableStudent[];
  others: ProjectAvailableStudent[];
} {
  const sorted = [...students].sort((a, b) => b.matchScore - a.matchScore);
  return {
    recommended: sorted.filter((s) => s.matchScore >= BEST_MATCH_SCORE_THRESHOLD),
    others: sorted.filter((s) => s.matchScore < BEST_MATCH_SCORE_THRESHOLD),
  };
}
