// Controllers/CoursesController.cs
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GraduationProject.API.Data;
using GraduationProject.API.DTOs;
using GraduationProject.API.Helpers;
using GraduationProject.API.Models;

namespace GraduationProject.API.Controllers
{
    /// <summary>
    /// Course-based Team Formation module.
    /// Covers: Course CRUD, Enrollment management, and Course Project Settings.
    ///
    /// Role rules:
    ///   - Doctor  → create courses, manage enrollments, upsert project settings.
    ///   - Student → view courses they are enrolled in, leave courses.
    ///   - Both    → read course details (with access guard).
    /// </summary>
    [ApiController]
    [Route("api/courses")]
    [Authorize]
    public class CoursesController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly IWebHostEnvironment _env;

        public CoursesController(ApplicationDbContext db, IWebHostEnvironment env)
        {
            _db = db;
            _env = env;
        }

        // =====================================================================
        // POST /api/courses
        // Create a new course — doctor only.
        // Code must be unique per doctor (not globally).
        // =====================================================================
        [HttpPost]
        public async Task<IActionResult> CreateCourse([FromBody] CreateCourseDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var doctor = await GetCurrentDoctorProfileAsync();
            if (doctor == null)
                return StatusCode(403, new { message = "Only doctors can create courses." });

            // Code uniqueness per doctor (enforced by DB index ix_courses_doctor_code)
            var duplicate = await _db.Courses
                .AnyAsync(c => c.DoctorId == doctor.Id &&
                               c.Code.ToLower() == dto.Code.Trim().ToLower());

            if (duplicate)
                return Conflict(new { message = $"You already have a course with code '{dto.Code.Trim()}'." });

            var course = new Course
            {
                Name = dto.Name.Trim(),
                Code = dto.Code.Trim().ToUpper(),
                DoctorId = doctor.Id,
                CreatedAt = DateTime.UtcNow
            };

            _db.Courses.Add(course);
            await _db.SaveChangesAsync();

            return StatusCode(201, MapToCourseDto(course, doctor.User?.Name ?? string.Empty));
        }

        // =====================================================================
        // GET /api/courses/my
        // Returns all courses created by the logged-in doctor.
        // =====================================================================
        [HttpGet("my")]
        public async Task<IActionResult> GetMyCourses()
        {
            var doctor = await GetCurrentDoctorProfileAsync();
            if (doctor == null)
                return StatusCode(403, new { message = "Only doctors can access this endpoint." });

            var courses = await _db.Courses
                .Include(c => c.Doctor).ThenInclude(d => d.User)
                .Where(c => c.DoctorId == doctor.Id)
                .OrderByDescending(c => c.CreatedAt)
                .AsNoTracking()
                .ToListAsync();

            var result = courses.Select(c =>
                MapToCourseDto(c, c.Doctor?.User?.Name ?? string.Empty));

            return Ok(result);
        }

        // =====================================================================
        // GET /api/courses/enrolled
        // Returns all courses where the logged-in student is enrolled.
        // =====================================================================
        [HttpGet("enrolled")]
        public async Task<IActionResult> GetEnrolledCourses()
        {
            var student = await GetCurrentStudentProfileAsync();
            if (student == null)
                return StatusCode(403, new { message = "Only students can access this endpoint." });

            var courses = await _db.CourseEnrollments
                .Include(e => e.Course)
                    .ThenInclude(c => c.Doctor)
                    .ThenInclude(d => d.User)
                .Where(e => e.StudentId == student.Id)
                .OrderByDescending(e => e.CreatedAt)
                .AsNoTracking()
                .ToListAsync();

            var result = courses.Select(e =>
                MapToCourseDto(e.Course, e.Course.Doctor?.User?.Name ?? string.Empty));

            return Ok(result);
        }

        // =====================================================================
        // GET /api/courses/{courseId}
        // Returns full course details.
        //
        // Access guard:
        //   - Doctor must own the course.
        //   - Student must be enrolled in the course.
        // =====================================================================
        [HttpGet("{courseId:int}")]
        public async Task<IActionResult> GetCourseDetail(int courseId)
        {
            var course = await _db.Courses
                .Include(c => c.Doctor).ThenInclude(d => d.User)
                .Include(c => c.Enrollments)
                .Include(c => c.Teams)
                .Include(c => c.ProjectSettings)
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.Id == courseId);

