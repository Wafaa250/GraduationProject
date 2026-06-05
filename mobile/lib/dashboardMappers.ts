import type { GradProject } from "@/api/gradProjectApi";
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

export function mapInvitations(items: TeamInvitationItem[]): TeamInvitationView[] {
  return items.map((inv) => ({
    id: String(inv.invitationId),
    inviter: inv.senderName,
    inviterInitials: profileInitialsFromName(inv.senderName),
    team: inv.senderSection || inv.courseName,
    project: inv.projectTitle,
  }));
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
