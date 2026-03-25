using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GraduationProject.API.Data;

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
                var commonSkills      = mySkills.Intersect(theirSkills).Count();
                var complementary     = theirSkills.Except(mySkills).Count();
                var matchScore        = (int)(
                    (commonSkills  * 0.6 / System.Math.Max(mySkills.Count, 1)  * 100) +
                    (complementary * 0.4 / System.Math.Max(theirSkills.Count, 1) * 100)
                );
                matchScore = System.Math.Min(matchScore, 100);

                return new
                {
                    userId       = s.UserId,
                    profileId    = s.Id,
                    name         = s.User.Name,
                    university   = s.University ?? "",
                    major        = s.Major ?? "",
                    academicYear = s.AcademicYear ?? "",
                    skills       = theirSkills.Take(4).ToList(),
                    matchScore,
                    profilePicture = s.ProfilePictureBase64,
                };
            })
            .OrderByDescending(s => s.matchScore)
            .ToList();

            return Ok(result);
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
