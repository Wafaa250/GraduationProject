import type { GraduationNotification } from "@/api/notificationsApi";
import {
  buildStudentInvitationRoute,
  getStudentInvitationTargetLabel,
} from "@/lib/notificationInvitationRouting";

export function getStudentNotificationTarget(n: GraduationNotification): string | null {
  return buildStudentInvitationRoute(n);
}

export function getStudentNotificationTargetLabel(n: GraduationNotification): string | null {
  return getStudentInvitationTargetLabel(n);
}
