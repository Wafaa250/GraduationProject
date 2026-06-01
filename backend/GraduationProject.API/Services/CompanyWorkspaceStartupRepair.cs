using GraduationProject.API.Data;
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
        }
    }
}
