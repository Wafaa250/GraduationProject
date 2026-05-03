using System.Text.Json;
using GraduationProject.API.DTOs;
using GraduationProject.API.Helpers;
using GraduationProject.API.Interfaces;
using GraduationProject.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GraduationProject.API.Controllers
{
    [ApiController]
    [Route("api/courses")]
    public class CoursesController : ControllerBase
    {
        private readonly ICourseRepository _courseRepo;
        private readonly ICourseSectionRepository _sectionRepo;

        public CoursesController(
            ICourseRepository courseRepo,
            ICourseSectionRepository sectionRepo)
        {
            _courseRepo = courseRepo;
            _sectionRepo = sectionRepo;
        }

        // ============================================================
        // GET /api/courses/my  (doctor)
        // ============================================================
        [HttpGet("my")]
        [Authorize(Roles = "doctor")]
        public async Task<IActionResult> GetMyCourses()
        {
            var doctorId = await GetCurrentDoctorIdAsync();
            if (doctorId == null)
                return Unauthorized(new { message = "Doctor profile not found." });

            var courses = await _courseRepo.GetByDoctorIdAsync(doctorId.Value);
            return Ok(courses.Select(MapCourseToDto));
        }

        // ============================================================
        // GET /api/courses/enrolled  (student)
        // ============================================================
        [HttpGet("enrolled")]
        [Authorize(Roles = "student")]
        public async Task<IActionResult> GetEnrolledCourses()
        {
            var studentId = await GetCurrentStudentIdAsync();
            if (studentId == null)
                return Unauthorized(new { message = "Student profile not found." });

            var enrollments = await _sectionRepo.GetEnrolledSectionsByStudentAsync(studentId.Value);

            var result = enrollments.Select(e => new EnrolledCourseResponseDto
            {
                CourseId = e.Section.Course.Id,
                Name = e.Section.Course.Name,
                Code = e.Section.Course.Code,
                Semester = e.Section.Course.Semester,
                DoctorId = e.Section.Course.DoctorId,
                DoctorName = e.Section.Course.Doctor?.User?.Name ?? string.Empty,
                Section = new EnrolledSectionDto
                {
                    SectionId = e.Section.Id,
                    SectionName = e.Section.Name,
                },
            });

            return Ok(result);
        }

        // ============================================================
        // POST /api/courses  (doctor)
        // ============================================================
        [HttpPost]
        [Authorize(Roles = "doctor")]
        public async Task<IActionResult> CreateCourse([FromBody] CreateCourseDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var doctorId = await GetCurrentDoctorIdAsync();
            if (doctorId == null)
                return Unauthorized(new { message = "Doctor profile not found." });

            var course = new Course
            {
                Name = dto.Name.Trim(),
                Code = dto.Code.Trim().ToUpper(),
                Semester = string.IsNullOrWhiteSpace(dto.Semester) ? null : dto.Semester.Trim(),
                DoctorId = doctorId.Value,
                CreatedAt = DateTime.UtcNow,
            };

            var created = await _courseRepo.CreateAsync(course);
            return CreatedAtAction(
                nameof(GetCourseById),
                new { courseId = created.Id },
                MapCourseToDto(created));
        }

        // ============================================================
        // GET /api/courses/{courseId}  (doctor + student)
        // ============================================================
        [HttpGet("{courseId:int}")]
        [Authorize(Roles = "doctor,student")]
        public async Task<IActionResult> GetCourseById(int courseId)
        {
            var role = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value ?? "";

            var course = await _courseRepo.GetByIdAsync(courseId);
            if (course == null)
                return NotFound(new { message = "Course not found." });

            if (role == "doctor")
            {
                var doctorId = await GetCurrentDoctorIdAsync();
                if (doctorId == null || course.DoctorId != doctorId.Value)
                    return NotFound(new { message = "Course not found." });
            }
            else
            {
                // Student: verify they are enrolled in this course
                var studentId = await GetCurrentStudentIdAsync();
                if (studentId == null)
                    return Unauthorized(new { message = "Student profile not found." });

                var enrollments = await _sectionRepo.GetEnrolledSectionsByStudentAsync(studentId.Value);
                var isEnrolled = enrollments.Any(e => e.Section.CourseId == courseId);
                if (!isEnrolled)
                    return NotFound(new { message = "Course not found." });
            }

            return Ok(MapCourseToDto(course));
        }

        // ============================================================
        // GET /api/courses/{courseId}/sections  (doctor)
        // ============================================================
        [HttpGet("{courseId:int}/sections")]
        [Authorize(Roles = "doctor")]
        public async Task<IActionResult> GetSections(int courseId)
        {
            var doctorId = await GetCurrentDoctorIdAsync();
            if (doctorId == null)
                return Unauthorized(new { message = "Doctor profile not found." });

            var course = await _courseRepo.GetByIdAsync(courseId);
            if (course == null || course.DoctorId != doctorId.Value)
                return NotFound(new { message = "Course not found." });

            var sections = await _sectionRepo.GetByCourseIdAsync(courseId);
            return Ok(sections.Select(MapSectionToDto));
        }

        // ============================================================
        // POST /api/courses/{courseId}/sections  (doctor)
        // ============================================================
        [HttpPost("{courseId:int}/sections")]
        [Authorize(Roles = "doctor")]
        public async Task<IActionResult> CreateSection(
            int courseId,
            [FromBody] CreateCourseSectionDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var doctorId = await GetCurrentDoctorIdAsync();
            if (doctorId == null)
                return Unauthorized(new { message = "Doctor profile not found." });

            var course = await _courseRepo.GetByIdAsync(courseId);
            if (course == null || course.DoctorId != doctorId.Value)
                return NotFound(new { message = "Course not found." });

            var section = new CourseSection
            {
                CourseId = courseId,
                Name = dto.Name.Trim(),
                Days = JsonSerializer.Serialize(dto.Days),
                TimeFrom = string.IsNullOrWhiteSpace(dto.TimeFrom) ? null : dto.TimeFrom.Trim(),
                TimeTo = string.IsNullOrWhiteSpace(dto.TimeTo) ? null : dto.TimeTo.Trim(),
                Capacity = dto.Capacity,
                CreatedAt = DateTime.UtcNow,
            };

            var created = await _sectionRepo.CreateAsync(section);
            return CreatedAtAction(
                nameof(GetSections),
                new { courseId },
                MapSectionToDto(created));
        }

        // ============================================================
        // GET /api/courses/sections/{sectionId}/students  (doctor)
        // ============================================================
        [HttpGet("sections/{sectionId:int}/students")]
        [Authorize(Roles = "doctor")]
        public async Task<IActionResult> GetSectionStudents(int sectionId)
        {
            var doctorId = await GetCurrentDoctorIdAsync();
            if (doctorId == null)
                return Unauthorized(new { message = "Doctor profile not found." });

            var section = await _sectionRepo.GetByIdAsync(sectionId);
            if (section == null)
                return NotFound(new { message = "Section not found." });

            var course = await _courseRepo.GetByIdAsync(section.CourseId);
            if (course == null || course.DoctorId != doctorId.Value)
                return Forbid();

            var enrollments = await _sectionRepo.GetStudentsAsync(sectionId);
            return Ok(enrollments.Select(MapEnrollmentToDto));
        }

        // ============================================================
        // POST /api/courses/sections/{sectionId}/students  (doctor)
        // ============================================================
        [HttpPost("sections/{sectionId:int}/students")]
        [Authorize(Roles = "doctor")]
        public async Task<IActionResult> AddSectionStudents(
            int sectionId,
            [FromBody] AddSectionStudentsDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var doctorId = await GetCurrentDoctorIdAsync();
            if (doctorId == null)
                return Unauthorized(new { message = "Doctor profile not found." });

            var section = await _sectionRepo.GetByIdAsync(sectionId);
            if (section == null)
                return NotFound(new { message = "Section not found." });

            var course = await _courseRepo.GetByIdAsync(section.CourseId);
            if (course == null || course.DoctorId != doctorId.Value)
                return Forbid();

            var (added, notFound, alreadyEnrolled) =
                await _sectionRepo.AddStudentsAsync(sectionId, dto.StudentIds);

            return Ok(new AddSectionStudentsResultDto
            {
                Added = added.Count,
                NotFound = notFound,
                AlreadyEnrolled = alreadyEnrolled,
            });
        }

        // ============================================================
        // PRIVATE HELPERS
        // ============================================================
        private async Task<int?> GetCurrentDoctorIdAsync()
        {
            var userId = AuthorizationHelper.GetUserId(User);
            if (userId == 0) return null;
            return await _courseRepo.GetDoctorProfileIdByUserIdAsync(userId);
        }

        private async Task<int?> GetCurrentStudentIdAsync()
        {
            var userId = AuthorizationHelper.GetUserId(User);
            if (userId == 0) return null;
            return await _courseRepo.GetStudentProfileIdByUserIdAsync(userId);
        }

        private static CourseResponseDto MapCourseToDto(Course c) => new()
        {
            CourseId = c.Id,
            Name = c.Name,
            Code = c.Code,
            Semester = c.Semester,
            CreatedAt = c.CreatedAt,
            DoctorId = c.DoctorId,
            DoctorName = c.Doctor?.User?.Name ?? string.Empty,
        };

        private static CourseSectionResponseDto MapSectionToDto(CourseSection s)
        {
            List<string> days;
            try { days = JsonSerializer.Deserialize<List<string>>(s.Days) ?? new(); }
            catch { days = new(); }

            return new CourseSectionResponseDto
            {
                Id = s.Id,
                CourseId = s.CourseId,
                Name = s.Name,
                Days = days,
                TimeFrom = s.TimeFrom,
                TimeTo = s.TimeTo,
                Capacity = s.Capacity,
                CreatedAt = s.CreatedAt,
            };
        }

        private static SectionStudentResponseDto MapEnrollmentToDto(SectionEnrollment e) => new()
        {
            StudentId = e.StudentProfileId,
            Name = e.Student?.User?.Name,
            UniversityId = e.Student?.StudentId,
            University = e.Student?.University,
            Major = e.Student?.Major,
            Email = e.Student?.User?.Email,
            EnrolledAt = e.EnrolledAt,
        };
    }
}