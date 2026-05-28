import { getCourseWorkspace, getDoctorCourses } from "@/api/doctorCoursesApi";
import { doctorCourseProjectPath, doctorStudentPath } from "@/routes/paths";
import type { ConversationDetails, ConversationListItem } from "@/api/conversationsApi";

export type DoctorConversationKind = "team" | "student";

export function getDoctorConversationKind(
  conversation: Pick<ConversationListItem, "courseTeamId" | "participantCount">,
): DoctorConversationKind {
  if (conversation.courseTeamId != null || conversation.participantCount > 2) {
    return "team";
  }
  return "student";
}

export function getDoctorConversationDisplayName(
  conversation: ConversationListItem | ConversationDetails,
  currentUserId?: number | null,
): string {
  const title = conversation.title?.trim();
  if (title) return title;
  if (getDoctorConversationKind(conversation) === "student") {
    if ("otherUser" in conversation && conversation.otherUser?.name?.trim()) {
      return conversation.otherUser.name.trim();
    }
    const other = conversation.users.find((u) => u.id !== currentUserId);
    return other?.name?.trim() || "Student";
  }
  return "Team conversation";
}

export function getDoctorConversationPreview(
  conversation: ConversationListItem,
): string {
  const last = conversation.lastMessage;
  if (!last || last.deleted) return "No messages yet";
  const text = last.text.trim();
  return text || "No messages yet";
}

export async function resolveDoctorTeamWorkspacePath(
  courseTeamId: number,
): Promise<string | null> {
  const courses = await getDoctorCourses();
  for (const course of courses) {
    const workspace = await getCourseWorkspace(course.courseId);
    const team = workspace.teams.find((t) => t.teamId === courseTeamId);
    if (!team) continue;
    const project = workspace.courseProjects.find((p) => p.id === team.courseProjectId);
    const sectionId = project?.sections[0]?.sectionId;
    if (project && sectionId != null) {
      return doctorCourseProjectPath(course.courseId, sectionId, project.id);
    }
  }
  return null;
}

export function getDoctorStudentProfilePath(
  conversation: ConversationDetails | ConversationListItem,
  currentUserId?: number | null,
): string | null {
  if (getDoctorConversationKind(conversation) !== "student") return null;
  if ("otherUser" in conversation && conversation.otherUser?.id) {
    return doctorStudentPath(conversation.otherUser.id);
  }
  const other = conversation.users.find((u) => u.id !== currentUserId);
  return other?.id ? doctorStudentPath(other.id) : null;
}