            if (course == null)
                return NotFound(new { message = "Course not found." });

            // ── Access guard ──────────────────────────────────────────────────
            var role = AuthorizationHelper.GetRole(User);

            if (role == "doctor")
            {
                var doctor = await GetCurrentDoctorProfileAsync();
                if (doctor == null || course.DoctorId != doctor.Id)
                    return StatusCode(403, new { message = "Not authorized. You do not own this course." });
            }
            else if (role == "student")
            {
                var student = await GetCurrentStudentProfileAsync();
                if (student == null)
                    return Forbid();

                var isEnrolled = course.Enrollments.Any(e => e.StudentId == student.Id);
                if (!isEnrolled)
                    return StatusCode(403, new { message = "Not authorized. You are not enrolled in this course." });
            }
            else
            {
                return StatusCode(403, new { message = "Not authorized." });
            }

            // ── Active project setting ────────────────────────────────────────
            var activeSetting = course.ProjectSettings
                .Where(ps => ps.IsActive)
                .OrderByDescending(ps => ps.CreatedAt)
                .FirstOrDefault();

            var dto = new CourseDetailDto
            {
                Id = course.Id,
                Name = course.Name,
                Code = course.Code,
                DoctorId = course.DoctorId,
                DoctorName = course.Doctor?.User?.Name ?? string.Empty,
                StudentCount = course.Enrollments.Count,
                TeamCount = course.Teams.Count,
                CreatedAt = course.CreatedAt,
                ProjectSetting = activeSetting != null
                    ? MapToProjectSettingDto(activeSetting)
                    : null
            };

