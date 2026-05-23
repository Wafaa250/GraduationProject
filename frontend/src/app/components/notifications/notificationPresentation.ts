import { formatDistanceToNow } from "date-fns";
import {
  BellRing,
  CheckCircle2,
  Crown,
  FolderPlus,
  GraduationCap,
  PencilLine,
  Trash2,
  UserMinus,
  UserPlus,
  Users,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import type { GraduationNotificationDto } from "../../../api/notificationsApi";

export function formatNotificationTimeSafe(iso: string): string {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true });
  } catch {
    return "";
  }
}

export function getNotificationEventAccent(eventType: string): {
  icon: LucideIcon;
  iconClass: string;
  bgClass: string;
} {
  switch (eventType) {
    case "project_created":
      return { icon: FolderPlus, iconClass: "text-teal-700", bgClass: "bg-teal-500/10" };
    case "project_updated":
      return { icon: PencilLine, iconClass: "text-indigo-700", bgClass: "bg-indigo-500/10" };
    case "project_deleted":
      return { icon: Trash2, iconClass: "text-red-700", bgClass: "bg-red-500/10" };
    case "member_joined":
      return { icon: UserPlus, iconClass: "text-sky-700", bgClass: "bg-sky-500/10" };
    case "member_left":
    case "member_removed_self":
    case "member_removed_team":
      return { icon: UserMinus, iconClass: "text-orange-700", bgClass: "bg-orange-500/10" };
    case "leader_changed_new":
    case "leader_changed_old":
    case "leader_changed_members":
      return { icon: Crown, iconClass: "text-amber-700", bgClass: "bg-amber-500/10" };
    case "invitation_received":
      return { icon: UserPlus, iconClass: "text-violet-700", bgClass: "bg-violet-500/10" };
    case "invitation_rejected":
    case "invitation_cancelled_by_sender":
      return { icon: XCircle, iconClass: "text-rose-700", bgClass: "bg-rose-500/10" };
    case "invitation_expired_after_acceptance":
      return { icon: BellRing, iconClass: "text-orange-800", bgClass: "bg-orange-500/10" };
    case "supervision_request_received":
    case "supervisor_cancellation_requested":
      return { icon: GraduationCap, iconClass: "text-violet-700", bgClass: "bg-violet-500/10" };
    case "supervision_request_accepted":
    case "supervisor_cancellation_accepted":
    case "supervision_cancelled_by_doctor":
      return { icon: CheckCircle2, iconClass: "text-emerald-700", bgClass: "bg-emerald-500/10" };
    case "supervision_request_rejected":
    case "supervisor_cancellation_rejected":
    case "supervision_request_auto_rejected":
      return { icon: XCircle, iconClass: "text-red-700", bgClass: "bg-red-500/10" };
    case "course_project_created":
      return { icon: FolderPlus, iconClass: "text-teal-700", bgClass: "bg-teal-500/10" };
    case "course_project_updated":
      return { icon: PencilLine, iconClass: "text-indigo-700", bgClass: "bg-indigo-500/10" };
    case "course_project_deleted":
      return { icon: Trash2, iconClass: "text-red-700", bgClass: "bg-red-500/10" };
    case "course_teams_generated":
      return { icon: Users, iconClass: "text-teal-700", bgClass: "bg-teal-500/10" };
    case "course_team_member_added_self":
    case "course_team_member_added_team":
      return { icon: UserPlus, iconClass: "text-sky-700", bgClass: "bg-sky-500/10" };
    case "course_team_member_removed_self":
    case "course_team_member_removed_team":
    case "course_team_member_moved":
      return { icon: UserMinus, iconClass: "text-orange-700", bgClass: "bg-orange-500/10" };
    case "course_section_enrollment_added":
      return { icon: GraduationCap, iconClass: "text-violet-700", bgClass: "bg-violet-500/10" };
    case "organization_event":
      return { icon: BellRing, iconClass: "text-amber-700", bgClass: "bg-amber-500/10" };
    default:
      return { icon: BellRing, iconClass: "text-muted-foreground", bgClass: "bg-muted" };
  }
}

export type NotificationFilterGroup = "all" | "supervision" | "teams" | "courses" | "graduation";

export const NOTIFICATION_FILTER_GROUPS: { id: NotificationFilterGroup; label: string }[] = [
  { id: "all", label: "All" },
  { id: "supervision", label: "Supervision" },
  { id: "teams", label: "Teams" },
  { id: "courses", label: "Courses" },
  { id: "graduation", label: "Graduation" },
];

export function notificationFilterGroup(n: GraduationNotificationDto): NotificationFilterGroup {
  const et = (n.eventType ?? "").toLowerCase();
  if (n.category === "course") {
    if (et.includes("team") || et.includes("teammate") || et === "course_teams_generated") {
      return "teams";
    }
    return "courses";
  }
  if (
    et.includes("supervisor") ||
    et.includes("supervision") ||
    et.startsWith("supervision_")
  ) {
    return "supervision";
  }
  return "graduation";
}

export function groupLabelForNotification(n: GraduationNotificationDto): string {
  const g = notificationFilterGroup(n);
  return NOTIFICATION_FILTER_GROUPS.find((x) => x.id === g)?.label ?? "Activity";
}

export function mergeNotificationLists(
  current: GraduationNotificationDto[],
  incoming: GraduationNotificationDto[],
): GraduationNotificationDto[] {
  const map = new Map<number, GraduationNotificationDto>();
  for (const item of current) map.set(item.id, item);
  for (const item of incoming) {
    const prev = map.get(item.id);
    map.set(item.id, prev ? { ...prev, ...item } : item);
  }
  return [...map.values()].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function navigateFromDoctorNotification(
  navigate: (path: string, options?: { state?: unknown }) => void,
  n: GraduationNotificationDto,
): void {
  const et = (n.eventType ?? "").toLowerCase();

  if (n.category === "course") {
    navigate("/doctor-dashboard?section=courses");
    return;
  }

  if (
    et.includes("supervision") ||
    et.includes("supervisor") ||
    et.startsWith("supervision_")
  ) {
    navigate("/doctor-dashboard?section=requests");
    return;
  }

  if (n.projectId != null && Number(n.projectId) > 0) {
    navigate(`/project/${n.projectId}`);
    return;
  }

  navigate("/doctor-dashboard?section=projects");
}
