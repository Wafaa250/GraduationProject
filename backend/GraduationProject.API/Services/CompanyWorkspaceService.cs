using GraduationProject.API.Data;
using GraduationProject.API.Models;
using Microsoft.EntityFrameworkCore;

namespace GraduationProject.API.Services
{
    public class CompanyWorkspaceService : ICompanyWorkspaceService
    {
        private readonly ApplicationDbContext _db;

        public CompanyWorkspaceService(ApplicationDbContext db) => _db = db;

        public async Task<CompanyWorkspaceContext?> GetWorkspaceAsync(int userId)
        {
            var membership = await _db.CompanyMembers
                .AsNoTracking()
                .Include(m => m.CompanyProfile)
                .ThenInclude(c => c.User)
                .FirstOrDefaultAsync(m => m.UserId == userId);

            if (membership != null)
            {
                return new CompanyWorkspaceContext
                {
                    Profile = membership.CompanyProfile,
                    Member = membership,
                };
            }

            var profile = await _db.CompanyProfiles
                .AsNoTracking()
                .Include(c => c.User)
                .FirstOrDefaultAsync(c => c.UserId == userId);

            if (profile == null)
                return null;

            return new CompanyWorkspaceContext
            {
                Profile = profile,
                Member = new CompanyMember
                {
                    UserId = userId,
                    CompanyProfileId = profile.Id,
                    Role = CompanyMemberRoles.Owner,
                },
            };
        }
    }
}
