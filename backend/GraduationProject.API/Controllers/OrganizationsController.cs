using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GraduationProject.API.Data;
using GraduationProject.API.DTOs;
using GraduationProject.API.Helpers;
using GraduationProject.API.Models;

namespace GraduationProject.API.Controllers
{
    [ApiController]
    [Route("api/organizations")]
    [Authorize]
    public class OrganizationsController : ControllerBase
    {
        private const int MaxUpcomingEvents = 6;
        private static readonly TimeSpan ActiveEventGrace = TimeSpan.FromHours(6);

        private readonly ApplicationDbContext _db;

        public OrganizationsController(ApplicationDbContext db)
        {
            _db = db;
        }

        // GET /api/organizations
        [HttpGet]
        public async Task<IActionResult> List()
        {
            var items = await _db.StudentAssociationProfiles
                .AsNoTracking()
                .OrderBy(p => p.AssociationName)
                .Select(p => new PublicOrganizationListItemDto
                {
                    Id = p.Id,
                    Name = p.AssociationName,
                    Category = p.Category,
                    Faculty = p.Faculty,
                    LogoUrl = p.LogoUrl,
                    IsVerified = p.IsVerified,
                })
                .ToListAsync();

            return Ok(items);
        }

        // GET /api/organizations/{organizationId}
        [HttpGet("{organizationId:int}")]
        public async Task<IActionResult> GetById(int organizationId)
        {
            var profile = await _db.StudentAssociationProfiles
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Id == organizationId);

            if (profile == null)
                return NotFound(new { message = "Organization not found." });

            var followersCount = await _db.OrganizationFollows
                .AsNoTracking()
                .CountAsync(f => f.OrganizationProfileId == organizationId);

            var upcoming = await GetUpcomingEventsQuery(organizationId)
                .Take(MaxUpcomingEvents)
                .Select(e => new PublicOrganizationEventSummaryDto
                {
                    Id = e.Id,
                    Title = e.Title,
                    EventType = e.EventType,
                    Category = e.Category,
                    CoverImageUrl = e.CoverImageUrl,
                    EventDate = e.EventDate,
                    Location = e.Location,
                    IsOnline = e.IsOnline,
                })
                .ToListAsync();

            var leadershipTeam = await _db.StudentOrganizationTeamMembers
                .AsNoTracking()
                .Where(m => m.OrganizationProfileId == organizationId)
                .OrderBy(m => m.DisplayOrder)
                .ThenBy(m => m.CreatedAt)
                .Select(m => new PublicLeadershipTeamMemberDto
                {
                    Id = m.Id,
                    FullName = m.FullName,
                    RoleTitle = m.RoleTitle,
                    Major = m.Major,
                    ImageUrl = m.ImageUrl,
                    LinkedInUrl = m.LinkedInUrl,
                    DisplayOrder = m.DisplayOrder,
                })
                .ToListAsync();

            return Ok(MapProfile(profile, upcoming, followersCount, leadershipTeam));
        }

        // GET /api/organizations/{organizationId}/follow-status
        [HttpGet("{organizationId:int}/follow-status")]
        [Authorize(Roles = "student")]
        public async Task<IActionResult> GetFollowStatus(int organizationId)
        {
            var studentProfileId = await GetCurrentStudentProfileIdAsync();
            if (!studentProfileId.HasValue)
                return NotFound(new { message = "Student profile not found." });

            var exists = await _db.StudentAssociationProfiles.AnyAsync(p => p.Id == organizationId);
            if (!exists)
                return NotFound(new { message = "Organization not found." });

            var isFollowing = await _db.OrganizationFollows.AnyAsync(f =>
                f.OrganizationProfileId == organizationId &&
                f.StudentProfileId == studentProfileId.Value);

            return Ok(new OrganizationFollowStatusDto { IsFollowing = isFollowing });
        }

        // POST /api/organizations/{organizationId}/follow
        [HttpPost("{organizationId:int}/follow")]
        [Authorize(Roles = "student")]
        public async Task<IActionResult> Follow(int organizationId)
        {
            var studentProfileId = await GetCurrentStudentProfileIdAsync();
            if (!studentProfileId.HasValue)
                return NotFound(new { message = "Student profile not found." });

            var org = await _db.StudentAssociationProfiles
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Id == organizationId);
            if (org == null)
                return NotFound(new { message = "Organization not found." });

