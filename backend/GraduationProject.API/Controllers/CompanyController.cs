using System.Linq;
using System.Threading.Tasks;
using GraduationProject.API.Data;
using GraduationProject.API.DTOs;
using GraduationProject.API.Helpers;
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

        public CompanyController(ApplicationDbContext db, ICompanyTalentMatchService talentMatch)
        {
            _db = db;
            _talentMatch = talentMatch;
        }

        [HttpGet("profile")]
        public async Task<IActionResult> GetProfile()
        {
            var profile = await GetCompanyProfileAsync();
            if (profile == null)
                return NotFound(new { message = "Company profile not found." });

            return Ok(new CompanyProfileDto
            {
                Id = profile.Id,
                UserId = profile.UserId,
                CompanyName = profile.CompanyName,
                Industry = profile.Industry,
                Description = profile.Description,
                Location = profile.Location,
                WebsiteUrl = profile.WebsiteUrl,
                LinkedInUrl = profile.LinkedInUrl,
                Email = profile.User?.Email ?? string.Empty,
            });
        }

        [HttpPost("talent-search")]
        public async Task<IActionResult> TalentSearch([FromBody] CompanyTalentSearchDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var profile = await GetCompanyProfileAsync();
            if (profile == null)
                return NotFound(new { message = "Company profile not found." });

            var result = await _talentMatch.SearchAsync(profile.Id, dto);
            return Ok(result);
        }

        [HttpGet("talent-requests")]
        public async Task<IActionResult> ListTalentRequests()
        {
            var profile = await GetCompanyProfileAsync();
            if (profile == null)
                return NotFound(new { message = "Company profile not found." });

            var rows = await _db.CompanyTalentRequests
                .AsNoTracking()
                .Where(r => r.CompanyProfileId == profile.Id)
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

        private async Task<Models.CompanyProfile?> GetCompanyProfileAsync()
        {
            var userId = AuthorizationHelper.GetUserId(User);
            return await _db.CompanyProfiles
                .Include(c => c.User)
                .FirstOrDefaultAsync(c => c.UserId == userId);
        }
    }
}
