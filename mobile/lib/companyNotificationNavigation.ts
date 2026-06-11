import type { AppNotification } from "@/api/notificationsApi";
import { COMPANY_ROUTES } from "@/lib/companyRoutes";

/** Mirrors web `CompanyNotificationBell.resolveNotificationTarget`. */
export function getCompanyNotificationTarget(
  notification: Pick<AppNotification, "eventType" | "projectId">,
): string | null {
  const eventType = notification.eventType;
  const requestId = notification.projectId;

  if (
    eventType === "company_ai_recommendations_ready" ||
    eventType === "company_team_recommendations_ready"
  ) {
    return requestId ? COMPANY_ROUTES.requestRecommendations(requestId) : COMPANY_ROUTES.requests;
  }

  if (
    eventType === "company_student_recommendation_saved" ||
    eventType === "company_team_recommendation_saved"
  ) {
    return requestId ? COMPANY_ROUTES.requestRecommendations(requestId) : COMPANY_ROUTES.saved;
  }

  if (
    eventType === "company_request_paused" ||
    eventType === "company_request_reactivated" ||
    eventType === "company_request_closed"
  ) {
    return requestId ? COMPANY_ROUTES.requestDetail(requestId) : COMPANY_ROUTES.requests;
  }

  if (eventType === "company_member_added" || eventType === "company_member_removed") {
    return COMPANY_ROUTES.members;
  }

  return COMPANY_ROUTES.dashboard;
}

export function getCompanyNotificationTargetLabel(
  notification: Pick<AppNotification, "eventType" | "projectId">,
): string | null {
  const target = getCompanyNotificationTarget(notification);
  if (!target) return null;

  if (target.includes("/saved")) return "View saved";
  if (target.includes("/members")) return "View members";
  if (target.includes("/recommendations")) return "View recommendations";
  if (target.match(/\/requests\/\d+/)) return "View request";
  if (target.includes("/requests")) return "View requests";
  if (target.includes("/dashboard")) return "Dashboard";
  return "View";
}