            if (org.UserId == AuthorizationHelper.GetUserId(User))
                return BadRequest(new { message = "You cannot follow your own organization account." });

            var duplicate = await _db.OrganizationFollows.AnyAsync(f =>
                f.OrganizationProfileId == organizationId &&
                f.StudentProfileId == studentProfileId.Value);
            if (duplicate)
                return Ok(new { message = "Already following.", isFollowing = true });

            _db.OrganizationFollows.Add(new OrganizationFollow
            {
                OrganizationProfileId = organizationId,
                StudentProfileId = studentProfileId.Value,
                FollowedAt = DateTime.UtcNow,
            });
            await _db.SaveChangesAsync();

            return Ok(new { message = "You are now following this organization.", isFollowing = true });
        }

        // DELETE /api/organizations/{organizationId}/follow
        [HttpDelete("{organizationId:int}/follow")]
        [Authorize(Roles = "student")]
        public async Task<IActionResult> Unfollow(int organizationId)
        {
            var studentProfileId = await GetCurrentStudentProfileIdAsync();
            if (!studentProfileId.HasValue)
                return NotFound(new { message = "Student profile not found." });

            var row = await _db.OrganizationFollows
                .FirstOrDefaultAsync(f =>
                    f.OrganizationProfileId == organizationId &&
                    f.StudentProfileId == studentProfileId.Value);

            if (row == null)
                return Ok(new { message = "Not following.", isFollowing = false });

            _db.OrganizationFollows.Remove(row);
            await _db.SaveChangesAsync();

            return Ok(new { message = "Unfollowed.", isFollowing = false });
        }

        // GET /api/organizations/{organizationId}/events/{eventId}
        [HttpGet("{organizationId:int}/events/{eventId:int}")]
        public async Task<IActionResult> GetEvent(int organizationId, int eventId)
        {
            var profile = await _db.StudentAssociationProfiles
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Id == organizationId);

            if (profile == null)
                return NotFound(new { message = "Organization not found." });

            var entity = await GetUpcomingEventsQuery(organizationId)
                .FirstOrDefaultAsync(e => e.Id == eventId);

            if (entity == null)
                return NotFound(new { message = "Event not found." });

            return Ok(new PublicOrganizationEventDetailDto
            {
                Id = entity.Id,
                OrganizationId = organizationId,
                Title = entity.Title,
                Description = entity.Description,
                EventType = entity.EventType,
                Category = entity.Category,
                CoverImageUrl = entity.CoverImageUrl,
                EventDate = entity.EventDate,
                RegistrationDeadline = entity.RegistrationDeadline,
                Location = entity.Location,
                IsOnline = entity.IsOnline,
                OrganizationName = profile.AssociationName,
                OrganizationLogoUrl = profile.LogoUrl,
            });
        }

        private async Task<int?> GetCurrentStudentProfileIdAsync()
        {
            var userId = AuthorizationHelper.GetUserId(User);
            return await _db.StudentProfiles
                .AsNoTracking()
                .Where(s => s.UserId == userId)
                .Select(s => (int?)s.Id)
                .FirstOrDefaultAsync();
        }

        private IQueryable<StudentOrganizationEvent> GetUpcomingEventsQuery(int organizationProfileId)
        {
            var cutoff = DateTime.UtcNow.Subtract(ActiveEventGrace);
            return _db.StudentOrganizationEvents
                .AsNoTracking()
                .Where(e => e.OrganizationProfileId == organizationProfileId && e.EventDate >= cutoff)
                .OrderBy(e => e.EventDate);
        }

        private static PublicStudentOrganizationProfileDto MapProfile(
            StudentAssociationProfile profile,
            List<PublicOrganizationEventSummaryDto> upcoming,
            int followersCount,
            List<PublicLeadershipTeamMemberDto> leadershipTeam) => new()
        {
            OrganizationId = profile.Id,
            OrganizationName = profile.AssociationName,
            Description = profile.Description,
            Faculty = profile.Faculty,
            Category = profile.Category,
            LogoUrl = profile.LogoUrl,
            InstagramUrl = profile.InstagramUrl,
            FacebookUrl = profile.FacebookUrl,
            LinkedInUrl = profile.LinkedInUrl,
            IsVerified = profile.IsVerified,
            CreatedAt = profile.CreatedAt,
            UpcomingEvents = upcoming,
            FollowersCount = followersCount,
            LeadershipTeam = leadershipTeam,
        };
    }
}
