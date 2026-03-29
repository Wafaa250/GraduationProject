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
    [Route("api/students")]
    [Authorize]
    public class StudentsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;

        public StudentsController(ApplicationDbContext db)
        {
            _db = db;
        }

        // =====================================================
        // GET /api/students
        // يرجع قائمة الطلاب مع matchScore للطالب الحالي
        // Query params: skill, university, major, search
        // =====================================================
        [HttpGet]
        public async Task<IActionResult> GetStudents(
            [FromQuery] string? skill,
            [FromQuery] string? university,
            [FromQuery] string? major,
            [FromQuery] string? search)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userIdClaim == null) return Unauthorized();
            var userId = int.Parse(userIdClaim);

            // مهارات الطالب الحالي لحساب الـ matchScore
            var mySkills = await _db.StudentSkills
                .Where(ss => ss.Student.UserId == userId)
                .Select(ss => ss.Skill.Name)
                .ToListAsync();

            // جلب كل الطلاب ما عدا الحالي
            var query = _db.StudentProfiles
                .Include(s => s.User)
                .Include(s => s.StudentSkills)
                    .ThenInclude(ss => ss.Skill)
                .Where(s => s.UserId != userId);

            // فلتر بالجامعة
            if (!string.IsNullOrEmpty(university))
                query = query.Where(s => s.University != null && s.University == university);

            // فلتر بالتخصص
            if (!string.IsNullOrEmpty(major))
                query = query.Where(s => s.Major != null && s.Major == major);

            // فلتر بالمهارة
            if (!string.IsNullOrEmpty(skill))
                query = query.Where(s => s.StudentSkills.Any(ss => ss.Skill.Name == skill));

            // بحث بالاسم
            if (!string.IsNullOrEmpty(search))
                query = query.Where(s => s.User.Name.Contains(search));

            var students = await query.ToListAsync();

            var result = students.Select(s =>
            {
                var theirSkills = s.StudentSkills.Select(ss => ss.Skill.Name).ToList();

                // حساب الـ matchScore
                var commonSkills = mySkills.Intersect(theirSkills).Count();
                var complementary = theirSkills.Except(mySkills).Count();
                var matchScore = (int)(
                    (commonSkills * 0.6 / System.Math.Max(mySkills.Count, 1) * 100) +
                    (complementary * 0.4 / System.Math.Max(theirSkills.Count, 1) * 100)
                );
                matchScore = System.Math.Min(matchScore, 100);

                return new
                {
                    userId = s.UserId,
                    profileId = s.Id,
                    name = s.User.Name,
                    university = s.University ?? "",
                    major = s.Major ?? "",
                    academicYear = s.AcademicYear ?? "",
                    skills = theirSkills.Take(4).ToList(),
                    matchScore,
                    profilePicture = s.ProfilePictureBase64,
                };
            })
            .OrderByDescending(s => s.matchScore)
            .ToList();

            return Ok(result);
        }

        // =====================================================
        // GET /api/students/{userId}
        // يرجع بروفايل طالب كامل بالـ userId
        // الوصول: الطالب نفسه أو doctor
        // =====================================================
        [HttpGet("{userId:int}")]
        public async Task<IActionResult> GetStudentById(int userId)
        {
            var currentUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var role = AuthorizationHelper.GetRole(User);

            // صلاحية: الطالب نفسه أو doctor
            var isDoctor = role == "doctor";
            var isSelf = role == "student" && currentUserId == userId;

            if (!isDoctor && !isSelf)
                return Forbid();

            // جلب البروفايل مع User
            var profile = await _db.StudentProfiles
                .Include(s => s.User)
                .FirstOrDefaultAsync(s => s.UserId == userId);

            if (profile == null)
                return NotFound(new { message = "Student profile not found." });

            // IDs → أسماء
            var roles = await SkillHelper.IdsJsonToNames(_db, profile.Roles);
            var technicalSkills = await SkillHelper.IdsJsonToNames(_db, profile.TechnicalSkills);
            var tools = await SkillHelper.IdsJsonToNames(_db, profile.Tools);

            // حساب الـ matchScore (بس إذا الطالب الحالي مش نفسه)
            int? matchScore = null;
            if (role == "student" && currentUserId != userId)
            {
                var myIds = SkillHelper.ParseIntList(
                                   (await _db.StudentProfiles
                                       .FirstOrDefaultAsync(s => s.UserId == currentUserId))?.Roles);
                var theirIds = SkillHelper.ParseIntList(profile.Roles);

                var common = myIds.Intersect(theirIds).Count();
                var complementary = theirIds.Except(myIds).Count();
                matchScore = (int)(
                    (common * 0.6 / System.Math.Max(myIds.Count, 1) * 100) +
                    (complementary * 0.4 / System.Math.Max(theirIds.Count, 1) * 100)
                );
                matchScore = System.Math.Min(matchScore.Value, 100);
            }

            return Ok(new
            {
                userId = profile.UserId,
                profileId = profile.Id,
                name = profile.User.Name,
                email = profile.User.Email,
                studentId = profile.StudentId ?? "",
                university = profile.University ?? "",
                faculty = profile.Faculty ?? "",
                major = profile.Major ?? "",
                academicYear = profile.AcademicYear ?? "",
                gpa = profile.Gpa,
                bio = profile.Bio ?? "",
                availability = profile.Availability ?? "",
                lookingFor = profile.LookingFor ?? "",
                github = profile.Github ?? "",
                linkedin = profile.Linkedin ?? "",
                portfolio = profile.Portfolio ?? "",
                profilePictureBase64 = profile.ProfilePictureBase64,
                languages = SkillHelper.ParseStringList(profile.Languages),
                roles,
                technicalSkills,
                tools,
                // للتوافق مع الفرونت
                generalSkills = roles,
                majorSkills = technicalSkills,
                matchScore,          // null لو doctor أو نفس الطالب
            });
        }

        // =====================================================
        // PUT /api/students/{userId}
        // تعديل بروفايل الطالب — الطالب نفسه فقط
        // =====================================================
        [HttpPut("{userId:int}")]
        public async Task<IActionResult> UpdateStudent(int userId, [FromBody] UpdateProfileDto dto)
        {
            var currentUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var role = AuthorizationHelper.GetRole(User);

            // الطالب نفسه بس
            if (role != "student" || currentUserId != userId)
                return Forbid();

            var profile = await _db.StudentProfiles
                .Include(s => s.User)
                .FirstOrDefaultAsync(s => s.UserId == userId);

            if (profile == null)
                return NotFound(new { message = "Student profile not found." });

            // ── User ──────────────────────────────────────────────────────────
            if (!string.IsNullOrWhiteSpace(dto.FullName))
                profile.User.Name = dto.FullName.Trim();

            // ── Profile fields ────────────────────────────────────────────────
            if (dto.Bio != null) profile.Bio = dto.Bio;
            if (dto.Availability != null) profile.Availability = dto.Availability;
            if (dto.LookingFor != null) profile.LookingFor = dto.LookingFor;
            if (dto.Github != null) profile.Github = dto.Github;
            if (dto.Linkedin != null) profile.Linkedin = dto.Linkedin;
            if (dto.Portfolio != null) profile.Portfolio = dto.Portfolio;
            if (dto.ProfilePictureBase64 != null)
                profile.ProfilePictureBase64 = dto.ProfilePictureBase64;

            // ── Languages ─────────────────────────────────────────────────────
            if (dto.Languages != null)
                profile.Languages = System.Text.Json.JsonSerializer.Serialize(dto.Languages);

            // ── Skills: اسم → ID (مع إنشاء تلقائي لو مش موجود) ──────────────
            if (dto.Roles != null)
                profile.Roles = await SkillHelper.NamesToIdsJson(_db, dto.Roles, "role");

            if (dto.TechnicalSkills != null)
                profile.TechnicalSkills = await SkillHelper.NamesToIdsJson(_db, dto.TechnicalSkills, "technical");

            if (dto.Tools != null)
                profile.Tools = await SkillHelper.NamesToIdsJson(_db, dto.Tools, "tool");

            // للتوافق مع الفرونت القديم
            if (dto.GeneralSkills != null && dto.Roles == null)
                profile.Roles = await SkillHelper.NamesToIdsJson(_db, dto.GeneralSkills, "role");

            if (dto.MajorSkills != null && dto.TechnicalSkills == null)
                profile.TechnicalSkills = await SkillHelper.NamesToIdsJson(_db, dto.MajorSkills, "technical");

            await _db.SaveChangesAsync();

            return Ok(new { message = "Profile updated successfully." });
        }

        // =====================================================
        // GET /api/students/filters
        // يرجع قيم الفلاتر المتاحة (جامعات، تخصصات، مهارات)
        // =====================================================
        [HttpGet("filters")]
        public async Task<IActionResult> GetFilters()
        {
            var universities = await _db.StudentProfiles
                .Where(s => s.University != null)
                .Select(s => s.University!)
                .Distinct()
                .OrderBy(u => u)
                .ToListAsync();

            var majors = await _db.StudentProfiles
                .Where(s => s.Major != null)
                .Select(s => s.Major!)
                .Distinct()
                .OrderBy(m => m)
                .ToListAsync();

            var skills = await _db.Skills
                .Select(s => s.Name)
                .OrderBy(s => s)
                .ToListAsync();

            return Ok(new { universities, majors, skills });
        }
    }
}