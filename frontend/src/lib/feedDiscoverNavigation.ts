import type { FeedDiscoverMember, FeedSearchResultRow } from "@/api/feedApi";
import { ROUTES } from "@/routes/paths";

/** Profile route for a Communication Hub search result row. */
export function searchResultProfilePath(hit: FeedSearchResultRow): string {
  const type = hit.entityType.toLowerCase();
  switch (type) {
    case "student":
      return ROUTES.studentDirectoryProfile(hit.entityId);
    case "doctor":
      return ROUTES.doctorPublicProfile(hit.entityId);
    case "company":
      return hit.entityId > 0 ? ROUTES.companyPublicProfile(hit.entityId) : ROUTES.communicationHub;
    case "association":
      return ROUTES.organizationPublicProfile(hit.entityId);
    default: {
      const url = hit.url?.trim();
      if (url && url.startsWith("/")) return url;
      return ROUTES.communicationHub;
    }
  }
}

/** Maps feed discover/search members to existing app routes (no new backend). */
export function discoverMemberPath(
  member: FeedDiscoverMember,
  ids?: { studentUserId?: number; doctorUserId?: number },
): string {
  switch (member.entityType) {
    case "student":
      if (ids?.studentUserId) return ROUTES.studentDirectoryProfile(ids.studentUserId);
      return ROUTES.browseProjects;
    case "doctor":
      if (ids?.doctorUserId) return ROUTES.doctorPublicProfile(ids.doctorUserId);
      return ROUTES.communicationHub;
    case "company":
      return member.entityId > 0
        ? ROUTES.companyPublicProfile(member.entityId)
        : ROUTES.communicationHub;
    case "association":
      return ROUTES.organizationPublicProfile(member.entityId);
    default:
      return ROUTES.communicationHub;
  }
}
