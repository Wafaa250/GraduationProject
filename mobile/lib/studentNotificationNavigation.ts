import type { GraduationNotification } from "@/api/notificationsApi";
import { buildStudentInvitationRoute } from "@/lib/notificationInvitationRouting";

export function getStudentNotificationTarget(n: GraduationNotification): string | null {
  return buildStudentInvitationRoute(n);
}
