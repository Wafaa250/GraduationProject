using System;
using System.Linq;
using System.Threading.Tasks;
using GraduationProject.API.Data;
using GraduationProject.API.DTOs;
using GraduationProject.API.Helpers;
using GraduationProject.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace GraduationProject.API.Controllers
{
    [ApiController]
    [Route("api/companies")]
    [Authorize]
    public class CompanyDiscoveryController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ILogger<CompanyDiscoveryController> _logger;

        public CompanyDiscoveryController(ApplicationDbContext db, ILogger<CompanyDiscoveryController> logger)
        {
            _db = db;
            _logger = logger;
        }

        [HttpGet("public")]
        public async Task<IActionResult> ListPublic([FromQuery] string? search)
        {
            var studentProfileId = await GetCurrentStudentProfileIdAsync();
            var followingIds = studentProfileId.HasValue
                ? await _db.CompanyFollows.AsNoTracking()
                    .Where(f => f.StudentProfileId == studentProfileId.Value)
                    .Select(f => f.CompanyProfileId)
                    .ToListAsync()
                : new System.Collections.Generic.List<int>();

            var followingSet = followingIds.ToHashSet();

            var query = _db.CompanyProfiles.AsNoTracking().Include(c => c.User).AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var pattern = $"%{search.Trim()}%";
                query = query.Where(CompanySearchHelper.MatchesPattern(pattern));
            }

            var profileRows = await query
                .OrderBy(c => c.CompanyName)
                .Take(40)
                .ToListAsync();

            var items = profileRows
                .Select(c => new
                {
                    id = c.Id,
                    userId = c.UserId,
                    companyName = CompanySearchHelper.DisplayName(c),
                    industry = c.Industry,
                    description = c.Description,
                    areasOfInterest = c.AreasOfInterest,
                    isFollowing = studentProfileId.HasValue && followingSet.Contains(c.Id),
                    canFollow = true,
                })
                .ToList();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var pattern = $"%{search.Trim()}%";
                var profileUserIds = profileRows.Select(c => c.UserId).ToHashSet();
                var orphans = await _db.Users
                    .AsNoTracking()
                    .Where(u => u.Role == "company")
                    .Where(u => !profileUserIds.Contains(u.Id))
                    .Where(u => !_db.CompanyProfiles.Any(c => c.UserId == u.Id))
                    .Where(u =>
                        EF.Functions.ILike(u.Name, pattern)
                        || EF.Functions.ILike(u.Email, pattern))
                    .OrderBy(u => u.Name)
                    .Take(20)
                    .ToListAsync();

                items.AddRange(orphans.Select(u => new
                {
                    id = 0,
                    userId = u.Id,
                    companyName = string.IsNullOrWhiteSpace(u.Name) ? u.Email : u.Name.Trim(),
                    industry = (string?)null,
                    description = (string?)null,
                    areasOfInterest = (string?)null,
                    isFollowing = false,
                    canFollow = false,
                }));
            }

            return Ok(items);
        }

        /// <summary>GET /api/companies/{companyProfileId}/profile — read-only company profile for students.</summary>
        [HttpGet("{companyProfileId:int}/profile")]
        public async Task<IActionResult> GetProfile(int companyProfileId)
        {
            var profile = await _db.CompanyProfiles.AsNoTracking()
                .FirstOrDefaultAsync(c => c.Id == companyProfileId);

            if (profile == null)
                return NotFound(new { message = "Company not found." });

            var studentProfileId = await GetCurrentStudentProfileIdAsync();
            var isFollowing = studentProfileId.HasValue && await _db.CompanyFollows.AsNoTracking()
                .AnyAsync(f =>
                    f.CompanyProfileId == companyProfileId
                    && f.StudentProfileId == studentProfileId.Value);

            return Ok(new PublicCompanyProfileDetailDto
            {
                Id = profile.Id,
                CompanyName = CompanySearchHelper.DisplayName(profile),
                Industry = profile.Industry,
                Description = profile.Description,
                HeadquartersLocation = profile.HeadquartersLocation,
                Location = profile.Location,
                WorkingStyle = profile.WorkingStyle,
                WebsiteUrl = profile.WebsiteUrl,
                LinkedInUrl = profile.LinkedInUrl,
                ContactEmail = profile.ContactEmail,
                OptionalContactLink = profile.OptionalContactLink,
                AreasOfInterest = SkillHelper.ParseStringList(profile.AreasOfInterest),
                IsFollowing = isFollowing,
            });
        }

        /// <summary>GET /api/companies/{companyProfileId}/opportunities — published opportunities for students.</summary>
        [HttpGet("{companyProfileId:int}/opportunities")]
        public async Task<IActionResult> ListOpportunities(int companyProfileId)
        {
            var exists = await _db.CompanyProfiles.AsNoTracking()
                .AnyAsync(c => c.Id == companyProfileId);
            if (!exists)
                return NotFound(new { message = "Company not found." });

            var rows = await _db.CompanyRequests
                .AsNoTracking()
                .Where(r =>
                    r.CompanyProfileId == companyProfileId
                    && r.Status == CompanyRequestStatus.Submitted
                    && r.RequestStatus == CompanyRequestLifecycleStatus.Active
                    && r.IsPublishedToHub)
                .OrderByDescending(r => r.PublishedToHubAt ?? r.SubmittedAt ?? r.UpdatedAt)
                .ToListAsync();

            return Ok(rows.Select(r => new PublicCompanyOpportunitySummaryDto
            {
                Id = r.Id,
                Title = r.Title,
                Category = r.Category,
                CollaborationFormat = FeedMappingHelper.FormatCollaboration(r.CollaborationFormat),
                DurationLabel = FeedMappingHelper.FormatCompanyDuration(r),
                PublishedAt = r.PublishedToHubAt ?? r.SubmittedAt ?? r.UpdatedAt,
            }).ToList());
        }

        /// <summary>GET /api/companies/{companyProfileId}/opportunities/{requestId} — visible company project request for students.</summary>
        [HttpGet("{companyProfileId:int}/opportunities/{requestId:int}")]
        public async Task<IActionResult> GetOpportunity(int companyProfileId, int requestId)
        {
            var row = await _db.CompanyRequests
                .AsNoTracking()
                .Include(r => r.CompanyProfile)
                .Include(r => r.Roles).ThenInclude(role => role.Skills)
                .FirstOrDefaultAsync(r =>
                    r.Id == requestId && r.CompanyProfileId == companyProfileId);

            if (row == null || !CompanyRequestHubVisibility.IsVisibleInCommunicationHub(row))
                return NotFound(new { message = "Opportunity not found." });

            var company = row.CompanyProfile;
            var skills = FeedMappingHelper.CollectCompanySkills(row);
            return Ok(new PublicCompanyOpportunityDetailDto
            {
                Id = row.Id,
                CompanyProfileId = row.CompanyProfileId,
                CompanyName = company?.CompanyName ?? "Company",
                Industry = company?.Industry,
                Title = row.Title,
                Description = row.Description,
                Category = row.Category,
                RequestType = row.RequestType,
                CollaborationFormat = FeedMappingHelper.FormatCollaboration(row.CollaborationFormat),
                DurationLabel = FeedMappingHelper.FormatCompanyDuration(row),
                Skills = string.IsNullOrWhiteSpace(skills)
                    ? new List<string>()
                    : skills.Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries).ToList(),
                RoleCount = row.Roles.Count,
                PublishedAt = row.PublishedToHubAt ?? row.SubmittedAt ?? row.UpdatedAt,
                ContactEmail = company?.ContactEmail,
                WebsiteUrl = company?.WebsiteUrl,
                LinkedInUrl = company?.LinkedInUrl,
                ScopeNotes = row.ScopeNotes,
                Roles = row.Roles
                    .OrderBy(role => role.SortOrder)
                    .Select(role => new PublicCompanyOpportunityRoleDto
                    {
                        RoleName = role.RoleName,
                        Skills = role.Skills
                            .OrderBy(s => s.SortOrder)
                            .Select(s => s.SkillName)
                            .ToList(),
                    })
                    .ToList(),
            });
        }

        /// <summary>GET /api/companies/{companyProfileId}/talent-requests/{talentRequestId}</summary>
        [HttpGet("{companyProfileId:int}/talent-requests/{talentRequestId:int}")]
        public async Task<IActionResult> GetTalentRequest(int companyProfileId, int talentRequestId)
        {
            var row = await _db.CompanyTalentRequests
                .AsNoTracking()
                .Include(t => t.CompanyProfile)
                .FirstOrDefaultAsync(t =>
                    t.Id == talentRequestId && t.CompanyProfileId == companyProfileId);

            if (row == null)
                return NotFound(new { message = "Talent request not found." });

            var company = row.CompanyProfile;
            return Ok(new PublicCompanyTalentRequestDetailDto
            {
                Id = row.Id,
                CompanyProfileId = row.CompanyProfileId,
                CompanyName = company?.CompanyName ?? "Company",
                Industry = company?.Industry,
                Title = row.Title,
                Description = row.Description,
                EngagementType = row.EngagementType,
                Duration = row.Duration,
                PreferredMajor = row.PreferredMajor,
                Skills = SkillHelper.ParseStringList(row.RequiredSkills),
                CreatedAt = row.CreatedAt,
            });
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
            if (!studentProfileId.HasValue)
                return NotFound(new { message = "Student profile not found." });

            var exists = await _db.CompanyProfiles.AsNoTracking()
                .AnyAsync(c => c.Id == companyProfileId);
            if (!exists) return NotFound(new { message = "Company not found." });

            var duplicate = await _db.CompanyFollows.AnyAsync(f =>
                f.CompanyProfileId == companyProfileId && f.StudentProfileId == studentProfileId.Value);
            if (duplicate)
                return Ok(new { message = "Already following.", isFollowing = true });

            try
            {
                _db.CompanyFollows.Add(new CompanyFollow
                {
                    CompanyProfileId = companyProfileId,
                    StudentProfileId = studentProfileId.Value,
                    FollowedAt = DateTime.UtcNow,
                });
                await _db.SaveChangesAsync();
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, "Failed to follow company {CompanyProfileId}", companyProfileId);
                return StatusCode(500, new
                {
                    message = "Could not save follow. Restart the API so database tables can be created, or run Scripts/apply-communication-feed.sql.",
                });
            }

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
