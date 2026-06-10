import type { ConversationListItem } from "@/api/conversationsApi";
import type { DoctorSupervisedProject } from "@/api/doctorDashboardApi";
import {
  getGraduationProjectById,
  getGraduationProjectMembers,
  resolveProjectTypeLabel,
} from "@/api/gradProjectApi";
import { initialsFromName } from "@/lib/doctorHubMappers";
import { findDoctorProjectConversation } from "@/lib/doctorProjectConversation";

export type ProjectHealthStatus = "active" | "completed";

export type ProjectStatusFilter = "all" | ProjectHealthStatus;

export type ActiveProjectCardModel = {
  id: number;
  category: string;
  status: ProjectHealthStatus;
  title: string;
  description: string;
  teamSize: number;
  teamCapacity: number;
  supervisorName?: string | null;
  ownerName: string;
  createdAt: string;
  preferredRoles: string[];
  skills: string[];
  team: Array<{ id: number; initials: string; name: string }>;
  memberUserIds: number[];
  hasTeamChat: boolean;
};

export const PROJECT_FILTER_TABS: { id: ProjectStatusFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "active", label: "Supervised" },
  { id: "completed", label: "Complete" },
];

export async function mapSupervisedToActiveProject(
  project: DoctorSupervisedProject,
): Promise<Omit<ActiveProjectCardModel, "hasTeamChat">> {
  const [detailsSettled, membersSettled] = await Promise.allSettled([
    getGraduationProjectById(project.projectId),
    getGraduationProjectMembers(project.projectId),
  ]);

  const details = detailsSettled.status === "fulfilled" ? detailsSettled.value : null;
  const membersResponse = membersSettled.status === "fulfilled" ? membersSettled.value : null;

  const apiMembers =
    membersResponse && membersResponse.members.length > 0
      ? membersResponse.members
      : (details?.members ?? []).map((member) => ({
          studentId: member.studentId,
          userId: member.userId,
          name: member.name,
          email: member.email ?? "",
          university: member.university ?? "",
          major: member.major ?? "",
          role: member.role,
        }));

  const members =
    apiMembers.length > 0
      ? apiMembers.map((member) => ({
          id: member.studentId,
          name: member.name,
          initials: initialsFromName(member.name || "?"),
        }))
      : [
          {
            id: project.owner.studentId,
            name: project.owner.name,
            initials: initialsFromName(project.owner.name || "?"),
          },
        ];

  const memberUserIds = apiMembers.map((m) => m.userId).filter((id) => id > 0);
  const teamSize = membersResponse?.currentMembers ?? details?.currentMembers ?? project.memberCount;
  const teamCapacity =
    membersResponse?.totalCapacity ?? details?.partnersCount ?? project.partnersCount;
  const isTeamComplete =
    project.isFull ||
    membersResponse?.isFull ||
    details?.isFull ||
    (teamCapacity > 0 && teamSize >= teamCapacity);

  const skills = [
    ...(project.requiredSkills ?? []),
    ...(details?.requiredSkills ?? []),
    ...(details?.technologies ?? []),
  ].filter((skill, index, arr) => arr.indexOf(skill) === index);

  const preferredRoles = [
    ...(project.preferredRoles ?? []),
    ...(details?.preferredRoles ?? []),
  ].filter((role, index, arr) => arr.indexOf(role) === index);

  const description =
    project.description?.trim() || "No project description provided.";

  return {
    id: project.projectId,
    category:
      project.projectTypeLabel ??
      details?.projectTypeLabel ??
      resolveProjectTypeLabel({
        projectType: project.projectType ?? details?.projectType ?? "GP",
        ownerFaculty: project.owner.faculty ?? details?.ownerFaculty,
        ownerMajor: project.owner.major ?? details?.ownerMajor,
      }),
    status: isTeamComplete ? "completed" : "active",
    title: project.name || details?.name || "Untitled project",
    description,
    teamSize,
    teamCapacity,
    supervisorName: details?.supervisor?.name ?? null,
    ownerName: project.owner.name || details?.ownerName || "—",
    createdAt: project.createdAt || details?.createdAt || "",
    preferredRoles,
    skills: skills.slice(0, 6),
    team: members,
    memberUserIds,
  };
}

export function attachTeamChatFlags(
  projects: Omit<ActiveProjectCardModel, "hasTeamChat">[],
  conversations: ConversationListItem[],
  doctorUserId: number,
): ActiveProjectCardModel[] {
  return projects.map((project) => ({
    ...project,
    hasTeamChat:
      doctorUserId > 0 &&
      !!findDoctorProjectConversation(
        conversations,
        project.title,
        project.memberUserIds,
        doctorUserId,
      ),
  }));
}

export function computeActiveProjectMetrics(
  projects: ActiveProjectCardModel[],
  summarySupervised?: number,
) {
  let teamsComplete = 0;
  let teamChats = 0;
  for (const project of projects) {
    if (project.status === "completed") teamsComplete += 1;
    if (project.hasTeamChat) teamChats += 1;
  }
  return {
    supervised: summarySupervised ?? projects.length,
    teamsComplete,
    teamChats,
  };
}

export function filterActiveProjectsByStatus(
  projects: ActiveProjectCardModel[],
  filter: ProjectStatusFilter,
): ActiveProjectCardModel[] {
  if (filter === "all") return projects;
  return projects.filter((project) => project.status === filter);
}

export function projectFilterCounts(projects: ActiveProjectCardModel[]) {
  return {
    all: projects.length,
    active: projects.filter((p) => p.status === "active").length,
    completed: projects.filter((p) => p.status === "completed").length,
  };
}
