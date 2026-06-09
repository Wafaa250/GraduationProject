import type { GraduationNotification } from "@/api/notificationsApi";
import { DOCTOR_ROUTES, doctorCoursePath, doctorProjectPath } from "@/lib/doctorRoutes";

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
      return {
        kind: "graduation_team_invitation",
        invitationId: idFromDedup(n.dedupKey, /^gp:invite:(\d+):/),
        requestId: null,
        projectId: n.projectId,
        requiresPendingValidation: true,
      };
    }
    if (event === "invitation_rejected" || event === "invitation_cancelled_by_sender") {
      return {
        kind: "graduation_team_response",
        invitationId: idFromDedup(n.dedupKey, /^gp:invite_(?:reject|cancel|expired):(\d+):/),
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
    if (event.includes("supervision") || event.includes("supervisor")) {
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

  if (
    category === "course" &&
    (event === "course_project_created" ||
      event === "course_project_updated" ||
      event === "course_project_deleted")
  ) {
    return {
      kind: "course_update",
      invitationId: null,
      requestId: null,
      projectId: n.projectId,
      requiresPendingValidation: false,
    };
  }

  if (category === "course" && event === "course_teammate_invitation_pending") {
    return {
      kind: "course_team_invitation",
      invitationId: n.id,
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

export function buildStudentInvitationRoute(
  n: GraduationNotification,
  parsed: ParsedInvitationNotification = parseInvitationNotification(n),
): string | null {
  if (parsed.kind === "chat") {
    const conversationId = conversationIdFromChatDedupKey(n.dedupKey);
    if (conversationId != null && Number.isFinite(conversationId)) {
      return `/messages/${conversationId}`;
    }
    return "/messages";
  }

  if (parsed.kind === "company_opportunity") {
    return n.projectId != null ? `/feed?focus=company-invitation&requestId=${n.projectId}` : "/feed";
  }
  if (parsed.kind === "organization_event" && n.projectId != null) {
    return `/organizations/${n.projectId}`;
  }
  if (parsed.kind === "organization_recruitment") {
    return "/following";
  }
  if (parsed.kind === "course_update") {
    if (n.projectId != null && n.eventType?.toLowerCase() === "section_message") {
      return `/courses/${n.projectId}`;
    }
    return "/courses";
  }
  if (parsed.kind === "project_update") {
    return "/graduation-projects/workspace";
  }

  if (parsed.kind === "graduation_team_invitation") {
    const params = new URLSearchParams({ focus: "graduation-invitation" });
    if (parsed.invitationId != null) params.set("invitationId", String(parsed.invitationId));
    return `/dashboard?${params.toString()}`;
  }

  if (parsed.kind === "course_team_invitation") {
    const params = new URLSearchParams({ focus: "course-invitation" });
    if (parsed.invitationId != null) params.set("invitationId", String(parsed.invitationId));
    return `/dashboard?${params.toString()}`;
  }

  if (n.category === "graduation_project") {
    return "/graduation-projects/workspace";
  }

  if (n.category === "course" || n.category === "ai") {
    return "/dashboard";
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
      return `/doctor/messages/${conversationId}`;
    }
    return DOCTOR_ROUTES.messages;
  }

  if (parsed.kind === "course_update") {
    if (n.projectId != null && n.eventType?.toLowerCase() === "section_message") {
      return doctorCoursePath(n.projectId);
    }
    return DOCTOR_ROUTES.courses;
  }
  if (parsed.kind === "project_update") {
    return n.projectId != null ? doctorProjectPath(n.projectId) : DOCTOR_ROUTES.projects;
  }

  if (parsed.kind === "supervision_request" || parsed.kind === "supervision_response") {
    const params = new URLSearchParams();
    if (parsed.requestId != null) params.set("requestId", String(parsed.requestId));
    const qs = params.toString();
    return qs ? `${DOCTOR_ROUTES.requests}?${qs}` : DOCTOR_ROUTES.requests;
  }

  if (n.category === "graduation_project" && n.projectId != null) {
    return doctorProjectPath(n.projectId);
  }

  if (n.category === "graduation_project") {
    return DOCTOR_ROUTES.projects;
  }

  if (n.category === "course" || n.category === "ai") {
    return DOCTOR_ROUTES.courses;
  }

  return null;
}
