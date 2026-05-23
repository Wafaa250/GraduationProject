import type { DoctorCourseProject } from "../../../api/doctorCoursesApi";

/** Numeric backend course id, or null for temp/draft route ids. */
export function parseBackendCourseId(cid: string | undefined): number | null {
  if (!cid) return null;
  if (/^\d+$/.test(cid.trim())) {
    const n = Number(cid);
    return Number.isFinite(n) && n > 0 ? n : null;
  }
  return null;
}

export function sectionLabelFromProject(p: DoctorCourseProject): string {
  return doctorProjectSectionDisplayLabel(p);
}

export function doctorProjectSectionDisplayLabel(project: DoctorCourseProject): string {
  if (project.applyToAllSections) {
    return "All sections";
  }
  const names = project.sections
    .map((s) => s.sectionName.trim())
    .filter((n) => n.length > 0);
  return names.length > 0 ? names.join(", ") : "Section";
}
