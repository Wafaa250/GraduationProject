using System;
using System.Linq;
using System.Threading.Tasks;
using GraduationProject.API.Data;
using GraduationProject.API.Helpers;
using GraduationProject.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GraduationProject.API.Controllers
{
    [ApiController]
    [Route("api/companies")]
    [Authorize]
    public class CompanyDiscoveryController : ControllerBase
    {
        private readonly ApplicationDbContext _db;

        public CompanyDiscoveryController(ApplicationDbContext db) => _db = db;

        [HttpGet("public")]
        public async Task<IActionResult> ListPublic()
        {
            var studentProfileId = await GetCurrentStudentProfileIdAsync();
            var followingIds = studentProfileId.HasValue
                ? await _db.CompanyFollows.AsNoTracking()
                    .Where(f => f.StudentProfileId == studentProfileId.Value)
                    .Select(f => f.CompanyProfileId)
                    .ToListAsync()
                : new System.Collections.Generic.List<int>();

            var followingSet = followingIds.ToHashSet();

            var items = await _db.CompanyProfiles.AsNoTracking()
                .OrderBy(c => c.CompanyName)
                .Select(c => new
                {
                    id = c.Id,
                    companyName = c.CompanyName,
                    industry = c.Industry,
                    description = c.Description,
                    isFollowing = studentProfileId.HasValue && followingSet.Contains(c.Id),
                })
                .ToListAsync();

            return Ok(items);
        }

        [HttpGet("{companyProfileId:int}/follow-status")]
        [Authorize(Roles = "student")]
        public async Task<IActionResult> GetFollowStatus(int companyProfileId)
        {
            var studentProfileId = await RequireStudentProfileIdAsync();
            if (!studentProfileId.HasValue) return Forbid();

            var isFollowing = await _db.CompanyFollows.AsNoTracking()
                .AnyAsync(f =>
                    f.CompanyProfileId == companyProfileId
                    && f.StudentProfileId == studentProfileId.Value);

            return Ok(new { isFollowing });
        }

        [HttpPost("{companyProfileId:int}/follow")]
        [Authorize(Roles = "student")]
        public async Task<IActionResult> Follow(int companyProfileId)
        {
            var studentProfileId = await RequireStudentProfileIdAsync();
            if (!studentProfileId.HasValue) return Forbid();

            var exists = await _db.CompanyProfiles.AsNoTracking()
                .AnyAsync(c => c.Id == companyProfileId);
            if (!exists) return NotFound(new { message = "Company not found." });

            var duplicate = await _db.CompanyFollows.AnyAsync(f =>
                f.CompanyProfileId == companyProfileId && f.StudentProfileId == studentProfileId.Value);
            if (duplicate)
                return Ok(new { message = "Already following.", isFollowing = true });

            _db.CompanyFollows.Add(new CompanyFollow
            {
                CompanyProfileId = companyProfileId,
                StudentProfileId = studentProfileId.Value,
                FollowedAt = DateTime.UtcNow,
            });
            await _db.SaveChangesAsync();

            return Ok(new { message = "You are now following this company.", isFollowing = true });
        }

        [HttpDelete("{companyProfileId:int}/follow")]
        [Authorize(Roles = "student")]
        public async Task<IActionResult> Unfollow(int companyProfileId)
        {
            var studentProfileId = await RequireStudentProfileIdAsync();
            if (!studentProfileId.HasValue) return Forbid();

            var row = await _db.CompanyFollows.FirstOrDefaultAsync(f =>
                f.CompanyProfileId == companyProfileId && f.StudentProfileId == studentProfileId.Value);

            if (row == null)
                return Ok(new { message = "Not following.", isFollowing = false });

            _db.CompanyFollows.Remove(row);
            await _db.SaveChangesAsync();

            return Ok(new { message = "Unfollowed.", isFollowing = false });
        }

        private async Task<int?> GetCurrentStudentProfileIdAsync()
        {
            var role = AuthorizationHelper.GetRole(User)?.ToLowerInvariant();
            if (role != "student") return null;

            var userId = AuthorizationHelper.GetUserId(User);
            if (userId <= 0) return null;

            return await _db.StudentProfiles.AsNoTracking()
                .Where(s => s.UserId == userId)
                .Select(s => (int?)s.Id)
                .FirstOrDefaultAsync();
        }

        private async Task<int?> RequireStudentProfileIdAsync()
        {
            var userId = AuthorizationHelper.GetUserId(User);
            if (userId <= 0) return null;

            return await _db.StudentProfiles.AsNoTracking()
                .Where(s => s.UserId == userId)
                .Select(s => (int?)s.Id)
                .FirstOrDefaultAsync();
        }
    }
}
