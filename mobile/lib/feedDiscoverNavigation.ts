import type { FeedDiscoverMember, FeedSearchResultRow } from "@/api/feedApi";

/** Profile route for a Communication Hub search result row. */
export function searchResultProfilePath(hit: FeedSearchResultRow): string {
  const type = hit.entityType.toLowerCase();
  switch (type) {
    case "student":
      return `/students/${hit.userId ?? hit.entityId}`;
    case "doctor":
      return `/doctors/${hit.userId ?? hit.entityId}`;
    case "company":
      return hit.entityId > 0 ? `/companies/${hit.entityId}` : "/feed";
    case "association":
      return `/organizations/${hit.entityId}`;
    default: {
      const url = hit.url?.trim();
      if (url && url.startsWith("/")) return url;
      return "/feed";
    }
  }
}

export function discoverMemberPath(
  member: FeedDiscoverMember,
  ids?: { studentUserId?: number; doctorUserId?: number },
): string {
  switch (member.entityType) {
    case "student":
      if (ids?.studentUserId) return `/students/${ids.studentUserId}`;
      return "/feed";
    case "doctor":
      if (ids?.doctorUserId) return `/doctors/${ids.doctorUserId}`;
      return "/feed";
    case "company":
      return member.entityId > 0 ? `/companies/${member.entityId}` : "/feed";
    case "association":
      return `/organizations/${member.entityId}`;
    default:
      return "/feed";
  }
}

export function searchRowCanMessage(row: FeedSearchResultRow): boolean {
  const type = row.entityType.toLowerCase();
  if (type !== "student" && type !== "doctor") return false;
  return (row.userId ?? row.entityId) > 0;
}

export function searchRowCanFollow(row: FeedSearchResultRow): boolean {
  const type = row.entityType.toLowerCase();
  if (type !== "company" && type !== "association") return false;
  return row.entityId > 0 && row.followable !== false;
}

export function searchRowMessageTargetUserId(row: FeedSearchResultRow): number {
  return row.userId ?? row.entityId;
}
