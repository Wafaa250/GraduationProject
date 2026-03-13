using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GraduationProject.API.Data;
using GraduationProject.API.DTOs;
using GraduationProject.API.Helpers;

namespace GraduationProject.API.Controllers
{
    [ApiController]
    [Route("api/dashboard")]
    [Authorize]
    public class DashboardController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        public DashboardController(ApplicationDbContext db) => _db = db;

        // GET /api/dashboard/summary
        [HttpGet("summary")]
        public async Task<IActionResult> GetSummary()
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized(new { message = "Invalid token" });

            var profile = await _db.StudentProfiles
                .Include(s => s.User)
                .FirstOrDefaultAsync(s => s.UserId == userId);

            if (profile == null)
                return NotFound(new { message = "Student profile not found" });

            var myIds     = GetAllIds(profile);
            var strength  = BuildStrength(profile);
            var teammates = await GetTeammatesInternal(userId.Value, myIds);

            return Ok(new DashboardSummaryDto
            {
                Name               = profile.User.Name,
                Major              = profile.Major        ?? "",
                University         = profile.University   ?? "",
                AcademicYear       = profile.AcademicYear ?? "",
                TotalSkills        = myIds.Count,
                ProfileStrength    = strength,
                SuggestedTeammates = teammates
            });
        }

        // GET /api/dashboard/teammates
        [HttpGet("teammates")]
        public async Task<IActionResult> GetSuggestedTeammates()
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized();

            var profile = await _db.StudentProfiles.FirstOrDefaultAsync(s => s.UserId == userId);
            if (profile == null) return NotFound();

            return Ok(await GetTeammatesInternal(userId.Value, GetAllIds(profile)));
        }

        // GET /api/dashboard/profile-strength
        [HttpGet("profile-strength")]
        public async Task<IActionResult> GetProfileStrength()
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized();

            var profile = await _db.StudentProfiles.FirstOrDefaultAsync(s => s.UserId == userId);
            if (profile == null) return NotFound();

            return Ok(BuildStrength(profile));
        }

        // ── Helpers ──────────────────────────────────────────────────────────

        private int? GetUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return claim != null ? int.Parse(claim) : null;
        }

        private static List<int> GetAllIds(Models.StudentProfile p) =>
            SkillHelper.ParseIntList(p.Roles)
                .Concat(SkillHelper.ParseIntList(p.TechnicalSkills))
                .Concat(SkillHelper.ParseIntList(p.Tools))
                .ToList();

        private static ProfileStrengthDto BuildStrength(Models.StudentProfile p)
        {
            var hasProfilePic = !string.IsNullOrEmpty(p.ProfilePictureBase64);
            var hasBio        = !string.IsNullOrEmpty(p.Bio);
            var hasRoles      = SkillHelper.ParseIntList(p.Roles).Any();
            var hasTech       = SkillHelper.ParseIntList(p.TechnicalSkills).Any();

            var score = 0;
            if (hasProfilePic) score += 20;
            if (hasRoles)      score += 25;
            if (hasTech)       score += 25;
            if (hasBio)        score += 15;
            if (p.Gpa.HasValue) score += 15;

            return new ProfileStrengthDto
            {
                Score             = score,
                HasProfilePicture = hasProfilePic,
                HasGeneralSkills  = hasRoles,
                HasMajorSkills    = hasTech,
                HasBio            = hasBio,
                HasGpa            = p.Gpa.HasValue
            };
        }

        private async Task<List<SuggestedTeammateDto>> GetTeammatesInternal(
            int currentUserId, List<int> myIds)
        {
            var allStudents = await _db.StudentProfiles
                .Include(s => s.User)
                .Where(s => s.UserId != currentUserId)
                .ToListAsync();

            var results = new List<SuggestedTeammateDto>();

            foreach (var s in allStudents)
            {
                var theirIds = GetAllIds(s);

                var common        = myIds.Intersect(theirIds).Count();
                var complementary = theirIds.Except(myIds).Count();

                var matchScore = (int)(
                    (common        * 0.6 / Math.Max(myIds.Count,    1) * 100) +
                    (complementary * 0.4 / Math.Max(theirIds.Count, 1) * 100)
                );
                matchScore = Math.Min(matchScore, 100);

                if (matchScore <= 0) continue;

                // أسماء أول 4 roles للعرض
                var roleIds      = SkillHelper.ParseIntList(s.Roles).Take(4).ToList();
                var displayNames = await _db.Skills
                    .Where(sk => roleIds.Contains(sk.Id))
                    .Select(sk => sk.Name)
                    .ToListAsync();

                results.Add(new SuggestedTeammateDto
                {
                    UserId         = s.UserId,
                    ProfileId      = s.Id,
                    Name           = s.User.Name,
                    Major          = s.Major        ?? "",
                    University     = s.University   ?? "",
                    AcademicYear   = s.AcademicYear ?? "",
                    ProfilePicture = s.ProfilePictureBase64,
                    Skills         = displayNames,
                    MatchScore     = matchScore
                });
            }

            return results
                .OrderByDescending(x => x.MatchScore)
                .Take(6)
                .ToList();
        }
    }
}
