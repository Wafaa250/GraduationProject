import type { FeedRecommendedItem } from "@/api/feedApi";

export function feedRecommendedProfilePath(item: FeedRecommendedItem): string {
  switch (item.type) {
    case "student":
      return `/students/${item.userId ?? item.entityId}`;
    case "doctor":
      return `/doctors/${item.userId ?? item.entityId}`;
    case "company":
      return item.entityId > 0 ? `/companies/${item.entityId}` : "/feed";
    case "association":
      return `/organizations/${item.entityId}`;
    default:
      return "/feed";
  }
}

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

export function feedRecommendedShowsMessage(item: FeedRecommendedItem): boolean {
  return (
    (item.type === "student" || item.type === "doctor") &&
    item.canMessage &&
    (item.userId ?? 0) > 0
  );
}
