using System;
using System.Linq;
using System.Threading.Tasks;
using GraduationProject.API.Data;
using GraduationProject.API.DTOs;
using GraduationProject.API.Helpers;
using GraduationProject.API.Models;
using GraduationProject.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GraduationProject.API.Controllers
{
    [ApiController]
    [Route("api/company")]
    [Authorize(Roles = "company")]
    public class CompanyController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ICompanyTalentMatchService _talentMatch;
        private readonly ICompanyWorkspaceService _workspace;
        private readonly ICompanyUniquenessService _companyUniqueness;
        private readonly ICompanyActivityService _activity;

        public CompanyController(
            ApplicationDbContext db,
            ICompanyTalentMatchService talentMatch,
            ICompanyWorkspaceService workspace,
            ICompanyUniquenessService companyUniqueness,
            ICompanyActivityService activity)
        {
            _db = db;
            _talentMatch = talentMatch;
            _workspace = workspace;
            _companyUniqueness = companyUniqueness;
            _activity = activity;
        }

        [HttpGet("profile")]
        public async Task<IActionResult> GetProfile()
        {
            var context = await RequireWorkspaceAsync();
            if (context == null)
                return NotFound(new { message = "Company profile not found." });

            return Ok(MapProfile(context));
        }

        [HttpPut("profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateCompanyProfileDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var context = await RequireWorkspaceAsync(trackChanges: true);
            if (context == null)
                return NotFound(new { message = "Company profile not found." });

            if (!context.IsOwner)
                return Forbid();

            var profile = await _db.CompanyProfiles
                .FirstOrDefaultAsync(c => c.Id == context.Profile.Id);

            if (profile == null)
                return NotFound(new { message = "Company profile not found." });

            var nameCheck = await _companyUniqueness.ValidateCompanyNameChangeAsync(
                profile.Id,
                dto.CompanyName);
            if (!nameCheck.isAllowed)
                return Conflict(new { message = nameCheck.error });

            var websiteCheck = await _companyUniqueness.ValidateWebsiteDomainChangeAsync(
                profile.Id,
                dto.WebsiteUrl);
            if (!websiteCheck.isAllowed)
                return Conflict(new { message = websiteCheck.error });

            profile.CompanyName = dto.CompanyName.Trim();
            profile.NormalizedCompanyName = CompanyUniquenessHelper.NormalizeCompanyName(dto.CompanyName);
            profile.Description = NormalizeNullable(dto.Description);
            profile.Industry = NormalizeNullable(dto.Industry);
            profile.HeadquartersLocation = NormalizeNullable(dto.HeadquartersLocation);
            profile.Location = profile.HeadquartersLocation;
            profile.WorkingStyle = NormalizeNullable(dto.WorkingStyle);
            profile.AreasOfInterest = SkillHelper.ToJsonOrNull(dto.AreasOfInterest);
            profile.WebsiteUrl = NormalizeUrlNullable(dto.WebsiteUrl);
            profile.WebsiteDomain = CompanyUniquenessHelper.ExtractWebsiteDomain(profile.WebsiteUrl);
            profile.LinkedInUrl = NormalizeUrlNullable(dto.LinkedInUrl);
            profile.ContactEmail = NormalizeNullable(dto.ContactEmail);
            profile.OptionalContactLink = NormalizeUrlNullable(dto.OptionalContactLink);

            await _db.SaveChangesAsync();

            var userId = AuthorizationHelper.GetUserId(User);
            var actor = await _db.Users.AsNoTracking()
                .Where(u => u.Id == userId)
                .Select(u => u.Name)
                .FirstOrDefaultAsync() ?? "A team member";

            await _activity.LogAsync(
                context.Profile.Id,
                userId,
                CompanyActivityTypes.ProfileUpdated,
                $"{actor} updated company profile");

            await _db.Entry(profile).Reference(c => c.User).LoadAsync();
            return Ok(MapProfile(new CompanyWorkspaceContext
            {
                Profile = profile,
                Member = context.Member,
            }));
        }

        [HttpPost("talent-search")]
        public async Task<IActionResult> TalentSearch([FromBody] CompanyTalentSearchDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var context = await RequireWorkspaceAsync();
            if (context == null)
                return NotFound(new { message = "Company profile not found." });

            var result = await _talentMatch.SearchAsync(context.Profile.Id, dto);
            return Ok(result);
        }

        [HttpGet("talent-requests")]
        public async Task<IActionResult> ListTalentRequests()
        {
            var context = await RequireWorkspaceAsync();
            if (context == null)
                return NotFound(new { message = "Company profile not found." });

            var rows = await _db.CompanyTalentRequests
                .AsNoTracking()
                .Where(r => r.CompanyProfileId == context.Profile.Id)
                .OrderByDescending(r => r.CreatedAt)
                .Take(20)
                .ToListAsync();

            var list = rows.Select(r => new CompanyTalentRequestSummaryDto
            {
                Id = r.Id,
                Title = r.Title,
                EngagementType = r.EngagementType,
                RequiredSkills = SkillHelper.ParseStringList(r.RequiredSkills),
                CreatedAt = r.CreatedAt,
            }).ToList();

            return Ok(list);
        }

        private async Task<CompanyWorkspaceContext?> RequireWorkspaceAsync(bool trackChanges = false)
        {
            var userId = AuthorizationHelper.GetUserId(User);
            var context = await _workspace.GetWorkspaceAsync(userId);
            if (context == null)
                return null;

            if (!trackChanges)
                return context;

            var profile = await _db.CompanyProfiles
                .Include(c => c.User)
                .FirstOrDefaultAsync(c => c.Id == context.Profile.Id);

            if (profile == null)
                return null;

            return new CompanyWorkspaceContext
            {
                Profile = profile,
                Member = context.Member,
            };
        }

        private static CompanyProfileDto MapProfile(CompanyWorkspaceContext context)
        {
            var profile = context.Profile;
            return new CompanyProfileDto
            {
                Id = profile.Id,
                UserId = profile.UserId,
                CompanyName = profile.CompanyName,
                Industry = profile.Industry,
                Description = profile.Description,
                Location = profile.Location,
                HeadquartersLocation = profile.HeadquartersLocation ?? profile.Location,
                WorkingStyle = profile.WorkingStyle,
                AreasOfInterest = SkillHelper.ParseStringList(profile.AreasOfInterest),
                WebsiteUrl = profile.WebsiteUrl,
                LinkedInUrl = profile.LinkedInUrl,
                Email = profile.User?.Email ?? string.Empty,
                ContactEmail = profile.ContactEmail ?? profile.User?.Email,
                OptionalContactLink = profile.OptionalContactLink,
                WorkspaceRole = context.Role,
            };
        }

        private static string? NormalizeNullable(string? value) =>
            string.IsNullOrWhiteSpace(value) ? null : value.Trim();

        private static string? NormalizeUrlNullable(string? value)
        {
            var trimmed = NormalizeNullable(value);
            if (trimmed == null) return null;
            if (Uri.TryCreate(trimmed, UriKind.Absolute, out _)) return trimmed;
            var withScheme = $"https://{trimmed}";
            return Uri.TryCreate(withScheme, UriKind.Absolute, out _) ? withScheme : trimmed;
        }
    }
}
