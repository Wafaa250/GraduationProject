using System.Collections.Generic;
using System.Data;
using System.Text.Json;
using System.Text.RegularExpressions;
using GraduationProject.API.DTOs;
using GraduationProject.API.Data;
using GraduationProject.API.Helpers;
using GraduationProject.API.Interfaces;
using GraduationProject.API.Models;
using GraduationProject.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

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
        private readonly IGraduationProjectNotificationService _notifications;
        private readonly ApplicationDbContext _db;
        private readonly IAiStudentRecommendationService _aiStudentRecommendations;

        private const int MaxAiCourseTeamRecommendationCandidates = 20;

        public CoursesController(
            ICourseRepository courseRepo,
            ICourseSectionRepository sectionRepo,
            ICourseProjectRepository projectRepo,
            ITeamGenerationService teamService,
            ICourseTeamRepository teamRepo,
            IGraduationProjectNotificationService notifications,
            ApplicationDbContext db,
            IAiStudentRecommendationService aiStudentRecommendations)
        {
            _courseRepo = courseRepo;
            _sectionRepo = sectionRepo;
            _projectRepo = projectRepo;
            _teamService = teamService;
            _teamRepo = teamRepo;
            _notifications = notifications;
            _db = db;
            _aiStudentRecommendations = aiStudentRecommendations;
        }

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

        [HttpGet("enrolled")]
        [Authorize(Roles = "student")]
        public async Task<IActionResult> GetEnrolledCourses()
        {
            var studentId = await GetCurrentStudentIdAsync();
            if (studentId == null)
                return Unauthorized(new { message = "Student profile not found." });

            var enrollments = await _sectionRepo.GetEnrolledSectionsByStudentAsync(studentId.Value);

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
                var studentId = await GetCurrentStudentIdAsync();
                if (studentId == null)
                    return Unauthorized(new { message = "Student profile not found." });

                var enrollments = await _sectionRepo.GetEnrolledSectionsByStudentAsync(studentId.Value);
                var myEnrollment = enrollments.FirstOrDefault(e => e.Section.CourseId == courseId);
                if (myEnrollment == null)
                    return NotFound(new { message = "Course not found." });

                var doctorNames = await _courseRepo.GetDoctorNamesByIdsAsync(new List<int> { course.DoctorId });
                var doctorName = doctorNames.GetValueOrDefault(course.DoctorId, string.Empty);

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
                    mySectionId = myEnrollment.Section.Id,
                    mySectionName = myEnrollment.Section.Name,
                    sections = sections.Select(s =>
                    {
                        List<string> days;
                        try { days = JsonSerializer.Deserialize<List<string>>(s.Days) ?? new(); }
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

            if (added.Count > 0)
            {
                await _notifications.NotifyStudentsAddedToSectionAsync(
                    sectionId,
                    section.Name,
                    course.Id,
                    course.Name,
                    added.Select(e => e.StudentProfileId));
            }

            return Ok(new AddSectionStudentsResultDto
            {
                Added = added.Count,
                NotFound = notFound,
                AlreadyEnrolled = alreadyEnrolled,
            });
        }

        [HttpGet("{courseId:int}/students")]
        [Authorize(Roles = "student")]
        public async Task<IActionResult> GetCourseStudents(int courseId)
        {
            var studentId = await GetCurrentStudentIdAsync();
            if (studentId == null)
                return Unauthorized(new { message = "Student profile not found." });

            var enrollments = await _sectionRepo.GetEnrolledSectionsByStudentAsync(studentId.Value);
            var isEnrolled = enrollments.Any(e => e.Section.CourseId == courseId);
            if (!isEnrolled)
                return NotFound(new { message = "Course not found." });

            var allEnrollments = await _sectionRepo.GetAllEnrollmentsByCourseIdAsync(courseId);
            return Ok(allEnrollments.Select(MapEnrollmentToDto));
        }

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

            var allTeams = await _teamRepo.GetTeamsByProjectAsync(projectId);
            var myTeam = allTeams.FirstOrDefault(t =>
                t.Members.Any(m => m.StudentProfileId == studentId.Value));

            if (myTeam == null)
                return NotFound(new { message = "You are not assigned to a team for this project." });

            var enrollments = await _sectionRepo.GetEnrolledSectionsByStudentAsync(studentId.Value);
            _ = enrollments.FirstOrDefault(e => e.Section.CourseId == project.CourseId);

            return Ok(new
            {
                projectId = project.Id,
                projectTitle = project.Title,
                courseId = project.CourseId,
                teamId = myTeam.Id,
                teamIndex = myTeam.TeamIndex,
                members = myTeam.Members.Select(m => new
                {
                    studentId = m.StudentProfileId,
                    userId = m.UserId,
                    name = m.Student?.User?.Name ?? string.Empty,
                    universityId = m.Student?.StudentId,
                    matchScore = Math.Round(m.MatchScore, 1),
                }),
            });
        }

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
            if (role == "student")
            {
                var studentId = await GetCurrentStudentIdAsync();
                if (studentId == null)
                    return Unauthorized(new { message = "Student profile not found." });

                var projectIds = projects.Select(p => p.Id).ToList();
                var myProjectTeamIds = await _db.CourseTeamMembers
                    .Where(m => m.StudentProfileId == studentId.Value && projectIds.Contains(m.Team.CourseProjectId))
                    .Select(m => m.Team.CourseProjectId)
                    .Distinct()
                    .ToListAsync();
                var myProjectTeamIdSet = myProjectTeamIds.ToHashSet();

                return Ok(projects.Select(p =>
                {
                    var dto = MapProjectToDto(p);
                    return new
                    {
                        id = dto.Id,
                        courseId = dto.CourseId,
                        title = dto.Title,
                        description = dto.Description,
                        teamSize = dto.TeamSize,
                        applyToAllSections = dto.ApplyToAllSections,
                        allowCrossSectionTeams = dto.AllowCrossSectionTeams,
                        aiMode = dto.AiMode,
                        createdAt = dto.CreatedAt,
                        sections = dto.Sections,
                        hasTeam = myProjectTeamIdSet.Contains(dto.Id),
                    };
                }));
            }

            return Ok(projects.Select(MapProjectToDto));
        }

        [HttpGet("{courseId:int}/projects/{projectId:int}/manual-team/students")]
        [Authorize(Roles = "student")]
        public async Task<IActionResult> GetManualTeamStudents(int courseId, int projectId)
        {
            var me = await GetCurrentStudentIdAsync();
            if (me == null)
                return Unauthorized(new { message = "Student profile not found." });

            var enrollments = await _sectionRepo.GetEnrolledSectionsByStudentAsync(me.Value);
            var myEnrollment = enrollments.FirstOrDefault(e => e.Section.CourseId == courseId);
            if (myEnrollment == null)
                return NotFound(new { message = "Course not found." });

            var project = await _projectRepo.GetByIdAsync(projectId);
            if (project == null || project.CourseId != courseId)
                return NotFound(new { message = "Project not found." });

            if (!project.ApplyToAllSections)
            {
                var projectSectionIds = project.Sections.Select(s => s.CourseSectionId).ToHashSet();
                if (!projectSectionIds.Contains(myEnrollment.CourseSectionId))
                    return NotFound(new { message = "Project not found." });
            }

            var allCourseEnrollments = (await _sectionRepo.GetAllEnrollmentsByCourseIdAsync(courseId))
                .GroupBy(e => e.StudentProfileId)
                .Select(g => g.First())
                .Where(e => e.StudentProfileId != me.Value)
                .ToList();

            var memberIdsInProject = await _db.CourseTeamMembers
                .Where(m => m.Team.CourseProjectId == projectId)
                .Select(m => m.StudentProfileId)
                .Distinct()
                .ToListAsync();

            var senderTeam = await _db.CourseTeams
                .Include(t => t.Members)
                .Where(t => t.CourseProjectId == projectId && t.Members.Any(m => m.StudentProfileId == me.Value))
                .FirstOrDefaultAsync();

            var senderTeamMemberIds = senderTeam?.Members.Select(m => m.StudentProfileId).ToHashSet() ?? new HashSet<int>();
            var senderTeamIsFull = senderTeam != null && senderTeam.Members.Count >= project.TeamSize;

            var pendingDedupKeys = await _db.UserNotifications
                .Where(n =>
                    n.Category == "course" &&
                    n.EventType == "course_teammate_invitation_pending" &&
                    n.DedupKey != null)
                .Select(n => n.DedupKey!)
                .ToListAsync();

            var pendingInvitationsForProject = pendingDedupKeys
                .Select(ParseCourseInvitationDedupKey)
                .Where(x => x.HasValue && x.Value.projectId == projectId)
                .Select(x => x!.Value)
                .ToList();

            var pendingByReceiver = pendingInvitationsForProject
                .Select(x => x.receiverId)
                .ToHashSet();

            var students = allCourseEnrollments
                .Select(e =>
                {
                    var st = e.Student;
                    var inAnyTeam = memberIdsInProject.Contains(st.Id);
                    var inMyTeam = senderTeamMemberIds.Contains(st.Id);
                    var crossSectionBlocked = !project.AllowCrossSectionTeams && e.CourseSectionId != myEnrollment.CourseSectionId;
                    var notInProjectSection = !project.ApplyToAllSections &&
                                              !project.Sections.Any(ps => ps.CourseSectionId == e.CourseSectionId);
                    var hasPending = pendingInvitationsForProject.Any(x =>
                        (x.senderId == me.Value && x.receiverId == st.Id) ||
                        (x.senderId == st.Id && x.receiverId == me.Value));

                    string availabilityStatus;
                    string availabilityReason;
                    if (inMyTeam)
                    {
                        availabilityStatus = "already_teammate";
                        availabilityReason = "Already in your team";
                    }
                    else if (inAnyTeam)
                    {
                        availabilityStatus = "unavailable";
                        availabilityReason = "Already in team";
                    }
                    else if (hasPending)
                    {
                        availabilityStatus = "pending";
                        availabilityReason = "Pending invitation";
                    }
                    else if (crossSectionBlocked || notInProjectSection)
                    {
                        availabilityStatus = "unavailable";
                        availabilityReason = "Cross-section restricted";
                    }
                    else if (senderTeamIsFull)
                    {
                        availabilityStatus = "unavailable";
                        availabilityReason = "Team full";
                    }
                    else
                    {
                        availabilityStatus = "available";
                        availabilityReason = "Available";
                    }

                    return new
                    {
                        id = st.Id,
                        name = st.User?.Name ?? string.Empty,
                        email = st.User?.Email ?? string.Empty,
                        skills = ExtractSkillTags(st).Take(8).ToList(),
                        sectionName = e.Section?.Name ?? string.Empty,
                        avatar = st.ProfilePictureBase64,
                        bio = st.Bio,
                        hasPendingRequest = availabilityStatus == "pending" || pendingByReceiver.Contains(st.Id),
                        isAlreadyInTeam = availabilityStatus == "already_teammate",
                        availabilityStatus,
                        availabilityReason,
                    };
                })
                .OrderBy(s => s.name)
                .ToList();

            return Ok(new
            {
                projectId = project.Id,
                projectTitle = project.Title,
                teamSize = project.TeamSize,
                students,
            });
        }

        /// <summary>
        /// Ranked teammate suggestions for the manual invitation flow — same invitations API as browse mode.
        /// </summary>
        [HttpGet("{courseId:int}/projects/{projectId:int}/ai-team-recommendations")]
        [Authorize(Roles = "student")]
        public async Task<IActionResult> GetAiTeamRecommendations(int courseId, int projectId)
        {
            var me = await GetCurrentStudentIdAsync();
            if (me == null)
                return Unauthorized(new { message = "Student profile not found." });

            var enrollments = await _sectionRepo.GetEnrolledSectionsByStudentAsync(me.Value);
            var myEnrollment = enrollments.FirstOrDefault(e => e.Section.CourseId == courseId);
            if (myEnrollment == null)
                return NotFound(new { message = "Course not found." });

            var project = await _projectRepo.GetByIdAsync(projectId);
            if (project == null || project.CourseId != courseId)
                return NotFound(new { message = "Project not found." });

            if (!project.ApplyToAllSections)
            {
                var projectSectionIds = project.Sections.Select(s => s.CourseSectionId).ToHashSet();
                if (!projectSectionIds.Contains(myEnrollment.CourseSectionId))
                    return NotFound(new { message = "Project not found." });
            }

            var myProfile = await _db.StudentProfiles
                .AsNoTracking()
                .Include(s => s.User)
                .FirstOrDefaultAsync(s => s.Id == me.Value);

            if (myProfile?.User == null)
                return Unauthorized(new { message = "Student profile not found." });

            var myIds = GetProfileNumericSkillIds(myProfile).ToList();

            var requiredSkillNames = SkillHelper.ParseStringList(project.Description)
                .Where(n => !string.IsNullOrWhiteSpace(n))
                .Select(n => n.Trim())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            var requiredSkillIds = await ResolveRequiredSkillIdsAsync(requiredSkillNames);

            var allCourseEnrollments = (await _sectionRepo.GetAllEnrollmentsByCourseIdAsync(courseId))
                .GroupBy(e => e.StudentProfileId)
                .Select(g => g.First())
                .Where(e => e.StudentProfileId != me.Value)
                .ToList();

            var memberIdsInProject = await _db.CourseTeamMembers
                .Where(m => m.Team.CourseProjectId == projectId)
                .Select(m => m.StudentProfileId)
                .Distinct()
                .ToListAsync();

            var senderTeam = await _db.CourseTeams
                .Include(t => t.Members)
                .Where(t => t.CourseProjectId == projectId && t.Members.Any(m => m.StudentProfileId == me.Value))
                .FirstOrDefaultAsync();

            var senderTeamMemberIds = senderTeam?.Members.Select(m => m.StudentProfileId).ToHashSet() ?? new HashSet<int>();
            var senderTeamIsFull = senderTeam != null && senderTeam.Members.Count >= project.TeamSize;

            var pendingDedupKeys = await _db.UserNotifications
                .Where(n =>
                    n.Category == "course" &&
                    n.EventType == "course_teammate_invitation_pending" &&
                    n.DedupKey != null)
                .Select(n => n.DedupKey!)
                .ToListAsync();

            var pendingInvitationsForProject = pendingDedupKeys
                .Select(ParseCourseInvitationDedupKey)
                .Where(x => x.HasValue && x!.Value.projectId == projectId)
                .Select(x => x!.Value)
                .ToList();

            var pendingByReceiver = pendingInvitationsForProject
                .Select(x => x.receiverId)
                .ToHashSet();

            var candidates = new List<AiManualTeamRecommendationRow>();

            foreach (var e in allCourseEnrollments)
            {
                var st = e.Student;
                if (st?.User == null) continue;

                var onAnotherTeamOnly = memberIdsInProject.Contains(st.Id) && !senderTeamMemberIds.Contains(st.Id);
                if (onAnotherTeamOnly) continue;

                var crossSectionBlocked = !project.AllowCrossSectionTeams && e.CourseSectionId != myEnrollment.CourseSectionId;
                var notInProjectSection = !project.ApplyToAllSections &&
                    !project.Sections.Any(ps => ps.CourseSectionId == e.CourseSectionId);
                if (crossSectionBlocked || notInProjectSection) continue;

                var inMyTeam = senderTeamMemberIds.Contains(st.Id);

                var hasPending = pendingInvitationsForProject.Any(x =>
                    (x.senderId == me.Value && x.receiverId == st.Id) ||
                    (x.senderId == st.Id && x.receiverId == me.Value));

                string availabilityStatus;
                string availabilityReason;
                if (inMyTeam)
                {
                    availabilityStatus = "already_teammate";
                    availabilityReason = "Already in your team";
                }
                else if (hasPending)
                {
                    availabilityStatus = "pending";
                    availabilityReason = "Pending invitation";
                }
                else if (senderTeamIsFull)
                {
                    availabilityStatus = "unavailable";
                    availabilityReason = "Team full";
                }
                else
                {
                    availabilityStatus = "available";
                    availabilityReason = "Available";
                }

                var theirIds = GetProfileNumericSkillIds(st).ToList();

                var sharedRequiredCount = requiredSkillIds.Count <= 0
                    ? 0
                    : theirIds.Count(id => requiredSkillIds.Contains(id));

                if (requiredSkillIds.Count > 0 && sharedRequiredCount == 0 && availabilityStatus != "already_teammate")
                    continue;

                var commonWithMe = myIds.Intersect(theirIds).Count();
                var complementaryCount = theirIds.Except(myIds).Count();

                var dashboardOverlap = DashboardStyleTeammateScore(myIds, theirIds);
                var projectFit = requiredSkillIds.Count <= 0
                    ? dashboardOverlap
                    : (int)Math.Round(100.0 * sharedRequiredCount / requiredSkillIds.Count);

                var fallbackScore = requiredSkillIds.Count <= 0
                    ? dashboardOverlap
                    : (int)Math.Min(dashboardOverlap * 0.55 + projectFit * 0.45, 100);

                var bioTokens = BioTokens(myProfile.Bio).Intersect(BioTokens(st.Bio)).Count();
                if (bioTokens > 0 && fallbackScore < 100)
                    fallbackScore = Math.Min(fallbackScore + Math.Min(bioTokens * 3, 9), 100);

                var skillNamesDisplay = ExtractSkillTags(st).Take(8).ToList();

                var matchReasonFallback = BuildFallbackMatchReason(sharedRequiredCount, requiredSkillIds.Count,
                    commonWithMe, complementaryCount, bioTokens > 0);

                candidates.Add(new AiManualTeamRecommendationRow
                {
                    StudentId = st.Id,
                    Name = st.User!.Name ?? string.Empty,
                    Email = st.User.Email ?? string.Empty,
                    Avatar = st.ProfilePictureBase64,
                    SectionName = e.Section?.Name ?? string.Empty,
                    SkillNames = skillNamesDisplay,
                    Bio = st.Bio,
                    Major = st.Major ?? string.Empty,
                    FallbackScore = fallbackScore,
                    MatchScore = fallbackScore,
                    MatchReason = matchReasonFallback,
                    HasPendingRequest = hasPending || pendingByReceiver.Contains(st.Id),
                    IsAlreadyInTeam = inMyTeam,
                    AvailabilityStatus = availabilityStatus,
                    AvailabilityReason = availabilityReason
                });
            }

            var forAiSubset = candidates
                .Where(c => c.AvailabilityStatus is "available" or "pending")
                .OrderByDescending(c => c.FallbackScore)
                .Take(MaxAiCourseTeamRecommendationCandidates)
                .ToList();

            AiProjectInput aiProject = new()
            {
                Title = project.Title,
                Abstract = project.Description ?? string.Empty,
                RequiredSkills = requiredSkillNames
            };

            var ranked = await _aiStudentRecommendations.RankStudentsAsync(aiProject,
                forAiSubset.Select(r => new AiStudentInput
                {
                    StudentId = r.StudentId,
                    Name = r.Name,
                    Skills = r.SkillNames.ToList(),
                    Major = r.Major,
                    Bio = r.Bio ?? string.Empty
                }).ToList());

            var ordered = OrderRecommendationsWithOptionalAi(candidates, ranked);

            var payload = ordered.Select(r => new
            {
                studentId = r.StudentId,
                name = r.Name,
                email = r.Email,
                avatar = r.Avatar,
                sectionName = r.SectionName,
                skills = r.SkillNames,
                bio = r.Bio,
                matchScore = r.MatchScore,
                matchReason = r.MatchReason,
                hasPendingRequest = r.HasPendingRequest,
                isAlreadyInTeam = r.IsAlreadyInTeam,
                availabilityStatus = r.AvailabilityStatus,
                availabilityReason = r.AvailabilityReason
            }).ToList();

            return Ok(payload);
        }

        private static List<AiManualTeamRecommendationRow> OrderRecommendationsWithOptionalAi(
            List<AiManualTeamRecommendationRow> candidates,
            List<AiRankedStudentResult>? rankedAi)
        {
            var dict = candidates.ToDictionary(c => c.StudentId, c => c);

            var ordered = new List<AiManualTeamRecommendationRow>();

            void appendFromDictionary(int studentId, int matchScore, string reason)
            {
                if (!dict.TryGetValue(studentId, out var row)) return;
                row.MatchScore = matchScore;
                row.MatchReason = reason;
                ordered.Add(row);
                dict.Remove(studentId);
            }

            if (rankedAi != null && rankedAi.Count > 0)
            {
                var validAiIds = candidates.Select(c => c.StudentId).ToHashSet();
                foreach (var r in rankedAi)
                {
                    if (!validAiIds.Contains(r.StudentId)) continue;
                    var score = Math.Clamp(r.MatchScore, 0, 100);
                    var reason = string.IsNullOrWhiteSpace(r.Reason) ? candidates.First(c => c.StudentId == r.StudentId).MatchReason : r.Reason.Trim();
                    appendFromDictionary(r.StudentId, score, reason);
                }
            }

            foreach (var rest in dict.Values.OrderByDescending(c => c.FallbackScore).ThenBy(c => c.Name))
                appendFromDictionary(rest.StudentId, rest.MatchScore, rest.MatchReason);

            return ordered;
        }

        private static int DashboardStyleTeammateScore(IReadOnlyList<int> myIds, IReadOnlyList<int> theirIds)
        {
            var common = myIds.Intersect(theirIds).Count();
            var complementary = theirIds.Except(myIds).Count();
            var score = (int)(
                common * 0.6 / Math.Max(myIds.Count, 1) * 100 +
                complementary * 0.4 / Math.Max(theirIds.Count, 1) * 100);
            return Math.Min(Math.Max(score, 0), 100);
        }

        private static IEnumerable<int> GetProfileNumericSkillIds(StudentProfile p) =>
            SkillHelper.ParseIntList(p.Roles)
                .Concat(SkillHelper.ParseIntList(p.TechnicalSkills))
                .Concat(SkillHelper.ParseIntList(p.Tools));

        private static string BuildFallbackMatchReason(
            int matchedRequiredSkills, int totalRequiredSkills, int sharedWithCaller, int complementary,
            bool bioOverlap)
        {
            var parts = new List<string>();
            if (totalRequiredSkills > 0 && matchedRequiredSkills > 0)
                parts.Add($"Matches {matchedRequiredSkills} required project skill(s)");
            if (sharedWithCaller > 0)
                parts.Add($"{sharedWithCaller} shared skill(s) overlap with your profile");
            if (complementary > 0)
                parts.Add($"Adds {complementary} complementary skill slot(s)");
            if (bioOverlap)
                parts.Add("Bio/role wording overlaps");
            if (parts.Count == 0)
                return "Eligible peer in this project cohort with a complementary skill mix.";
            return string.Join("; ", parts) + ".";
        }

        private static HashSet<string> BioTokens(string? bio)
        {
            var set = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            if (string.IsNullOrWhiteSpace(bio)) return set;
            foreach (var tok in Regex.Split(bio, @"[\s,.;:!?()\[\]{}/""'-]+"))
            {
                var t = tok.Trim().ToLowerInvariant();
                if (t.Length >= 4) set.Add(t);
            }
            return set;
        }

        private async Task<List<int>> ResolveRequiredSkillIdsAsync(List<string> requiredSkillNames)
        {
            if (requiredSkillNames.Count == 0) return new List<int>();

            var allSkills = await _db.Skills.AsNoTracking()
                .Select(s => new { s.Id, s.Name })
                .ToListAsync();

            return allSkills
                .Where(s => requiredSkillNames.Any(r => string.Equals(r, s.Name, StringComparison.OrdinalIgnoreCase)))
                .Select(s => s.Id)
                .ToList();
        }

        private sealed class AiManualTeamRecommendationRow
        {
            public int StudentId { get; init; }
            public string Name { get; init; } = "";
            public string Email { get; init; } = "";
            public string? Avatar { get; init; }
            public string SectionName { get; init; } = "";
            public List<string> SkillNames { get; init; } = new();
            public string? Bio { get; init; }
            public string Major { get; init; } = "";
            public int FallbackScore { get; init; }
            public int MatchScore { get; set; }
            public string MatchReason { get; set; } = "";
            public bool HasPendingRequest { get; init; }
            public bool IsAlreadyInTeam { get; init; }
            public string AvailabilityStatus { get; init; } = "";
            public string AvailabilityReason { get; init; } = "";
        }

        [HttpPost("{courseId:int}/projects/{projectId:int}/manual-team/requests/{receiverId:int}")]
        [Authorize(Roles = "student")]
        public async Task<IActionResult> SendManualTeamRequest(int courseId, int projectId, int receiverId)
        {
            var me = await GetCurrentStudentIdAsync();
            if (me == null)
                return Unauthorized(new { message = "Student profile not found." });

            if (receiverId == me.Value)
                return BadRequest(new { message = "You cannot send a request to yourself." });

            var enrollments = await _sectionRepo.GetEnrolledSectionsByStudentAsync(me.Value);
            var myEnrollment = enrollments.FirstOrDefault(e => e.Section.CourseId == courseId);
            if (myEnrollment == null)
                return NotFound(new { message = "Course not found." });

            var project = await _projectRepo.GetByIdAsync(projectId);
            if (project == null || project.CourseId != courseId)
                return NotFound(new { message = "Project not found." });

            var receiverEnrollment = await _db.SectionEnrollments
                .Include(e => e.Section)
                .Include(e => e.Student)
                    .ThenInclude(s => s.User)
                .FirstOrDefaultAsync(e => e.Section.CourseId == courseId && e.StudentProfileId == receiverId);

            if (receiverEnrollment == null)
                return NotFound(new { message = "Student not found in this course." });

            if (!project.AllowCrossSectionTeams && receiverEnrollment.CourseSectionId != myEnrollment.CourseSectionId)
                return BadRequest(new { message = "This project does not allow cross-section teams." });

            if (!project.ApplyToAllSections)
            {
                var projectSectionIds = project.Sections.Select(s => s.CourseSectionId).ToHashSet();
                if (!projectSectionIds.Contains(myEnrollment.CourseSectionId) || !projectSectionIds.Contains(receiverEnrollment.CourseSectionId))
                    return BadRequest(new { message = "This student is not eligible for this project." });
            }

            var memberIdsInProject = await _db.CourseTeamMembers
                .Where(m => m.Team.CourseProjectId == projectId)
                .Select(m => m.StudentProfileId)
                .Distinct()
                .ToListAsync();

            if (memberIdsInProject.Contains(receiverId))
                return BadRequest(new { message = "This student is already assigned to a team for this project." });

            var directDedup = BuildCourseInvitationDedupKey(projectId, me.Value, receiverId);
            var reverseDedup = BuildCourseInvitationDedupKey(projectId, receiverId, me.Value);

            var duplicatePending = await _db.UserNotifications.AnyAsync(n =>
                n.Category == "course" &&
                n.EventType == "course_teammate_invitation_pending" &&
                (n.DedupKey == directDedup || n.DedupKey == reverseDedup));

            if (duplicatePending)
                return Conflict(new { message = "A pending request already exists." });

            // Data repair guard:
            // Older rows may still keep the same dedup key after non-pending states,
            // which violates the unique index (user_id, dedup_key) on re-send.
            // Clear dedup on non-pending rows for this same key before inserting.
            var staleSameKeyRows = await _db.UserNotifications
                .Where(n =>
                    n.UserId == receiverEnrollment.Student.UserId &&
                    n.Category == "course" &&
                    n.DedupKey == directDedup &&
                    n.EventType != "course_teammate_invitation_pending")
                .ToListAsync();
            if (staleSameKeyRows.Count > 0)
            {
                foreach (var row in staleSameKeyRows)
                    row.DedupKey = null;
                await _db.SaveChangesAsync();
            }

            var senderTeam = await _db.CourseTeams
                .Include(t => t.Members)
                .Where(t => t.CourseProjectId == projectId && t.Members.Any(m => m.StudentProfileId == me.Value))
                .FirstOrDefaultAsync();

            var senderCurrentCount = senderTeam?.Members.Count ?? 1;
            var senderPendingCount = await _db.UserNotifications
                .Where(n =>
                    n.Category == "course" &&
                    n.EventType == "course_teammate_invitation_pending" &&
                    n.DedupKey != null &&
                    EF.Functions.Like(n.DedupKey, $"course:invite:{projectId}:{me.Value}:%"))
                .CountAsync();

            var occupiedSlots = senderCurrentCount + senderPendingCount;
            if (occupiedSlots >= project.TeamSize)
                return BadRequest(new { message = "Your team already reached the project team size limit." });

            var senderName = myEnrollment.Student?.User?.Name ?? "A student";
            _db.UserNotifications.Add(new UserNotification
            {
                UserId = receiverEnrollment.Student.UserId,
                Category = "course",
                EventType = "course_teammate_invitation_pending",
                ProjectId = projectId,
                Title = "Team request received",
                Body = $"{senderName} invited you to join their team for \"{project.Title}\".",
                DedupKey = directDedup,
                CreatedAt = DateTime.UtcNow,
                ReadAt = null,
            });

            await _db.SaveChangesAsync();
            return Ok(new { message = "Team request sent successfully." });
        }

        [HttpGet("team-invitations")]
        [Authorize(Roles = "student")]
        public async Task<IActionResult> GetMyTeamInvitations()
        {
            var me = await GetCurrentStudentIdAsync();
            if (me == null) return Unauthorized(new { message = "Student profile not found." });

            var meUserId = AuthorizationHelper.GetUserId(User);
            var pending = await _db.UserNotifications
                .Where(n => n.UserId == meUserId && n.Category == "course" && n.EventType == "course_teammate_invitation_pending" && n.DedupKey != null)
                .OrderByDescending(n => n.CreatedAt)
                .ToListAsync();

            var items = new List<object>();
            foreach (var n in pending)
            {
                var parsed = ParseCourseInvitationDedupKey(n.DedupKey!);
                if (!parsed.HasValue) continue;
                var (projectId, senderId, receiverId) = parsed.Value;
                if (receiverId != me.Value) continue;

                var project = await _projectRepo.GetByIdAsync(projectId);
                if (project == null) continue;
                var course = await _courseRepo.GetByIdAsync(project.CourseId);
                if (course == null) continue;

                var sender = await _db.StudentProfiles
                    .Include(s => s.User)
                    .FirstOrDefaultAsync(s => s.Id == senderId);
                var senderSection = await _db.SectionEnrollments
                    .Include(e => e.Section)
                    .Where(e => e.StudentProfileId == senderId && e.Section.CourseId == project.CourseId)
                    .Select(e => e.Section.Name)
                    .FirstOrDefaultAsync();

                items.Add(new
                {
                    invitationId = n.Id,
                    projectId = project.Id,
                    projectTitle = project.Title,
                    courseId = course.Id,
                    courseName = course.Name,
                    senderId,
                    senderName = sender?.User?.Name ?? "Student",
                    senderSection = senderSection ?? "Unknown section",
                    senderSkills = sender == null ? new List<string>() : ExtractSkillTags(sender).Take(8).ToList(),
                    message = n.Body,
                    invitedAt = n.CreatedAt,
                });
            }

            return Ok(items);
        }

        [HttpPost("team-invitations/{invitationId:int}/accept")]
        [Authorize(Roles = "student")]
        public async Task<IActionResult> AcceptTeamInvitation(int invitationId)
        {
            static CourseTeamMember BuildMember(int studentProfileId, int userId) => new()
            {
                StudentProfileId = studentProfileId,
                UserId = userId,
                MatchScore = 0,
            };

            var me = await GetCurrentStudentIdAsync();
            if (me == null) return Unauthorized(new { message = "Student profile not found." });
            var meUserId = AuthorizationHelper.GetUserId(User);
            if (meUserId <= 0) return Unauthorized(new { message = "Invalid user context." });

            await using var tx = await _db.Database.BeginTransactionAsync(IsolationLevel.Serializable);

            var invitation = await _db.UserNotifications
                .FirstOrDefaultAsync(n =>
                    n.Id == invitationId &&
                    n.UserId == meUserId &&
                    n.Category == "course" &&
                    n.EventType == "course_teammate_invitation_pending" &&
                    n.DedupKey != null);
            if (invitation == null)
            {
                await tx.RollbackAsync();
                return NotFound(new { message = "Invitation not found." });
            }

            var parsed = ParseCourseInvitationDedupKey(invitation.DedupKey!);
            if (!parsed.HasValue)
            {
                await tx.RollbackAsync();
                return BadRequest(new { message = "Invitation data is invalid." });
            }

            var (projectId, senderStudentProfileId, receiverStudentProfileId) = parsed.Value;
            if (senderStudentProfileId <= 0 || receiverStudentProfileId <= 0)
            {
                await tx.RollbackAsync();
                return BadRequest(new { message = "Invitation participant ids are invalid." });
            }

            if (senderStudentProfileId == receiverStudentProfileId)
            {
                await tx.RollbackAsync();
                return BadRequest(new { message = "Invitation data is invalid: sender and receiver are identical." });
            }

            if (receiverStudentProfileId != me.Value)
            {
                await tx.RollbackAsync();
                return Forbid();
            }

            var project = await _projectRepo.GetByIdAsync(projectId);
            if (project == null)
            {
                await tx.RollbackAsync();
                return NotFound(new { message = "Project not found." });
            }

            var courseId = project.CourseId;

            var senderStudent = await _db.StudentProfiles
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.Id == senderStudentProfileId);
            if (senderStudent == null)
            {
                await tx.RollbackAsync();
                return BadRequest(new { message = "Invitation sender account is invalid." });
            }

            var receiverStudent = await _db.StudentProfiles
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.UserId == meUserId);
            if (receiverStudent == null)
            {
                await tx.RollbackAsync();
                return Unauthorized(new { message = "Student profile not found." });
            }

            if (receiverStudent.Id != receiverStudentProfileId)
            {
                await tx.RollbackAsync();
                return Forbid();
            }

            var senderUserId = senderStudent.UserId;
            var receiverUserId = receiverStudent.UserId;

            var receiverInProjectTeam = await _db.CourseTeamMembers
                .AnyAsync(m => m.Team.CourseProjectId == projectId && m.StudentProfileId == receiverStudent.Id);
            if (receiverInProjectTeam)
            {
                await tx.RollbackAsync();
                return BadRequest(new { message = "You are already in a team for this project." });
            }

            var senderTeam = await _db.CourseTeams
                .Include(t => t.Members)
                .Where(t => t.CourseProjectId == projectId && t.Members.Any(m => m.StudentProfileId == senderStudent.Id))
                .FirstOrDefaultAsync();

            if (senderTeam != null &&
                senderTeam.Members.Any(m => m.StudentProfileId == receiverStudent.Id))
            {
                await tx.RollbackAsync();
                return BadRequest(new { message = "You are already in the sender team." });
            }

            // Seats after accept = current count + receiver; new team implies sender-only slot before accept.
            int membersBeforeAccept;
            if (senderTeam == null)
                membersBeforeAccept = 1;
            else
                membersBeforeAccept = await _db.CourseTeamMembers.CountAsync(m => m.CourseTeamId == senderTeam.Id);

            if (membersBeforeAccept >= project.TeamSize)
            {
                await tx.RollbackAsync();
                return BadRequest(new { message = "Team is full." });
            }

            CourseTeam trackedTeam;

            if (senderTeam == null)
            {
                var nextIndex = (await _db.CourseTeams
                    .Where(t => t.CourseProjectId == projectId)
                    .Select(t => (int?)t.TeamIndex)
                    .MaxAsync() ?? -1) + 1;

                trackedTeam = new CourseTeam
                {
                    CourseProjectId = projectId,
                    TeamIndex = nextIndex,
                    CreatedAt = DateTime.UtcNow,
                    Members =
                    [
                        BuildMember(senderStudent.Id, senderUserId),
                        BuildMember(receiverStudent.Id, receiverUserId),
                    ],
                };
                _db.CourseTeams.Add(trackedTeam);
            }
            else
            {
                trackedTeam = await _db.CourseTeams
                    .Include(t => t.Members)
                    .Where(t => t.Id == senderTeam.Id)
                    .FirstAsync();

                if (trackedTeam.Members.Any(m => m.StudentProfileId == receiverStudent.Id))
                {
                    await tx.RollbackAsync();
                    return BadRequest(new { message = "You are already in the sender team." });
                }

                var seatsUsed = await _db.CourseTeamMembers.CountAsync(m => m.CourseTeamId == trackedTeam.Id);
                if (seatsUsed >= project.TeamSize)
                {
                    await tx.RollbackAsync();
                    return BadRequest(new { message = "Team is full." });
                }

                trackedTeam.Members.Add(BuildMember(receiverStudent.Id, receiverUserId));
            }

            invitation.EventType = "course_teammate_invitation_accepted";
            invitation.ReadAt = DateTime.UtcNow;
            invitation.DedupKey = null;

            var conflicting = await _db.UserNotifications
                .Where(n =>
                    n.Id != invitationId &&
                    n.UserId == receiverUserId &&
                    n.Category == "course" &&
                    n.EventType == "course_teammate_invitation_pending" &&
                    n.DedupKey != null &&
                    EF.Functions.Like(n.DedupKey, $"course:invite:{projectId}:%:{receiverStudent.Id}"))
                .ToListAsync();

            foreach (var c in conflicting)
            {
                c.EventType = "course_teammate_invitation_rejected";
                c.ReadAt = DateTime.UtcNow;
                c.DedupKey = null;
            }

            _db.UserNotifications.Add(new UserNotification
            {
                UserId = senderUserId,
                Category = "course",
                EventType = "course_teammate_invitation_accepted",
                ProjectId = projectId,
                Title = "Invitation accepted",
                Body = "Your teammate invitation was accepted.",
                DedupKey = $"course-team-invite-accepted:{invitation.Id}",
                CreatedAt = DateTime.UtcNow,
                ReadAt = null,
            });

            await _db.SaveChangesAsync();
            await tx.CommitAsync();

            return Ok(new
            {
                teamId = trackedTeam.Id,
                courseId,
                projectId,
                status = "accepted",
            });
        }

        [HttpPost("team-invitations/{invitationId:int}/reject")]
        [Authorize(Roles = "student")]
        public async Task<IActionResult> RejectTeamInvitation(int invitationId)
        {
            var meUserId = AuthorizationHelper.GetUserId(User);
            var me = await GetCurrentStudentIdAsync();
            if (me == null) return Unauthorized(new { message = "Student profile not found." });
            var invitation = await _db.UserNotifications
                .FirstOrDefaultAsync(n =>
                    n.Id == invitationId &&
                    n.UserId == meUserId &&
                    n.Category == "course" &&
                    n.EventType == "course_teammate_invitation_pending");
            if (invitation == null) return NotFound(new { message = "Invitation not found." });

            var parsed = invitation.DedupKey != null ? ParseCourseInvitationDedupKey(invitation.DedupKey) : null;
            invitation.EventType = "course_teammate_invitation_rejected";
            invitation.ReadAt = DateTime.UtcNow;
            invitation.DedupKey = null;
            if (parsed.HasValue)
            {
                var (_, senderId, _) = parsed.Value;
                var senderUserId = await GetStudentUserId(senderId);
                if (senderUserId > 0)
                {
                    _db.UserNotifications.Add(new UserNotification
                    {
                        UserId = senderUserId,
                        Category = "course",
                        EventType = "course_teammate_invitation_rejected",
                        ProjectId = invitation.ProjectId,
                        Title = "Invitation rejected",
                        Body = "Your teammate invitation was rejected.",
                        CreatedAt = DateTime.UtcNow,
                        ReadAt = null,
                    });
                }
            }
            await _db.SaveChangesAsync();
            return Ok(new { message = "Invitation rejected." });
        }

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

            var project = new CourseProject
            {
                CourseId = courseId,
                Title = dto.Title.Trim(),
                Description = string.IsNullOrWhiteSpace(dto.Description) ? null : dto.Description.Trim(),
                TeamSize = dto.TeamSize,
                ApplyToAllSections = dto.ApplyToAllSections,
                AllowCrossSectionTeams = dto.AllowCrossSectionTeams,
                AiMode = aiMode,
                CreatedAt = DateTime.UtcNow,
            };

            var sectionIds = dto.ApplyToAllSections ? new List<int>() : dto.SectionIds;

            var created = await _projectRepo.CreateAsync(project, sectionIds);
            await _notifications.NotifyCourseProjectCreatedAsync(
                created.Id,
                created.CourseId,
                created.Title,
                created.ApplyToAllSections,
                created.Sections.Select(s => s.CourseSectionId));
            return CreatedAtAction(
                nameof(GetCourseProjects),
                new { courseId },
                MapProjectToDto(created));
        }

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

            project.Title = dto.Title.Trim();
            project.Description = string.IsNullOrWhiteSpace(dto.Description) ? null : dto.Description.Trim();
            project.TeamSize = dto.TeamSize;
            project.ApplyToAllSections = dto.ApplyToAllSections;
            project.AllowCrossSectionTeams = dto.AllowCrossSectionTeams;
            project.AiMode = aiMode;

            var sectionIds = dto.ApplyToAllSections ? new List<int>() : dto.SectionIds;

            var updated = await _projectRepo.UpdateAsync(project, sectionIds);
            await _notifications.NotifyCourseProjectUpdatedAsync(
                updated.Id,
                updated.CourseId,
                updated.Title,
                updated.ApplyToAllSections,
                updated.Sections.Select(s => s.CourseSectionId));
            return Ok(MapProjectToDto(updated));
        }

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

            await _notifications.NotifyCourseProjectDeletedAsync(
                project.Id,
                project.CourseId,
                project.Title,
                project.ApplyToAllSections,
                project.Sections.Select(s => s.CourseSectionId));
            await _projectRepo.DeleteAsync(projectId);
            return NoContent();
        }

        [HttpPost("{courseId:int}/projects/{projectId:int}/generate-teams")]
        [Authorize(Roles = "doctor")]
        public async Task<IActionResult> GenerateTeams(int courseId, int projectId)
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

            if (project.AiMode != "doctor")
                return BadRequest(new { message = "Team generation is only available for doctor-assign projects." });

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

            var students = enrollments
                .GroupBy(e => e.StudentProfileId)
                .Select(g =>
                {
                    var s = g.First().Student;
                    var skills = new List<string>();
                    if (!string.IsNullOrWhiteSpace(s?.TechnicalSkills))
                    {
                        try { skills = JsonSerializer.Deserialize<List<string>>(s.TechnicalSkills) ?? new(); }
                        catch { /* ignore */ }
                    }
                    return new StudentForTeam(
                        StudentProfileId: g.Key,
                        UserId: s?.UserId ?? 0,
                        Name: s?.User?.Name ?? string.Empty,
                        Skills: skills,
                        Major: s?.Major,
                        Bio: s?.Bio);
                })
                .ToList();

            var result = await _teamService.GenerateTeamsAsync(
                courseId,
                projectId,
                project.Title,
                project.Description,
                project.TeamSize,
                students);

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
            await _notifications.NotifyCourseTeamsGeneratedAsync(
                projectId,
                project.Title,
                saved.SelectMany(t => t.Members.Select(m => m.UserId)));
            return Ok(MapTeamsResponse(saved, project, students));
        }

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

            var teams = (await _teamRepo.GetTeamsByProjectAsync(projectId)).ToList();
            return Ok(MapTeamsResponse(teams, project, null));
        }

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

            var project = await _projectRepo.GetByIdAsync(projectId);
            if (project == null || project.CourseId != courseId)
                return NotFound(new { message = "Project not found." });

            var allTeamsBefore = (await _teamRepo.GetTeamsByProjectAsync(projectId)).ToList();
            var studentProfile = await _courseRepo.GetStudentByUniversityIdAsync(dto.UniversityId);
            if (studentProfile == null)
                return NotFound(new { message = $"Student '{dto.UniversityId}' not found." });

            var oldTeam = allTeamsBefore.FirstOrDefault(t => t.Members.Any(m => m.StudentProfileId == studentProfile.Id));
            await _teamRepo.AddMemberAsync(team.Id, studentProfile.Id, studentProfile.UserId);
            var updated = await _teamRepo.GetTeamByIndexAsync(projectId, teamIndex);
            if (updated != null)
            {
                await _notifications.NotifyCourseTeamMemberAddedAsync(
                    projectId,
                    project.Title,
                    studentProfile.Id,
                    teamIndex,
                    updated.Members.Select(m => m.UserId),
                    oldTeam?.TeamIndex,
                    oldTeam?.Members.Select(m => m.UserId));
            }
            return Ok(MapTeamDto(updated!, null));
        }

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

            var project = await _projectRepo.GetByIdAsync(projectId);
            if (project == null || project.CourseId != courseId)
                return NotFound(new { message = "Project not found." });

            await _teamRepo.RemoveMemberAsync(team.Id, studentProfileId);
            var updated = await _teamRepo.GetTeamByIndexAsync(projectId, teamIndex);
            await _notifications.NotifyCourseTeamMemberRemovedAsync(
                projectId,
                project.Title,
                studentProfileId,
                teamIndex,
                updated?.Members.Select(m => m.UserId) ?? Enumerable.Empty<int>());
            return Ok(MapTeamDto(updated!, null));
        }

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
                        if (s != null) skills = s.Skills.ToList();
                    }
                    else if (m.Student?.TechnicalSkills != null)
                    {
                        try { skills = JsonSerializer.Deserialize<List<string>>(m.Student.TechnicalSkills) ?? new(); }
                        catch { /* ignore */ }
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

        private static string BuildCourseInvitationDedupKey(int projectId, int senderId, int receiverId)
            => $"course:invite:{projectId}:{senderId}:{receiverId}";

        private static (int projectId, int senderId, int receiverId)? ParseCourseInvitationDedupKey(string dedupKey)
        {
            var match = Regex.Match(dedupKey, @"^course:invite:(\d+):(\d+):(\d+)$");
            if (!match.Success) return null;
            if (!int.TryParse(match.Groups[1].Value, out var p)) return null;
            if (!int.TryParse(match.Groups[2].Value, out var s)) return null;
            if (!int.TryParse(match.Groups[3].Value, out var r)) return null;
            return (p, s, r);
        }

        private static IEnumerable<string> ExtractSkillTags(StudentProfile profile)
        {
            var raw = new[] { profile.Roles, profile.TechnicalSkills, profile.Tools };
            var tags = new List<string>();
            foreach (var block in raw)
            {
                if (string.IsNullOrWhiteSpace(block)) continue;
                try
                {
                    var parsed = JsonSerializer.Deserialize<List<string>>(block);
                    if (parsed != null) tags.AddRange(parsed.Where(s => !string.IsNullOrWhiteSpace(s)).Select(s => s.Trim()));
                }
                catch
                {
                    // Keep endpoint resilient if a profile has malformed skill JSON.
                }
            }
            return tags.Distinct(StringComparer.OrdinalIgnoreCase);
        }

        private async Task<int> GetStudentUserId(int studentProfileId)
        {
            return await _db.StudentProfiles
                .Where(s => s.Id == studentProfileId)
                .Select(s => s.UserId)
                .FirstOrDefaultAsync();
        }
    }
}
