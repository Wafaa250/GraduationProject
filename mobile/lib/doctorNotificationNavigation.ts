import type { GraduationNotification } from "@/api/notificationsApi";
import { buildDoctorInvitationRoute } from "@/lib/notificationInvitationRouting";

export function doctorMessageThreadPath(conversationId: number): string {
  return `/doctor/messages/${conversationId}`;
}

export function getDoctorNotificationTarget(n: GraduationNotification): string | null {
  return buildDoctorInvitationRoute(n);
}

export function getDoctorNotificationTargetLabel(n: GraduationNotification): string | null {
  const route = getDoctorNotificationTarget(n);
  if (!route) return null;
  if (route.includes("/requests")) return "View requests";
  if (route.match(/\/projects\/\d+/)) return "View project";
  if (route.includes("/messages/")) return "Open chat";
  if (route.includes("/courses")) return "View courses";
  return "View";
}
