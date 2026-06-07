import type { FeedRecommendedItem, FeedSearchResultRow } from "@/api/feedApi";
import { feedRecommendedProfilePath } from "@/lib/feedRecommendedNavigation";
import { searchResultProfilePath } from "@/lib/feedDiscoverNavigation";

/** Unified public profile route for Communication Hub entry points. */
export function hubPublicProfilePath(entityType: string, userId?: number, entityId?: number): string {
  const type = entityType.toLowerCase();
  switch (type) {
    case "student":
      return userId && userId > 0 ? `/students/${userId}` : "/feed";
    case "doctor":
      return userId && userId > 0 ? `/doctors/${userId}` : "/feed";
    case "company":
      return entityId && entityId > 0 ? `/companies/${entityId}` : "/feed";
    case "association":
      return entityId && entityId > 0 ? `/organizations/${entityId}` : "/feed";
    default:
      return "/feed";
  }
}

export function hubRecommendedProfilePath(item: FeedRecommendedItem): string {
  return feedRecommendedProfilePath(item);
}

export function hubSearchProfilePath(row: FeedSearchResultRow): string {
  return row.url?.trim() || searchResultProfilePath(row);
}

export function hubStudentProfilePath(userId: number): string {
  return `/students/${userId}`;
}

export function hubDoctorProfilePath(userId: number): string {
  return `/doctors/${userId}`;
}

export function hubCompanyProfilePath(companyProfileId: number): string {
  return `/companies/${companyProfileId}`;
}

export function hubOrganizationProfilePath(organizationId: number): string {
  return `/organizations/${organizationId}`;
}
