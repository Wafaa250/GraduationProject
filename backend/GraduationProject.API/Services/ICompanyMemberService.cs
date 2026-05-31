using System.Collections.Generic;
using System.Threading.Tasks;
using GraduationProject.API.DTOs;

namespace GraduationProject.API.Services
{
    public interface ICompanyMemberService
    {
        Task<IReadOnlyList<CompanyMemberListItemDto>> ListAsync(int actingUserId);
        Task<(CompanyMemberListItemDto? result, string? error, bool credentialsEmailSent)> AddAsync(
            int actingUserId,
            AddCompanyMemberDto dto);
        Task<(bool success, string? error)> RemoveAsync(int actingUserId, int memberId);
    }
}
