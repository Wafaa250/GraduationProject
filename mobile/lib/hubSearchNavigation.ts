import type { FeedSearchResultRow } from "@/api/feedApi";
import {
  searchResultProfilePath,
  searchRowCanFollow,
  searchRowCanMessage,
  searchRowMessageTargetUserId,
} from "@/lib/feedDiscoverNavigation";

export function hubSearchProfilePath(row: FeedSearchResultRow): string {
  return row.url?.trim() || searchResultProfilePath(row);
}

export function hubSearchShowsViewProfile(row: FeedSearchResultRow): boolean {
  const type = row.entityType.toLowerCase();
  if (type === "student" || type === "doctor") {
    return searchRowMessageTargetUserId(row) > 0;
  }
  if (type === "company" || type === "association") {
    return row.entityId > 0;
  }
  return false;
}

export { searchRowCanFollow, searchRowCanMessage, searchRowMessageTargetUserId };
