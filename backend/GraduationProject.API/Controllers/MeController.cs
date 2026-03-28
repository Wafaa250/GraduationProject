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
            var role   = AuthorizationHelper.GetRole(User);

            return role switch
            {
                "student"     => await GetStudentInfo(userId),
                "doctor"      => await GetDoctorInfo(userId),
                "company"     => await GetCompanyInfo(userId),
                "association" => await GetAssociationInfo(userId),
                "admin"       => await GetAdminInfo(userId),
                _             => Unauthorized(new { message = "Unknown role." })
            };
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
            var profile = await _db.DoctorProfiles
                .Include(d => d.User)
                .FirstOrDefaultAsync(d => d.UserId == userId);

            if (profile == null)
                return NotFound(new { message = "Doctor profile not found." });

            return Ok(new
            {
                role                = "doctor",
                userId              = profile.UserId,
                profileId           = profile.Id,
                name                = profile.User.Name,
                email               = profile.User.Email,
                specialization      = profile.Specialization,
                supervisionCapacity = profile.SupervisionCapacity,
                bio                 = profile.Bio
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

        // ── Association ──────────────────────────────────────────────────────
        private async Task<IActionResult> GetAssociationInfo(int userId)
        {
            var profile = await _db.AssociationProfiles
                .Include(a => a.User)
                .FirstOrDefaultAsync(a => a.UserId == userId);

            if (profile == null)
                return NotFound(new { message = "Association profile not found." });

            return Ok(new
            {
                role            = "association",
                userId          = profile.UserId,
                profileId       = profile.Id,
                name            = profile.User.Name,
                email           = profile.User.Email,
                associationName = profile.AssociationName,
                description     = profile.Description
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
