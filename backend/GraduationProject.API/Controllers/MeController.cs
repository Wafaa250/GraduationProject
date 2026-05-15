using System.Collections.Generic;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GraduationProject.API.Data;
using GraduationProject.API.Helpers;

namespace GraduationProject.API.Controllers
{
    [ApiController]
    [Route("api/me")]
    [Authorize]
    public class MeController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        public MeController(ApplicationDbContext db) => _db = db;

        // GET /api/me
        [HttpGet]
        public async Task<IActionResult> GetMe()
        {
            var userId = AuthorizationHelper.GetUserId(User);
            var role   = NormalizeRole(AuthorizationHelper.GetRole(User));

            // Doctor (and other non-student roles) must never run student profile loading.
            if (role == "doctor")
                return await GetDoctorInfo(userId);

            return role switch
            {
                "student"     => await GetStudentInfo(userId),
                "company"     => await GetCompanyInfo(userId),
                "studentassociation" or "association" => await GetStudentAssociationInfo(userId),
                "admin"       => await GetAdminInfo(userId),
                _             => Unauthorized(new { message = "Unknown role." })
            };
        }

        private static string NormalizeRole(string? role) =>
            (role ?? string.Empty).Trim().ToLowerInvariant();

        /// <summary>DoctorProfiles stores TechnicalSkills / ResearchSkills as JSON text; tolerate null, empty, or invalid JSON.</summary>
        private static List<string> DeserializeList(string? json)
        {
            if (string.IsNullOrWhiteSpace(json))
                return new List<string>();
            try
            {
                return JsonSerializer.Deserialize<List<string>>(json.Trim()) ?? new List<string>();
            }
            catch (JsonException)
            {
                return new List<string>();
            }
        }

        // ── Student ──────────────────────────────────────────────────────────
        private async Task<IActionResult> GetStudentInfo(int userId)
        {
            var profile = await _db.StudentProfiles
                .Include(s => s.User)
                .FirstOrDefaultAsync(s => s.UserId == userId);

            if (profile == null)
                return NotFound(new { message = "Student profile not found." });

            // IDs → أسماء من جدول skills
            var roles           = await SkillHelper.IdsJsonToNames(_db, profile.Roles);
            var technicalSkills = await SkillHelper.IdsJsonToNames(_db, profile.TechnicalSkills);
            var tools           = await SkillHelper.IdsJsonToNames(_db, profile.Tools);

            return Ok(new
            {
                role         = "student",
                userId       = profile.UserId,
                profileId    = profile.Id,
                name         = profile.User.Name,
                email        = profile.User.Email,
                studentId    = profile.StudentId,
                university   = profile.University,
                faculty      = profile.Faculty,
                major        = profile.Major,
                academicYear = profile.AcademicYear,
                gpa          = profile.Gpa,
                bio          = profile.Bio,
                availability         = profile.Availability,
                lookingFor           = profile.LookingFor,
                github               = profile.Github,
                linkedin             = profile.Linkedin,
                portfolio            = profile.Portfolio,
                profilePictureBase64 = profile.ProfilePictureBase64,
                languages            = SkillHelper.ParseStringList(profile.Languages),
                // الحقول الرئيسية
                roles           = roles,
                technicalSkills = technicalSkills,
                tools           = tools,
                // للتوافق مع ProfilePage.tsx اللي بيستخدم generalSkills/majorSkills
                generalSkills   = roles,
                majorSkills     = technicalSkills,
            });
        }

        // ── Doctor ───────────────────────────────────────────────────────────
        private async Task<IActionResult> GetDoctorInfo(int userId)
        {
            var dp = await _db.DoctorProfiles
                .AsNoTracking()
                .Include(d => d.User)
                .FirstOrDefaultAsync(d => d.UserId == userId);

            if (dp == null)
                return NotFound(new { message = "Doctor profile not found." });

            var u = dp.User;
            var technicalSkills = DeserializeList(dp.TechnicalSkills);
            var researchSkills = DeserializeList(dp.ResearchSkills);

            return Ok(new
            {
                role = "doctor",
                userId = dp.UserId,
                profileId = dp.Id,
                user = new
                {
                    userId = u.Id,
                    name = u.Name,
                    email = u.Email,
                    profilePictureBase64 = dp.ProfilePictureBase64,
                    role = "doctor",
                },
                doctorProfile = new
                {
                    profileId = dp.Id,
                    department = dp.Department,
                    faculty = dp.Faculty,
                    specialization = dp.Specialization,
                    university = dp.University,
                    yearsOfExperience = dp.YearsOfExperience,
                    linkedin = dp.Linkedin,
                    officeHours = dp.OfficeHours,
                    bio = dp.Bio,
                    profilePictureBase64 = dp.ProfilePictureBase64,
                    technicalSkills,
                    researchSkills,
                },
            });
        }

        // ── Company ──────────────────────────────────────────────────────────
        private async Task<IActionResult> GetCompanyInfo(int userId)
        {
            var profile = await _db.CompanyProfiles
                .Include(c => c.User)
                .FirstOrDefaultAsync(c => c.UserId == userId);

            if (profile == null)
                return NotFound(new { message = "Company profile not found." });

            return Ok(new
            {
                role        = "company",
                userId      = profile.UserId,
                profileId   = profile.Id,
                name        = profile.User.Name,
                email       = profile.User.Email,
                companyName = profile.CompanyName,
                industry    = profile.Industry,
                description = profile.Description
            });
        }

        // ── Student Association ────────────────────────────────────────────────
        private async Task<IActionResult> GetStudentAssociationInfo(int userId)
        {
            var profile = await _db.StudentAssociationProfiles
                .Include(a => a.User)
                .FirstOrDefaultAsync(a => a.UserId == userId);

            if (profile == null)
                return NotFound(new { message = "Association profile not found." });

            return Ok(new
            {
                role = "studentassociation",
                userId = profile.UserId,
                profileId = profile.Id,
                name = profile.User.Name,
                email = profile.User.Email,
                associationName = profile.AssociationName,
                username = profile.Username,
                description = profile.Description,
                faculty = profile.Faculty,
                category = profile.Category,
                logoUrl = profile.LogoUrl,
                instagramUrl = profile.InstagramUrl,
                facebookUrl = profile.FacebookUrl,
                linkedInUrl = profile.LinkedInUrl,
                isVerified = profile.IsVerified,
                createdAt = profile.CreatedAt,
            });
        }

        // ── Admin ─────────────────────────────────────────────────────────────
        private async Task<IActionResult> GetAdminInfo(int userId)
        {
            var user = await _db.Users.FindAsync(userId);
            if (user == null) return NotFound();
            return Ok(new { role = "admin", userId = user.Id, name = user.Name, email = user.Email });
        }
    }
}
