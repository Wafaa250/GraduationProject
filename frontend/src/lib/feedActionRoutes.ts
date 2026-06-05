import { FEED_SOURCE_TYPES, type FeedItem } from "@/lib/feedTypes";
import {
  ASSOCIATION_ROUTES,
  COMPANY_ROUTES,
  ROUTES,
  studentCourseProjectPath,
} from "@/routes/paths";

/** Resolve CTA path — prefers API actionUrl (built from real entity routes on the server). */
export function resolveFeedPostActionUrl(item: FeedItem): string {
  const fromApi = item.actionUrl?.trim();
  if (fromApi) return fromApi;

  const orgId = item.organizationProfileId ?? item.followEntityId ?? 0;
  const companyId = item.companyProfileId ?? item.followEntityId ?? 0;

  switch (item.relatedEntityType) {
    case FEED_SOURCE_TYPES.studentCollaboration: {
      const isGp = item.title.toLowerCase().includes("graduation project");
      if (isGp) return `${ROUTES.graduationProjectWorkspace}?projectId=${item.relatedEntityId}`;
      return `${ROUTES.browseProjects}?projectId=${item.relatedEntityId}&view=team`;
    }
    case FEED_SOURCE_TYPES.doctorProject:
      return `${ROUTES.browseProjects}?projectId=${item.relatedEntityId}`;
    case FEED_SOURCE_TYPES.doctorCourseProject:
      return studentCourseProjectPath(
        Number(item.metadata.find((m) => m.label === "CourseId")?.value ?? 0) || 0,
        item.relatedEntityId,
      );
    case FEED_SOURCE_TYPES.doctorAnnouncement:
      return ROUTES.studentCourses;
    case FEED_SOURCE_TYPES.companyOpportunity:
      if (item.companyRequestId && companyId) {
        return ROUTES.companyOpportunityDetail(companyId, item.companyRequestId);
      }
      return ROUTES.communicationHub;
    case FEED_SOURCE_TYPES.companyTalentRequest:
      if (companyId && item.relatedEntityId) {
        return COMPANY_ROUTES.talentRequestDetail(item.relatedEntityId, companyId);
      }
      return COMPANY_ROUTES.requests;
    case FEED_SOURCE_TYPES.associationEvent:
      if (item.eventId && orgId) {
        return `${ASSOCIATION_ROUTES.eventDetail(item.eventId)}?orgId=${orgId}`;
      }
      return ASSOCIATION_ROUTES.events;
    case FEED_SOURCE_TYPES.associationRecruitment:
      if (item.recruitmentCampaignId && orgId) {
        return `${ASSOCIATION_ROUTES.recruitmentDetail(item.recruitmentCampaignId)}?orgId=${orgId}`;
      }
      return ASSOCIATION_ROUTES.recruitment;
    case FEED_SOURCE_TYPES.associationRecruitmentPosition:
      if (item.recruitmentCampaignId && orgId) {
        const base = `${ASSOCIATION_ROUTES.recruitmentDetail(item.recruitmentCampaignId)}?orgId=${orgId}`;
        if (item.positionId) return `${base}&positionId=${item.positionId}`;
        return base;
      }
      return ASSOCIATION_ROUTES.recruitment;
    default:
      return ROUTES.communicationHub;
  }
}
