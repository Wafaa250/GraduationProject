using GraduationProject.API.Data;
using GraduationProject.API.Helpers;
using GraduationProject.API.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace GraduationProject.API.Services
{
    /// <summary>
    /// One-time data repairs for company workspace membership gaps (owners, notification prefs).
    /// </summary>
    public static class CompanyWorkspaceStartupRepair
    {
        public static async Task RunAsync(ApplicationDbContext db, ILogger logger)
        {
            var ownerRepairs = await db.CompanyProfiles
                .AsNoTracking()
                .Where(cp => !db.CompanyMembers.Any(cm => cm.UserId == cp.UserId))
                .Select(cp => new { cp.Id, cp.UserId })
                .ToListAsync();

            foreach (var row in ownerRepairs)
            {
                db.CompanyMembers.Add(new CompanyMember
                {
                    UserId = row.UserId,
                    CompanyProfileId = row.Id,
                    Role = CompanyMemberRoles.Owner,
                    CreatedAt = DateTime.UtcNow,
                });
            }

            if (ownerRepairs.Count > 0)
            {
                await db.SaveChangesAsync();
                logger.LogInformation(
                    "Repaired {Count} missing owner company_members row(s) from company_profiles",
                    ownerRepairs.Count);
            }

            var prefRepairs = await db.CompanyMemberNotificationPreferences
                .AsNoTracking()
                .Where(p => !db.CompanyMembers.Any(cm => cm.UserId == p.UserId))
                .Select(p => new { p.UserId, p.CompanyProfileId })
                .ToListAsync();

            foreach (var row in prefRepairs)
            {
                db.CompanyMembers.Add(new CompanyMember
                {
                    UserId = row.UserId,
                    CompanyProfileId = row.CompanyProfileId,
                    Role = CompanyMemberRoles.Member,
                    CreatedAt = DateTime.UtcNow,
                });
            }

            if (prefRepairs.Count > 0)
            {
                await db.SaveChangesAsync();
                logger.LogInformation(
                    "Repaired {Count} missing member company_members row(s) from notification preferences",
                    prefRepairs.Count);
            }

            await MigrateLegacyInvitedMemberAccountRolesAsync(db, logger);
        }

        /// <summary>
        /// Invited employees were incorrectly given users.role = company. Real owners own a company_profiles row.
        /// </summary>
        private static async Task MigrateLegacyInvitedMemberAccountRolesAsync(
            ApplicationDbContext db,
            ILogger logger)
        {
            var rowsUpdated = await db.Database.ExecuteSqlInterpolatedAsync($"""
                UPDATE users AS u
                SET role = {UserRoles.CompanyMember}
                WHERE lower(btrim(u.role)) = {UserRoles.Company}
                  AND NOT EXISTS (
                    SELECT 1 FROM company_profiles AS cp WHERE cp.user_id = u.id
                  )
                  AND EXISTS (
                    SELECT 1 FROM company_members AS cm
                    WHERE cm.user_id = u.id
                      AND lower(btrim(cm.role)) = {CompanyMemberRoles.Member}
                  )
                  AND NOT EXISTS (
                    SELECT 1 FROM company_members AS cm_owner
                    WHERE cm_owner.user_id = u.id
                      AND lower(btrim(cm_owner.role)) = {CompanyMemberRoles.Owner}
                  )
                """);

            if (rowsUpdated > 0)
            {
                logger.LogInformation(
                    "Migrated {Count} legacy invited employee account(s) from company to companymember role",
                    rowsUpdated);
                return;
            }

            var ownerProfileUserIds = db.CompanyProfiles.AsNoTracking().Select(cp => cp.UserId);

            var efCandidates = await db.Users
                .Where(u =>
                    u.Role.ToLower() == UserRoles.Company &&
                    !ownerProfileUserIds.Contains(u.Id) &&
                    db.CompanyMembers.Any(cm =>
                        cm.UserId == u.Id &&
                        cm.Role.ToLower() == CompanyMemberRoles.Member) &&
                    !db.CompanyMembers.Any(cm =>
                        cm.UserId == u.Id &&
                        cm.Role.ToLower() == CompanyMemberRoles.Owner))
                .ToListAsync();

            if (efCandidates.Count == 0)
            {
                logger.LogDebug("No legacy invited company member account roles required migration");
                return;
            }

            foreach (var user in efCandidates)
                user.Role = UserRoles.CompanyMember;

            await db.SaveChangesAsync();
            logger.LogInformation(
                "Migrated {Count} legacy invited employee account(s) via EF fallback (company → companymember)",
                efCandidates.Count);
        }
    }
}
