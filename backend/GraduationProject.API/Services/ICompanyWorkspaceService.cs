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

    public sealed class CompanyWorkspaceResolveResult
    {
        public CompanyWorkspaceContext? Context { get; init; }
        public bool Success => Context != null;
        public string? FailureCode { get; init; }
        public string UserFacingMessage { get; init; } = "Company workspace not found.";
        public int UserId { get; init; }
        public string? UserRole { get; init; }
        public int? CompanyProfileId { get; init; }
        public int? CompanyMemberId { get; init; }
        public string ResolutionPath { get; init; } = "none";
    }

    public interface ICompanyWorkspaceService
    {
        Task<CompanyWorkspaceContext?> GetWorkspaceAsync(int userId);

        Task<CompanyWorkspaceResolveResult> ResolveWorkspaceAsync(int userId, string? endpoint = null);
    }
}
