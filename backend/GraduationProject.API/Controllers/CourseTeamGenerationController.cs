// Controllers/CourseTeamGenerationController.cs
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GraduationProject.API.Data;
using GraduationProject.API.Helpers;
using GraduationProject.API.Models;
using GraduationProject.API.Services;

namespace GraduationProject.API.Controllers
{
    /// <summary>
    /// AI Team Generation — Doctor only.
    ///
    /// POST /api/courses/{courseId}/projects/{projectId}/generate-teams
    ///
    /// Takes all students enrolled in the course (or scoped section),
    /// ranks them via the AI service (complementary skills),
    /// and returns suggested teams based on the project's teamSize.
    /// Nothing is persisted — the doctor reviews and can regenerate.
    /// </summary>
    [ApiController]
    [Route("api/courses/{courseId:int}/projects/{projectId:int}")]
    [Authorize]
    public class CourseTeamGenerationController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly IAiPartnerRecommendationService _ai;
        private readonly IAiTeamFormationService _teamAi;

        public CourseTeamGenerationController(
            ApplicationDbContext db,
            IAiPartnerRecommendationService ai,
            IAiTeamFormationService teamAi)
        {
            _db = db;
            _ai = ai;
            _teamAi = teamAi;
        }

        // =====================================================================
        // POST /api/courses/{courseId}/projects/{projectId}/generate-teams
        //
        // Returns suggested teams (not saved to DB).
        // Each team is a list of student ids + names.
        // =====================================================================
        [HttpPost("generate-teams")]
        public async Task<IActionResult> GenerateTeams(int courseId, int projectId)
        {
            // ── 1. Doctor only + course ownership ────────────────────────────
            if (AuthorizationHelper.GetRole(User) != "doctor")
                return StatusCode(403, new { message = "Only doctors can generate teams." });

            var userId = AuthorizationHelper.GetUserId(User);
            var doctor = await _db.DoctorProfiles
                .AsNoTracking()
                .FirstOrDefaultAsync(d => d.UserId == userId);

            if (doctor == null)
                return StatusCode(403, new { message = "Doctor profile not found." });

            var course = await _db.Courses.AsNoTracking()
                .FirstOrDefaultAsync(c => c.Id == courseId);

            if (course == null)
                return NotFound(new { message = "Course not found." });

            if (course.DoctorId != doctor.Id)
                return StatusCode(403, new { message = "You do not own this course." });

            // ── 2. Load the CourseProject ─────────────────────────────────────
            var project = await _db.CourseProjects
                .AsNoTracking()
                .Include(p => p.CourseProjectSections)
                .FirstOrDefaultAsync(p => p.Id == projectId && p.CourseId == courseId);

            if (project == null)
                return NotFound(new { message = "Project not found." });

            var teamSize = project.TeamSize;

            // ── 3. Determine which students are eligible ──────────────────────
            // If project applies to specific sections → only students in those sections.
            // If project applies to all sections     → all enrolled students.
            IQueryable<CourseEnrollment> enrollmentsQuery = _db.CourseEnrollments
                .AsNoTracking()
                .Where(e => e.CourseId == courseId);

            if (!project.ApplyToAllSections && project.CourseProjectSections.Count > 0)
            {
                var sectionIds = project.CourseProjectSections
                    .Select(cps => cps.CourseSectionId)
                    .ToList();

                enrollmentsQuery = enrollmentsQuery
                    .Where(e => e.CourseSectionId.HasValue &&
                                sectionIds.Contains(e.CourseSectionId.Value));
            }

            var enrolledStudentIds = await enrollmentsQuery
                .Select(e => e.StudentId)
                .Distinct()
                .ToListAsync();

            if (enrolledStudentIds.Count == 0)
                return BadRequest(new { message = "No students are enrolled in this project's scope." });

            // ── 4. Load student profiles ──────────────────────────────────────
            var profiles = await _db.StudentProfiles
                .AsNoTracking()
                .Include(s => s.User)
                .Where(s => enrolledStudentIds.Contains(s.Id))
                .ToListAsync();

            if (profiles.Count == 0)
                return BadRequest(new { message = "Could not load student profiles." });

            // ── 5. Resolve skills (same pattern as CoursePartnerRecommendationsController) ──
            var skillsMap = new Dictionary<int, List<string>>();
            foreach (var p in profiles)
            {
                var skills = await SkillHelper.IdsJsonToNames(_db, p.TechnicalSkills);
                var roles = await SkillHelper.IdsJsonToNames(_db, p.Roles);
                var tools = await SkillHelper.IdsJsonToNames(_db, p.Tools);
                skillsMap[p.Id] = skills
                    .Concat(roles)
                    .Concat(tools)
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .ToList();
            }

            // ── 6. Build AI request ───────────────────────────────────────────
            var aiRequest = new AiTeamFormationRequest
            {
                ProjectTitle = project.Title,
                ProjectDescription = project.Description,
                TeamSize = teamSize,
                Students = profiles.Select(p => new AiTeamStudent
                {
                    StudentId = p.Id,
                    Name = p.User?.Name ?? string.Empty,
                    Skills = skillsMap.GetValueOrDefault(p.Id, new List<string>()),
                    Major = p.Major ?? string.Empty,
                    Bio = p.Bio ?? string.Empty,
                }).ToList()
            };

            // ── 7. Call OpenAI team formation service ─────────────────────────
            var aiTeams = await _teamAi.FormTeamsAsync(aiRequest);

            // Profle lookup map
            var profileMap = profiles.ToDictionary(p => p.Id);

            List<List<StudentProfile>> teams;

            if (aiTeams != null && aiTeams.Count > 0)
            {
                // ── AI success: use AI grouping ───────────────────────────────
                teams = new List<List<StudentProfile>>();
                var assignedIds = new HashSet<int>();

                foreach (var aiTeam in aiTeams.OrderBy(t => t.TeamIndex))
                {
                    var group = new List<StudentProfile>();
                    foreach (var sid in aiTeam.StudentIds)
                    {
                        if (profileMap.TryGetValue(sid, out var prof) && assignedIds.Add(sid))
                            group.Add(prof);
                    }
                    if (group.Count > 0)
                        teams.Add(group);
                }

                // Absorb any students the AI missed (shouldn't happen but just in case)
                var unassigned = profiles.Where(p => !assignedIds.Contains(p.Id)).ToList();
                if (unassigned.Count > 0)
                {
                    var weakest = teams.OrderBy(t => t.Count).FirstOrDefault();
                    if (weakest != null)
                        foreach (var s in unassigned) weakest.Add(s);
                    else
                        teams.Add(unassigned);
                }
            }
            else
            {
                // ── Fallback: skill-overlap greedy grouping ───────────────────
                var scoreMap = new Dictionary<int, int>();
                foreach (var p in profiles)
                {
                    var mySkills = skillsMap.GetValueOrDefault(p.Id, new List<string>());
                    // Score = unique skills count (students with more diverse skills first)
                    scoreMap[p.Id] = mySkills.Count;
                }

                var ranked = profiles
                    .OrderByDescending(p => scoreMap.GetValueOrDefault(p.Id, 0))
                    .ThenBy(p => p.User?.Name ?? string.Empty, StringComparer.OrdinalIgnoreCase)
                    .ToList();

                var fullTeamCount = ranked.Count / teamSize;
                var remainder = ranked.Count % teamSize;
                var teamCount = fullTeamCount > 0 ? fullTeamCount : 1;

                teams = new List<List<StudentProfile>>();
                for (var i = 0; i < teamCount; i++) teams.Add(new List<StudentProfile>());

                var mainStudents = ranked.Take(teamCount * teamSize).ToList();
                for (var i = 0; i < mainStudents.Count; i++)
                    teams[i % teamCount].Add(mainStudents[i]);

                if (remainder > 0)
                {
                    var leftoverStudents = ranked.Skip(teamCount * teamSize).ToList();
                    foreach (var leftover in leftoverStudents)
                    {
                        var weakestTeam = teams.OrderBy(t => t.Count).First();
                        weakestTeam.Add(leftover);
                    }
                }
            }

            // ── 8. Build response ─────────────────────────────────────────────
            // Build aiReason map from AI result (if available)
            var reasonMap = aiTeams?.SelectMany(t =>
                t.StudentIds.Select(sid => new { sid, t.Reason }))
                .GroupBy(x => x.sid)
                .ToDictionary(g => g.Key, g => g.First().Reason)
                ?? new Dictionary<int, string>();

            var result = teams
                .Where(t => t.Count > 0)
                .Select((t, idx) => new
                {
                    teamIndex = idx + 1,
                    memberCount = t.Count,
                    teamReason = aiTeams != null ? (aiTeams.ElementAtOrDefault(idx)?.Reason ?? string.Empty) : string.Empty,
                    members = t.Select(p => new
                    {
                        studentId = p.Id,
                        userId = p.UserId,
                        name = p.User?.Name ?? string.Empty,
                        matchScore = 0, // score is now a team-level concept, not per-student
                        skills = skillsMap.GetValueOrDefault(p.Id, new List<string>())
                    }).ToList()
                }).ToList();

            return Ok(new
            {
                projectId = project.Id,
                projectTitle = project.Title,
                teamSize = teamSize,
                teamCount = result.Count,
                teams = result
            });
        }

