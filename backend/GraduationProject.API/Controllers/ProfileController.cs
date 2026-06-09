using System;
using System.Collections.Generic;
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

            if (dto.CollaborationPreferences != null)
                profile.CollaborationPreferences = JsonSerializer.Serialize(dto.CollaborationPreferences);

            if (dto.OtherLinks != null)
                profile.OtherLinks = JsonSerializer.Serialize(dto.OtherLinks);

            if (dto.ExpectedGraduation != null)
                profile.ExpectedGraduation = dto.ExpectedGraduation;

            if (dto.PersonalWebsite != null)
                profile.PersonalWebsite = dto.PersonalWebsite;

            await _db.SaveChangesAsync();
            return Ok(new { message = "Profile updated successfully" });
        }

        [HttpGet("settings")]
        public async Task<IActionResult> GetStudentSettings()
        {
            var userId = AuthorizationHelper.GetUserId(User);
            if (!string.Equals(AuthorizationHelper.GetRole(User), "student", StringComparison.OrdinalIgnoreCase))
                return Forbid();

            var row = await _db.StudentAccountSettings.AsNoTracking()
                .FirstOrDefaultAsync(s => s.UserId == userId);

            return Ok(MapStudentSettings(row));
        }

        [HttpPut("settings")]
        public async Task<IActionResult> UpdateStudentSettings([FromBody] UpdateStudentProfileSettingsDto dto)
        {
            var userId = AuthorizationHelper.GetUserId(User);
            if (!string.Equals(AuthorizationHelper.GetRole(User), "student", StringComparison.OrdinalIgnoreCase))
                return Forbid();

            var row = await _db.StudentAccountSettings.FirstOrDefaultAsync(s => s.UserId == userId);
            if (row == null)
            {
                row = new Models.StudentAccountSettings { UserId = userId };
                _db.StudentAccountSettings.Add(row);
            }

            if (dto.NotificationPreferences != null)
                row.NotificationPreferences = JsonSerializer.Serialize(dto.NotificationPreferences);

            if (dto.AiProjectInterests != null)
                row.AiProjectInterests = JsonSerializer.Serialize(dto.AiProjectInterests);

            row.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return Ok(MapStudentSettings(row));
        }

        [HttpGet("doctor/settings")]
        public async Task<IActionResult> GetDoctorSettings()
        {
            var userId = AuthorizationHelper.GetUserId(User);
            if (!string.Equals(AuthorizationHelper.GetRole(User), "doctor", StringComparison.OrdinalIgnoreCase))
                return Forbid();

            var profile = await _db.DoctorProfiles.AsNoTracking()
                .FirstOrDefaultAsync(d => d.UserId == userId);
            if (profile == null)
                return NotFound(new { message = "Doctor profile not found." });

            return Ok(MapDoctorSettings(profile));
        }

        [HttpPut("doctor/settings")]
        public async Task<IActionResult> UpdateDoctorSettings([FromBody] UpdateDoctorProfileSettingsDto dto)
        {
            var userId = AuthorizationHelper.GetUserId(User);
            if (!string.Equals(AuthorizationHelper.GetRole(User), "doctor", StringComparison.OrdinalIgnoreCase))
                return Forbid();

            var profile = await _db.DoctorProfiles.FirstOrDefaultAsync(d => d.UserId == userId);
            if (profile == null)
                return NotFound(new { message = "Doctor profile not found." });

            if (dto.NotificationPreferences != null)
                profile.NotificationPreferences = JsonSerializer.Serialize(dto.NotificationPreferences);

            if (dto.SupervisionPreferences != null)
            {
                profile.SupervisionCapacity = Math.Clamp(dto.SupervisionPreferences.SupervisionCapacity, 0, 50);
                profile.AvailableForSupervision = dto.SupervisionPreferences.AvailableForSupervision;
            }

            await _db.SaveChangesAsync();
            return Ok(MapDoctorSettings(profile));
        }

        private static StudentProfileSettingsDto MapStudentSettings(Models.StudentAccountSettings? row)
        {
            var settings = new StudentProfileSettingsDto();
            if (row?.NotificationPreferences != null)
            {
                try
                {
                    settings.NotificationPreferences = JsonSerializer.Deserialize<StudentNotificationPreferencesDto>(
                        row.NotificationPreferences) ?? new StudentNotificationPreferencesDto();
                }
                catch (JsonException) { /* defaults */ }
            }

            if (row?.AiProjectInterests != null)
            {
                try
                {
                    settings.AiProjectInterests = JsonSerializer.Deserialize<List<string>>(row.AiProjectInterests)
                        ?? new List<string>();
                }
                catch (JsonException) { /* defaults */ }
            }

            return settings;
        }

        private static DoctorProfileSettingsDto MapDoctorSettings(Models.DoctorProfile profile)
        {
            var settings = new DoctorProfileSettingsDto
            {
                SupervisionPreferences = new DoctorSupervisionPreferencesDto
                {
                    SupervisionCapacity = profile.SupervisionCapacity,
                    AvailableForSupervision = profile.AvailableForSupervision,
                },
            };

            if (!string.IsNullOrWhiteSpace(profile.NotificationPreferences))
            {
                try
                {
                    settings.NotificationPreferences = JsonSerializer.Deserialize<DoctorNotificationPreferencesDto>(
                        profile.NotificationPreferences) ?? new DoctorNotificationPreferencesDto();
                }
                catch (JsonException) { /* defaults */ }
            }

            return settings;
        }

        [HttpPut("doctor")]
        public async Task<IActionResult> UpdateDoctorProfile([FromBody] UpdateDoctorProfileDto dto)
        {
            var userId = AuthorizationHelper.GetUserId(User);

            var profile = await _db.DoctorProfiles
                .Include(d => d.User)
                .FirstOrDefaultAsync(d => d.UserId == userId);

            if (profile == null)
                return NotFound(new { message = "Doctor profile not found" });

            // User
            if (!string.IsNullOrWhiteSpace(dto.FullName))
                profile.User.Name = dto.FullName;

            // Basic
            if (dto.Department != null) profile.Department = dto.Department;
            if (dto.Faculty != null) profile.Faculty = dto.Faculty;
            if (dto.Specialization != null) profile.Specialization = dto.Specialization;

            // New fields
            if (dto.YearsOfExperience != null) profile.YearsOfExperience = dto.YearsOfExperience;
            if (dto.Linkedin != null) profile.Linkedin = dto.Linkedin;
            if (dto.OfficeHours != null) profile.OfficeHours = dto.OfficeHours;

            if (dto.Bio != null) profile.Bio = dto.Bio;
            if (dto.ProfilePictureBase64 != null)
                profile.ProfilePictureBase64 = dto.ProfilePictureBase64;

            // Skills — DB columns are text (JSON string arrays)
            profile.TechnicalSkills = JsonSerializer.Serialize(dto.TechnicalSkills ?? new List<string>());
            profile.ResearchSkills = JsonSerializer.Serialize(dto.ResearchSkills ?? new List<string>());

            await _db.SaveChangesAsync();

            return Ok(new { message = "Doctor profile updated successfully" });
        }
    }
}
