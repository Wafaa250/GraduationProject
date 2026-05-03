using System.Text.Json;
using GraduationProject.API.DTOs;
using GraduationProject.API.Services;
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
        private readonly ICourseProjectRepository _projectRepo;
        private readonly ITeamGenerationService _teamService;
        private readonly ICourseTeamRepository _teamRepo;

        public CoursesController(
            ICourseRepository courseRepo,
            ICourseSectionRepository sectionRepo,
            ICourseProjectRepository projectRepo,
            ITeamGenerationService teamService,
            ICourseTeamRepository teamRepo)
        {
            _courseRepo = courseRepo;
            _sectionRepo = sectionRepo;
            _projectRepo = projectRepo;
            _teamService = teamService;
            _teamRepo = teamRepo;
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
            var doctorIds = courses.Select(c => c.DoctorId).Distinct().ToList();
            var doctorNames = await _courseRepo.GetDoctorNamesByIdsAsync(doctorIds);
            return Ok(courses.Select(c => MapCourseToDto(c, doctorNames.GetValueOrDefault(c.DoctorId, ""))));
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

            // Fetch doctor names separately to avoid navigation chain issues
            var doctorIds = enrollments.Select(e => e.Section.Course.DoctorId).Distinct().ToList();
            var doctorNames = await _courseRepo.GetDoctorNamesByIdsAsync(doctorIds);

            var result = enrollments.Select(e => new EnrolledCourseResponseDto
            {
                CourseId = e.Section.Course.Id,
                Name = e.Section.Course.Name,
                Code = e.Section.Course.Code,
                Semester = e.Section.Course.Semester,
                DoctorId = e.Section.Course.DoctorId,
                DoctorName = doctorNames.GetValueOrDefault(e.Section.Course.DoctorId, string.Empty),
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
            var doctorNames = await _courseRepo.GetDoctorNamesByIdsAsync(new List<int> { created.DoctorId });
            var doctorName = doctorNames.GetValueOrDefault(created.DoctorId, "");
            return CreatedAtAction(
                nameof(GetCourseById),
                new { courseId = created.Id },
                MapCourseToDto(created, doctorName));
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

                var doctorNamesDoctor = await _courseRepo.GetDoctorNamesByIdsAsync(new List<int> { course.DoctorId });
                return Ok(MapCourseToDto(course, doctorNamesDoctor.GetValueOrDefault(course.DoctorId, "")));
            }
            else
            {
                // Student: verify they are enrolled and find their section
                var studentId = await GetCurrentStudentIdAsync();
                if (studentId == null)
                    return Unauthorized(new { message = "Student profile not found." });

                var enrollments = await _sectionRepo.GetEnrolledSectionsByStudentAsync(studentId.Value);
                var myEnrollment = enrollments.FirstOrDefault(e => e.Section.CourseId == courseId);
                if (myEnrollment == null)
                    return NotFound(new { message = "Course not found." });

                // Get doctor name via direct join
                var doctorNames = await _courseRepo.GetDoctorNamesByIdsAsync(new List<int> { course.DoctorId });
                var doctorName = doctorNames.GetValueOrDefault(course.DoctorId, string.Empty);

                // Load all sections for this course (needed by frontend)
                var sections = await _sectionRepo.GetByCourseIdAsync(courseId);

                return Ok(new
                {
                    courseId = course.Id,
                    name = course.Name,
                    code = course.Code,
                    semester = course.Semester,
                    createdAt = course.CreatedAt,
                    doctorId = course.DoctorId,
                    doctorName = doctorName,
                    // Student's section info — used by frontend to show "My Section"
                    mySectionId = myEnrollment.Section.Id,
                    mySectionName = myEnrollment.Section.Name,
                    // All sections array — used by frontend to resolve section details
                    sections = sections.Select(s => {
                        List<string> days;
                        try { days = System.Text.Json.JsonSerializer.Deserialize<List<string>>(s.Days) ?? new(); }
                        catch { days = new(); }
                        return new
                        {
                            id = s.Id,
                            name = s.Name,
                            courseId = s.CourseId,
                            days = days,
                            timeFrom = s.TimeFrom,
                            timeTo = s.TimeTo,
                            capacity = s.Capacity,
                        };
                    }),
                });
            }
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
        // GET /api/courses/{courseId}/students  (student)
        // Returns all students enrolled in any section of this course
        // ============================================================
        [HttpGet("{courseId:int}/students")]
        [Authorize(Roles = "student")]
        public async Task<IActionResult> GetCourseStudents(int courseId)
        {
            var studentId = await GetCurrentStudentIdAsync();
            if (studentId == null)
                return Unauthorized(new { message = "Student profile not found." });

            // Verify the student is enrolled in this course
            var enrollments = await _sectionRepo.GetEnrolledSectionsByStudentAsync(studentId.Value);
            var isEnrolled = enrollments.Any(e => e.Section.CourseId == courseId);
            if (!isEnrolled)
                return NotFound(new { message = "Course not found." });

            // Return all students enrolled in any section of this course
            var allEnrollments = await _sectionRepo.GetAllEnrollmentsByCourseIdAsync(courseId);
            return Ok(allEnrollments.Select(MapEnrollmentToDto));
        }

        // ============================================================
        // GET /api/courses/projects/{projectId}/my-team  (student)
        // Returns the team the current student belongs to for this project
        // ============================================================
        [HttpGet("projects/{projectId:int}/my-team")]
        [Authorize(Roles = "student")]
        public async Task<IActionResult> GetMyTeam(int projectId)
        {
            var studentId = await GetCurrentStudentIdAsync();
            if (studentId == null)
                return Unauthorized(new { message = "Student profile not found." });

            var project = await _projectRepo.GetByIdAsync(projectId);
            if (project == null)
                return NotFound(new { message = "Project not found." });

            // Find the team this student is in for this project
            var allTeams = await _teamRepo.GetByProjectIdAsync(projectId);
            var myTeam = allTeams.FirstOrDefault(t =>
                t.Members.Any(m => m.StudentProfileId == studentId.Value));

            if (myTeam == null)
                return NotFound(new { message = "You are not assigned to a team for this project." });

            // Find the student's enrolled section for this course
            var enrollments = await _sectionRepo.GetEnrolledSectionsByStudentAsync(studentId.Value);
            var sectionEnrollment = enrollments.FirstOrDefault(e => e.Section.CourseId == project.CourseId);

            return Ok(new
            {
                projectId    = project.Id,
                projectTitle = project.Title,
                courseId     = project.CourseId,
                teamId       = myTeam.Id,
                teamIndex    = myTeam.TeamIndex,
                members      = myTeam.Members.Select(m => new
                {
                    studentId    = m.StudentProfileId,
                    userId       = m.UserId,
                    name         = m.Student?.User?.Name ?? string.Empty,
                    universityId = m.Student?.StudentId,
                    matchScore   = Math.Round(m.MatchScore, 1),
                }),
            });
        }

        // ============================================================
        // GET /api/courses/{courseId}/enrolled-students  (doctor)
        // Returns all students enrolled in any section of this course
        // ============================================================
        [HttpGet("{courseId:int}/enrolled-students")]
        [Authorize(Roles = "doctor")]
        public async Task<IActionResult> GetCourseEnrolledStudents(int courseId)
        {
            var doctorId = await GetCurrentDoctorIdAsync();
            if (doctorId == null)
                return Unauthorized(new { message = "Doctor profile not found." });

            var course = await _courseRepo.GetByIdAsync(courseId);
            if (course == null || course.DoctorId != doctorId.Value)
                return NotFound(new { message = "Course not found." });

            var allEnrollments = await _sectionRepo.GetAllEnrollmentsByCourseIdAsync(courseId);
            return Ok(allEnrollments.Select(MapEnrollmentToDto));
        }

        // ============================================================
        // GET /api/courses/{courseId}/projects  (doctor + student)
        // ============================================================
        [HttpGet("{courseId:int}/projects")]
        [Authorize(Roles = "doctor,student")]
        public async Task<IActionResult> GetCourseProjects(int courseId)
        {
            var role = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value ?? "";

            if (role == "doctor")
            {
                var doctorId = await GetCurrentDoctorIdAsync();
                if (doctorId == null)
                    return Unauthorized(new { message = "Doctor profile not found." });

                var course = await _courseRepo.GetByIdAsync(courseId);
                if (course == null || course.DoctorId != doctorId.Value)
                    return NotFound(new { message = "Course not found." });
            }
            else
            {
                var studentId = await GetCurrentStudentIdAsync();
                if (studentId == null)
                    return Unauthorized(new { message = "Student profile not found." });

                var enrollments = await _sectionRepo.GetEnrolledSectionsByStudentAsync(studentId.Value);
                var isEnrolled = enrollments.Any(e => e.Section.CourseId == courseId);
                if (!isEnrolled)
                    return NotFound(new { message = "Course not found." });
            }

            var projects = await _projectRepo.GetByCourseIdAsync(courseId);
            return Ok(projects.Select(MapProjectToDto));
        }

        // ============================================================
        // POST /api/courses/{courseId}/projects  (doctor)
        // ============================================================
        [HttpPost("{courseId:int}/projects")]
        [Authorize(Roles = "doctor")]
        public async Task<IActionResult> CreateCourseProject(
            int courseId,
            [FromBody] CreateCourseProjectDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var doctorId = await GetCurrentDoctorIdAsync();
            if (doctorId == null)
                return Unauthorized(new { message = "Doctor profile not found." });

            var course = await _courseRepo.GetByIdAsync(courseId);
            if (course == null || course.DoctorId != doctorId.Value)
                return NotFound(new { message = "Course not found." });

            var aiMode = dto.AiMode == "student" ? "student" : "doctor";
            var allowCross = dto.ApplyToAllSections && dto.AllowCrossSectionTeams;

            var project = new CourseProject
            {
                CourseId = courseId,
                Title = dto.Title.Trim(),
                Description = string.IsNullOrWhiteSpace(dto.Description) ? null : dto.Description.Trim(),
                TeamSize = dto.TeamSize,
                ApplyToAllSections = dto.ApplyToAllSections,
                AllowCrossSectionTeams = allowCross,
                AiMode = aiMode,
                CreatedAt = DateTime.UtcNow,
            };

            // When applying to all sections, sectionIds is ignored
            var sectionIds = dto.ApplyToAllSections ? new List<int>() : dto.SectionIds;

            var created = await _projectRepo.CreateAsync(project, sectionIds);
            return CreatedAtAction(
                nameof(GetCourseProjects),
                new { courseId },
                MapProjectToDto(created));
        }

        // ============================================================
        // PUT /api/courses/projects/{projectId}  (doctor)
        // ============================================================
        [HttpPut("projects/{projectId:int}")]
        [Authorize(Roles = "doctor")]
        public async Task<IActionResult> UpdateCourseProject(
            int projectId,
            [FromBody] UpdateCourseProjectDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var doctorId = await GetCurrentDoctorIdAsync();
            if (doctorId == null)
                return Unauthorized(new { message = "Doctor profile not found." });

            var project = await _projectRepo.GetByIdAsync(projectId);
            if (project == null)
                return NotFound(new { message = "Project not found." });

            var course = await _courseRepo.GetByIdAsync(project.CourseId);
            if (course == null || course.DoctorId != doctorId.Value)
                return Forbid();

            var aiMode = dto.AiMode == "student" ? "student" : "doctor";
            var allowCross = dto.ApplyToAllSections && dto.AllowCrossSectionTeams;

            project.Title = dto.Title.Trim();
            project.Description = string.IsNullOrWhiteSpace(dto.Description) ? null : dto.Description.Trim();
            project.TeamSize = dto.TeamSize;
            project.ApplyToAllSections = dto.ApplyToAllSections;
            project.AllowCrossSectionTeams = allowCross;
            project.AiMode = aiMode;

            var sectionIds = dto.ApplyToAllSections ? new List<int>() : dto.SectionIds;

            var updated = await _projectRepo.UpdateAsync(project, sectionIds);
            return Ok(MapProjectToDto(updated));
        }

        // ============================================================
        // DELETE /api/courses/projects/{projectId}  (doctor)
        // ============================================================
        [HttpDelete("projects/{projectId:int}")]
        [Authorize(Roles = "doctor")]
        public async Task<IActionResult> DeleteCourseProject(int projectId)
        {
            var doctorId = await GetCurrentDoctorIdAsync();
            if (doctorId == null)
                return Unauthorized(new { message = "Doctor profile not found." });

            var project = await _projectRepo.GetByIdAsync(projectId);
            if (project == null)
                return NotFound(new { message = "Project not found." });

            var course = await _courseRepo.GetByIdAsync(project.CourseId);
            if (course == null || course.DoctorId != doctorId.Value)
                return Forbid();

            await _projectRepo.DeleteAsync(projectId);
            return NoContent();
        }

        // ============================================================
        // POST /api/courses/{courseId}/projects/{projectId}/generate-teams
        // ============================================================
        [HttpPost("{courseId:int}/projects/{projectId:int}/generate-teams")]
        [Authorize(Roles = "doctor")]
        public async Task<IActionResult> GenerateTeams(int courseId, int projectId)
        {
            var doctorId = await GetCurrentDoctorIdAsync();
            if (doctorId == null)
                return Unauthorized(new { message = "Doctor profile not found." });

            // Verify course ownership
            var course = await _courseRepo.GetByIdAsync(courseId);
            if (course == null || course.DoctorId != doctorId.Value)
                return NotFound(new { message = "Course not found." });

            // Verify project belongs to this course
            var project = await _projectRepo.GetByIdAsync(projectId);
            if (project == null || project.CourseId != courseId)
                return NotFound(new { message = "Project not found." });

            // Only allowed for doctor-assign mode
            if (project.AiMode != "doctor")
                return BadRequest(new { message = "Team generation is only available for doctor-assign projects." });

            // Get enrolled students for this project's target sections
            List<SectionEnrollment> enrollments;
            if (project.ApplyToAllSections)
            {
                enrollments = (await _sectionRepo.GetAllEnrollmentsByCourseIdAsync(courseId)).ToList();
            }
            else
            {
                var sectionIds = project.Sections.Select(s => s.CourseSectionId).ToHashSet();
                var allEnrollments = await _sectionRepo.GetAllEnrollmentsByCourseIdAsync(courseId);
                enrollments = allEnrollments.Where(e => sectionIds.Contains(e.CourseSectionId)).ToList();
            }

            if (enrollments.Count == 0)
                return BadRequest(new { message = "No students enrolled in this project's sections." });

            // Build student list for AI
            var students = enrollments
                .GroupBy(e => e.StudentProfileId)
                .Select(g =>
                {
                    var s = g.First().Student;
                    var skills = new List<string>();
                    if (!string.IsNullOrWhiteSpace(s?.TechnicalSkills))
                    {
                        try { skills = System.Text.Json.JsonSerializer.Deserialize<List<string>>(s.TechnicalSkills) ?? new(); }
                        catch { }
                    }
                    return new StudentForTeam(
                        StudentProfileId: g.Key,
                        UserId: s?.UserId ?? 0,
                        Name: s?.User?.Name ?? string.Empty,
                        Skills: skills,
                        Major: s?.Major,
                        Bio: s?.Bio
                    );
                })
                .ToList();

            var result = await _teamService.GenerateTeamsAsync(
                projectId,
                project.Title,
                project.Description,
                project.TeamSize,
                students);

            // Save teams to DB
            var teamsToSave = result.Teams.Select(t => new CourseTeam
            {
                CourseProjectId = projectId,
                TeamIndex = t.TeamIndex,
                CreatedAt = DateTime.UtcNow,
                Members = t.Members.Select(m => new CourseTeamMember
                {
                    StudentProfileId = m.StudentId,
                    UserId = m.UserId,
                    MatchScore = m.MatchScore,
                }).ToList(),
            }).ToList();

            var saved = await _teamRepo.SaveTeamsAsync(projectId, teamsToSave);
            return Ok(MapTeamsResponse(saved, project, students));
        }

        // ============================================================
        // GET /api/courses/{courseId}/projects/{projectId}/teams
        // ============================================================
        [HttpGet("{courseId:int}/projects/{projectId:int}/teams")]
        [Authorize(Roles = "doctor")]
        public async Task<IActionResult> GetSavedTeams(int courseId, int projectId)
        {
            var doctorId = await GetCurrentDoctorIdAsync();
            if (doctorId == null)
                return Unauthorized(new { message = "Doctor profile not found." });

            var course = await _courseRepo.GetByIdAsync(courseId);
            if (course == null || course.DoctorId != doctorId.Value)
                return NotFound(new { message = "Course not found." });

            var project = await _projectRepo.GetByIdAsync(projectId);
            if (project == null || project.CourseId != courseId)
                return NotFound(new { message = "Project not found." });

            var teams = (await _teamRepo.GetByProjectIdAsync(projectId)).ToList();
            return Ok(MapTeamsResponse(teams, project, null));
        }

        // ============================================================
        // GET /api/courses/{courseId}/projects/{projectId}/teams/{teamIndex}
        // ============================================================
        [HttpGet("{courseId:int}/projects/{projectId:int}/teams/{teamIndex:int}")]
        [Authorize(Roles = "doctor")]
        public async Task<IActionResult> GetTeamByIndex(int courseId, int projectId, int teamIndex)
        {
            var doctorId = await GetCurrentDoctorIdAsync();
            if (doctorId == null)
                return Unauthorized(new { message = "Doctor profile not found." });

            var course = await _courseRepo.GetByIdAsync(courseId);
            if (course == null || course.DoctorId != doctorId.Value)
                return NotFound(new { message = "Course not found." });

            var team = await _teamRepo.GetTeamByIndexAsync(projectId, teamIndex);
            if (team == null)
                return NotFound(new { message = "Team not found." });

            return Ok(MapTeamDto(team, null));
        }

        // ============================================================
        // POST /api/courses/{courseId}/projects/{projectId}/teams/{teamIndex}/members
        // ============================================================
        [HttpPost("{courseId:int}/projects/{projectId:int}/teams/{teamIndex:int}/members")]
        [Authorize(Roles = "doctor")]
        public async Task<IActionResult> AddTeamMember(
            int courseId, int projectId, int teamIndex,
            [FromBody] AddTeamMemberDto dto)
        {
            var doctorId = await GetCurrentDoctorIdAsync();
            if (doctorId == null)
                return Unauthorized(new { message = "Doctor profile not found." });

            var course = await _courseRepo.GetByIdAsync(courseId);
            if (course == null || course.DoctorId != doctorId.Value)
                return NotFound(new { message = "Course not found." });

            var team = await _teamRepo.GetTeamByIndexAsync(projectId, teamIndex);
            if (team == null)
                return NotFound(new { message = "Team not found." });

            var studentProfile = await _courseRepo.GetStudentByUniversityIdAsync(dto.UniversityId);
            if (studentProfile == null)
                return NotFound(new { message = $"Student '{dto.UniversityId}' not found." });

            await _teamRepo.AddMemberAsync(team.Id, studentProfile.Id, studentProfile.UserId);
            var updated = await _teamRepo.GetTeamByIndexAsync(projectId, teamIndex);
            return Ok(MapTeamDto(updated!, null));
        }

        // ============================================================
        // DELETE .../teams/{teamIndex}/members/{studentProfileId}
        // ============================================================
        [HttpDelete("{courseId:int}/projects/{projectId:int}/teams/{teamIndex:int}/members/{studentProfileId:int}")]
        [Authorize(Roles = "doctor")]
        public async Task<IActionResult> RemoveTeamMember(
            int courseId, int projectId, int teamIndex, int studentProfileId)
        {
            var doctorId = await GetCurrentDoctorIdAsync();
            if (doctorId == null)
                return Unauthorized(new { message = "Doctor profile not found." });

            var course = await _courseRepo.GetByIdAsync(courseId);
            if (course == null || course.DoctorId != doctorId.Value)
                return NotFound(new { message = "Course not found." });

            var team = await _teamRepo.GetTeamByIndexAsync(projectId, teamIndex);
            if (team == null)
                return NotFound(new { message = "Team not found." });

            await _teamRepo.RemoveMemberAsync(team.Id, studentProfileId);
            var updated = await _teamRepo.GetTeamByIndexAsync(projectId, teamIndex);
            return Ok(MapTeamDto(updated!, null));
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

        private static CourseResponseDto MapCourseToDto(Course c, string doctorName = "") => new()
        {
            CourseId = c.Id,
            Name = c.Name,
            Code = c.Code,
            Semester = c.Semester,
            CreatedAt = c.CreatedAt,
            DoctorId = c.DoctorId,
            DoctorName = doctorName,
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

        private static CourseProjectResponseDto MapProjectToDto(CourseProject p)
        {
            // When ApplyToAllSections, sections list comes from the join table
            // (empty if all sections) — frontend handles this
            var sections = p.Sections.Select(s => new CourseProjectSectionDto
            {
                SectionId = s.CourseSectionId,
                SectionName = s.Section?.Name ?? string.Empty,
            }).ToList();

            return new CourseProjectResponseDto
            {
                Id = p.Id,
                CourseId = p.CourseId,
                Title = p.Title,
                Description = p.Description,
                TeamSize = p.TeamSize,
                ApplyToAllSections = p.ApplyToAllSections,
                AllowCrossSectionTeams = p.AllowCrossSectionTeams,
                AiMode = p.AiMode,
                CreatedAt = p.CreatedAt,
                Sections = sections,
            };
        }

        private static object MapTeamsResponse(
            IEnumerable<CourseTeam> teams,
            CourseProject project,
            List<StudentForTeam>? students)
        {
            var teamList = teams.ToList();
            return new
            {
                projectId = project.Id,
                projectTitle = project.Title,
                teamSize = project.TeamSize,
                teamCount = teamList.Count,
                teams = teamList.Select(t => MapTeamDto(t, students)),
            };
        }

        private static object MapTeamDto(CourseTeam t, List<StudentForTeam>? students)
        {
            return new
            {
                teamId = t.Id,
                teamIndex = t.TeamIndex,
                memberCount = t.Members.Count,
                members = t.Members.Select(m =>
                {
                    var skills = new List<string>();
                    if (students != null)
                    {
                        var s = students.FirstOrDefault(x => x.StudentProfileId == m.StudentProfileId);
                        if (s != null) skills = s.Skills;
                    }
                    else if (m.Student?.TechnicalSkills != null)
                    {
                        try { skills = System.Text.Json.JsonSerializer.Deserialize<List<string>>(m.Student.TechnicalSkills) ?? new(); }
                        catch { }
                    }
                    return new
                    {
                        studentId = m.StudentProfileId,
                        userId = m.UserId,
                        name = m.Student?.User?.Name ?? string.Empty,
                        universityId = m.Student?.StudentId,
                        matchScore = Math.Round(m.MatchScore, 1),
                        skills,
                    };
                }),
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
            SectionId = e.CourseSectionId,
        };
    }
}