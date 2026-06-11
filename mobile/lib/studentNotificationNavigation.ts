import type { GraduationNotification } from "@/api/notificationsApi";
import { STUDENT_ROUTES, studentMessageThreadPath } from "@/lib/studentRoutes";

function conversationIdFromChatDedupKey(dedupKey: string | null | undefined): number | null {
  if (!dedupKey) return null;
  const direct = dedupKey.match(/^chat:direct:(\d+):/);
  if (direct) return Number(direct[1]);
  const team = dedupKey.match(/^chat:team-conv:(\d+):/);
  if (team) return Number(team[1]);
  const started = dedupKey.match(/^chat:conversation_started:(\d+):/);
  if (started) return Number(started[1]);
  return null;
}

export function getStudentNotificationTarget(n: GraduationNotification): string | null {
  if (n.category === "chat") {
    const conversationId = conversationIdFromChatDedupKey(n.dedupKey);
    if (conversationId != null && Number.isFinite(conversationId)) {
      return studentMessageThreadPath(conversationId);
    }
    return "/messages";
  }

  if (n.category === "graduation_project") {
    return STUDENT_ROUTES.graduationProjectWorkspace;
  }

  if (n.category === "course" || n.category === "ai") {
    return STUDENT_ROUTES.studentCourses;
  }

  return null;
}
