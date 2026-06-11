import { FEED_SOURCE_TYPES, type FeedItem } from "@/lib/feedTypes";
import { COMPANY_ROUTES } from "@/lib/companyRoutes";
import { DOCTOR_ROUTES } from "@/lib/doctorRoutes";
import { STUDENT_ROUTES, studentCourseProjectPath } from "@/lib/studentRoutes";

/** Resolve CTA path — prefers API actionUrl (built from real entity routes on the server). */
export function resolveFeedPostActionUrl(item: FeedItem): string {
  const fromApi = item.actionUrl?.trim();
  if (fromApi) {
    const mobile = convertWebPathToMobile(fromApi);
    if (mobile) return mobile;
  }

  const orgId = item.organizationProfileId ?? item.followEntityId ?? 0;
  const companyId = item.companyProfileId ?? item.followEntityId ?? 0;

  switch (item.relatedEntityType) {
    case FEED_SOURCE_TYPES.studentCollaboration: {
      const isGp = item.title.toLowerCase().includes("graduation project");
      if (isGp) {
        return `${STUDENT_ROUTES.graduationProjectWorkspace}?projectId=${item.relatedEntityId}`;
      }
      return `${STUDENT_ROUTES.dashboard}?projectId=${item.relatedEntityId}&view=team`;
    }
    case FEED_SOURCE_TYPES.doctorProject:
      return `/projects/${item.relatedEntityId}`;
    case FEED_SOURCE_TYPES.doctorCourseProject:
      return studentCourseProjectPath(
        Number(item.metadata.find((m) => m.label === "CourseId")?.value ?? 0) || 0,
        item.relatedEntityId,
      );
    case FEED_SOURCE_TYPES.doctorAnnouncement:
      return STUDENT_ROUTES.studentCourses;
    case FEED_SOURCE_TYPES.companyOpportunity:
      if (item.companyRequestId && companyId) {
        return companyOpportunityPath(companyId, item.companyRequestId);
      }
      return "/feed";
    case FEED_SOURCE_TYPES.companyTalentRequest:
      if (companyId && item.relatedEntityId) {
        return `/company/talent-requests/${item.relatedEntityId}?companyId=${companyId}`;
      }
      return "/feed";
    case FEED_SOURCE_TYPES.associationEvent:
      if (item.eventId && orgId) {
        return `${studentOrganizationEventPath(item.eventId)}?orgId=${orgId}`;
      }
      return "/feed";
    case FEED_SOURCE_TYPES.associationRecruitment:
      if (item.recruitmentCampaignId && orgId) {
        return `${studentRecruitmentCampaignPath(item.recruitmentCampaignId)}?orgId=${orgId}`;
      }
      return "/feed";
    case FEED_SOURCE_TYPES.studentPost:
      return `/students/${item.authorUserId ?? 0}`;
    case FEED_SOURCE_TYPES.doctorPost:
      return `/doctors/${item.authorUserId ?? 0}`;
    case FEED_SOURCE_TYPES.associationRecruitmentPosition:
      if (item.recruitmentCampaignId && orgId) {
        const base = `${studentRecruitmentCampaignPath(item.recruitmentCampaignId)}?orgId=${orgId}`;
        if (item.positionId) return `${base}&positionId=${item.positionId}`;
        return base;
      }
      return "/feed";
    default:
      return "/feed";
  }
}

export function companyOpportunityPath(companyProfileId: number, requestId: number): string {
  return `/opportunities/companies/${companyProfileId}/${requestId}`;
}

export function studentOrganizationEventPath(eventId: number): string {
  return `/events/${eventId}`;
}

export function studentRecruitmentCampaignPath(campaignId: number): string {
  return `/recruitment/${campaignId}`;
}

