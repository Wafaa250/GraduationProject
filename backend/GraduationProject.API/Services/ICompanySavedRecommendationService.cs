using System.Threading.Tasks;
using GraduationProject.API.DTOs;

namespace GraduationProject.API.Services
{
    public interface ICompanySavedRecommendationService
    {
        Task<CompanySavedRecommendationsPageDto> ListAllAsync(int companyProfileId);
        Task<CompanySavedRecommendationIdsDto> GetSavedIdsForRequestAsync(int companyProfileId, int requestId);
        Task<(bool saved, string? error)> SaveStudentAsync(
            int companyProfileId,
            int requestId,
            int studentProfileId,
            int savedByUserId);
        Task<(bool removed, string? error)> UnsaveStudentAsync(
            int companyProfileId,
            int requestId,
            int studentProfileId);
        Task<(bool saved, string? error)> SaveTeamAsync(
            int companyProfileId,
            int requestId,
            int teamRecommendationId,
            int savedByUserId);
        Task<(bool removed, string? error)> UnsaveTeamAsync(
            int companyProfileId,
            int requestId,
            int teamRecommendationId);
        Task<(bool updated, string? error)> UpdateStudentNoteAsync(
            int companyProfileId,
            int requestId,
            int studentProfileId,
            string? note,
            int? actingUserId = null);
        Task<(bool updated, string? error)> UpdateTeamNoteAsync(
            int companyProfileId,
            int requestId,
            int teamRecommendationId,
            string? note,
            int? actingUserId = null);
    }
}