        // =====================================================================
        // POST /api/courses/{courseId}/projects/{projectId}/save-teams
        //
        // Persists AI-generated teams to the DB.
        // Body: { teams: [ { members: [ { studentId, userId } ] } ] }
        //
        // - Creates one CourseTeam per group.
        // - First member becomes the leader.
        // - Idempotent: deletes any existing teams for this project before saving.
        // - Requires a CourseProjectSetting row (legacy FK). If none exists,
        //   creates a minimal one so the FK constraint is satisfied.
        // =====================================================================
        [HttpPost("save-teams")]
        public async Task<IActionResult> SaveTeams(
            int courseId,
            int projectId,
            [FromBody] SaveTeamsDto dto)
        {
            // ── 1. Doctor only + ownership ────────────────────────────────────
            if (AuthorizationHelper.GetRole(User) != "doctor")
                return StatusCode(403, new { message = "Only doctors can save teams." });

            var userId = AuthorizationHelper.GetUserId(User);
            var doctor = await _db.DoctorProfiles.AsNoTracking()
                .FirstOrDefaultAsync(d => d.UserId == userId);
            if (doctor == null)
                return StatusCode(403, new { message = "Doctor profile not found." });

            var course = await _db.Courses.AsNoTracking()
                .FirstOrDefaultAsync(c => c.Id == courseId);
            if (course == null)
                return NotFound(new { message = "Course not found." });
            if (course.DoctorId != doctor.Id)
                return StatusCode(403, new { message = "You do not own this course." });

            // ── 2. Load the CourseProject ─────────────────────────────────────
            var project = await _db.CourseProjects.AsNoTracking()
                .FirstOrDefaultAsync(p => p.Id == projectId && p.CourseId == courseId);
            if (project == null)
                return NotFound(new { message = "Project not found." });

            if (dto?.Teams == null || dto.Teams.Count == 0)
                return BadRequest(new { message = "No teams provided." });

            // ── 3. Resolve / create a CourseProjectSetting (legacy FK) ────────
            var setting = await _db.CourseProjectSettings
                .FirstOrDefaultAsync(s => s.CourseId == courseId);

            if (setting == null)
            {
                setting = new CourseProjectSetting
                {
                    CourseId = courseId,
                    Title = project.Title,
                    Description = project.Description,
                    TeamSize = project.TeamSize,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                };
                _db.CourseProjectSettings.Add(setting);
                await _db.SaveChangesAsync();
            }

            // ── 4. Delete existing teams for this project ─────────────────────
            var existing = await _db.CourseTeams
                .Include(t => t.Members)
                .Where(t => t.CourseProjectId == projectId)
                .ToListAsync();

            if (existing.Count > 0)
            {
                _db.CourseTeamMembers.RemoveRange(existing.SelectMany(t => t.Members));
                _db.CourseTeams.RemoveRange(existing);
                await _db.SaveChangesAsync();
            }

            // ── 5. Validate all student IDs exist ─────────────────────────────
            var allStudentIds = dto.Teams
                .SelectMany(t => t.Members.Select(m => m.StudentId))
                .Distinct()
                .ToList();

            var validProfiles = await _db.StudentProfiles.AsNoTracking()
                .Where(s => allStudentIds.Contains(s.Id))
                .Select(s => s.Id)
                .ToListAsync();

            var invalidIds = allStudentIds.Except(validProfiles).ToList();
            if (invalidIds.Count > 0)
                return BadRequest(new { message = $"Unknown student IDs: {string.Join(", ", invalidIds)}" });

            // ── 6. Save new teams ─────────────────────────────────────────────
            var savedTeams = new List<object>();

            foreach (var teamDto in dto.Teams)
            {
                if (teamDto.Members == null || teamDto.Members.Count == 0)
                    continue;

                var leaderId = teamDto.Members[0].StudentId;

                var team = new CourseTeam
                {
                    CourseId = courseId,
                    ProjectSettingId = setting.Id,
                    CourseProjectId = projectId,
                    LeaderStudentId = leaderId,
                    CreatedAt = DateTime.UtcNow,
                };
                _db.CourseTeams.Add(team);
                await _db.SaveChangesAsync(); // get team.Id

                var members = teamDto.Members.Select(m => new CourseTeamMember
                {
                    TeamId = team.Id,
                    CourseId = courseId,
                    StudentId = m.StudentId,
                    ProjectSettingId = setting.Id,
                    Role = m.StudentId == leaderId ? "leader" : "member",
                    JoinedAt = DateTime.UtcNow,
                }).ToList();

                _db.CourseTeamMembers.AddRange(members);
                await _db.SaveChangesAsync();

                savedTeams.Add(new
                {
                    teamId = team.Id,
                    leaderId = leaderId,
                    memberCount = members.Count,
                });
            }

            return StatusCode(201, new
            {
                message = $"{savedTeams.Count} teams saved successfully.",
                projectId = project.Id,
                teams = savedTeams,
            });
        }
    }

    // ── DTOs for save-teams ───────────────────────────────────────────────────
    public class SaveTeamMemberDto
    {
        public int StudentId { get; set; }
        public int UserId { get; set; }
    }

    public class SaveTeamDto
    {
        public List<SaveTeamMemberDto> Members { get; set; } = new();
    }

    public class SaveTeamsDto
    {
        public List<SaveTeamDto> Teams { get; set; } = new();
    }
}