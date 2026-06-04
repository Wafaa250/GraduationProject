namespace GraduationProject.API.Helpers
{
    public static class FeedPostSourceTypes
    {
        public const string AssociationEvent = "association_event";
        public const string AssociationRecruitment = "association_recruitment";
        public const string CompanyOpportunity = "company_opportunity";
        public const string CompanyTalentRequest = "company_talent_request";
        public const string AssociationRecruitmentPosition = "association_recruitment_position";
        public const string DoctorCourseProject = "doctor_course_project";
        public const string DoctorAnnouncement = "doctor_announcement";
        public const string DoctorProject = "doctor_project";
        public const string StudentCollaboration = "student_collaboration";
    }

    public static class FeedAuthorTypes
    {
        public const string Association = "association";
        public const string Company = "company";
        public const string Doctor = "doctor";
        public const string Student = "student";
    }

    public static class FeedEngagementTypes
    {
        public const string Like = "like";
        public const string Save = "save";
    }

    public static class FeedPostKeyHelper
    {
        public static string Build(string sourceType, int entityId) => $"{sourceType}:{entityId}";

        public static bool TryParse(string postKey, out string sourceType, out int entityId)
        {
            sourceType = string.Empty;
            entityId = 0;
            if (string.IsNullOrWhiteSpace(postKey)) return false;

            var idx = postKey.LastIndexOf(':');
            if (idx <= 0 || idx >= postKey.Length - 1) return false;

            sourceType = postKey[..idx];
            return int.TryParse(postKey[(idx + 1)..], out entityId);
        }
    }
}
