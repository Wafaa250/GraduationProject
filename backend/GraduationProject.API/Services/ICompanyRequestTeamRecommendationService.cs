using GraduationProject.API.DTOs;

namespace GraduationProject.API.Services
{
    public interface ICompanyRequestTeamRecommendationService
    {
        Task<CompanyRequestTeamRecommendationResultDto> GenerateAsync(
            int companyProfileId,
            int requestId,
            GenerateCompanyRequestTeamRecommendationsDto dto);

        Task<CompanyRequestTeamRecommendationResultDto> RegenerateAsync(
            int companyProfileId,
            int requestId,
            GenerateCompanyRequestTeamRecommendationsDto dto);

        Task<CompanyRequestTeamRecommendationResultDto?> GetLatestAsync(int companyProfileId, int requestId);

        Task<CompanyRequestTeamRecommendationRunHistoryDto?> ListRunsAsync(int companyProfileId, int requestId);
    }
}
