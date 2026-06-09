import type { GraduationNotification } from "@/api/notificationsApi";

import {
  buildDoctorInvitationRoute,
  buildStudentInvitationRoute,
  parseInvitationNotification,
} from "@/lib/notificationInvitationRouting";
import { resolveGraduationInvitationRoute } from "@/lib/graduationInvitationResolver";

import {
  invitationEntityId,
  logInvitationNotificationTrace,
} from "@/lib/notificationNavigationTrace";

/**
 * Resolve the destination route for a notification click.
 * Graduation team invitations always resolve to the detail page when possible.
 */
export async function resolveStudentNotificationNavigation(
  n: GraduationNotification,
): Promise<string | null> {
  logInvitationNotificationTrace("click_handler_start", n, parseInvitationNotification(n));

  const parsed = parseInvitationNotification(n);
  logInvitationNotificationTrace("notification_parsed", n, parsed, {
    invitationId: parsed.invitationId,
    requestId: parsed.requestId,
    requiresPendingValidation: parsed.requiresPendingValidation,
  });

  const isGraduationInvite =
    parsed.kind === "graduation_team_invitation" &&
    (parsed.invitationId != null || (n.dedupKey?.startsWith("gp:invite:") ?? false));

  if (isGraduationInvite) {
    const resolved = await resolveGraduationInvitationRoute(n);
    console.log("[NotificationInvitationTrace]", {
      stage: "graduation_invitation_route_resolved",
      notificationId: resolved.notificationId,
      parsedKind: resolved.parsedKind,
      dedupKey: resolved.dedupKey,
      projectId: resolved.projectId,
      extractedInvitationId: resolved.extractedInvitationId,
      resolvedInvitationId: resolved.resolvedInvitationId,
      pendingInboxCount: resolved.pendingInboxCount,
      resolution: resolved.resolution,
      generatedRoute: resolved.route,
    });

    logInvitationNotificationTrace("route_generated", n, parsed, {
      generatedRoute: resolved.route,
      entityId: resolved.resolvedInvitationId,
      resolution: resolved.resolution,
    });

    return resolved.route;
  }

  const route = buildStudentInvitationRoute(n, parsed);
  logInvitationNotificationTrace("route_generated", n, parsed, {
    generatedRoute: route,
    entityId: invitationEntityId(parsed, n),
  });

  if (!route) {
    logInvitationNotificationTrace("route_missing", n, parsed, {
      generatedRoute: null,
    });
    return null;
  }

  return route;
}

export async function resolveDoctorNotificationNavigation(
  n: GraduationNotification,
): Promise<string | null> {
  logInvitationNotificationTrace("click_handler_start", n, parseInvitationNotification(n));

  const parsed = parseInvitationNotification(n);
  logInvitationNotificationTrace("notification_parsed", n, parsed, {
    invitationId: parsed.invitationId,
    requestId: parsed.requestId,
    requiresPendingValidation: parsed.requiresPendingValidation,
  });

  const route = buildDoctorInvitationRoute(n, parsed);
  logInvitationNotificationTrace("route_generated", n, parsed, {
    generatedRoute: route,
    entityId: invitationEntityId(parsed, n),
  });

  if (!route) {
    logInvitationNotificationTrace("route_missing", n, parsed, {
      generatedRoute: null,
    });
    return null;
  }

  return route;
}
