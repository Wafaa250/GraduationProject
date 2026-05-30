using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using GraduationProject.API.Data;
using GraduationProject.API.Helpers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GraduationProject.API.Controllers
{
    [ApiController]
    [Route("api/doctors")]
    [Authorize]
    public class DoctorsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        public DoctorsController(ApplicationDbContext db) => _db = db;

        // GET /api/doctors?search=keyword
        [HttpGet]
        public async Task<IActionResult> GetDoctors([FromQuery] string? search)
        {
            var query = _db.DoctorProfiles
                .AsNoTracking()
                .Include(d => d.User)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim().ToLower();

                // Course search by course name/code/semester for doctor's courses
                var matchingDoctorIdsByCourse = await _db.Courses
                    .AsNoTracking()
                    .Where(c =>
                        (c.Name != null && c.Name.ToLower().Contains(term)) ||
                        (c.Code != null && c.Code.ToLower().Contains(term)) ||
                        (c.Semester != null && c.Semester.ToLower().Contains(term)))
                    .Select(c => c.DoctorId)
                    .Distinct()
                    .ToListAsync();

                query = query.Where(d =>
                    (d.User.Name != null && d.User.Name.ToLower().Contains(term)) ||
                    (d.User.Email != null && d.User.Email.ToLower().Contains(term)) ||
                    (d.Specialization != null && d.Specialization.ToLower().Contains(term)) ||
                    (d.Faculty != null && d.Faculty.ToLower().Contains(term)) ||
                    matchingDoctorIdsByCourse.Contains(d.Id));
            }

            var doctors = await query
                .OrderBy(d => d.User.Name)
                .ToListAsync();

            var doctorIds = doctors.Select(d => d.Id).ToList();
            var courseCounts = await _db.Courses
                .AsNoTracking()
                .Where(c => doctorIds.Contains(c.DoctorId))
                .GroupBy(c => c.DoctorId)
                .Select(g => new { doctorId = g.Key, count = g.Count() })
                .ToDictionaryAsync(x => x.doctorId, x => x.count);

            var result = doctors.Select(d => new
            {
                userId = d.UserId,
                profileId = d.Id,
                name = d.User.Name,
                email = d.User.Email,
                specialization = d.Specialization ?? string.Empty,
                faculty = d.Faculty ?? string.Empty,
                university = d.University ?? string.Empty,
                department = d.Department ?? string.Empty,
                coursesCount = courseCounts.TryGetValue(d.Id, out var count) ? count : 0,
            });

            return Ok(result);
        }

        // GET /api/doctors/{doctorId}
        [HttpGet("{doctorId:int}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetDoctorById(int doctorId)
        {
            var doctor = await _db.DoctorProfiles
                .AsNoTracking()
                .Include(d => d.User)
                .FirstOrDefaultAsync(d => d.UserId == doctorId);

            if (doctor == null)
                return NotFound(new { message = "Doctor profile not found." });

            List<string> technicalSkills = DeserializeStringList(doctor.TechnicalSkills);
            List<string> researchSkills = DeserializeStringList(doctor.ResearchSkills);

            return Ok(new
            {
                userId = doctor.UserId,
                profileId = doctor.Id,
                user = new
                {
                    userId = doctor.User.Id,
                    name = doctor.User.Name,
                    email = doctor.User.Email,
                    profilePictureBase64 = doctor.ProfilePictureBase64,
                    role = "doctor",
                },
                doctorProfile = new
                {
                    profileId = doctor.Id,
                    department = doctor.Department,
                    faculty = doctor.Faculty,
                    specialization = doctor.Specialization,
                    university = doctor.University,
                    yearsOfExperience = doctor.YearsOfExperience,
                    linkedin = doctor.Linkedin,
                    officeHours = doctor.OfficeHours,
                    bio = doctor.Bio,
                    profilePictureBase64 = doctor.ProfilePictureBase64,
                    technicalSkills,
                    researchSkills,
                },
            });
        }

        private static List<string> DeserializeStringList(string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
                return new List<string>();

            try
            {
                return JsonSerializer.Deserialize<List<string>>(value.Trim()) ?? new List<string>();
            }
            catch
            {
                return new List<string>();
            }
        }
    }
}
