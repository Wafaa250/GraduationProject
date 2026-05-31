namespace GraduationProject.API.DTOs
{
    public class CompanySettingsDto
    {
        public CompanyNotificationPreferencesDto Notifications { get; set; } = new();
        public CompanyWorkspaceSummaryDto Workspace { get; set; } = new();
    }

    public class CompanyNotificationPreferencesDto
    {
        public bool NotifyAiRecommendations { get; set; } = true;
        public bool NotifySavedRecommendationsActivity { get; set; } = true;
        public bool NotifyRequestStatusUpdates { get; set; } = true;
        public bool NotifyWorkspaceMemberChanges { get; set; } = true;
    }

    public class UpdateCompanyNotificationPreferencesDto
    {
        public bool NotifyAiRecommendations { get; set; }
        public bool NotifySavedRecommendationsActivity { get; set; }
        public bool NotifyRequestStatusUpdates { get; set; }
        public bool NotifyWorkspaceMemberChanges { get; set; }
    }

    public class CompanyWorkspaceSummaryDto
    {
        public string OwnerName { get; set; } = string.Empty;
        public int MembersCount { get; set; }
        public int ActiveRequestsCount { get; set; }
    }
}
