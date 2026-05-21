import type { LucideIcon } from "lucide-react";
import {
  BellRing,
  BookOpen,
  CheckCircle2,
  Crown,
  FolderPlus,
  GraduationCap,
  Megaphone,
  MessageCircle,
  PencilLine,
  Sparkles,
  Trash2,
  UserMinus,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";

import type { GraduationNotificationDto } from "../../../api/notificationsApi";

/** Visual groups for filled notification icon badges. */
export type NotificationVisualKind =
  | "message"
  | "team"
  | "ai"
  | "course"
  | "supervisor"
  | "organization"
  | "warning"
  | "default";

export type NotificationPresentation = {
  kind: NotificationVisualKind;
  Icon: LucideIcon;
  /** CSS classes: notify-badge-base + variant (design-utilities.css) */
  tone: string;
};

const badge = (variant: string) => `notify-badge-base ${variant}`;

export const notificationToneByKind: Record<NotificationVisualKind, string> = {
  message: badge("notify-badge-message"),
  team: badge("notify-badge-team"),
  ai: badge("notify-badge-ai"),
  course: badge("notify-badge-course"),
  supervisor: badge("notify-badge-supervisor"),
  organization: badge("notify-badge-organization"),
  warning: badge("notify-badge-danger"),
  default: badge("notify-badge-message"),
};

/**
 * Exhaustive map of backend `event_type` values
 * (see GraduationProjectNotificationService + CoursesController).
 */
const presentationByEventType: Record<string, NotificationPresentation> = {
  // —— graduation_project ——
  project_created: { kind: "ai", Icon: Sparkles, tone: notificationToneByKind.ai },
  project_updated: { kind: "course", Icon: PencilLine, tone: notificationToneByKind.course },
  project_deleted: { kind: "warning", Icon: Trash2, tone: notificationToneByKind.warning },

  member_joined: { kind: "team", Icon: UserPlus, tone: notificationToneByKind.team },
  member_left: { kind: "warning", Icon: UserMinus, tone: notificationToneByKind.warning },
  member_removed_self: { kind: "warning", Icon: UserMinus, tone: notificationToneByKind.warning },
  member_removed_team: { kind: "warning", Icon: UserMinus, tone: notificationToneByKind.warning },

  leader_changed_new: { kind: "team", Icon: Crown, tone: notificationToneByKind.team },
  leader_changed_old: { kind: "team", Icon: Crown, tone: notificationToneByKind.team },
  leader_changed_members: { kind: "team", Icon: Crown, tone: notificationToneByKind.team },

  invitation_received: { kind: "team", Icon: UserPlus, tone: notificationToneByKind.team },
  invitation_rejected: { kind: "warning", Icon: XCircle, tone: notificationToneByKind.warning },
  invitation_cancelled_by_sender: { kind: "warning", Icon: XCircle, tone: notificationToneByKind.warning },
  invitation_expired_after_acceptance: {
    kind: "warning",
    Icon: BellRing,
    tone: notificationToneByKind.warning,
  },

  supervision_request_received: {
    kind: "supervisor",
    Icon: GraduationCap,
    tone: notificationToneByKind.supervisor,
  },
  supervision_request_accepted: {
    kind: "supervisor",
    Icon: CheckCircle2,
    tone: notificationToneByKind.supervisor,
  },
  supervision_request_rejected: {
    kind: "warning",
    Icon: XCircle,
    tone: notificationToneByKind.warning,
  },
  supervision_request_auto_rejected: {
    kind: "warning",
    Icon: BellRing,
    tone: notificationToneByKind.warning,
  },
  supervisor_cancellation_requested: {
    kind: "supervisor",
    Icon: GraduationCap,
    tone: notificationToneByKind.supervisor,
  },
  supervisor_cancellation_accepted: {
    kind: "supervisor",
    Icon: CheckCircle2,
    tone: notificationToneByKind.supervisor,
  },
  supervisor_cancellation_rejected: {
    kind: "warning",
    Icon: XCircle,
    tone: notificationToneByKind.warning,
  },
  supervision_cancelled_by_doctor: {
    kind: "warning",
    Icon: XCircle,
    tone: notificationToneByKind.warning,
  },

  // —— chat ——
  direct_message: { kind: "message", Icon: MessageCircle, tone: notificationToneByKind.message },
  conversation_started: {
    kind: "message",
    Icon: MessageCircle,
    tone: notificationToneByKind.message,
  },
  section_message: { kind: "message", Icon: MessageCircle, tone: notificationToneByKind.message },
  team_message: { kind: "message", Icon: MessageCircle, tone: notificationToneByKind.message },

  // —— course ——
  course_project_created: {
    kind: "course",
    Icon: FolderPlus,
    tone: notificationToneByKind.course,
  },
  course_project_updated: { kind: "course", Icon: PencilLine, tone: notificationToneByKind.course },
  course_project_deleted: { kind: "warning", Icon: Trash2, tone: notificationToneByKind.warning },
  course_teams_generated: { kind: "team", Icon: Users, tone: notificationToneByKind.team },
  course_team_member_added_self: {
    kind: "team",
    Icon: UserPlus,
    tone: notificationToneByKind.team,
  },
  course_team_member_added_team: {
    kind: "team",
    Icon: UserPlus,
    tone: notificationToneByKind.team,
  },
  course_team_member_moved: { kind: "team", Icon: Users, tone: notificationToneByKind.team },
  course_team_member_removed_self: {
    kind: "warning",
    Icon: UserMinus,
    tone: notificationToneByKind.warning,
  },
  course_team_member_removed_team: {
    kind: "warning",
    Icon: UserMinus,
    tone: notificationToneByKind.warning,
  },
  course_section_enrollment_added: {
    kind: "course",
    Icon: BookOpen,
    tone: notificationToneByKind.course,
  },
  course_teammate_invitation_pending: {
    kind: "team",
    Icon: UserPlus,
    tone: notificationToneByKind.team,
  },
  course_teammate_invitation_accepted: {
    kind: "team",
    Icon: CheckCircle2,
    tone: notificationToneByKind.team,
  },
  course_teammate_invitation_rejected: {
    kind: "warning",
    Icon: XCircle,
    tone: notificationToneByKind.warning,
  },

  // —— organization_event ——
  organization_event: {
    kind: "organization",
    Icon: Megaphone,
    tone: notificationToneByKind.organization,
  },

  // —— organization_recruitment ——
  recruitment_application_accepted: {
    kind: "organization",
    Icon: CheckCircle2,
    tone: notificationToneByKind.organization,
  },
  recruitment_application_rejected: {
    kind: "warning",
    Icon: XCircle,
    tone: notificationToneByKind.warning,
  },
};

const defaultPresentation: NotificationPresentation = {
  kind: "default",
  Icon: BellRing,
  tone: notificationToneByKind.default,
};

/** Resolve icon + filled badge colors for a notification row. */
export function getNotificationPresentation(
  n: GraduationNotificationDto,
): NotificationPresentation {
  const et = (n.eventType ?? "").trim().toLowerCase();
  if (et && presentationByEventType[et]) {
    return presentationByEventType[et];
  }

  const cat = (n.category ?? "").trim().toLowerCase();
  if (cat === "chat") {
    return presentationByEventType.direct_message;
  }
  if (cat === "organization_event") {
    return presentationByEventType.organization_event;
  }
  if (cat === "organization_recruitment") {
    return et.includes("reject")
      ? presentationByEventType.recruitment_application_rejected
      : presentationByEventType.recruitment_application_accepted;
  }
  if (cat === "course") {
    return { kind: "course", Icon: BookOpen, tone: notificationToneByKind.course };
  }
  if (cat === "graduation_project") {
    if (et.includes("invitation")) return presentationByEventType.invitation_received;
    if (et.includes("supervision") || et.includes("supervisor")) {
      return presentationByEventType.supervision_request_received;
    }
  }

  return defaultPresentation;
}

/** @deprecated Use getNotificationPresentation().kind */
export function getNotificationVisualKind(n: GraduationNotificationDto): NotificationVisualKind {
  return getNotificationPresentation(n).kind;
}

/** Compact timestamp for notification cards (e.g. "10M AGO"). */
export function formatNotificationTime(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return "NOW";
    if (mins < 60) return `${mins}M AGO`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}H AGO`;
    const days = Math.floor(hours / 24);
    if (days < 14) return `${days}D AGO`;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" }).toUpperCase();
  } catch {
    return "";
  }
}
