import type { GradProject } from "@/api/gradProjectApi";
import type { ReceivedProjectInvitation } from "@/api/invitationsApi";
import type { TeamInvitationItem } from "@/api/studentCoursesApi";
import { projectTypeLabel } from "@/lib/graduationProjectTypes";
import { profileInitialsFromName } from "@/lib/profileAvatar";

export type InsightMetric = {
  key: string;
  label: string;
  value: string;
  hint: string;
  icon: "people" | "folder" | "sparkles" | "mail";
  tint: string;
  iconColor: string;
};

export type TeamInvitationKind = "course" | "graduation" | "future";

export type TeamInvitationView = {
  id: string;
  rawId: string;
  kind: TeamInvitationKind;
  inviter: string;
  inviterInitials: string;
  team: string;
  project: string;
  status: string;
  actionable: boolean;
};

export type GraduationInvitationView = TeamInvitationView;

export type GraduationProjectView = {
  title: string;
  description: string;
  status: string;
  skills: string[];
  teamSize: string;
  stageLabel?: string;
};

function isPendingStatus(status: string): boolean {
  return status.trim().toLowerCase() === "pending";
}

export function mapGraduationInvitations(
  items: ReceivedProjectInvitation[],
): GraduationInvitationView[] {
  return items.map((inv) => ({
    id: `graduation:${inv.invitationId}`,
    rawId: String(inv.invitationId),
    kind: "graduation" as const,
    inviter: inv.senderName,
    inviterInitials: profileInitialsFromName(inv.senderName),
    team: "Graduation project",
    project: inv.projectName,
    status: inv.status || "unknown",
    actionable: isPendingStatus(inv.status),
  }));
}

export function mapInvitations(items: TeamInvitationItem[]): TeamInvitationView[] {
  return items.map((inv) => ({
    id: `course:${inv.invitationId}`,
    rawId: String(inv.invitationId),
    kind: "course" as const,
    inviter: inv.senderName,
    inviterInitials: profileInitialsFromName(inv.senderName),
    team: inv.senderSection || inv.courseName,
    project: inv.projectTitle,
    status: "pending",
    actionable: true,
  }));
}

export function mergeDashboardInvitations(
  course: TeamInvitationView[],
  graduation: GraduationInvitationView[],
): TeamInvitationView[] {
  return [...graduation, ...course];
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
