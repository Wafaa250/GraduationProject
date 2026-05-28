import {
  ROUTES,
  doctorMessageThreadPath,
  doctorProjectPath,
} from "@/routes/paths";
import type { GraduationNotification } from "@/api/notificationsApi";

function conversationIdFromChatDedupKey(dedupKey: string | null | undefined): number | null {
  if (!dedupKey) return null;
  const direct = dedupKey.match(/^chat:direct:(\d+):/);
  if (direct) return Number(direct[1]);
  const started = dedupKey.match(/^chat:conversation_started:(\d+):/);
  if (started) return Number(started[1]);
  return null;
}

/** Best-effort in-app route for a doctor notification (null = no navigation). */
export function getDoctorNotificationTarget(n: GraduationNotification): string | null {
  const event = n.eventType?.toLowerCase() ?? "";

  if (n.category === "graduation_project") {
    if (event.includes("supervision") || event.includes("supervisor")) {
      return ROUTES.doctorRequests;
    }
    if (n.projectId != null) return doctorProjectPath(n.projectId);
    return ROUTES.doctorProjects;
  }

  if (n.category === "chat") {
    const conversationId = conversationIdFromChatDedupKey(n.dedupKey);
    if (conversationId != null && Number.isFinite(conversationId)) {
      return doctorMessageThreadPath(conversationId);
    }
    return ROUTES.doctorMessages;
  }

  if (n.category === "course") {
    if (event.includes("invite") || event.includes("supervision")) {
      return ROUTES.doctorRequests;
    }
    return ROUTES.doctorCourses;
  }

  return null;
}
