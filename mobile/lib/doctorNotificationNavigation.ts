import type { GraduationNotification } from "@/api/notificationsApi";
import { DOCTOR_ROUTES, doctorProjectPath } from "@/lib/doctorRoutes";

function conversationIdFromChatDedupKey(dedupKey: string | null | undefined): number | null {
  if (!dedupKey) return null;
  const direct = dedupKey.match(/^chat:direct:(\d+):/);
  if (direct) return Number(direct[1]);
  const teamConv = dedupKey.match(/^chat:team-conv:(\d+):/);
  if (teamConv) return Number(teamConv[1]);
  const started = dedupKey.match(/^chat:conversation_started:(\d+):/);
  if (started) return Number(started[1]);
  return null;
}

export function doctorMessageThreadPath(conversationId: number): string {
  return `/doctor/messages/${conversationId}`;
}

/** Best-effort in-app route for a doctor notification (null = no navigation). */
export function getDoctorNotificationTarget(n: GraduationNotification): string | null {
  const event = n.eventType?.toLowerCase() ?? "";

  if (n.category === "graduation_project") {
    if (event.includes("supervision") || event.includes("supervisor")) {
      return DOCTOR_ROUTES.requests;
    }
    if (n.projectId != null) return doctorProjectPath(n.projectId);
    return DOCTOR_ROUTES.projects;
  }

  if (n.category === "chat") {
    const conversationId = conversationIdFromChatDedupKey(n.dedupKey);
    if (conversationId != null && Number.isFinite(conversationId)) {
      return doctorMessageThreadPath(conversationId);
    }
    return DOCTOR_ROUTES.messages;
  }

  if (n.category === "course") {
    if (event.includes("invite") || event.includes("supervision")) {
      return DOCTOR_ROUTES.requests;
    }
    return DOCTOR_ROUTES.courses;
  }

  if (n.category === "ai") {
    return DOCTOR_ROUTES.courses;
  }

  return null;
}

export function getDoctorNotificationTargetLabel(n: GraduationNotification): string | null {
  const target = getDoctorNotificationTarget(n);
  if (!target) return null;
  if (target.includes("/requests")) return "View requests";
  if (target.match(/\/projects\/\d+/)) return "View project";
  if (target.includes("/projects")) return "View projects";
  if (target.match(/\/messages\/\d+/)) return "Open chat";
  if (target.includes("/messages")) return "Messages";
  if (target.includes("/courses")) return "View courses";
  return "View";
}
