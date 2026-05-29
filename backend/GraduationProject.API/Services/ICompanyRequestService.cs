using System.Collections.Generic;
using System.Threading.Tasks;
using GraduationProject.API.DTOs;

namespace GraduationProject.API.Services
{
    /// <summary>Company project requests (wizard). No AI matching in v1.</summary>
    public interface ICompanyRequestService
    {
        Task<CompanyRequestDetailDto?> GetDraftAsync(int companyProfileId);
        Task<CompanyRequestDetailDto> SaveDraftAsync(int companyProfileId, SaveCompanyRequestDraftDto dto, int? actingUserId = null);
        Task DeleteDraftAsync(int companyProfileId);

        Task<CompanyRequestDetailDto> SubmitAsync(int companyProfileId, CreateCompanyRequestDto dto, int? actingUserId = null);

        Task<IReadOnlyList<CompanyRequestSummaryDto>> ListAsync(
            int companyProfileId,
            bool includeDraft = false);

        Task<CompanyRequestDetailDto?> GetByIdAsync(int companyProfileId, int requestId);

        Task<CompanyRequestDetailDto?> UpdateStatusAsync(
            int companyProfileId,
            int requestId,
            string status,
            int? actingUserId = null);

        Task<CompanyRequestDetailDto?> UpdateAsync(
            int companyProfileId,
            int requestId,
            CreateCompanyRequestDto dto,
            int? actingUserId = null);

        Task<bool> DeleteAsync(int companyProfileId, int requestId);
    }
}
