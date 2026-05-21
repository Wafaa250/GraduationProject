import {
  ORGANIZATION_EVENT_CATEGORY,
  ORGANIZATION_RECRUITMENT_CATEGORY,
  type GraduationNotificationDto,
} from "../../../api/notificationsApi";

/** Web route for a notification row click (student shell). */
export function getStudentNotificationPath(n: GraduationNotificationDto): string {
  const cat = (n.category ?? "").trim().toLowerCase();
  const et = (n.eventType ?? "").trim().toLowerCase();

  if (cat === "chat") return "/messages";

  if (et === "section_message" && n.projectId) {
    return `/student/courses/${n.projectId}?tab=chat`;
  }
  if (et === "team_message" && n.projectId) {
    return `/student/team/${n.projectId}`;
  }

  if (cat === ORGANIZATION_EVENT_CATEGORY && n.projectId != null) {
    return `/organizations/${n.projectId}`;
  }

  if (cat === ORGANIZATION_RECRUITMENT_CATEGORY) {
    return "/communities/recruitment";
  }

  if (
    cat === "course" &&
    (et === "course_teammate_invitation_pending" ||
      et.startsWith("course_teammate_invitation"))
  ) {
    return "/student/team-invitations";
  }

  if (et.includes("invitation") || et === "invitation_received") {
    return "/student/team-invitations";
  }

  if (cat === "course") {
    if (n.projectId) return `/student/courses/${n.projectId}`;
    return "/student/courses";
  }

  if (
    et.includes("supervision") ||
    et.includes("supervisor") ||
    cat === "graduation_project"
  ) {
    return "/dashboard";
  }

  return "/dashboard";
}
