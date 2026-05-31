using GraduationProject.API.Models;

namespace GraduationProject.API.Services
{
    public class CompanyWorkspaceContext
    {
        public CompanyProfile Profile { get; init; } = null!;
        public CompanyMember Member { get; init; } = null!;
        public string Role => Member.Role;
        public bool IsOwner => Member.Role == CompanyMemberRoles.Owner;
    }

    public interface ICompanyWorkspaceService
    {
        Task<CompanyWorkspaceContext?> GetWorkspaceAsync(int userId);
    }
}
