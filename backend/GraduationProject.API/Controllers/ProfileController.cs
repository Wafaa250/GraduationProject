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

            await _db.SaveChangesAsync();
            return Ok(new { message = "Profile updated successfully" });
        }

        // GET /api/profile/settings
        [HttpGet("settings")]
        public async Task<IActionResult> GetStudentSettings()
        {
            var userId = AuthorizationHelper.GetUserId(User);
            var profile = await _db.StudentProfiles
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.UserId == userId);

            if (profile == null)
                return NotFound(new { message = "Student profile not found." });

            return Ok(new
            {
                notificationPreferences = StudentSettingsHelper.DeserializeNotificationPreferences(
                    profile.NotificationPreferences),
                aiProjectInterests = StudentSettingsHelper.DeserializeAiProjectInterests(
                    profile.AiProjectInterests),
            });
        }

        // PUT /api/profile/settings
        [HttpPut("settings")]
        public async Task<IActionResult> UpdateStudentSettings([FromBody] UpdateStudentSettingsDto dto)
        {
            var userId = AuthorizationHelper.GetUserId(User);
            var profile = await _db.StudentProfiles
                .FirstOrDefaultAsync(s => s.UserId == userId);

            if (profile == null)
                return NotFound(new { message = "Student profile not found." });

            StudentSettingsHelper.ApplySettingsUpdate(profile, dto);
            await _db.SaveChangesAsync();

            return Ok(new
            {
                message = "Settings saved successfully",
                notificationPreferences = StudentSettingsHelper.DeserializeNotificationPreferences(
                    profile.NotificationPreferences),
                aiProjectInterests = StudentSettingsHelper.DeserializeAiProjectInterests(
                    profile.AiProjectInterests),
            });
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
            if (dto.PhoneNumber != null) profile.PhoneNumber = dto.PhoneNumber;
            if (dto.Department != null) profile.Department = dto.Department;
            if (dto.Faculty != null) profile.Faculty = dto.Faculty;
            if (dto.Specialization != null) profile.Specialization = dto.Specialization;
            if (dto.University != null) profile.University = dto.University;
            if (dto.AcademicRank != null) profile.AcademicRank = dto.AcademicRank;

            if (dto.YearsOfExperience != null) profile.YearsOfExperience = dto.YearsOfExperience;
            if (dto.Linkedin != null) profile.Linkedin = dto.Linkedin;
            if (dto.OfficeHours != null) profile.OfficeHours = dto.OfficeHours;

            if (dto.Bio != null) profile.Bio = dto.Bio;
            if (dto.ProfilePictureBase64 != null)
                profile.ProfilePictureBase64 = dto.ProfilePictureBase64;

            if (dto.TechnicalSkills != null)
                profile.TechnicalSkills = JsonSerializer.Serialize(dto.TechnicalSkills);
            if (dto.ResearchSkills != null)
                profile.ResearchSkills = JsonSerializer.Serialize(dto.ResearchSkills);
            if (dto.ResearchInterests != null)
                profile.ResearchInterests = DoctorSettingsHelper.SerializeStringList(dto.ResearchInterests);
            if (dto.PreferredProjectAreas != null)
                profile.PreferredProjectAreas = DoctorSettingsHelper.SerializeStringList(dto.PreferredProjectAreas);

            await _db.SaveChangesAsync();

            return Ok(new { message = "Doctor profile updated successfully" });
        }

        // GET /api/profile/doctor/settings
        [HttpGet("doctor/settings")]
        public async Task<IActionResult> GetDoctorSettings()
        {
            var userId = AuthorizationHelper.GetUserId(User);
            var profile = await _db.DoctorProfiles
                .AsNoTracking()
                .FirstOrDefaultAsync(d => d.UserId == userId);

            if (profile == null)
                return NotFound(new { message = "Doctor profile not found." });

            return Ok(new
            {
                notificationPreferences = DoctorSettingsHelper.DeserializeNotificationPreferences(
                    profile.NotificationPreferences),
                supervisionPreferences = DoctorSettingsHelper.DefaultSupervisionPreferences(profile),
            });
        }

        // PUT /api/profile/doctor/settings
        [HttpPut("doctor/settings")]
        public async Task<IActionResult> UpdateDoctorSettings([FromBody] UpdateDoctorSettingsDto dto)
        {
            var userId = AuthorizationHelper.GetUserId(User);
            var profile = await _db.DoctorProfiles
                .FirstOrDefaultAsync(d => d.UserId == userId);

            if (profile == null)
                return NotFound(new { message = "Doctor profile not found." });

            DoctorSettingsHelper.ApplySettingsUpdate(profile, dto);
            await _db.SaveChangesAsync();

            return Ok(new
            {
                message = "Settings saved successfully",
                notificationPreferences = DoctorSettingsHelper.DeserializeNotificationPreferences(
                    profile.NotificationPreferences),
                supervisionPreferences = DoctorSettingsHelper.DefaultSupervisionPreferences(profile),
            });
        }
    }
}
