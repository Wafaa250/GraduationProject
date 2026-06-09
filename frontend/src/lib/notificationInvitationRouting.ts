import {
  ROUTES,
  doctorCoursePath,
  doctorMessageThreadPath,
  doctorProjectPath,
  doctorSupervisionInvitationPath,
  studentCourseInvitationPath,
  studentCoursePath,
  studentGraduationInvitationPath,
  studentMessageThreadPath,
} from "@/routes/paths";
import type { GraduationNotification } from "@/api/notificationsApi";

export type InvitationNotificationKind =
  | "graduation_team_invitation"
  | "graduation_team_response"
  | "course_team_invitation"
  | "course_team_response"
  | "supervision_request"
  | "supervision_response"
  | "chat"
  | "company_opportunity"
  | "organization_event"
  | "organization_recruitment"
  | "course_update"
  | "project_update"
  | "other";

export type ParsedInvitationNotification = {
  kind: InvitationNotificationKind;
  invitationId: number | null;
  requestId: number | null;
  projectId: number | null;
  requiresPendingValidation: boolean;
};

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

function idFromDedup(dedupKey: string | null | undefined, pattern: RegExp): number | null {
  if (!dedupKey) return null;
  const match = dedupKey.match(pattern);
  if (!match) return null;
  const id = Number(match[1]);
  return Number.isFinite(id) ? id : null;
}

/** Extract invitation / request identifiers from a notification row. */
export function parseInvitationNotification(
  n: GraduationNotification,
): ParsedInvitationNotification {
  const event = n.eventType?.toLowerCase() ?? "";
  const category = n.category?.toLowerCase() ?? "";

  if (category === "chat") {
    if (event === "section_message" || event === "team_message") {
      return {
        kind: "course_update",
        invitationId: null,
        requestId: null,
        projectId: n.projectId,
        requiresPendingValidation: false,
      };
    }
    return {
      kind: "chat",
      invitationId: null,
      requestId: null,
      projectId: n.projectId,
      requiresPendingValidation: false,
    };
  }

  if (category === "company") {
    return {
      kind: "company_opportunity",
      invitationId: idFromDedup(n.dedupKey, /^company:invite(?:_cancel)?:(\d+):/),
      requestId: null,
      projectId: n.projectId,
      requiresPendingValidation: event === "company_request_invitation_received",
    };
  }

  if (category === "organization_event") {
    return {
      kind: "organization_event",
      invitationId: idFromDedup(n.dedupKey, /^organization_event:(\d+):/),
      requestId: null,
      projectId: n.projectId,
      requiresPendingValidation: false,
    };
  }

  if (category === "organization_recruitment") {
    return {
      kind: "organization_recruitment",
      invitationId: idFromDedup(n.dedupKey, /^recruitment:(?:accepted|rejected):(\d+):/),
      requestId: null,
      projectId: n.projectId,
      requiresPendingValidation: false,
    };
  }

  if (category === "graduation_project") {
    if (event === "project_created" || event.includes("project_update")) {
      return {
        kind: "project_update",
        invitationId: null,
        requestId: null,
        projectId: n.projectId,
        requiresPendingValidation: false,
      };
    }
    if (event === "invitation_received") {
      const invitationId = idFromDedup(n.dedupKey, /^gp:invite:(\d+):/);
      if (invitationId != null) {
        return {
          kind: "graduation_team_invitation",
          invitationId,
          requestId: null,
          projectId: n.projectId,
          requiresPendingValidation: true,
        };
      }
      return {
        kind: "other",
        invitationId: null,
        requestId: null,
        projectId: n.projectId,
        requiresPendingValidation: false,
      };
    }
    if (
      event === "invitation_accepted" ||
      event === "invitation_rejected" ||
      event === "invitation_cancelled_by_sender" ||
      event === "invitation_expired_after_acceptance"
    ) {
      return {
        kind: "graduation_team_response",
        invitationId: idFromDedup(n.dedupKey, /^gp:invite_(?:accept|reject|cancel|expired):(\d+):/),
        requestId: null,
        projectId: n.projectId,
        requiresPendingValidation: false,
      };
    }
    if (event === "supervision_request_received") {
      return {
        kind: "supervision_request",
        invitationId: null,
        requestId: idFromDedup(n.dedupKey, /^gp:supervisor_req:(\d+):/),
        projectId: n.projectId,
        requiresPendingValidation: true,
      };
    }
    if (
      event.includes("supervision_request") ||
      event.includes("supervisor") ||
      event.includes("supervision")
    ) {
      return {
        kind: "supervision_response",
        invitationId: null,
        requestId: idFromDedup(n.dedupKey, /^gp:supervisor_(?:accept|reject|auto_reject):(\d+):/),
        projectId: n.projectId,
        requiresPendingValidation: false,
      };
    }
    return {
      kind: "other",
      invitationId: null,
      requestId: null,
      projectId: n.projectId,
      requiresPendingValidation: false,
    };
  }

  if (category === "course") {
    if (
      event === "course_project_created" ||
      event === "course_project_updated" ||
      event === "course_project_deleted"
    ) {
      return {
        kind: "course_update",
        invitationId: null,
        requestId: null,
        projectId: n.projectId,
        requiresPendingValidation: false,
      };
    }
    if (event === "course_teammate_invitation_pending") {
      return {
        kind: "course_team_invitation",
        // Course invitations use the notification row id as invitationId (see GET /courses/team-invitations).
        invitationId: n.id,
        requestId: null,
        projectId: n.projectId,
        requiresPendingValidation: true,
      };
    }
    if (
      event === "course_teammate_invitation_accepted" ||
      event === "course_teammate_invitation_rejected"
    ) {
      return {
        kind: "course_team_response",
        invitationId: n.id,
        requestId: null,
        projectId: n.projectId,
        requiresPendingValidation: false,
      };
    }
    return {
      kind: "other",
      invitationId: null,
      requestId: null,
      projectId: n.projectId,
      requiresPendingValidation: false,
    };
  }

  return {
    kind: "other",
    invitationId: null,
    requestId: null,
    projectId: n.projectId,
    requiresPendingValidation: false,
  };
}

