using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GraduationProject.API.Data;
using GraduationProject.API.DTOs;
using GraduationProject.API.Helpers;

namespace GraduationProject.API.Controllers
{
    [ApiController]
    [Route("api/profile")]
    [Authorize]
    public class ProfileController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        public ProfileController(ApplicationDbContext db) => _db = db;

        // PUT /api/profile
        [HttpPut]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto dto)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userIdClaim == null)
                return Unauthorized(new { message = "Invalid token" });

            var userId = int.Parse(userIdClaim);

            var profile = await _db.StudentProfiles
                .Include(s => s.User)
                .FirstOrDefaultAsync(s => s.UserId == userId);

            if (profile == null)
                return NotFound(new { message = "Profile not found" });

            // ── User ─────────────────────────────────────────────────────────
            if (!string.IsNullOrWhiteSpace(dto.FullName))
                profile.User.Name = dto.FullName;

            // ── Profile fields ───────────────────────────────────────────────
            if (dto.Bio          != null) profile.Bio          = dto.Bio;
            if (dto.Availability != null) profile.Availability = dto.Availability;
            if (dto.LookingFor   != null) profile.LookingFor   = dto.LookingFor;
            if (dto.Github       != null) profile.Github       = dto.Github;
            if (dto.Linkedin     != null) profile.Linkedin     = dto.Linkedin;
            if (dto.Portfolio    != null) profile.Portfolio    = dto.Portfolio;
            if (dto.ProfilePictureBase64 != null)
                profile.ProfilePictureBase64 = dto.ProfilePictureBase64;

            // ── Languages: نصوص مش IDs ───────────────────────────────────────
            if (dto.Languages != null)
                profile.Languages = JsonSerializer.Serialize(dto.Languages);

            // ── Skills: اسم → شوف إذا موجود → أضف إذا مش موجود → احفظ ID ───
            if (dto.Roles != null)
                profile.Roles = await SkillHelper.NamesToIdsJson(_db, dto.Roles, "role");

            if (dto.TechnicalSkills != null)
                profile.TechnicalSkills = await SkillHelper.NamesToIdsJson(_db, dto.TechnicalSkills, "technical");

            if (dto.Tools != null)
                profile.Tools = await SkillHelper.NamesToIdsJson(_db, dto.Tools, "tool");

            // للتوافق مع الفرونت القديم (generalSkills = roles, majorSkills = technicalSkills)
            if (dto.GeneralSkills != null && dto.Roles == null)
                profile.Roles = await SkillHelper.NamesToIdsJson(_db, dto.GeneralSkills, "role");

            if (dto.MajorSkills != null && dto.TechnicalSkills == null)
                profile.TechnicalSkills = await SkillHelper.NamesToIdsJson(_db, dto.MajorSkills, "technical");

            await _db.SaveChangesAsync();
            return Ok(new { message = "Profile updated successfully" });
        }
    }
}
