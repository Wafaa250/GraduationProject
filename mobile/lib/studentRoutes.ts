/** Student route paths aligned with web ROUTES (paths.ts). */
export const STUDENT_ROUTES = {
  dashboard: "/dashboard",
  profile: "/profile",
  editProfile: "/edit-profile",
  following: "/following",
  studentCourses: "/courses",
  graduationProjectWorkspace: "/graduation-projects/workspace",
  createGraduationProject: "/graduation-projects/create",
  browseProjects: "/browse-projects",
} as const;

export function studentCoursePath(courseId: number): string {
  return `/courses/${courseId}`;
}

export function studentCourseProjectPath(courseId: number, projectId: number): string {
  return `/courses/${courseId}/projects/${projectId}`;
}

export function studentDirectoryProfilePath(userId: number): string {
  return `/students/${userId}`;
}

export function companyOpportunityDetailPath(companyProfileId: number, requestId: number): string {
  return `/opportunities/companies/${companyProfileId}/${requestId}`;
}

export function studentOrganizationEventDetailPath(eventId: number, orgId?: number): string {
  const base = `/events/${eventId}`;
  return orgId && orgId > 0 ? `${base}?orgId=${orgId}` : base;
}

export function studentRecruitmentCampaignDetailPath(
  campaignId: number,
  orgId?: number,
  positionId?: number,
): string {
  const params = new URLSearchParams();
  if (orgId && orgId > 0) params.set("orgId", String(orgId));
  if (positionId && positionId > 0) params.set("positionId", String(positionId));
  const qs = params.toString();
  return qs ? `/recruitment/${campaignId}?${qs}` : `/recruitment/${campaignId}`;
}