export function buildStudentInvitationRoute(
  n: GraduationNotification,
  parsed: ParsedInvitationNotification = parseInvitationNotification(n),
): string | null {
  if (parsed.kind === "chat") {
    const conversationId = conversationIdFromChatDedupKey(n.dedupKey);
    if (conversationId != null && Number.isFinite(conversationId)) {
      return studentMessageThreadPath(conversationId);
    }
    return ROUTES.studentMessages;
  }

  if (parsed.kind === "company_opportunity") {
    if (n.projectId != null) {
      return `${ROUTES.communicationHub}?focus=company-invitation&requestId=${n.projectId}`;
    }
    return ROUTES.communicationHub;
  }

  if (parsed.kind === "organization_event") {
    if (n.projectId != null) return ROUTES.organizationPublicProfile(n.projectId);
    return ROUTES.following;
  }

  if (parsed.kind === "organization_recruitment") {
    return ROUTES.following;
  }

  if (parsed.kind === "course_update") {
    if (n.projectId != null && n.eventType?.toLowerCase() === "section_message") {
      return studentCoursePath(n.projectId);
    }
    return ROUTES.studentCourses;
  }

  if (parsed.kind === "project_update") {
    return ROUTES.graduationProjectWorkspace;
  }

  if (parsed.kind === "graduation_team_invitation") {
    const entityId = parsed.invitationId ?? idFromDedup(n.dedupKey, /^gp:invite:(\d+):/);
    if (entityId != null) return studentGraduationInvitationPath(entityId);
    return null;
  }

  if (parsed.kind === "course_team_invitation") {
    const entityId = parsed.invitationId ?? n.id;
    if (entityId != null) return studentCourseInvitationPath(entityId);
    return ROUTES.dashboard;
  }

  if (parsed.kind === "graduation_team_response" || parsed.kind === "supervision_response") {
    return ROUTES.graduationProjectWorkspace;
  }

  if (n.category === "graduation_project") {
    return ROUTES.graduationProjectWorkspace;
  }

  if (n.category === "course" || n.category === "ai") {
    return ROUTES.dashboard;
  }

  return null;
}

export function buildDoctorInvitationRoute(
  n: GraduationNotification,
  parsed: ParsedInvitationNotification = parseInvitationNotification(n),
): string | null {
  if (parsed.kind === "chat") {
    const conversationId = conversationIdFromChatDedupKey(n.dedupKey);
    if (conversationId != null && Number.isFinite(conversationId)) {
      return doctorMessageThreadPath(conversationId);
    }
    return ROUTES.doctorMessages;
  }

  if (parsed.kind === "company_opportunity") {
    return ROUTES.doctorDashboard;
  }

  if (parsed.kind === "organization_event" || parsed.kind === "organization_recruitment") {
    return ROUTES.doctorDashboard;
  }

  if (parsed.kind === "course_update") {
    if (n.projectId != null && n.eventType?.toLowerCase() === "section_message") {
      return doctorCoursePath(n.projectId);
    }
    return ROUTES.doctorCourses;
  }

  if (parsed.kind === "project_update") {
    if (n.projectId != null) return doctorProjectPath(n.projectId);
    return ROUTES.doctorProjects;
  }

  if (parsed.kind === "supervision_request") {
    const requestId =
      parsed.requestId ?? idFromDedup(n.dedupKey, /^gp:supervisor_req:(\d+):/);
    if (requestId != null) return doctorSupervisionInvitationPath(requestId);
    return ROUTES.doctorRequests;
  }

  if (parsed.kind === "supervision_response") {
    return ROUTES.doctorRequests;
  }

  if (n.category === "graduation_project") {
    if (n.projectId != null) return doctorProjectPath(n.projectId);
    return ROUTES.doctorProjects;
  }

  if (n.category === "course") {
    return ROUTES.doctorCourses;
  }

  return null;
}

export function getStudentInvitationTargetLabel(
  n: GraduationNotification,
  parsed: ParsedInvitationNotification = parseInvitationNotification(n),
): string | null {
  const route = buildStudentInvitationRoute(n, parsed);
  if (!route) return null;
  switch (parsed.kind) {
    case "graduation_team_invitation":
      return "View invitation";
    case "course_team_invitation":
      return "View invitation";
    case "graduation_team_response":
    case "supervision_response":
      return "Open workspace";
    case "chat":
      return route.includes("/messages/") ? "Open chat" : "Messages";
    case "company_opportunity":
      return "View opportunity";
    case "organization_event":
      return "View organization";
    case "organization_recruitment":
      return "View following";
    case "course_update":
      return "Open courses";
    case "project_update":
      return "Open workspace";
    default:
      return "View";
  }
}

export function getDoctorInvitationTargetLabel(
  n: GraduationNotification,
  parsed: ParsedInvitationNotification = parseInvitationNotification(n),
): string | null {
  const route = buildDoctorInvitationRoute(n, parsed);
  if (!route) return null;
  switch (parsed.kind) {
    case "supervision_request":
      return "View invitation";
    case "supervision_response":
      return "View requests";
    case "chat":
      return route.includes("/messages/") ? "Open chat" : "Messages";
    case "course_update":
      return "Open courses";
    case "project_update":
      return "View project";
    default:
      return route.includes("/projects/") ? "View project" : "View";
  }
}
