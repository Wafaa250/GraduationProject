// Controllers/DashboardController.cs
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
    /// <summary>
    /// AI + Project Overview Dashboard.
    /// Provides profile insights, project status, and AI-assisted team suggestions.
    /// </summary>
    [ApiController]
    [Route("api/dashboard")]
    [Authorize]
    public class DashboardController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        public DashboardController(ApplicationDbContext db) => _db = db;

        // =====================================================================
        // GET /api/dashboard/summary
        // Full dashboard snapshot: profile info, project status, and teammates.
        // =====================================================================
        [HttpGet("summary")]
        public async Task<IActionResult> GetSummary()
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized(new { message = "Invalid token" });

            if (IsDoctor())
                return Ok(await BuildDoctorSummaryAsync(userId.Value));

            var profile = await _db.StudentProfiles
                .Include(s => s.User)
                .FirstOrDefaultAsync(s => s.UserId == userId);

            if (profile == null)
                return NotFound(new { message = "Student profile not found" });

            var myIds      = GetAllIds(profile);
            var strength   = BuildStrength(profile);
            var teammates  = await GetTeammatesInternal(userId.Value, myIds);
            var project    = await GetMyProjectInternal(profile.Id);

            return Ok(new DashboardSummaryDto
            {
                Name               = profile.User.Name,
                Major              = profile.Major        ?? "",
                University         = profile.University   ?? "",
                AcademicYear       = profile.AcademicYear ?? "",
                TotalSkills        = myIds.Count,
                ProfileStrength    = strength,
                SuggestedTeammates = teammates,
                MyProject          = project
            });
        }

        // =====================================================================
        // GET /api/dashboard/teammates
        // Returns AI-scored teammate suggestions for team formation.
        //
        // [AI HOOK] Future: rank suggestions using AI matching based on
        //           project requirements, not just skill overlap.
        // =====================================================================
        [HttpGet("teammates")]
        public async Task<IActionResult> GetSuggestedTeammates()
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized();

            if (IsDoctor())
                return Ok(new List<SuggestedTeammateDto>());

            var profile = await _db.StudentProfiles.FirstOrDefaultAsync(s => s.UserId == userId);
            if (profile == null) return NotFound();

            return Ok(await GetTeammatesInternal(userId.Value, GetAllIds(profile)));
        }

        // =====================================================================
        // GET /api/dashboard/profile-strength
        // Returns a scored breakdown of how complete the student's profile is.
        // =====================================================================
        [HttpGet("profile-strength")]
        public async Task<IActionResult> GetProfileStrength()
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized();

            if (IsDoctor())
                return Ok(EmptyProfileStrength());

            var profile = await _db.StudentProfiles.FirstOrDefaultAsync(s => s.UserId == userId);
            if (profile == null) return NotFound();

            return Ok(BuildStrength(profile));
        }

        // =====================================================================
        // GET /api/dashboard/my-project
        // Returns the student's current project affiliation.
        //   - owner  → created the project
        //   - member → joined as a team member
        //   - null   → no project affiliation
        // =====================================================================
        [HttpGet("my-project")]
        public async Task<IActionResult> GetMyProject()
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized();

            if (IsDoctor())
                return Ok((DashboardProjectDto?)null);

            var profile = await _db.StudentProfiles.FirstOrDefaultAsync(s => s.UserId == userId);
            if (profile == null) return NotFound();

            return Ok(await GetMyProjectInternal(profile.Id));
        }

        // ── Private Helpers ───────────────────────────────────────────────────

        private bool IsDoctor()
        {
            var r = (AuthorizationHelper.GetRole(User) ?? string.Empty).Trim().ToLowerInvariant();
            return r == "doctor";
        }

        private async Task<DashboardSummaryDto> BuildDoctorSummaryAsync(int userId)
        {
            var doctor = await _db.DoctorProfiles
                .Include(d => d.User)
                .FirstOrDefaultAsync(d => d.UserId == userId);

            var name = doctor?.User?.Name ?? string.Empty;
            var major = doctor?.Specialization ?? string.Empty;
            var university = doctor?.Department ?? doctor?.Faculty ?? string.Empty;

            return new DashboardSummaryDto
            {
                Name               = name,
                Major              = major,
                University         = university,
                AcademicYear       = string.Empty,
                TotalSkills        = 0,
                ProfileStrength    = EmptyProfileStrength(),
                SuggestedTeammates = new List<SuggestedTeammateDto>(),
                MyProject          = null
            };
        }

        private static ProfileStrengthDto EmptyProfileStrength() =>
            new ProfileStrengthDto
            {
                Score             = 0,
                HasProfilePicture = false,
                HasGeneralSkills  = false,
                HasMajorSkills    = false,
                HasBio            = false,
                HasGpa            = false
            };

        private int? GetUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return claim != null ? int.Parse(claim) : null;
        }

        /// <summary>
        /// Builds a flat list of all skill/role/tool IDs for a student profile.
        /// Used for skill-overlap matching in teammate suggestions.
        /// </summary>
        private static List<int> GetAllIds(Models.StudentProfile p) =>
            SkillHelper.ParseIntList(p.Roles)
                .Concat(SkillHelper.ParseIntList(p.TechnicalSkills))
                .Concat(SkillHelper.ParseIntList(p.Tools))
                .ToList();

        /// <summary>
        /// Scores how complete the student's profile is (0–100).
        /// </summary>
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

        /// <summary>
        /// Resolves the student's current project affiliation.
        /// Checks ownership first, then team membership.
        /// Returns null if the student has no project.
        ///
        /// [AI HOOK] Future: attach AI-generated team health score or
        ///           project completion prediction alongside the project data.
        /// </summary>
        private async Task<DashboardProjectDto?> GetMyProjectInternal(int studentProfileId)
        {
            // Check ownership
            var ownedProject = await _db.StudentProjects
                .Include(p => p.Members)
                .FirstOrDefaultAsync(p => p.OwnerId == studentProfileId);

            if (ownedProject != null)
                return new DashboardProjectDto
                {
                    ProjectId     = ownedProject.Id,
                    ProjectName   = ownedProject.Name,
                    Role          = "owner",
                    MemberCount   = ownedProject.Members.Count,
                    MaxTeamSize   = ownedProject.PartnersCount,
                    IsFull        = ownedProject.Members.Count >= ownedProject.PartnersCount
                };

            // Check team membership
            var membership = await _db.StudentProjectMembers
                .Include(m => m.Project).ThenInclude(p => p.Members)
                .FirstOrDefaultAsync(m => m.StudentId == studentProfileId);

            if (membership != null)
                return new DashboardProjectDto
                {
                    ProjectId     = membership.Project.Id,
                    ProjectName   = membership.Project.Name,
                    Role          = "member",
                    MemberCount   = membership.Project.Members.Count,
                    MaxTeamSize   = membership.Project.PartnersCount,
                    IsFull        = membership.Project.Members.Count >= membership.Project.PartnersCount
                };

            return null;
        }

        /// <summary>
        /// Scores all other students by skill overlap and complementarity.
        /// Results are sorted by match score and capped at the top 6.
        ///
        /// Used for: team formation suggestions on the dashboard.
        ///
        /// [AI HOOK] Future: replace or augment this scoring with an AI model
        ///           that considers project requirements, work style, and availability.
        /// </summary>
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

                // Fetch display names for up to 4 of the student's roles
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
