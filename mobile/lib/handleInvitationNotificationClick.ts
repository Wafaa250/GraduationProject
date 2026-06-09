import { getReceivedProjectInvitations } from "@/api/invitationsApi";
import { getDoctorSupervisorRequests } from "@/api/doctorDashboardApi";
import { getTeamInvitations } from "@/api/studentCoursesApi";
import type { GraduationNotification } from "@/api/notificationsApi";
import { DOCTOR_ROUTES } from "@/lib/doctorRoutes";
import {
  buildDoctorInvitationRoute,
  buildStudentInvitationRoute,
  parseInvitationNotification,
  type ParsedInvitationNotification,
} from "@/lib/notificationInvitationRouting";

export type InvitationNavigationResult = {
  route: string | null;
  unavailableMessage: string | null;
};

const UNAVAILABLE_MESSAGE = "This invitation is no longer available.";

async function validateInvitationTarget(
  parsed: ParsedInvitationNotification,
  role: "student" | "doctor",
): Promise<boolean> {
  if (!parsed.requiresPendingValidation) return true;
  try {
    if (role === "student" && parsed.kind === "graduation_team_invitation") {
      if (parsed.invitationId == null) return true;
      const rows = await getReceivedProjectInvitations();
      return rows.some((r) => r.invitationId === parsed.invitationId && r.status === "pending");
    }
    if (role === "student" && parsed.kind === "course_team_invitation") {
      if (parsed.invitationId == null) return true;
      const rows = await getTeamInvitations();
      return rows.some((r) => r.invitationId === parsed.invitationId);
    }
    if (role === "doctor" && parsed.kind === "supervision_request") {
      if (parsed.requestId == null) return true;
      const rows = await getDoctorSupervisorRequests();
      return rows.some((r) => r.requestId === parsed.requestId && r.status?.toLowerCase() === "pending");
    }
    return true;
  } catch {
    return true;
  }
}

export async function resolveStudentNotificationNavigation(
  n: GraduationNotification,
): Promise<InvitationNavigationResult> {
  const parsed = parseInvitationNotification(n);
  const route = buildStudentInvitationRoute(n, parsed);
  if (!route) return { route: null, unavailableMessage: null };

  const available = await validateInvitationTarget(parsed, "student");
  if (!available) {
    const focus =
      parsed.kind === "course_team_invitation" ? "course-invitation" : "graduation-invitation";
    return {
      route: `/dashboard?focus=${focus}`,
      unavailableMessage: UNAVAILABLE_MESSAGE,
    };
  }

  return { route, unavailableMessage: null };
}

export async function resolveDoctorNotificationNavigation(
  n: GraduationNotification,
): Promise<InvitationNavigationResult> {
  const parsed = parseInvitationNotification(n);
  const route = buildDoctorInvitationRoute(n, parsed);
  if (!route) return { route: null, unavailableMessage: null };

  const available = await validateInvitationTarget(parsed, "doctor");
  if (!available) {
    return {
      route: DOCTOR_ROUTES.requests,
      unavailableMessage: UNAVAILABLE_MESSAGE,
    };
  }

  return { route, unavailableMessage: null };
}
