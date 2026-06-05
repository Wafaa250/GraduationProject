export type CourseProjectSectionScope = {
  applyToAllSections?: boolean;
  sections?: { sectionId: number; sectionName?: string }[];
};

export function isStudentEligibleForCourseProject(
  project: CourseProjectSectionScope,
  mySectionId: number,
): boolean {
  if (project.applyToAllSections) return true;
  if (!Number.isFinite(mySectionId) || mySectionId <= 0) return false;

  const assignedSectionIds = (project.sections ?? [])
    .map((s) => s.sectionId)
    .filter((id) => Number.isFinite(id) && id > 0);

  return assignedSectionIds.includes(mySectionId);
}

export function filterEligibleCourseProjects<T extends CourseProjectSectionScope>(
  projects: T[],
  mySectionId: number,
): T[] {
  return projects.filter((p) => isStudentEligibleForCourseProject(p, mySectionId));
}
