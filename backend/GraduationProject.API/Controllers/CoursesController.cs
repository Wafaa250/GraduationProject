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
    /// Covers: Course CRUD, Enrollment management, Section management,
    ///         and Course / Section Project Settings.
    ///
    /// Role rules:
    ///   - Doctor  → create courses, manage sections, enrollments, upsert project settings.
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
                Semester = dto.Semester?.Trim(),
                UseSharedProjectAcrossSections = dto.UseSharedProjectAcrossSections,
                AllowCrossSectionTeams = dto.AllowCrossSectionTeams,
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
        // Returns full course details (with sections).
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
                .Include(c => c.Sections)
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

            // ── Build section summaries (with per-section settings if applicable) ──
            var sectionDtos = new List<CourseSectionDto>();
            foreach (var sec in course.Sections.OrderBy(s => s.CreatedAt))
            {
                var studentCount = course.Enrollments.Count(e => e.CourseSectionId == sec.Id);

                SectionProjectSettingDto? sectionSetting = null;
                if (!course.UseSharedProjectAcrossSections)
                {
                    var activeSps = await _db.SectionProjectSettings
                        .Where(sps => sps.CourseSectionId == sec.Id && sps.IsActive)
                        .OrderByDescending(sps => sps.CreatedAt)
                        .AsNoTracking()
                        .FirstOrDefaultAsync();

                    if (activeSps != null)
                        sectionSetting = MapToSectionProjectSettingDto(activeSps);
                }

                sectionDtos.Add(MapToCourseSectionDto(sec, studentCount, sectionSetting));
            }

            // ── Active shared project setting ────────────────────────────────
            CourseProjectSettingDto? sharedSetting = null;
            if (course.UseSharedProjectAcrossSections)
            {
                var activeCps = course.ProjectSettings
                    .Where(ps => ps.IsActive)
                    .OrderByDescending(ps => ps.CreatedAt)
                    .FirstOrDefault();

                if (activeCps != null)
                    sharedSetting = MapToProjectSettingDto(activeCps);
            }

            var dto = new CourseDetailDto
            {
                Id = course.Id,
                Name = course.Name,
                Code = course.Code,
                DoctorId = course.DoctorId,
                DoctorName = course.Doctor?.User?.Name ?? string.Empty,
                Semester = course.Semester,
                UseSharedProjectAcrossSections = course.UseSharedProjectAcrossSections,
                AllowCrossSectionTeams = course.AllowCrossSectionTeams,
                StudentCount = course.Enrollments.Count,
                TeamCount = course.Teams.Count,
                SectionCount = course.Sections.Count,
                CreatedAt = course.CreatedAt,
                ProjectSetting = sharedSetting,
                Sections = sectionDtos
            };

            return Ok(dto);
        }

        // =====================================================================
        // POST /api/courses/{courseId}/students   ── DEPRECATED / DISABLED ──
        //
        // Students are no longer added at the course level. Enrollment is now
        // controlled exclusively at the section level.
        //
        // Use instead:  POST /api/courses/sections/{sectionId}/students
        //
        // The endpoint is kept in place (instead of being deleted) to preserve
        // API stability — old clients receive a clear 400 explaining where to
        // send the request. Existing CourseEnrollment rows are untouched.
        // =====================================================================
        [HttpPost("{courseId:int}/students")]
        public async Task<IActionResult> AddStudents(int courseId, [FromBody] AddStudentsDto dto)
        {
            var (_, guardResult) = await GetCourseWithDoctorGuardAsync(courseId);
            if (guardResult != null) return guardResult;

            return BadRequest(new
            {
                message = "Course-level enrollment is disabled. " +
                          "Create a section first, then use " +
                          "POST /api/courses/sections/{sectionId}/students to enrol students."
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
        // Returns the list of enrolled students (with section info).
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

            // ── Fetch enrollments with student data (and section) ─────────────
            var enrollments = await _db.CourseEnrollments
                .Include(e => e.Student).ThenInclude(s => s.User)
                .Include(e => e.Section)
                .Where(e => e.CourseId == courseId)
                .OrderBy(e => e.Student.User.Name)
                .AsNoTracking()
                .ToListAsync();

            var result = enrollments.Select(e => new CourseStudentDto
            {
                Id = e.StudentId,
                StudentId = e.StudentId,
                UniversityId = e.Student.StudentId ?? string.Empty,
                UserId = e.Student.UserId,
                Name = e.Student.User?.Name ?? string.Empty,
                Email = e.Student.User?.Email ?? string.Empty,
                University = e.Student.University ?? string.Empty,
                Major = e.Student.Major ?? string.Empty,
                AcademicYear = e.Student.AcademicYear ?? string.Empty,
                ProfilePictureBase64 = e.Student.ProfilePictureBase64,
                SectionId = e.CourseSectionId,
                EnrolledAt = e.CreatedAt
            });

            return Ok(result);
        }

        // =====================================================================
        // POST /api/courses/{courseId}/project-setting
        // Create a NEW active SHARED project setting — doctor (owner) only.
        // Valid only when course.UseSharedProjectAcrossSections == true.
        //
        // Multi-project behaviour (NEW):
        //   • Every call to this endpoint creates a new CourseProjectSetting
        //     row (no more in-place updates).
        //   • All previously-active settings for this course are flipped to
        //     IsActive = false, ensuring there is AT MOST ONE active setting
        //     per course at any time.
        //   • Old (now-inactive) settings remain in the database so their
        //     teams, files, and history are preserved.
        //
        // To edit an existing setting use PUT /api/courses/projects/{id}.
        // To switch which one is active use POST /api/courses/projects/{id}/activate.
        //
        // File upload (optional):
        //   - Accepts any document (PDF, DOCX, …) via multipart/form-data.
        //   - Saved to wwwroot/project-files/ with a GUID-prefixed name.
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

            if (!course!.UseSharedProjectAcrossSections)
                return BadRequest(new
                {
                    message = "This course uses per-section project settings. " +
                              "Use POST /api/courses/sections/{sectionId}/project-setting instead."
                });

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

            // ── Deactivate ALL previously-active settings for this course ─────
            var activeSettings = await _db.CourseProjectSettings
                .Where(ps => ps.CourseId == courseId && ps.IsActive)
                .ToListAsync();

            foreach (var old in activeSettings)
            {
                old.IsActive = false;
                old.UpdatedAt = DateTime.UtcNow;
            }

            // ── Create the new active setting ─────────────────────────────────
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

        // =====================================================================
        // GET /api/courses/{courseId}/project-setting
        // Returns the current active shared project setting.
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

        // ═════════════════════════════════════════════════════════════════════
        // SECTIONS  (NEW)
        // ═════════════════════════════════════════════════════════════════════

        // =====================================================================
        // POST /api/courses/{courseId}/sections
        // Create a new section inside a course — doctor (owner) only.
        // Section Name must be unique per course (case-insensitive).
        // =====================================================================
        [HttpPost("{courseId:int}/sections")]
        public async Task<IActionResult> CreateSection(
            int courseId, [FromBody] CreateCourseSectionDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var (_, guardResult) = await GetCourseWithDoctorGuardAsync(courseId);
            if (guardResult != null) return guardResult;

            var nameTrim = dto.Name.Trim();

            // Name uniqueness (case-insensitive) within the course.
            var duplicateName = await _db.CourseSections
                .AnyAsync(s => s.CourseId == courseId &&
                               s.Name.ToLower() == nameTrim.ToLower());

            if (duplicateName)
                return Conflict(new
                {
                    message = $"A section named '{nameTrim}' already exists in this course."
                });

            // Validate time range (from must be before to when both provided).
            var timeFrom = ParseTimeOnly(dto.TimeFrom);
            var timeTo = ParseTimeOnly(dto.TimeTo);
            if (timeFrom.HasValue && timeTo.HasValue && timeFrom.Value >= timeTo.Value)
                return BadRequest(new { message = "Start time must be before end time." });

            var section = new CourseSection
            {
                CourseId = courseId,
                Name = nameTrim,
                Days = SerializeDays(dto.Days),
                TimeFrom = timeFrom,
                TimeTo = timeTo,
                Capacity = dto.Capacity,
                CreatedAt = DateTime.UtcNow
            };

            _db.CourseSections.Add(section);
            await _db.SaveChangesAsync();

            return StatusCode(201, MapToCourseSectionDto(section, studentCount: 0, projectSetting: null));
        }

        // =====================================================================
        // GET /api/courses/{courseId}/sections
        // Returns all sections of a course with student counts.
        // Access guard: doctor (owner) or enrolled student.
        // =====================================================================
        [HttpGet("{courseId:int}/sections")]
        public async Task<IActionResult> GetSections(int courseId)
        {
            var course = await _db.Courses.AsNoTracking()
                .FirstOrDefaultAsync(c => c.Id == courseId);

            if (course == null)
                return NotFound(new { message = "Course not found." });

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

            var sections = await _db.CourseSections
                .Where(s => s.CourseId == courseId)
                .OrderBy(s => s.CreatedAt)
                .AsNoTracking()
                .ToListAsync();

            var sectionIds = sections.Select(s => s.Id).ToList();

            // Student counts per section (one grouped query)
            var countMap = await _db.CourseEnrollments
                .Where(e => e.CourseId == courseId &&
                            e.CourseSectionId.HasValue &&
                            sectionIds.Contains(e.CourseSectionId!.Value))
                .GroupBy(e => e.CourseSectionId!.Value)
                .Select(g => new { SectionId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.SectionId, x => x.Count);

            // Active per-section project settings (only relevant in per-section mode)
            Dictionary<int, SectionProjectSetting> spsMap = new();
            if (!course.UseSharedProjectAcrossSections)
            {
                var spsRows = await _db.SectionProjectSettings
                    .Where(sps => sectionIds.Contains(sps.CourseSectionId) && sps.IsActive)
                    .AsNoTracking()
                    .ToListAsync();

                spsMap = spsRows
                    .GroupBy(sps => sps.CourseSectionId)
                    .ToDictionary(
                        g => g.Key,
                        g => g.OrderByDescending(sps => sps.CreatedAt).First());
            }

            var result = sections.Select(s => MapToCourseSectionDto(
                s,
                countMap.GetValueOrDefault(s.Id, 0),
                spsMap.TryGetValue(s.Id, out var sps) ? MapToSectionProjectSettingDto(sps) : null
            ));

            return Ok(result);
        }

        // =====================================================================
        // POST /api/courses/sections/{sectionId}/students
        // Add or move students into a section — doctor (owner) only.
        //
        // Section-first enrollment (NEW primary enrollment path):
        //   • Students NOT yet enrolled in the course → a new CourseEnrollment
        //     row is created directly against this section.
        //   • Students already enrolled in a DIFFERENT section → their
        //     existing enrollment is updated to this section (move semantics).
        //   • Students already in THIS section → silently skipped.
        //
        // Duplicates and invalid university IDs are silently skipped and
        // reported in the response counters.
        // =====================================================================
        [HttpPost("sections/{sectionId:int}/students")]
        public async Task<IActionResult> AddStudentsToSection(
            int sectionId, [FromBody] AddStudentsToSectionDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var section = await _db.CourseSections
                .FirstOrDefaultAsync(s => s.Id == sectionId);

            if (section == null)
                return NotFound(new { message = "Section not found." });

            var (_, guardResult) = await GetCourseWithDoctorGuardAsync(section.CourseId);
            if (guardResult != null) return guardResult;

            // Resolve university student ID strings → profile IDs
            var studentProfiles = await _db.StudentProfiles
                .Where(s => s.StudentId != null && dto.StudentIds.Contains(s.StudentId))
                .AsNoTracking()
                .ToListAsync();

            var profileIds = studentProfiles.Select(s => s.Id).ToList();

            // Load existing enrollments for these students in the course
            var enrollments = await _db.CourseEnrollments
                .Where(e => e.CourseId == section.CourseId && profileIds.Contains(e.StudentId))
                .ToListAsync();

            var enrolledMap = enrollments.ToDictionary(e => e.StudentId);

            int added = 0;   // brand-new enrollments into this section
            int moved = 0;   // enrollments that were in a different section
            int skipped = 0;   // already in this section

            foreach (var profile in studentProfiles)
            {
                if (!enrolledMap.TryGetValue(profile.Id, out var enrollment))
                {
                    // ── New enrollment into this section ─────────────────────
                    _db.CourseEnrollments.Add(new CourseEnrollment
                    {
                        CourseId = section.CourseId,
                        StudentId = profile.Id,
                        CourseSectionId = sectionId,
                        CreatedAt = DateTime.UtcNow
                    });
                    added++;
                    continue;
                }

                if (enrollment.CourseSectionId == sectionId)
                {
                    skipped++;
                    continue;
                }

                enrollment.CourseSectionId = sectionId;
                moved++;
            }

            await _db.SaveChangesAsync();

            return Ok(new
            {
                message = $"Section '{section.Name}': {added} added, {moved} moved.",
                added,
                moved,
                skipped
            });
        }

        // =====================================================================
        // GET /api/courses/sections/{sectionId}/students
        // Returns students in a specific section.
        // Access guard: doctor (owner) or student enrolled in the course.
        // =====================================================================
        [HttpGet("sections/{sectionId:int}/students")]
        public async Task<IActionResult> GetSectionStudents(int sectionId)
        {
            var section = await _db.CourseSections.AsNoTracking()
                .FirstOrDefaultAsync(s => s.Id == sectionId);

            if (section == null)
                return NotFound(new { message = "Section not found." });

            var course = await _db.Courses.AsNoTracking()
                .FirstOrDefaultAsync(c => c.Id == section.CourseId);

            if (course == null)
                return NotFound(new { message = "Course not found." });

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
                    .AnyAsync(e => e.CourseId == section.CourseId && e.StudentId == student.Id);

                if (!isEnrolled)
                    return StatusCode(403, new { message = "Not authorized. You are not enrolled in this course." });
            }
            else
            {
                return StatusCode(403, new { message = "Not authorized." });
            }

            var enrollments = await _db.CourseEnrollments
                .Include(e => e.Student).ThenInclude(s => s.User)
                .Where(e => e.CourseId == section.CourseId && e.CourseSectionId == sectionId)
                .OrderBy(e => e.Student.User.Name)
                .AsNoTracking()
                .ToListAsync();

            var result = enrollments.Select(e => new CourseStudentDto
            {
                Id = e.StudentId,
                StudentId = e.StudentId,
                UniversityId = e.Student.StudentId ?? string.Empty,
                UserId = e.Student.UserId,
                Name = e.Student.User?.Name ?? string.Empty,
                Email = e.Student.User?.Email ?? string.Empty,
                University = e.Student.University ?? string.Empty,
                Major = e.Student.Major ?? string.Empty,
                AcademicYear = e.Student.AcademicYear ?? string.Empty,
                ProfilePictureBase64 = e.Student.ProfilePictureBase64,
                SectionId = sectionId,
                EnrolledAt = e.CreatedAt
            });

            return Ok(result);
        }

        // =====================================================================
        // POST /api/courses/sections/{sectionId}/project-setting
        // Create a NEW active PER-SECTION project setting — doctor only.
        // Valid only when course.UseSharedProjectAcrossSections == false.
        //
        // Multi-project behaviour (NEW):
        //   • Every call creates a new SectionProjectSetting row.
        //   • All previously-active settings for this section are flipped to
        //     IsActive = false, ensuring AT MOST ONE active setting per
        //     section at any time.
        // =====================================================================
        [HttpPost("sections/{sectionId:int}/project-setting")]
        public async Task<IActionResult> UpsertSectionProjectSetting(
            int sectionId, [FromBody] UpsertSectionProjectSettingDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var section = await _db.CourseSections
                .FirstOrDefaultAsync(s => s.Id == sectionId);

            if (section == null)
                return NotFound(new { message = "Section not found." });

            var (course, guardResult) = await GetCourseWithDoctorGuardAsync(section.CourseId);
            if (guardResult != null) return guardResult;

            if (course!.UseSharedProjectAcrossSections)
                return BadRequest(new
                {
                    message = "This course uses a shared project setting. " +
                              "Use POST /api/courses/{courseId}/project-setting instead."
                });

            // ── Deactivate ALL previously-active settings for this section ────
            var activeSettings = await _db.SectionProjectSettings
                .Where(sps => sps.CourseSectionId == sectionId && sps.IsActive)
                .ToListAsync();

            foreach (var old in activeSettings)
            {
                old.IsActive = false;
                old.UpdatedAt = DateTime.UtcNow;
            }

            var setting = new SectionProjectSetting
            {
                CourseSectionId = sectionId,
                Title = dto.Title.Trim(),
                Description = dto.Description?.Trim(),
                TeamSize = dto.TeamSize,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _db.SectionProjectSettings.Add(setting);
            await _db.SaveChangesAsync();
            return StatusCode(201, MapToSectionProjectSettingDto(setting));
        }

        // =====================================================================
        // GET /api/courses/sections/{sectionId}/project-setting
        // Returns the active per-section project setting.
        // Access guard: doctor (owner) or enrolled student.
        // =====================================================================
        [HttpGet("sections/{sectionId:int}/project-setting")]
        public async Task<IActionResult> GetSectionProjectSetting(int sectionId)
        {
            var section = await _db.CourseSections.AsNoTracking()
                .FirstOrDefaultAsync(s => s.Id == sectionId);

            if (section == null)
                return NotFound(new { message = "Section not found." });

            var course = await _db.Courses.AsNoTracking()
                .FirstOrDefaultAsync(c => c.Id == section.CourseId);

            if (course == null)
                return NotFound(new { message = "Course not found." });

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
                    .AnyAsync(e => e.CourseId == section.CourseId && e.StudentId == student.Id);

                if (!isEnrolled)
                    return StatusCode(403, new { message = "Not authorized. You are not enrolled in this course." });
            }
            else
            {
                return StatusCode(403, new { message = "Not authorized." });
            }

            var setting = await _db.SectionProjectSettings
                .Where(sps => sps.CourseSectionId == sectionId && sps.IsActive)
                .OrderByDescending(sps => sps.CreatedAt)
                .AsNoTracking()
                .FirstOrDefaultAsync();

            if (setting == null)
                return NotFound(new { message = "No active project setting found for this section." });

            return Ok(MapToSectionProjectSettingDto(setting));
        }

        // ═════════════════════════════════════════════════════════════════════
        // MULTI-PROJECT SUPPORT  (NEW)
        // ═════════════════════════════════════════════════════════════════════

        // =====================================================================
        // GET /api/courses/{courseId}/projects
        //
        // Returns EVERY shared project setting (active and inactive) that has
        // been created for this course, ordered newest → oldest, with a team
        // count per project. Doctor (owner) or enrolled student access.
        //
        // Only returned when course.UseSharedProjectAcrossSections == true;
        // otherwise see GET /api/courses/sections/{sectionId}/projects.
        // =====================================================================
        [HttpGet("{courseId:int}/projects")]
        public async Task<IActionResult> GetCourseProjects(int courseId)
        {
            var course = await _db.Courses.AsNoTracking()
                .FirstOrDefaultAsync(c => c.Id == courseId);

            if (course == null)
                return NotFound(new { message = "Course not found." });

            // Access guard: doctor owner OR enrolled student
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

            // Return CourseProject (new multi-project model)
            var projects = await _db.CourseProjects
                .AsNoTracking()
                .Include(p => p.CourseProjectSections)
                    .ThenInclude(cps => cps.CourseSection)
                .Where(p => p.CourseId == courseId)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();

            var result = projects.Select(p =>
                MapToCourseProjectDto(p, p.CourseProjectSections
                    .Select(cps => cps.CourseSection)
                    .Where(s => s != null)
                    .ToList()!)).ToList();

            return Ok(result);
        }

        // =====================================================================
        // POST /api/courses/{courseId}/projects
        // Create a new CourseProject — doctor (owner) only.
        // =====================================================================
        [HttpPost("{courseId:int}/projects")]
        public async Task<IActionResult> CreateCourseProject(
            int courseId, [FromBody] CreateCourseProjectDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var (_, guardResult) = await GetCourseWithDoctorGuardAsync(courseId);
            if (guardResult != null) return guardResult;

            List<CourseSection> targetSections = new();
            if (!dto.ApplyToAllSections)
            {
                if (dto.SectionIds == null || dto.SectionIds.Count == 0)
                    return BadRequest(new { message = "Provide at least one sectionId when ApplyToAllSections is false." });

                targetSections = await _db.CourseSections
                    .Where(s => s.CourseId == courseId && dto.SectionIds.Contains(s.Id))
                    .ToListAsync();

                if (targetSections.Count != dto.SectionIds.Distinct().Count())
                    return BadRequest(new { message = "One or more section IDs are invalid or do not belong to this course." });
            }

            var project = new CourseProject
            {
                CourseId = courseId,
                Title = dto.Title.Trim(),
                Description = dto.Description?.Trim(),
                TeamSize = dto.TeamSize,
                ApplyToAllSections = dto.ApplyToAllSections,
                AllowCrossSectionTeams = dto.AllowCrossSectionTeams,
                AiMode = (dto.AiMode ?? "doctor").Trim().ToLowerInvariant() == "student" ? "student" : "doctor",
                CreatedAt = DateTime.UtcNow
            };

            _db.CourseProjects.Add(project);
            await _db.SaveChangesAsync();

            if (!dto.ApplyToAllSections)
            {
                foreach (var sec in targetSections)
                    _db.CourseProjectSections.Add(new CourseProjectSection
                    { CourseProjectId = project.Id, CourseSectionId = sec.Id });
                await _db.SaveChangesAsync();
            }

            return StatusCode(201, MapToCourseProjectDto(project, targetSections));
        }

        // =====================================================================
        // PUT /api/courses/projects/{projectId}
        // Update a CourseProject — doctor (owner) only.
        // =====================================================================
        [HttpPut("projects/{projectId:int}")]
        public async Task<IActionResult> UpdateCourseProject(
            int projectId, [FromBody] UpdateCourseProjectDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var project = await _db.CourseProjects
                .Include(p => p.CourseProjectSections)
                .FirstOrDefaultAsync(p => p.Id == projectId);

            if (project == null)
                return NotFound(new { message = "Project not found." });

            var (_, guardResult) = await GetCourseWithDoctorGuardAsync(project.CourseId);
            if (guardResult != null) return guardResult;

            List<CourseSection> targetSections = new();
            if (!dto.ApplyToAllSections)
            {
                if (dto.SectionIds == null || dto.SectionIds.Count == 0)
                    return BadRequest(new { message = "Provide at least one sectionId when ApplyToAllSections is false." });

                targetSections = await _db.CourseSections
                    .Where(s => s.CourseId == project.CourseId && dto.SectionIds.Contains(s.Id))
                    .ToListAsync();

                if (targetSections.Count != dto.SectionIds.Distinct().Count())
                    return BadRequest(new { message = "One or more section IDs are invalid or do not belong to this course." });
            }

            project.Title = dto.Title.Trim();
            project.Description = dto.Description?.Trim();
            project.TeamSize = dto.TeamSize;
            project.ApplyToAllSections = dto.ApplyToAllSections;
            project.AllowCrossSectionTeams = dto.AllowCrossSectionTeams;
            project.AiMode = (dto.AiMode ?? "doctor").Trim().ToLowerInvariant() == "student" ? "student" : "doctor";

            _db.CourseProjectSections.RemoveRange(project.CourseProjectSections);
            if (!dto.ApplyToAllSections)
            {
                foreach (var sec in targetSections)
                    _db.CourseProjectSections.Add(new CourseProjectSection
                    { CourseProjectId = project.Id, CourseSectionId = sec.Id });
            }

            await _db.SaveChangesAsync();
            return Ok(MapToCourseProjectDto(project, targetSections));
        }

        // =====================================================================
        // DELETE /api/courses/projects/{projectId}
        // Delete a CourseProject — doctor (owner) only.
        // =====================================================================
        [HttpDelete("projects/{projectId:int}")]
        public async Task<IActionResult> DeleteCourseProject(int projectId)
        {
            var project = await _db.CourseProjects
                .Include(p => p.CourseProjectSections)
                .FirstOrDefaultAsync(p => p.Id == projectId);

            if (project == null)
                return NotFound(new { message = "Project not found." });

            var (_, guardResult) = await GetCourseWithDoctorGuardAsync(project.CourseId);
            if (guardResult != null) return guardResult;

            _db.CourseProjectSections.RemoveRange(project.CourseProjectSections);
            _db.CourseProjects.Remove(project);
            await _db.SaveChangesAsync();

            return Ok(new { message = "Project deleted successfully." });
        }

        // =====================================================================
        // GET /api/courses/sections/{sectionId}/projects
        //
        // Per-section counterpart of GET /api/courses/{courseId}/projects.
        // Returns every SectionProjectSetting (active + inactive) for this
        // section. Doctor (owner) or enrolled student access.
        // Only valid when course.UseSharedProjectAcrossSections == false.
        // =====================================================================
        [HttpGet("sections/{sectionId:int}/projects")]
        public async Task<IActionResult> GetSectionProjects(int sectionId)
        {
            var section = await _db.CourseSections.AsNoTracking()
                .FirstOrDefaultAsync(s => s.Id == sectionId);

            if (section == null)
                return NotFound(new { message = "Section not found." });

            var course = await _db.Courses.AsNoTracking()
                .FirstOrDefaultAsync(c => c.Id == section.CourseId);

            if (course == null)
                return NotFound(new { message = "Course not found." });

            // ── Access guard: doctor owner OR enrolled student ────────────────
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
                    .AnyAsync(e => e.CourseId == section.CourseId && e.StudentId == student.Id);

                if (!isEnrolled)
                    return StatusCode(403, new { message = "Not authorized. You are not enrolled in this course." });
            }
            else
            {
                return StatusCode(403, new { message = "Not authorized." });
            }

            if (course.UseSharedProjectAcrossSections)
                return BadRequest(new
                {
                    message = "This course uses a shared project setting. " +
                              "Use GET /api/courses/{courseId}/projects instead."
                });

            var settings = await _db.SectionProjectSettings
                .AsNoTracking()
                .Where(sps => sps.CourseSectionId == sectionId)
                .OrderByDescending(sps => sps.IsActive)
                .ThenByDescending(sps => sps.CreatedAt)
                .ToListAsync();

            // Team counts per setting id — CourseTeam.ProjectSettingId points at
            // the anchor CourseProjectSetting even in per-section mode, so
            // section-project team counts are not meaningful here. We still
            // report 0 to keep the DTO shape consistent.
            var result = settings.Select(sps => new CourseProjectSettingListItemDto
            {
                Id = sps.Id,
                CourseId = null,
                CourseSectionId = sps.CourseSectionId,
                Title = sps.Title,
                Description = sps.Description,
                TeamSize = sps.TeamSize,
                IsActive = sps.IsActive,
                TeamCount = 0,
                CreatedAt = sps.CreatedAt,
                UpdatedAt = sps.UpdatedAt,
                FileUrl = null,
                FileName = null
            }).ToList();

            return Ok(result);
        }

        // =====================================================================
        // POST /api/courses/projects/{settingId}/activate
        //
        // Activates an existing (inactive) shared CourseProjectSetting and
        // deactivates all other settings for the same course — doctor (owner)
        // only. Guarantees AT MOST ONE active setting per course.
        // =====================================================================
        [HttpPost("projects/{settingId:int}/activate")]
        public async Task<IActionResult> ActivateCourseProject(int settingId)
        {
            var setting = await _db.CourseProjectSettings
                .FirstOrDefaultAsync(ps => ps.Id == settingId);

            if (setting == null)
                return NotFound(new { message = "Project setting not found." });

            var (_, guardResult) = await GetCourseWithDoctorGuardAsync(setting.CourseId);
            if (guardResult != null) return guardResult;

            // Deactivate every other setting in the course.
            var others = await _db.CourseProjectSettings
                .Where(ps => ps.CourseId == setting.CourseId && ps.Id != settingId && ps.IsActive)
                .ToListAsync();

            foreach (var o in others)
            {
                o.IsActive = false;
                o.UpdatedAt = DateTime.UtcNow;
            }

            setting.IsActive = true;
            setting.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();
            return Ok(MapToProjectSettingDto(setting));
        }

        // =====================================================================
        // POST /api/courses/sections/projects/{settingId}/activate
        //
        // Per-section counterpart of the activation endpoint above.
        // =====================================================================
        [HttpPost("sections/projects/{settingId:int}/activate")]
        public async Task<IActionResult> ActivateSectionProject(int settingId)
        {
            var setting = await _db.SectionProjectSettings
                .FirstOrDefaultAsync(sps => sps.Id == settingId);

            if (setting == null)
                return NotFound(new { message = "Section project setting not found." });

            var section = await _db.CourseSections.AsNoTracking()
                .FirstOrDefaultAsync(s => s.Id == setting.CourseSectionId);

            if (section == null)
                return NotFound(new { message = "Section not found." });

            var (_, guardResult) = await GetCourseWithDoctorGuardAsync(section.CourseId);
            if (guardResult != null) return guardResult;

            var others = await _db.SectionProjectSettings
                .Where(sps => sps.CourseSectionId == setting.CourseSectionId
                              && sps.Id != settingId
                              && sps.IsActive)
                .ToListAsync();

            foreach (var o in others)
            {
                o.IsActive = false;
                o.UpdatedAt = DateTime.UtcNow;
            }

            setting.IsActive = true;
            setting.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();
            return Ok(MapToSectionProjectSettingDto(setting));
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
            var memberships = await _db.CourseTeamMembers
                .Include(ctm => ctm.Team)
                .Where(ctm => ctm.CourseId == courseId && ctm.StudentId == studentId)
                .ToListAsync();

            if (!memberships.Any())
                return;

            foreach (var membership in memberships)
            {
                var team = membership.Team;

                _db.CourseTeamMembers.Remove(membership);

                if (team.LeaderStudentId == studentId)
                {
                    var remainingMembers = await _db.CourseTeamMembers
                        .Where(ctm => ctm.TeamId == team.Id && ctm.StudentId != studentId)
                        .OrderBy(ctm => ctm.JoinedAt)
                        .ThenBy(ctm => ctm.Id)
                        .ToListAsync();

                    if (remainingMembers.Any())
                        team.LeaderStudentId = remainingMembers.First().StudentId;
                    else
                        _db.CourseTeams.Remove(team);
                }
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
                Semester = course.Semester,
                UseSharedProjectAcrossSections = course.UseSharedProjectAcrossSections,
                AllowCrossSectionTeams = course.AllowCrossSectionTeams,
                CreatedAt = course.CreatedAt
            };

        // ── Section helpers ───────────────────────────────────────────────────
        //
        // Days are stored as a JSON array of lowercase weekday ids:
        //   ["mon","tue","wed","thu","fri","sat","sun"]
        // ParseDays tolerates null / invalid JSON by returning an empty list.
        // ─────────────────────────────────────────────────────────────────────

        private static readonly HashSet<string> AllowedWeekdays =
            new(StringComparer.OrdinalIgnoreCase)
            { "mon", "tue", "wed", "thu", "fri", "sat", "sun" };

        private static List<string> ParseDays(string? json)
        {
            if (string.IsNullOrWhiteSpace(json)) return new List<string>();
            try
            {
                return System.Text.Json.JsonSerializer
                    .Deserialize<List<string>>(json.Trim()) ?? new List<string>();
            }
            catch
            {
                return new List<string>();
            }
        }

        private static string SerializeDays(IEnumerable<string>? days)
        {
            var normalized = (days ?? Enumerable.Empty<string>())
                .Where(d => !string.IsNullOrWhiteSpace(d))
                .Select(d => d.Trim().ToLowerInvariant())
                .Where(d => AllowedWeekdays.Contains(d))
                .Distinct()
                .ToList();
            return System.Text.Json.JsonSerializer.Serialize(normalized);
        }

        private static TimeOnly? ParseTimeOnly(string? hhmm)
        {
            if (string.IsNullOrWhiteSpace(hhmm)) return null;
            // Accept both "HH:mm" and "HH:mm:ss".
            if (TimeOnly.TryParseExact(hhmm.Trim(), new[] { "HH:mm", "HH:mm:ss", "H:mm" },
                    System.Globalization.CultureInfo.InvariantCulture,
                    System.Globalization.DateTimeStyles.None, out var t))
                return t;
            return null;
        }

        private static string? FormatTimeOnly(TimeOnly? t) =>
            t.HasValue ? t.Value.ToString("HH:mm") : null;

        private static CourseSectionDto MapToCourseSectionDto(
            CourseSection sec,
            int studentCount,
            SectionProjectSettingDto? projectSetting) =>
            new()
            {
                Id = sec.Id,
                CourseId = sec.CourseId,
                Name = sec.Name,
                Days = ParseDays(sec.Days),
                TimeFrom = FormatTimeOnly(sec.TimeFrom),
                TimeTo = FormatTimeOnly(sec.TimeTo),
                Capacity = sec.Capacity,
                StudentCount = studentCount,
                CreatedAt = sec.CreatedAt,
                ProjectSetting = projectSetting
            };


        private static CourseProjectDto MapToCourseProjectDto(
            CourseProject project,
            List<CourseSection> sections) =>
            new()
            {
                Id = project.Id,
                CourseId = project.CourseId,
                Title = project.Title,
                Description = project.Description,
                TeamSize = project.TeamSize,
                ApplyToAllSections = project.ApplyToAllSections,
                AllowCrossSectionTeams = project.AllowCrossSectionTeams,
                AiMode = project.AiMode,
                CreatedAt = project.CreatedAt,
                Sections = sections.Select(s => new CourseProjectSectionDto
                {
                    SectionId = s.Id,
                    SectionName = s.Name
                }).ToList()
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

        private static SectionProjectSettingDto MapToSectionProjectSettingDto(SectionProjectSetting sps) =>
            new()
            {
                Id = sps.Id,
                CourseSectionId = sps.CourseSectionId,
                Title = sps.Title,
                Description = sps.Description,
                TeamSize = sps.TeamSize,
                IsActive = sps.IsActive,
                CreatedAt = sps.CreatedAt,
                UpdatedAt = sps.UpdatedAt
            };
    }
}