            return Ok(dto);
        }

        // =====================================================================
        // POST /api/courses/{courseId}/students
        // Enroll a list of students — doctor (course owner) only.
        // Duplicates are silently skipped.
        // =====================================================================
        [HttpPost("{courseId:int}/students")]
        public async Task<IActionResult> AddStudents(int courseId, [FromBody] AddStudentsDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var (course, guardResult) = await GetCourseWithDoctorGuardAsync(courseId);
            if (guardResult != null) return guardResult;

            // IDs of students already enrolled
            var existingStudentIds = (await _db.CourseEnrollments
            .Where(e => e.CourseId == courseId)
            .Select(e => e.StudentId)
            .ToListAsync())
            .ToHashSet();

            // Validate all requested IDs exist
            var validStudents = await _db.StudentProfiles
            .Where(s => s.StudentId != null && dto.StudentIds.Contains(s.StudentId))
            .ToListAsync();

            var validStudentIds = validStudents.Select(s => s.Id).ToList();

            var toAdd = validStudentIds
                .Where(id => !existingStudentIds.Contains(id))
                .ToList();

            foreach (var studentId in toAdd)
            {
                _db.CourseEnrollments.Add(new CourseEnrollment
                {
                    CourseId = courseId,
                    StudentId = studentId,
                    CreatedAt = DateTime.UtcNow
                });
            }

            await _db.SaveChangesAsync();

            return Ok(new
            {
                message = $"{toAdd.Count} student(s) enrolled successfully.",
                enrolled = toAdd.Count,
                skipped = dto.StudentIds.Count - validStudentIds.Count
            });
        }

        // =====================================================================
        // DELETE /api/courses/{courseId}/students/{studentId}
        // Remove a student — doctor (course owner) only.
        // Also removes the student from any team in this course.
        // If the student was a team leader:
        //   • remaining members exist → oldest member is promoted to leader.
        //   • no members remain       → the team is deleted.
        // =====================================================================
        [HttpDelete("{courseId:int}/students/{studentId:int}")]
        public async Task<IActionResult> RemoveStudent(int courseId, int studentId)
        {
            var (course, guardResult) = await GetCourseWithDoctorGuardAsync(courseId);
            if (guardResult != null) return guardResult;

            var enrollment = await _db.CourseEnrollments
                .FirstOrDefaultAsync(e => e.CourseId == courseId && e.StudentId == studentId);

            if (enrollment == null)
                return NotFound(new { message = "Student is not enrolled in this course." });

            // ── Remove from any team in this course ───────────────────────────
            await RemoveStudentFromCourseTeamsAsync(courseId, studentId);

            _db.CourseEnrollments.Remove(enrollment);
            await _db.SaveChangesAsync();

            return Ok(new { message = "Student removed from course." });
        }

        // =====================================================================
        // POST /api/courses/{courseId}/leave
        // Student leaves a course voluntarily.
        // Also removes the student from any team in this course.
        // If the student was a team leader:
        //   • remaining members exist → oldest member is promoted to leader.
        //   • no members remain       → the team is deleted.
        // =====================================================================
        [HttpPost("{courseId:int}/leave")]
        public async Task<IActionResult> LeaveCourse(int courseId)
        {
            var student = await GetCurrentStudentProfileAsync();
            if (student == null)
                return StatusCode(403, new { message = "Only students can leave courses." });

            var enrollment = await _db.CourseEnrollments
                .FirstOrDefaultAsync(e => e.CourseId == courseId && e.StudentId == student.Id);

            if (enrollment == null)
                return NotFound(new { message = "You are not enrolled in this course." });

            // ── Remove from any team in this course ───────────────────────────
            await RemoveStudentFromCourseTeamsAsync(courseId, student.Id);

            _db.CourseEnrollments.Remove(enrollment);
            await _db.SaveChangesAsync();

            return Ok(new { message = "You have left the course." });
        }

        // =====================================================================
        // GET /api/courses/{courseId}/students
        // Returns the list of enrolled students.
        //
        // Access guard: same as GetCourseDetail (doctor owns OR student enrolled).
        // =====================================================================
        [HttpGet("{courseId:int}/students")]
        public async Task<IActionResult> GetCourseStudents(int courseId)
        {
            var course = await _db.Courses
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.Id == courseId);

            if (course == null)
                return NotFound(new { message = "Course not found." });

            // ── Access guard ──────────────────────────────────────────────────
            var role = AuthorizationHelper.GetRole(User);

            if (role == "doctor")
            {
                var doctor = await GetCurrentDoctorProfileAsync();
                if (doctor == null || course.DoctorId != doctor.Id)
                    return StatusCode(403, new { message = "Not authorized. You do not own this course." });
            }
            else if (role == "student")
            {
                var student = await GetCurrentStudentProfileAsync();
                if (student == null) return Forbid();

                var isEnrolled = await _db.CourseEnrollments
                    .AnyAsync(e => e.CourseId == courseId && e.StudentId == student.Id);

                if (!isEnrolled)
                    return StatusCode(403, new { message = "Not authorized. You are not enrolled in this course." });
            }
            else
            {
                return StatusCode(403, new { message = "Not authorized." });
            }

            // ── Fetch enrollments with student data ───────────────────────────
            var enrollments = await _db.CourseEnrollments
                .Include(e => e.Student).ThenInclude(s => s.User)
                .Where(e => e.CourseId == courseId)
                .OrderBy(e => e.Student.User.Name)
                .AsNoTracking()
                .ToListAsync();

            var result = enrollments.Select(e => new CourseStudentDto
            {
                StudentId = e.StudentId,
                UserId = e.Student.UserId,
                Name = e.Student.User?.Name ?? string.Empty,
                Email = e.Student.User?.Email ?? string.Empty,
                University = e.Student.University ?? string.Empty,
                Major = e.Student.Major ?? string.Empty,
                AcademicYear = e.Student.AcademicYear ?? string.Empty,
                ProfilePictureBase64 = e.Student.ProfilePictureBase64,
                EnrolledAt = e.CreatedAt
            });

            return Ok(result);
        }

        // =====================================================================
        // POST /api/courses/{courseId}/project-setting
        // Create or update the active project setting — doctor (owner) only.
        //
        // Logic:
        //   - If an active setting already exists → update it in-place.
        //   - Otherwise → create a new one.
        //
        // File upload (optional):
        //   - Accepts any document (PDF, DOCX, …) via multipart/form-data.
        //   - Saved to wwwroot/project-files/ with a GUID-prefixed name.
        //   - FileUrl / FileName are only updated when a new file is supplied;
        //     omitting the file keeps the previously stored values intact.
        // =====================================================================
        [HttpPost("{courseId:int}/project-setting")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UpsertProjectSetting(
            int courseId, [FromForm] UpsertCourseProjectSettingDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var (course, guardResult) = await GetCourseWithDoctorGuardAsync(courseId);
            if (guardResult != null) return guardResult;

            // ── Optional file upload ──────────────────────────────────────────
            string? savedFileUrl = null;
            string? savedFileName = null;

            if (dto.File is { Length: > 0 })
            {
                var uploadsDir = Path.Combine(_env.WebRootPath, "project-files");
                Directory.CreateDirectory(uploadsDir);   // no-op if already exists

                // Preserve the original extension; prefix with a GUID to guarantee uniqueness.
                var extension = Path.GetExtension(dto.File.FileName);
                var uniqueFileName = $"{Guid.NewGuid()}{extension}";
                var filePath = Path.Combine(uploadsDir, uniqueFileName);

                await using (var stream = new FileStream(filePath, FileMode.Create))
                    await dto.File.CopyToAsync(stream);

                savedFileUrl = $"/project-files/{uniqueFileName}";
                savedFileName = dto.File.FileName;
            }

            // ── Upsert ────────────────────────────────────────────────────────
            var existing = await _db.CourseProjectSettings
                .FirstOrDefaultAsync(ps => ps.CourseId == courseId && ps.IsActive);

            if (existing != null)
            {
                // ── Update ────────────────────────────────────────────────────
                existing.Title = dto.Title.Trim();
                existing.Description = dto.Description?.Trim();
                existing.TeamSize = dto.TeamSize;
                existing.UpdatedAt = DateTime.UtcNow;

                // Only overwrite file fields when a new file was supplied.
                if (savedFileUrl is not null)
                {
                    existing.FileUrl = savedFileUrl;
                    existing.FileName = savedFileName;
                }

                await _db.SaveChangesAsync();
                return Ok(MapToProjectSettingDto(existing));
            }
            else
            {
                // ── Create ────────────────────────────────────────────────────
                var setting = new CourseProjectSetting
                {
                    CourseId = courseId,
                    Title = dto.Title.Trim(),
                    Description = dto.Description?.Trim(),
                    TeamSize = dto.TeamSize,
                    IsActive = true,
                    FileUrl = savedFileUrl,
                    FileName = savedFileName,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _db.CourseProjectSettings.Add(setting);
                await _db.SaveChangesAsync();
                return StatusCode(201, MapToProjectSettingDto(setting));
            }
        }

        // =====================================================================
        // GET /api/courses/{courseId}/project-setting
        // Returns the current active project setting.
        //
        // Access guard: same as GetCourseDetail.
        // =====================================================================
        [HttpGet("{courseId:int}/project-setting")]
        public async Task<IActionResult> GetProjectSetting(int courseId)
        {
            var course = await _db.Courses
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.Id == courseId);

            if (course == null)
                return NotFound(new { message = "Course not found." });

            // ── Access guard ──────────────────────────────────────────────────
            var role = AuthorizationHelper.GetRole(User);

            if (role == "doctor")
            {
                var doctor = await GetCurrentDoctorProfileAsync();
                if (doctor == null || course.DoctorId != doctor.Id)
                    return StatusCode(403, new { message = "Not authorized. You do not own this course." });
            }
            else if (role == "student")
            {
                var student = await GetCurrentStudentProfileAsync();
                if (student == null) return Forbid();

                var isEnrolled = await _db.CourseEnrollments
                    .AnyAsync(e => e.CourseId == courseId && e.StudentId == student.Id);

                if (!isEnrolled)
                    return StatusCode(403, new { message = "Not authorized. You are not enrolled in this course." });
            }
            else
            {
                return StatusCode(403, new { message = "Not authorized." });
            }

            var setting = await _db.CourseProjectSettings
                .Where(ps => ps.CourseId == courseId && ps.IsActive)
                .OrderByDescending(ps => ps.CreatedAt)
                .AsNoTracking()
                .FirstOrDefaultAsync();

            if (setting == null)
                return NotFound(new { message = "No active project setting found for this course." });

            return Ok(MapToProjectSettingDto(setting));
        }

        // ── Private Helpers ───────────────────────────────────────────────────

        /// <summary>
        /// Resolves the doctor profile for the current JWT user.
        /// Returns null if the caller is not a doctor.
        /// </summary>
        private async Task<DoctorProfile?> GetCurrentDoctorProfileAsync()
        {
            if (AuthorizationHelper.GetRole(User) != "doctor") return null;
            var userId = AuthorizationHelper.GetUserId(User);
            return await _db.DoctorProfiles
                .Include(d => d.User)
                .FirstOrDefaultAsync(d => d.UserId == userId);
        }

        /// <summary>
        /// Resolves the student profile for the current JWT user.
        /// Returns null if the caller is not a student.
        /// </summary>
        private async Task<StudentProfile?> GetCurrentStudentProfileAsync()
        {
            if (AuthorizationHelper.GetRole(User) != "student") return null;
            var userId = AuthorizationHelper.GetUserId(User);
            return await _db.StudentProfiles.FirstOrDefaultAsync(s => s.UserId == userId);
        }

        /// <summary>
        /// Shared guard for doctor-only write operations on a specific course.
        /// Returns (course, null) on success; (null, errorResult) on failure.
        /// </summary>
        private async Task<(Course? course, IActionResult? error)> GetCourseWithDoctorGuardAsync(int courseId)
        {
            var doctor = await GetCurrentDoctorProfileAsync();
            if (doctor == null)
                return (null, StatusCode(403, new { message = "Only doctors can perform this action." }));

            var course = await _db.Courses
                .FirstOrDefaultAsync(c => c.Id == courseId);

            if (course == null)
                return (null, NotFound(new { message = "Course not found." }));

            if (course.DoctorId != doctor.Id)
                return (null, StatusCode(403, new { message = "Not authorized. You do not own this course." }));

            return (course, null);
        }

        /// <summary>
        /// Removes a student from all teams they belong to within the given course.
        ///
        /// Leader-departure rules (applied per team):
        ///   • If the departing student is NOT the leader → simply remove the member row.
        ///   • If the departing student IS the leader:
        ///       – Other members remain  → promote the earliest-joined remaining member
        ///         (lowest <c>JoinedAt</c>, falling back to lowest <c>Id</c>) to leader.
        ///       – No members remain     → delete the team entirely.
        ///
        /// Note: SaveChangesAsync is called by the caller after this method returns.
        /// </summary>
        private async Task RemoveStudentFromCourseTeamsAsync(int courseId, int studentId)
        {
            // Load every membership row for this student in this course,
            // together with the parent team so we can inspect LeaderId.
            var memberships = await _db.CourseTeamMembers
                .Include(ctm => ctm.Team)
                .Where(ctm => ctm.CourseId == courseId && ctm.StudentId == studentId)
                .ToListAsync();

            if (!memberships.Any())
                return;

            foreach (var membership in memberships)
            {
                var team = membership.Team;

                // Remove the departing student's membership row first.
                _db.CourseTeamMembers.Remove(membership);

                // ── Leader-departure handling ─────────────────────────────────
                if (team.LeaderStudentId == studentId)
                {
                    // Fetch the remaining members (excluding the one just removed).
                    var remainingMembers = await _db.CourseTeamMembers
                        .Where(ctm => ctm.TeamId == team.Id && ctm.StudentId != studentId)
                        .OrderBy(ctm => ctm.JoinedAt)   // oldest join date first
                        .ThenBy(ctm => ctm.Id)           // tie-break by row Id
                        .ToListAsync();

                    if (remainingMembers.Any())
                    {
                        // Promote the earliest-joined remaining member to leader.
                        team.LeaderStudentId = remainingMembers.First().StudentId;
                    }
                    else
                    {
                        // No members left — delete the empty team.
                        _db.CourseTeams.Remove(team);
                    }
                }
                // If the student was not the leader, nothing extra is needed.
            }
        }

        // ── Static Mappers ────────────────────────────────────────────────────

        private static CourseDto MapToCourseDto(Course course, string doctorName) =>
            new()
            {
                Id = course.Id,
                Name = course.Name,
                Code = course.Code,
                DoctorId = course.DoctorId,
                DoctorName = doctorName,
                CreatedAt = course.CreatedAt
            };

        private static CourseProjectSettingDto MapToProjectSettingDto(CourseProjectSetting ps) =>
            new()
            {
                Id = ps.Id,
                CourseId = ps.CourseId,
                Title = ps.Title,
                Description = ps.Description,
                TeamSize = ps.TeamSize,
                IsActive = ps.IsActive,
                CreatedAt = ps.CreatedAt,
                UpdatedAt = ps.UpdatedAt,
                FileUrl = ps.FileUrl,
                FileName = ps.FileName
            };
    }
}