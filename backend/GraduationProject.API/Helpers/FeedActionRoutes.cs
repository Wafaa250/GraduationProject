namespace GraduationProject.API.Helpers
{
    /// <summary>Web app paths for Communication Hub feed CTAs (existing app routes).</summary>
    public static class FeedActionRoutes
    {
        public static string BrowseProjects(int? projectId = null, string? view = null)
        {
            if (projectId is null or <= 0) return "/browse-projects";
            var q = $"projectId={projectId.Value}";
            if (!string.IsNullOrWhiteSpace(view)) q += $"&view={view}";
            return $"/browse-projects?{q}";
        }

        public static string GraduationProjectWorkspace(int? projectId = null)
        {
            if (projectId is null or <= 0) return "/graduation-projects/workspace";
            return $"/graduation-projects/workspace?projectId={projectId.Value}";
        }

        public static string StudentCourseProject(int courseId, int projectId) =>
            $"/courses/{courseId}/projects/{projectId}";

        public static string StudentCourses() => "/courses";

        /// <summary>Association event details (OrganizationEventDetailsPage).</summary>
        public static string AssociationEvent(int eventId, int organizationProfileId)
        {
            return $"/association/events/{eventId}?orgId={organizationProfileId}";
        }

        /// <summary>Association recruitment campaign (OrganizationRecruitmentCampaignDetailsPage).</summary>
        public static string AssociationRecruitmentCampaign(
            int campaignId,
            int organizationProfileId,
            int? positionId = null)
        {
            var path = $"/association/recruitment/{campaignId}?orgId={organizationProfileId}";
            if (positionId is > 0) return $"{path}&positionId={positionId.Value}";
            return path;
        }

        public static string CompanyRequest(int companyRequestId, int companyProfileId) =>
            $"/opportunities/companies/{companyProfileId}/{companyRequestId}";

        public static string CompanyTalentRequest(int talentRequestId, int companyProfileId) =>
            $"/company/talent-requests/{talentRequestId}?companyId={companyProfileId}";
    }
}
