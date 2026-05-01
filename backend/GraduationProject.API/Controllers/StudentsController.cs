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
            [FromQuery] string? search,
            [FromQuery] bool availableOnly = false)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userIdClaim == null) return Unauthorized();
            var userId = int.Parse(userIdClaim);

            // ✅ اقرأ مهارات الطالب الحالي من JSON fields مش من StudentSkills
            var myProfile = await _db.StudentProfiles
                .FirstOrDefaultAsync(s => s.UserId == userId);

            var myIds = myProfile != null
                ? SkillHelper.ParseIntList(myProfile.Roles)
                    .Concat(SkillHelper.ParseIntList(myProfile.TechnicalSkills))
                    .Concat(SkillHelper.ParseIntList(myProfile.Tools))
                    .ToList()
                : new List<int>();

            // جلب كل الطلاب ما عدا الحالي
            var query = _db.StudentProfiles
                .Include(s => s.User)
                .Where(s => s.UserId != userId)
                .AsNoTracking();

            // فلتر بالجامعة
            if (!string.IsNullOrEmpty(university))
                query = query.Where(s => s.University != null && s.University == university);

            // فلتر بالتخصص
            if (!string.IsNullOrEmpty(major))
                query = query.Where(s => s.Major != null && s.Major == major);

            // ✅ فلتر بالمهارة من Skills table عبر JSON ids
            if (!string.IsNullOrEmpty(skill))
            {
                var matchingSkill = await _db.Skills.FirstOrDefaultAsync(s => s.Name == skill);
                if (matchingSkill != null)
                {
                    var idStr = matchingSkill.Id.ToString();
                    query = query.Where(s =>
                        (s.Roles           != null && s.Roles.Contains(idStr)) ||
                        (s.TechnicalSkills != null && s.TechnicalSkills.Contains(idStr)) ||
                        (s.Tools           != null && s.Tools.Contains(idStr)));
                }
                else
                {
                    // مهارة غير موجودة في الـ DB → لا تُرجع نتائج
                    return Ok(new List<object>());
                }
            }

            // بحث عام (الاسم/الإيميل/التخصص/الكلية/الجامعة/المهارات)
            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim().ToLower();
                var matchingSkillIds = await _db.Skills
                    .AsNoTracking()
                    .Where(sk => sk.Name.ToLower().Contains(term))
                    .Select(sk => sk.Id.ToString())
                    .ToListAsync();

                query = query.Where(s =>
                    (s.User.Name != null && s.User.Name.ToLower().Contains(term)) ||
                    (s.User.Email != null && s.User.Email.ToLower().Contains(term)) ||
                    (s.Major != null && s.Major.ToLower().Contains(term)) ||
                    (s.Faculty != null && s.Faculty.ToLower().Contains(term)) ||
                    (s.University != null && s.University.ToLower().Contains(term)) ||
                    (s.Roles != null && (
                        s.Roles.ToLower().Contains(term) ||
                        matchingSkillIds.Any(id => s.Roles.Contains(id))
                    )) ||
                    (s.TechnicalSkills != null && (
                        s.TechnicalSkills.ToLower().Contains(term) ||
                        matchingSkillIds.Any(id => s.TechnicalSkills.Contains(id))
                    )) ||
                    (s.Tools != null && (
                        s.Tools.ToLower().Contains(term) ||
                        matchingSkillIds.Any(id => s.Tools.Contains(id))
                    ))
                );
            }

            // فلتر الطلاب المتاحين فقط (ما عندهم مشروع كـ owner أو member)
            if (availableOnly)
            {
                // IDs of students who own a project
                var ownerIds = await _db.StudentProjects
                    .Select(p => p.OwnerId)
                    .ToListAsync();

                // IDs of students who are members in any project
                var memberIds = await _db.StudentProjectMembers
                    .Select(m => m.StudentId)
                    .ToListAsync();

                var unavailableIds = ownerIds.Union(memberIds).ToHashSet();

                query = query.Where(s => !unavailableIds.Contains(s.Id));
            }

            var students = await query.ToListAsync();

            var result = new List<object>();

            foreach (var s in students)
            {
                // ✅ اقرأ مهاراتهم من JSON fields
                var theirIds = SkillHelper.ParseIntList(s.Roles)
                    .Concat(SkillHelper.ParseIntList(s.TechnicalSkills))
                    .Concat(SkillHelper.ParseIntList(s.Tools))
                    .ToList();

                // حساب الـ matchScore
                var common        = myIds.Intersect(theirIds).Count();
                var complementary = theirIds.Except(myIds).Count();
                var matchScore    = (int)(
                    (common        * 0.6 / Math.Max(myIds.Count,    1) * 100) +
                    (complementary * 0.4 / Math.Max(theirIds.Count, 1) * 100)
                );
                matchScore = Math.Min(matchScore, 100);

                // ✅ جلب أسماء الـ roles للعرض (أول 4)
                var roleIds      = SkillHelper.ParseIntList(s.Roles).Take(4).ToList();
                var displayNames = await _db.Skills
                    .Where(sk => roleIds.Contains(sk.Id))
                    .Select(sk => sk.Name)
                    .ToListAsync();

                result.Add(new
                {
                    userId         = s.UserId,
                    profileId      = s.Id,
                    name           = s.User.Name,
                    university     = s.University   ?? "",
                    major          = s.Major        ?? "",
                    academicYear   = s.AcademicYear ?? "",
                    skills         = displayNames,
                    matchScore,
                    profilePicture = s.ProfilePictureBase64,
                });
            }

            return Ok(result.OrderByDescending(s => ((dynamic)s).matchScore).ToList());
        }

        // =====================================================
        // GET /api/students/{userId}
        // يرجع بروفايل طالب كامل بالـ userId
        // الوصول: الطالب نفسه أو doctor
        // =====================================================
        [HttpGet("{userId:int}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetStudentById(int userId)
        {
            try
            {
                // جلب البروفايل مع User
                var student = await _db.StudentProfiles
                    .Include(s => s.User)
                    .FirstOrDefaultAsync(s => s.UserId == userId);

                if (student == null)
                    return NotFound();

                // IDs → أسماء
                var roles           = await SkillHelper.IdsJsonToNames(_db, student.Roles);
                var technicalSkills = await SkillHelper.IdsJsonToNames(_db, student.TechnicalSkills);
                var tools           = await SkillHelper.IdsJsonToNames(_db, student.Tools);

                // حساب الـ matchScore فقط إذا المستخدم الحالي طالب ومسجّل دخول
                int? matchScore = null;
                var currentUserIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var role = AuthorizationHelper.GetRole(User);
                if (!string.IsNullOrWhiteSpace(currentUserIdClaim)
                    && int.TryParse(currentUserIdClaim, out var currentUserId)
                    && role == "student"
                    && currentUserId != userId)
                {
                    var myIds = SkillHelper.ParseIntList(
                        (await _db.StudentProfiles
                            .FirstOrDefaultAsync(s => s.UserId == currentUserId))?.Roles);
                    var theirIds = SkillHelper.ParseIntList(student.Roles);

                    var common        = myIds.Intersect(theirIds).Count();
                    var complementary = theirIds.Except(myIds).Count();
                    matchScore = (int)(
                        (common        * 0.6 / Math.Max(myIds.Count,    1) * 100) +
                        (complementary * 0.4 / Math.Max(theirIds.Count, 1) * 100)
                    );
                    matchScore = Math.Min(matchScore.Value, 100);
                }

                return Ok(new
                {
                    userId               = student.UserId,
                    profileId            = student.Id,
                    name                 = student.User?.Name ?? "",
                    email                = student.User?.Email ?? "",
                    studentId            = student.StudentId   ?? "",
                    university           = student.University  ?? "",
                    faculty              = student.Faculty     ?? "",
                    major                = student.Major       ?? "",
                    academicYear         = student.AcademicYear ?? "",
                    gpa                  = student.Gpa,
                    bio                  = student.Bio         ?? "",
                    availability         = student.Availability ?? "",
                    lookingFor           = student.LookingFor  ?? "",
                    github               = student.Github      ?? "",
                    linkedin             = student.Linkedin    ?? "",
                    portfolio            = student.Portfolio   ?? "",
                    profilePictureBase64 = student.ProfilePictureBase64,
                    languages            = SkillHelper.ParseStringList(student.Languages),
                    roles,
                    technicalSkills,
                    tools,
                    // للتوافق مع الفرونت
                    generalSkills = roles,
                    majorSkills   = technicalSkills,
                    matchScore,
                });
            }
            catch (Exception)
            {
                return StatusCode(500, "Internal server error");
            }
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
            if (dto.Bio                  != null) profile.Bio                  = dto.Bio;
            if (dto.Availability         != null) profile.Availability         = dto.Availability;
            if (dto.LookingFor           != null) profile.LookingFor           = dto.LookingFor;
            if (dto.Github               != null) profile.Github               = dto.Github;
            if (dto.Linkedin             != null) profile.Linkedin             = dto.Linkedin;
            if (dto.Portfolio            != null) profile.Portfolio            = dto.Portfolio;
            if (dto.ProfilePictureBase64 != null) profile.ProfilePictureBase64 = dto.ProfilePictureBase64;

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
