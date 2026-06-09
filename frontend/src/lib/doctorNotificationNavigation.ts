import type { GraduationNotification } from "@/api/notificationsApi";
import {
  buildDoctorInvitationRoute,
  getDoctorInvitationTargetLabel,
} from "@/lib/notificationInvitationRouting";

export function getDoctorNotificationTarget(n: GraduationNotification): string | null {
  return buildDoctorInvitationRoute(n);
}

export { getDoctorInvitationTargetLabel as getDoctorNotificationTargetLabel };
