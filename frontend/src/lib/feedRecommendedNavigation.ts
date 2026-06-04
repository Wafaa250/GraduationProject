import type { FeedRecommendedItem } from "@/api/feedApi";
import { ROUTES } from "@/routes/paths";

export function feedRecommendedProfilePath(item: FeedRecommendedItem): string {
  const fromApi = item.profileUrl?.trim();
  if (fromApi) return fromApi;

  switch (item.type) {
    case "student":
      return ROUTES.studentDirectoryProfile(item.userId ?? item.entityId);
    case "doctor":
      return ROUTES.doctorPublicProfile(item.userId ?? item.entityId);
    case "company":
      return item.entityId > 0 ? ROUTES.companyPublicProfile(item.entityId) : ROUTES.communicationHub;
    case "association":
      return ROUTES.organizationPublicProfile(item.entityId);
    default:
      return ROUTES.communicationHub;
  }
}

export function feedRecommendedRoleLabel(type: FeedRecommendedItem["type"]): string {
  switch (type) {
    case "student":
      return "Student";
    case "doctor":
      return "Doctor";
    case "company":
      return "Company";
    case "association":
      return "Association";
    default:
      return "Member";
  }
}

/** Uppercase badge label for recommendation cards. */
export function feedRecommendedRoleBadgeLabel(type: FeedRecommendedItem["type"]): string {
  return feedRecommendedRoleLabel(type).toUpperCase();
}

/** View profile for all recommendation types when a stable public target exists. */
export function feedRecommendedShowsViewProfile(item: FeedRecommendedItem): boolean {
  switch (item.type) {
    case "student":
    case "doctor":
      return (item.userId ?? 0) > 0;
    case "company":
    case "association":
      return item.entityId > 0;
    default:
      return false;
  }
}

export function feedRecommendedShowsFollow(type: FeedRecommendedItem["type"]): boolean {
  return type === "company" || type === "association";
}
