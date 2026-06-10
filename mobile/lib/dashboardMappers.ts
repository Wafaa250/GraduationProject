import type { GradProject } from "@/api/gradProjectApi";
import type { ReceivedProjectInvitation } from "@/api/invitationsApi";
import type { TeamInvitationItem } from "@/api/studentCoursesApi";
import { projectTypeLabel } from "@/lib/graduationProjectTypes";
import { profileInitialsFromName } from "@/lib/profileAvatar";

export const GRAD_INVITE_PREFIX = "gp:";
export const COURSE_INVITE_PREFIX = "course:";

export type InsightMetric = {
  key: string;
  label: string;
  value: string;
  hint: string;
  icon: "people" | "folder" | "sparkles" | "mail";
  tint: string;
  iconColor: string;
};

export type TeamInvitationView = {
  id: string;
  inviter: string;
  inviterInitials: string;
  team: string;
  project: string;
};

export type GraduationProjectView = {
  title: string;
  description: string;
  status: string;
  skills: string[];
  teamSize: string;
  stageLabel?: string;
};

export function mapCourseInvitations(items: TeamInvitationItem[]): TeamInvitationView[] {
  return items.map((inv) => ({
    id: `${COURSE_INVITE_PREFIX}${inv.invitationId}`,
    inviter: inv.senderName,
    inviterInitials: profileInitialsFromName(inv.senderName),
    team: inv.senderSection || inv.courseName,
    project: inv.projectTitle,
  }));
}

export function mapGraduationInvitations(items: ReceivedProjectInvitation[]): TeamInvitationView[] {
  return items.map((inv) => ({
    id: `${GRAD_INVITE_PREFIX}${inv.invitationId}`,
    inviter: inv.senderName,
    inviterInitials: profileInitialsFromName(inv.senderName),
    team: "Graduation Project",
    project: inv.projectName,
  }));
}

export function parseInvitationId(
  id: string,
): { source: "graduation" | "course"; invitationId: number } | null {
  if (id.startsWith(GRAD_INVITE_PREFIX)) {
    const invitationId = Number(id.slice(GRAD_INVITE_PREFIX.length));
    return Number.isFinite(invitationId) ? { source: "graduation", invitationId } : null;
  }
  if (id.startsWith(COURSE_INVITE_PREFIX)) {
    const invitationId = Number(id.slice(COURSE_INVITE_PREFIX.length));
    return Number.isFinite(invitationId) ? { source: "course", invitationId } : null;
  }
  return null;
}

/** @deprecated Use mapCourseInvitations — kept for existing imports. */
export function mapInvitations(items: TeamInvitationItem[]): TeamInvitationView[] {
  return mapCourseInvitations(items);
}

export function mapGradProject(
  project: GradProject,
  faculty?: string | null,
  major?: string | null,
): GraduationProjectView {
  const description =
    (project.abstract ?? project.description ?? "").trim() ||
    "No project description provided yet.";
  return {
    title: project.name,
    description,
    status: "In Progress",
    skills: project.requiredSkills ?? [],
    teamSize: `${project.currentMembers} / ${project.partnersCount}`,
    stageLabel:
      project.projectTypeLabel ?? projectTypeLabel(project.projectType, faculty, major),
  };
}
