using System.Collections.Generic;
using System.Threading.Tasks;
using GraduationProject.API.DTOs;

namespace GraduationProject.API.Services
{
    public interface IStudentRecommendationService
    {
        Task<FeedRecommendationsResponseDto> GetRecommendationsForUserAsync(int userId);

        Task<FeedRecommendationsResponseDto> GetRecommendationsForStudentAsync(int studentProfileId);

        Task<System.Collections.Generic.List<StudentRecommendedStudentDto>> GetSuggestedStudentsAsync(int studentProfileId);

        Task<System.Collections.Generic.List<StudentRecommendedDoctorDto>> GetSuggestedDoctorsAsync(int studentProfileId);

        Task<System.Collections.Generic.List<StudentRecommendedCompanyDto>> GetSuggestedCompaniesAsync(int studentProfileId);

        Task<System.Collections.Generic.List<StudentRecommendedAssociationDto>> GetSuggestedAssociationsAsync(
            int studentProfileId);

        Task<FeedRecommendedResponseDto> GetUnifiedRecommendedForUserAsync(
            int userId,
            int? rotationTick = null,
            IReadOnlyList<string>? excludeIds = null);

        Task<StudentAiMatchStatusDto> GetAiMatchStatusForUserAsync(int userId);
    }
}
