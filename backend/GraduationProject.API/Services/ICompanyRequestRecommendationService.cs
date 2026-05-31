using System.Threading.Tasks;
using GraduationProject.API.DTOs;

namespace GraduationProject.API.Services
{
    public interface ICompanyRequestRecommendationService
    {
        Task<CompanyRequestRecommendationResultDto> GenerateAsync(
            int companyProfileId,
            int requestId,
            CompanyRequestRecommendationGenerateDto dto);

        Task<CompanyRequestRecommendationResultDto> RegenerateAsync(
            int companyProfileId,
            int requestId,
            CompanyRequestRecommendationGenerateDto dto);

        Task<CompanyRequestRecommendationResultDto?> GetLatestAsync(int companyProfileId, int requestId);

        Task<CompanyRequestRecommendationRunHistoryDto?> ListRunsAsync(int companyProfileId, int requestId);
    }
}
