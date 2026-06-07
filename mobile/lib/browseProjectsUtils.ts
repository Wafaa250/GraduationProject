import type { GradProject } from "@/api/gradProjectApi";
import { resolveProjectTypeLabel } from "@/api/gradProjectApi";
import {
  isProjectVisibleToStudent,
  projectTypeLabel as labelForFacultyMajor,
} from "@/lib/graduationProjectTypes";

export type BrowseTeamStatus = "Open" | "Forming team" | "Almost full";

export function computeSkillMatchScore(
  mySkills: string[],
  requiredSkills: string[] | undefined,
): number {
  const required = (requiredSkills ?? []).map((s) => s.trim().toLowerCase()).filter(Boolean);
  if (required.length === 0) return 50;
  const mine = new Set(mySkills.map((s) => s.trim().toLowerCase()).filter(Boolean));
  const hits = required.filter((s) => mine.has(s)).length;
  return Math.min(100, Math.round((hits / required.length) * 100));
}

export function getBrowseTeamStatus(project: GradProject): BrowseTeamStatus {
  const remaining =
    project.remainingSeats ??
    Math.max(0, project.partnersCount - (project.currentMembers ?? project.members?.length ?? 0));
  if (remaining <= 1) return "Almost full";
  const members = project.currentMembers ?? project.members?.length ?? 0;
  if (members >= 2) return "Forming team";
  return "Open";
}

export function projectTypeLabel(
  project: Pick<GradProject, "projectType" | "projectTypeLabel" | "ownerFaculty" | "ownerMajor">,
  viewerFaculty?: string | null,
  viewerMajor?: string | null,
): string {
  if (viewerFaculty !== undefined || viewerMajor !== undefined) {
    return labelForFacultyMajor(project.projectType, viewerFaculty, viewerMajor);
  }
  return resolveProjectTypeLabel(project);
}

export function isBrowseableProject(
  project: GradProject,
  myProfileId: number,
  viewerFaculty?: string | null,
  viewerMajor?: string | null,
): boolean {
  if (project.isOwner) return false;
  if (project.isFull) return false;
  if (project.lookingForTeammates === false) return false;
  if (project.members?.some((m) => m.studentId === myProfileId)) return false;
  if (
    viewerFaculty !== undefined &&
    !isProjectVisibleToStudent(
      project.projectType,
      project.ownerFaculty,
      project.ownerMajor,
      viewerFaculty,
      viewerMajor,
    )
  ) {
    return false;
  }
  return true;
}

export function collectBrowseSkillOptions(projects: GradProject[]): string[] {
  const set = new Set<string>();
  for (const p of projects) {
    for (const s of p.requiredSkills ?? []) {
      const t = s.trim();
      if (t) set.add(t);
    }
    for (const t of p.technologies ?? []) {
      const v = t.trim();
      if (v) set.add(v);
    }
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

export function mergeMySkills(me: {
  roles?: string[];
  technicalSkills?: string[];
  tools?: string[];
  generalSkills?: string[];
  majorSkills?: string[];
}): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of [
    ...(me.roles ?? []),
    ...(me.technicalSkills ?? []),
    ...(me.tools ?? []),
    ...(me.generalSkills ?? []),
    ...(me.majorSkills ?? []),
  ]) {
    const t = s.trim();
    if (!t) continue;
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
  }
  return out;
}
