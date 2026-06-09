import type { GraduationNotification } from "@/api/notificationsApi";
import type { ParsedInvitationNotification } from "@/lib/notificationInvitationRouting";

export type InvitationTraceKind =
  | "graduation_team_invitation"
  | "course_team_invitation"
  | "supervision_request"
  | "other";

const TRACE_KINDS: InvitationTraceKind[] = [
  "graduation_team_invitation",
  "course_team_invitation",
  "supervision_request",
];

export function invitationEntityId(
  parsed: ParsedInvitationNotification,
  n: GraduationNotification,
): number | null {
  if (parsed.kind === "supervision_request") return parsed.requestId;
  if (parsed.kind === "course_team_invitation") return parsed.invitationId ?? n.id;
  if (parsed.kind === "graduation_team_invitation") return parsed.invitationId;
  return parsed.invitationId ?? parsed.requestId ?? n.id;
}

export function shouldTraceInvitationKind(kind: string): kind is InvitationTraceKind {
  return TRACE_KINDS.includes(kind as InvitationTraceKind);
}

export function logInvitationNotificationTrace(
  stage: string,
  n: GraduationNotification,
  parsed: ParsedInvitationNotification,
  extra?: Record<string, unknown>,
): void {
  if (!shouldTraceInvitationKind(parsed.kind)) return;

  const payload = {
    stage,
    notificationId: n.id,
    notificationType: parsed.kind,
    category: n.category,
    eventType: n.eventType,
    entityId: invitationEntityId(parsed, n),
    dedupKey: n.dedupKey ?? null,
    projectId: n.projectId,
    ...extra,
  };

  console.log("[NotificationInvitationTrace]", payload);
}
