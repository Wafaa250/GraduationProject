using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
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

        // GET /api/organizations/{organizationId}/recruitment-campaigns
        [HttpGet("{organizationId:int}/recruitment-campaigns")]
        public async Task<IActionResult> ListRecruitmentCampaigns(int organizationId)
        {
            var exists = await _db.StudentAssociationProfiles.AnyAsync(p => p.Id == organizationId);
            if (!exists)
                return NotFound(new { message = "Organization not found." });

            var now = DateTime.UtcNow;
            var items = await _db.StudentOrganizationRecruitmentCampaigns
                .AsNoTracking()
                .Where(c =>
                    c.OrganizationProfileId == organizationId &&
                    c.IsPublished &&
                    c.ApplicationDeadline >= now)
                .OrderBy(c => c.ApplicationDeadline)
                .Select(c => new PublicRecruitmentCampaignSummaryDto
                {
                    Id = c.Id,
                    Title = c.Title,
                    CoverImageUrl = c.CoverImageUrl,
                    ApplicationDeadline = c.ApplicationDeadline,
                    OpenPositionsCount = c.Positions.Count,
                })
                .ToListAsync();

            return Ok(items);
        }

        // GET /api/organizations/{organizationId}/recruitment-campaigns/{campaignId}
        [HttpGet("{organizationId:int}/recruitment-campaigns/{campaignId:int}")]
        public async Task<IActionResult> GetRecruitmentCampaign(int organizationId, int campaignId)
        {
            var profile = await _db.StudentAssociationProfiles
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Id == organizationId);

            if (profile == null)
                return NotFound(new { message = "Organization not found." });

            var now = DateTime.UtcNow;
            var campaign = await _db.StudentOrganizationRecruitmentCampaigns
                .AsNoTracking()
                .Include(c => c.Positions)
                .Include(c => c.Questions)
                    .ThenInclude(q => q.Position)
                .FirstOrDefaultAsync(c =>
                    c.Id == campaignId &&
                    c.OrganizationProfileId == organizationId &&
                    c.IsPublished &&
                    c.ApplicationDeadline >= now);

            if (campaign == null)
                return NotFound(new { message = "Recruitment campaign not found." });

            return Ok(new PublicRecruitmentCampaignDetailDto
            {
                Id = campaign.Id,
                OrganizationId = organizationId,
                Title = campaign.Title,
                Description = campaign.Description,
                ApplicationDeadline = campaign.ApplicationDeadline,
                CoverImageUrl = campaign.CoverImageUrl,
                OrganizationName = profile.AssociationName,
                OrganizationLogoUrl = profile.LogoUrl,
                Positions = campaign.Positions
                    .OrderBy(p => p.DisplayOrder)
                    .ThenBy(p => p.Id)
                    .Select(p => new RecruitmentPositionResponseDto
                    {
                        Id = p.Id,
                        CampaignId = p.CampaignId,
                        RoleTitle = p.RoleTitle,
                        NeededCount = p.NeededCount,
                        Description = p.Description,
                        Requirements = p.Requirements,
                        RequiredSkills = p.RequiredSkills,
                        DisplayOrder = p.DisplayOrder,
                    })
                    .ToList(),
                Questions = MapPublicQuestions(campaign.Questions),
            });
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

            var registrationForm = await _db.StudentOrganizationEventRegistrationForms
                .AsNoTracking()
                .Include(f => f.Fields)
                .FirstOrDefaultAsync(f => f.EventId == eventId);

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
                RegistrationForm = registrationForm == null
                    ? null
                    : MapPublicRegistrationForm(registrationForm),
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

        private static readonly JsonSerializerOptions QuestionJsonOptions = new()
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        };

        private static List<RecruitmentQuestionResponseDto> MapPublicQuestions(
            IEnumerable<StudentOrganizationRecruitmentQuestion> questions) =>
            questions
                .OrderBy(q => q.DisplayOrder)
                .ThenBy(q => q.Id)
                .Select(q => new RecruitmentQuestionResponseDto
                {
                    Id = q.Id,
                    CampaignId = q.CampaignId,
                    QuestionTitle = q.QuestionTitle,
                    QuestionType = q.QuestionType,
                    Placeholder = q.Placeholder,
                    HelpText = q.HelpText,
                    IsRequired = q.IsRequired,
                    Options = DeserializeQuestionOptions(q.Options),
                    DisplayOrder = q.DisplayOrder,
                    CreatedAt = q.CreatedAt,
                    PositionId = q.PositionId,
                    PositionRoleTitle = q.Position != null ? q.Position.RoleTitle : null,
                })
                .ToList();

        private static EventRegistrationFormResponseDto MapPublicRegistrationForm(
            StudentOrganizationEventRegistrationForm form) =>
            new()
            {
                Id = form.Id,
                EventId = form.EventId,
                Title = form.Title,
                Description = form.Description,
                CreatedAt = form.CreatedAt,
                UpdatedAt = form.UpdatedAt,
                Fields = form.Fields
                    .OrderBy(f => f.DisplayOrder)
                    .ThenBy(f => f.Id)
                    .Select(f => new EventRegistrationFieldResponseDto
                    {
                        Id = f.Id,
                        FormId = f.FormId,
                        Label = f.Label,
                        FieldType = f.FieldType,
                        Placeholder = f.Placeholder,
                        HelpText = f.HelpText,
                        IsRequired = f.IsRequired,
                        Options = DeserializeFieldOptions(f.Options),
                        DisplayOrder = f.DisplayOrder,
                        CreatedAt = f.CreatedAt,
                    })
                    .ToList(),
            };

        private static List<string>? DeserializeFieldOptions(string? json)
        {
            if (string.IsNullOrWhiteSpace(json)) return null;
            try
            {
                return JsonSerializer.Deserialize<List<string>>(json, QuestionJsonOptions);
            }
            catch
            {
                return null;
            }
        }

        private static List<string>? DeserializeQuestionOptions(string? json)
        {
            if (string.IsNullOrWhiteSpace(json)) return null;
            try
            {
                return JsonSerializer.Deserialize<List<string>>(json, QuestionJsonOptions);
            }
            catch
            {
                return null;
            }
        }
    }
}
