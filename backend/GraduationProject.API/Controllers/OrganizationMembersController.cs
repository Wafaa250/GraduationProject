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
    [Route("api/organization/members")]
    [Authorize(Roles = "studentassociation,association")]
    public class OrganizationMembersController : ControllerBase
    {
        private readonly ApplicationDbContext _db;

        public OrganizationMembersController(ApplicationDbContext db)
        {
            _db = db;
        }

        [HttpGet]
        public async Task<IActionResult> List([FromQuery] string? kind)
        {
            var profile = await GetCurrentProfileAsync();
            if (profile == null)
                return NotFound(new { message = "Organization profile not found." });

            var query = _db.StudentOrganizationMembers
                .AsNoTracking()
                .Include(m => m.StudentProfile).ThenInclude(s => s.User)
                .Where(m => m.OrganizationProfileId == profile.Id);

            if (!string.IsNullOrWhiteSpace(kind))
            {
                var normalized = kind.Trim();
                if (!OrganizationMembershipKinds.All.Contains(normalized))
                    return BadRequest(new { message = "Invalid membership kind filter." });
                query = query.Where(m =>
                    m.MembershipKind == normalized ||
                    (normalized == OrganizationMembershipKinds.Member &&
                     (m.MembershipKind == null || m.MembershipKind == string.Empty)));
            }

            var rows = await query
                .OrderByDescending(m => m.AcceptedAt)
                .ToListAsync();

            return Ok(rows.Select(MapToDto).ToList());
        }

        private async Task<StudentAssociationProfile?> GetCurrentProfileAsync()
        {
            var userId = AuthorizationHelper.GetUserId(User);
            return await _db.StudentAssociationProfiles
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.UserId == userId);
        }

        private static OrganizationMemberListItemDto MapToDto(StudentOrganizationMember m) =>
            new()
            {
                Id = m.Id,
                StudentProfileId = m.StudentProfileId,
                StudentUserId = m.StudentProfile.UserId,
                StudentName = m.StudentProfile.User?.Name ?? "Student",
                StudentEmail = m.StudentProfile.User?.Email,
                Major = m.StudentProfile.Major,
                RoleTitle = m.RoleTitle ?? string.Empty,
                MembershipKind = m.MembershipKind,
                SourceApplicationId = m.SourceApplicationId,
                TeamMemberId = m.TeamMemberId,
                AcceptedAt = m.AcceptedAt,
                JoinedViaRecruitment = m.SourceApplicationId.HasValue,
            };
    }

    [ApiController]
    [Route("api/student/organization-memberships")]
    [Authorize(Roles = "student")]
    public class StudentOrganizationMembershipsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;

        public StudentOrganizationMembershipsController(ApplicationDbContext db)
        {
            _db = db;
        }

        [HttpGet]
        public async Task<IActionResult> ListMine()
        {
            var studentProfileId = await GetCurrentStudentProfileIdAsync();
            if (!studentProfileId.HasValue)
                return NotFound(new { message = "Student profile not found." });

            var rows = await _db.StudentOrganizationMembers
                .AsNoTracking()
                .Include(m => m.OrganizationProfile)
                .Include(m => m.SourceApplication).ThenInclude(a => a!.Campaign)
                .Where(m => m.StudentProfileId == studentProfileId.Value)
                .OrderByDescending(m => m.AcceptedAt)
                .ToListAsync();

            return Ok(rows.Select(m => new StudentOrganizationMembershipDto
            {
                OrganizationMemberId = m.Id,
                OrganizationId = m.OrganizationProfileId,
                OrganizationName = m.OrganizationProfile.AssociationName,
                OrganizationLogoUrl = m.OrganizationProfile.LogoUrl,
                RoleTitle = m.RoleTitle ?? string.Empty,
                MembershipKind = string.IsNullOrWhiteSpace(m.MembershipKind)
                    ? OrganizationMembershipKinds.Member
                    : m.MembershipKind,
                JoinedAt = m.AcceptedAt,
                SourceApplicationId = m.SourceApplicationId,
                CampaignId = m.SourceApplication?.CampaignId,
                CampaignTitle = m.SourceApplication?.Campaign.Title,
                JoinedViaRecruitment = m.SourceApplicationId.HasValue,
            }).ToList());
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
    }
}
