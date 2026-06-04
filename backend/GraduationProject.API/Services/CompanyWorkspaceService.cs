using GraduationProject.API.Data;
using GraduationProject.API.Helpers;
using GraduationProject.API.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace GraduationProject.API.Services
{
    public class CompanyWorkspaceService : ICompanyWorkspaceService
    {
        private readonly ApplicationDbContext _db;
        private readonly ILogger<CompanyWorkspaceService> _logger;

        public CompanyWorkspaceService(
            ApplicationDbContext db,
            ILogger<CompanyWorkspaceService> logger)
        {
            _db = db;
            _logger = logger;
        }

        public async Task<CompanyWorkspaceContext?> GetWorkspaceAsync(int userId)
        {
            var resolved = await ResolveWorkspaceAsync(userId);
            return resolved.Context;
        }

        public async Task<CompanyWorkspaceResolveResult> ResolveWorkspaceAsync(int userId, string? endpoint = null)
        {
            if (userId <= 0)
            {
                _logger.LogWarning(
                    "Company workspace resolve failed: invalid UserId={UserId} Endpoint={Endpoint} (missing or invalid JWT NameIdentifier claim)",
                    userId,
                    endpoint ?? "(unknown)");

                return new CompanyWorkspaceResolveResult
                {
                    UserId = userId,
                    FailureCode = "INVALID_SESSION",
                    UserFacingMessage = "Your session is invalid. Please sign in again.",
                    ResolutionPath = "invalid_user_id",
                };
            }

            var membership = await _db.CompanyMembers
                .Include(m => m.CompanyProfile)
                .ThenInclude(c => c.User)
                .FirstOrDefaultAsync(m => m.UserId == userId);

            if (membership != null)
            {
                if (membership.CompanyProfile == null)
                {
                    _logger.LogError(
                        "Company workspace resolve failed: orphan membership UserId={UserId} CompanyMemberId={MemberId} CompanyProfileId={CompanyProfileId}",
                        userId,
                        membership.Id,
                        membership.CompanyProfileId);

                    return new CompanyWorkspaceResolveResult
                    {
                        UserId = userId,
                        CompanyMemberId = membership.Id,
                        CompanyProfileId = membership.CompanyProfileId,
                        FailureCode = "COMPANY_PROFILE_MISSING",
                        UserFacingMessage =
                            "Your workspace membership points to a missing company profile. Contact support or ask your workspace owner to re-invite you.",
                        ResolutionPath = "orphan_membership",
                    };
                }

                _logger.LogDebug(
                    "Company workspace resolved via membership: UserId={UserId} CompanyProfileId={CompanyProfileId} CompanyMemberId={CompanyMemberId} Role={Role} Endpoint={Endpoint}",
                    userId,
                    membership.CompanyProfileId,
                    membership.Id,
                    membership.Role,
                    endpoint ?? "(unknown)");

                return await SuccessAsync(
                    membership.CompanyProfile,
                    membership,
                    "company_member");
            }

            var ownedProfile = await _db.CompanyProfiles
                .Include(c => c.User)
                .FirstOrDefaultAsync(c => c.UserId == userId);

            if (ownedProfile != null)
            {
                var ownerMember = await EnsureMembershipAsync(
                    ownedProfile,
                    userId,
                    CompanyMemberRoles.Owner);

                _logger.LogInformation(
                    "Company workspace resolved via owned profile (membership repaired if missing): UserId={UserId} CompanyProfileId={CompanyProfileId} CompanyMemberId={CompanyMemberId} Endpoint={Endpoint}",
                    userId,
                    ownedProfile.Id,
                    ownerMember.Id,
                    endpoint ?? "(unknown)");

                return await SuccessAsync(ownedProfile, ownerMember, "owned_profile_repaired");
            }

            var repairedFromPrefs = await TryRepairFromNotificationPreferencesAsync(userId, endpoint);
            if (repairedFromPrefs != null)
                return repairedFromPrefs;

            var user = await _db.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Id == userId);

            var dbRole = user?.Role ?? "(unknown)";
            var isCompanyAccount = UserRoles.IsCompanyWorkspaceAccount(dbRole);

            _logger.LogWarning(
                "Company workspace not found. UserId={UserId} DbRole={DbRole} Email={Email} HasCompanyProfile={HasProfile} HasCompanyMembership={HasMembership} Endpoint={Endpoint}",
                userId,
                dbRole,
                user?.Email ?? "(unknown)",
                false,
                false,
                endpoint ?? "(unknown)");

            if (!isCompanyAccount)
            {
                return new CompanyWorkspaceResolveResult
                {
                    UserId = userId,
                    UserRole = dbRole,
                    FailureCode = "NOT_COMPANY_ACCOUNT",
                    UserFacingMessage =
                        "This account is not configured as a company user. Sign in with a company account or contact support.",
                    ResolutionPath = "wrong_role",
                };
            }

            return new CompanyWorkspaceResolveResult
            {
                UserId = userId,
                UserRole = dbRole,
                FailureCode = "COMPANY_WORKSPACE_NOT_FOUND",
                UserFacingMessage =
                    "No company workspace is linked to this account. Complete company registration at sign-up, or ask your workspace owner to invite you using this email address.",
                ResolutionPath = "no_profile_or_membership",
            };
        }

        private async Task<CompanyWorkspaceResolveResult?> TryRepairFromNotificationPreferencesAsync(
            int userId,
            string? endpoint)
        {
            var pref = await _db.CompanyMemberNotificationPreferences
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.UserId == userId);

            if (pref == null)
                return null;

            var profile = await _db.CompanyProfiles
                .Include(c => c.User)
                .FirstOrDefaultAsync(c => c.Id == pref.CompanyProfileId);

            if (profile == null)
                return null;

            var member = await EnsureMembershipAsync(
                profile,
                userId,
                CompanyMemberRoles.Member);

            _logger.LogInformation(
                "Company workspace repaired from notification preferences: UserId={UserId} CompanyProfileId={CompanyProfileId} CompanyMemberId={CompanyMemberId} Endpoint={Endpoint}",
                userId,
                profile.Id,
                member.Id,
                endpoint ?? "(unknown)");

            return await SuccessAsync(profile, member, "notification_preferences_repaired");
        }

        private async Task<CompanyMember> EnsureMembershipAsync(
            CompanyProfile profile,
            int userId,
            string role)
        {
            var existing = await _db.CompanyMembers
                .FirstOrDefaultAsync(m => m.UserId == userId);

            if (existing != null)
                return existing;

            var member = new CompanyMember
            {
                UserId = userId,
                CompanyProfileId = profile.Id,
                Role = role,
                CreatedAt = DateTime.UtcNow,
            };

            _db.CompanyMembers.Add(member);
            await _db.SaveChangesAsync();
            return member;
        }

        private async Task<CompanyWorkspaceResolveResult> SuccessAsync(
            CompanyProfile profile,
            CompanyMember member,
            string resolutionPath)
        {
            var accountRole = await _db.Users
                .AsNoTracking()
                .Where(u => u.Id == member.UserId)
                .Select(u => u.Role)
                .FirstOrDefaultAsync() ?? UserRoles.Company;

            return new CompanyWorkspaceResolveResult
            {
                Context = new CompanyWorkspaceContext
                {
                    Profile = profile,
                    Member = member,
                },
                UserId = member.UserId,
                UserRole = accountRole,
                CompanyProfileId = profile.Id,
                CompanyMemberId = member.Id,
                ResolutionPath = resolutionPath,
            };
        }
    }
}