/** Map backend/web paths to expo-router paths when possible. */
export function convertWebPathToMobile(path: string): string | null {
  const trimmed = path.trim();
  if (!trimmed) return null;

  const [pathname, query = ""] = trimmed.split("?");
  const qs = query ? `?${query}` : "";

  const opportunityMatch = pathname.match(/^\/opportunities\/companies\/(\d+)\/(\d+)$/);
  if (opportunityMatch) {
    return `/opportunities/companies/${opportunityMatch[1]}/${opportunityMatch[2]}${qs}`;
  }

  const eventMatch = pathname.match(/^\/association\/events\/(\d+)$/);
  if (eventMatch) {
    return `/events/${eventMatch[1]}${qs}`;
  }

  const recruitmentMatch = pathname.match(/^\/association\/recruitment\/(\d+)$/);
  if (recruitmentMatch) {
    return `/recruitment/${recruitmentMatch[1]}${qs}`;
  }

  const talentMatch = pathname.match(/^\/company\/talent-requests\/(\d+)$/);
  if (talentMatch) {
    return `/company/talent-requests/${talentMatch[1]}${qs}`;
  }

  const companyStudentMatch = pathname.match(
    /^\/company\/requests\/(\d+)\/students\/(\d+)$/,
  );
  if (companyStudentMatch) {
    return COMPANY_ROUTES.studentDiscoveryProfile(
      Number(companyStudentMatch[1]),
      Number(companyStudentMatch[2]),
    );
  }

  const companyTeamMatch = pathname.match(/^\/company\/requests\/(\d+)\/teams\/(\d+)$/);
  if (companyTeamMatch) {
    return COMPANY_ROUTES.teamDiscoveryProfile(
      Number(companyTeamMatch[1]),
      Number(companyTeamMatch[2]),
    );
  }

  const companyRequestMatch = pathname.match(/^\/company\/requests\/(\d+)$/);
  if (companyRequestMatch) {
    return COMPANY_ROUTES.requestDetail(Number(companyRequestMatch[1]));
  }

  const doctorStudentMatch = pathname.match(/^\/doctor\/students\/(\d+)$/);
  if (doctorStudentMatch) {
    return `/doctor/students/${doctorStudentMatch[1]}${qs}`;
  }

  const studentProfileMatch = pathname.match(/^\/students\/profile\/(\d+)$/);
  if (studentProfileMatch) {
    return `/students/${studentProfileMatch[1]}${qs}`;
  }

  const organizationMatch = pathname.match(/^\/organizations\/(\d+)$/);
  if (organizationMatch) {
    return `/organizations/${organizationMatch[1]}${qs}`;
  }

  const companyProfileMatch = pathname.match(/^\/company\/profile\/(\d+)$/);
  if (companyProfileMatch) {
    return `/companies/${companyProfileMatch[1]}${qs}`;
  }

  const doctorProfileMatch = pathname.match(/^\/doctor\/profile\/(\d+)$/);
  if (doctorProfileMatch) {
    return `/doctors/${doctorProfileMatch[1]}${qs}`;
  }

  const doctorOwnProfile = pathname === "/doctor/profile";
  if (doctorOwnProfile) {
    return DOCTOR_ROUTES.profile;
  }

  const gradProjectMatch = pathname.match(/^\/graduation-projects\/(\d+)$/);
  if (gradProjectMatch) {
    return `${STUDENT_ROUTES.graduationProjectWorkspace}?projectId=${gradProjectMatch[1]}${qs ? `&${query}` : ""}`;
  }

  const gradBrowseStudentsMatch = pathname.match(/^\/graduation-projects\/browse-students$/);
  if (gradBrowseStudentsMatch) {
    const params = new URLSearchParams(query);
    const projectId = params.get("projectId");
    if (projectId && /^\d+$/.test(projectId)) {
      return `${STUDENT_ROUTES.browseProjectStudents}?projectId=${projectId}`;
    }
    return STUDENT_ROUTES.browseProjectStudents;
  }

  const doctorProjectChatMatch = pathname.match(/^\/doctor\/projects\/(\d+)\/chat$/);
  if (doctorProjectChatMatch) {
    return `/doctor/projects/chat/${doctorProjectChatMatch[1]}${qs}`;
  }

  if (pathname === "/doctor/courses/create") {
    return `${DOCTOR_ROUTES.courses}/create`;
  }

  const courseOnlyMatch = pathname.match(/^\/courses\/(\d+)$/);
  if (courseOnlyMatch) {
    return `/courses/${courseOnlyMatch[1]}${qs}`;
  }

  const courseProjectMatch = pathname.match(/^\/courses\/(\d+)\/projects\/(\d+)$/);
  if (courseProjectMatch) {
    return `/courses/${courseProjectMatch[1]}/projects/${courseProjectMatch[2]}${qs}`;
  }

  const browseMatch = pathname.match(/^\/browse-projects$/);
  if (browseMatch) {
    const params = new URLSearchParams(query);
    const projectId = params.get("projectId");
    if (projectId && /^\d+$/.test(projectId)) {
      return `/browse-projects?projectId=${projectId}`;
    }
    return "/browse-projects";
  }

  const projectMatch = pathname.match(/^\/projects\/(\d+)$/);
  if (projectMatch) {
    return `/projects/${projectMatch[1]}${qs}`;
  }

  if (
    pathname.startsWith("/projects/") ||
    pathname.startsWith("/students/") ||
    pathname.startsWith("/doctors/") ||
    pathname.startsWith("/companies/") ||
    pathname.startsWith("/organizations/") ||
    pathname.startsWith("/courses") ||
    pathname.startsWith("/graduation-projects/") ||
    pathname.startsWith("/messages/") ||
    pathname === "/feed" ||
    pathname === "/dashboard" ||
    pathname === "/profile"
  ) {
    return `${pathname}${qs}`;
  }

  return null;
}
