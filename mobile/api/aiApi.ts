import api from "./axiosInstance";

export type ProjectPreviewRequest = {
  projectType: string;
  title: string;
  abstract?: string | null;
  requiredSkills: string[];
  technologies: string[];
  preferredRoles: string[];
  requiredRoles: string[];
  skillPriorities: string[];
  interests: string[];
  teamSize: number;
};

export type ProjectPreviewStudent = {
  studentId: number;
  name: string;
  major: string;
  matchScore: number;
  skills: string[];
};

export type ProjectPreviewResponse = {
  isAvailable: boolean;
  message?: string | null;
  estimatedCompatibleStudentsCount: number;
  compatibilityScore: number;
  topMatchingSkills: string[];
  topMatchingRoles: string[];
  domainOverlapLabel?: string | null;
  roleCoverageLabel?: string | null;
  topRecommendedStudents: ProjectPreviewStudent[];
};

function normalizePreviewResponse(raw: Record<string, unknown>): ProjectPreviewResponse {
  const studentsRaw = (raw.topRecommendedStudents ?? raw.TopRecommendedStudents ?? []) as unknown[];
  return {
    isAvailable: Boolean(raw.isAvailable ?? raw.IsAvailable),
    message: (raw.message ?? raw.Message ?? null) as string | null,
    estimatedCompatibleStudentsCount: Number(
      raw.estimatedCompatibleStudentsCount ?? raw.EstimatedCompatibleStudentsCount ?? 0,
    ),
    compatibilityScore: Number(raw.compatibilityScore ?? raw.CompatibilityScore ?? 0),
    topMatchingSkills: (raw.topMatchingSkills ?? raw.TopMatchingSkills ?? []) as string[],
    topMatchingRoles: (raw.topMatchingRoles ?? raw.TopMatchingRoles ?? []) as string[],
    domainOverlapLabel: (raw.domainOverlapLabel ?? raw.DomainOverlapLabel ?? null) as string | null,
    roleCoverageLabel: (raw.roleCoverageLabel ?? raw.RoleCoverageLabel ?? null) as string | null,
    topRecommendedStudents: studentsRaw.map((s) => {
      const row = s as Record<string, unknown>;
      return {
        studentId: Number(row.studentId ?? row.StudentId ?? 0),
        name: String(row.name ?? row.Name ?? ""),
        major: String(row.major ?? row.Major ?? ""),
        matchScore: Number(row.matchScore ?? row.MatchScore ?? 0),
        skills: (row.skills ?? row.Skills ?? []) as string[],
      };
    }),
  };
}

export function hasSufficientProjectPreviewInput(input: {
  title: string;
  skills: string[];
  technologies: string[];
}): boolean {
  const title = input.title.trim();
  if (title.length < 3) return false;
  return input.skills.length > 0 || input.technologies.length > 0;
}

export async function fetchProjectMatchingPreview(
  payload: ProjectPreviewRequest,
): Promise<ProjectPreviewResponse> {
  const { data } = await api.post<Record<string, unknown>>("/ai/project-preview", payload);
  return normalizePreviewResponse(data);
}
