using GraduationProject.API.Models;

namespace GraduationProject.API.Helpers
{
    public static class CompanyRequestHubVisibility
    {
        public static bool IsVisibleInCommunicationHub(CompanyRequest request) =>
            request.Status == CompanyRequestStatus.Submitted
            && request.Status != CompanyRequestStatus.Archived
            && request.RequestStatus == CompanyRequestLifecycleStatus.Active
            && request.IsPublishedToHub;

        public static bool CanPublishToHub(CompanyRequest request) =>
            request.Status != CompanyRequestStatus.Draft
            && request.Status != CompanyRequestStatus.Archived
            && request.RequestStatus == CompanyRequestLifecycleStatus.Active
            && !request.IsPublishedToHub;

        public static bool CanUnpublishFromHub(CompanyRequest request) =>
            request.IsPublishedToHub;
    }
}
