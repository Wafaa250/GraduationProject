using System;
using System.Threading.Tasks;
using GraduationProject.API.Data;
using GraduationProject.API.Models;

namespace GraduationProject.API.Services
{
    public class CompanyActivityService : ICompanyActivityService
    {
        private readonly ApplicationDbContext _db;

        public CompanyActivityService(ApplicationDbContext db) => _db = db;

        public async Task LogAsync(int companyProfileId, int userId, string activityType, string description)
        {
            _db.CompanyActivityLogs.Add(new CompanyActivityLog
            {
                CompanyProfileId = companyProfileId,
                UserId = userId,
                ActivityType = activityType,
                Description = description.Trim(),
                CreatedAt = DateTime.UtcNow,
            });
            await _db.SaveChangesAsync();
        }
    }
}
