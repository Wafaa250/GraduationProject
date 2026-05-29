using System.Collections.Generic;
using System.Threading.Tasks;
using GraduationProject.API.DTOs;

namespace GraduationProject.API.Services
{
    public interface ICompanyRequestInvitationService
    {
        Task<CompanyRequestInvitationDetailDto> CreateAsync(
            int companyProfileId,
            int invitedByUserId,
            int requestId,
            CreateCompanyRequestInvitationDto dto);

        Task<IReadOnlyList<CompanyRequestInvitationSummaryDto>> ListByRequestAsync(
            int companyProfileId,
            int requestId);

        Task<IReadOnlyList<CompanyRequestInvitationSummaryDto>> ListCompanyInvitationsAsync(int companyProfileId);

        Task<CompanyRequestInvitationDetailDto?> CancelAsync(
            int companyProfileId,
            int requestId,
            int invitationId);

        Task<IReadOnlyList<CompanyRequestInvitationSummaryDto>> ListStudentInvitationsAsync(int studentProfileId);

        Task<CompanyRequestInvitationDetailDto?> GetStudentInvitationByIdAsync(int studentProfileId, int invitationId);

        Task<CompanyRequestInvitationDetailDto?> AcceptAsync(int studentProfileId, int invitationId);

        Task<CompanyRequestInvitationDetailDto?> RejectAsync(int studentProfileId, int invitationId);
    }
}
