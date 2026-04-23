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

        public CourseTeamGenerationController(
            ApplicationDbContext db,
            IAiPartnerRecommendationService ai)
        {
            _db = db;
            _ai = ai;
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

            // ── 6. AI ranking — use complementary mode for team formation ─────
            // We pick the first student as the "anchor" and rank everyone else.
            // Then we use a greedy grouping algorithm to form balanced teams.
            var anchor = profiles[0];
            var aiAnchor = new AiPartnerCurrentStudent
            {
                StudentId = anchor.Id,
                Name = anchor.User?.Name ?? string.Empty,
                Skills = skillsMap.GetValueOrDefault(anchor.Id, new List<string>()),
                Major = anchor.Major ?? string.Empty,
                Bio = anchor.Bio ?? string.Empty
            };

            var aiCandidates = profiles
                .Where(p => p.Id != anchor.Id)
                .Select(p => new AiPartnerCandidate
                {
                    StudentId = p.Id,
                    Name = p.User?.Name ?? string.Empty,
                    Skills = skillsMap.GetValueOrDefault(p.Id, new List<string>()),
                    Major = p.Major ?? string.Empty,
                    Bio = p.Bio ?? string.Empty
                }).ToList();

            // Score map: studentId → matchScore (0-100)
            var scoreMap = new Dictionary<int, int>();
            scoreMap[anchor.Id] = 100; // anchor always scores 100 vs itself

            if (aiCandidates.Count > 0)
            {
                var aiResults = await _ai.RankPartnersAsync(aiAnchor, aiCandidates, "complementary");

                if (aiResults != null && aiResults.Count > 0)
                {
                    var aiMap = aiResults.ToDictionary(r => r.StudentId, r => r.MatchScore);
                    foreach (var c in aiCandidates)
                        scoreMap[c.StudentId] = aiMap.TryGetValue(c.StudentId, out var s) ? s : 50;
                }
                else
                {
                    // Fallback: skill-count-based complementary scoring
                    var anchorSkills = skillsMap.GetValueOrDefault(anchor.Id, new List<string>());
                    foreach (var c in aiCandidates)
                    {
                        var cSkills = skillsMap.GetValueOrDefault(c.StudentId, new List<string>());
                        var unique = cSkills.Except(anchorSkills, StringComparer.OrdinalIgnoreCase).Count();
                        scoreMap[c.StudentId] = cSkills.Count == 0
                            ? 10
                            : (int)Math.Round((double)unique / cSkills.Count * 100);
                    }
                }
            }

            // ── 7. Greedy team formation ──────────────────────────────────────
            // Sort students by AI score descending (complementary skills first).
            // Use interleaving so each team gets a mix of skill levels:
            //   rank 1, rank (teamSize+1), ... → Team 1
            //   rank 2, rank (teamSize+2), ... → Team 2
            //
            // Remainder handling (odd numbers):
            //   Instead of leaving a student alone in a tiny team, we find the
            //   "weakest" team (lowest average matchScore) and add the leftover
            //   student to it. The AI already ranked the leftover student, so
            //   this keeps the most complementary pairing.
            var ranked = profiles
                .OrderByDescending(p => scoreMap.GetValueOrDefault(p.Id, 50))
                .ThenBy(p => p.User?.Name ?? string.Empty, StringComparer.OrdinalIgnoreCase)
                .ToList();

            // Determine how many full teams we need — use Floor so we never
            // create a team of 1 (the remainder goes into an existing team).
            var fullTeamCount = ranked.Count / teamSize;
            var remainder = ranked.Count % teamSize;

            // If everyone fits perfectly, teamCount = fullTeamCount.
            // If there is a remainder, we still use fullTeamCount teams and
            // absorb the extra student(s) into the weakest team(s).
            var teamCount = fullTeamCount > 0 ? fullTeamCount : 1;

            var teams = new List<List<StudentProfile>>();
            for (var i = 0; i < teamCount; i++)
                teams.Add(new List<StudentProfile>());

            // Fill teams by interleaving ranked students (skip remainder slots).
            var mainStudents = ranked.Take(teamCount * teamSize).ToList();
            for (var i = 0; i < mainStudents.Count; i++)
                teams[i % teamCount].Add(mainStudents[i]);

            // Absorb remainder students into the weakest team(s).
            // "Weakest" = lowest average matchScore among current members.
            if (remainder > 0)
            {
                var leftoverStudents = ranked.Skip(teamCount * teamSize).ToList();
                foreach (var leftover in leftoverStudents)
                {
                    // Find the team with the lowest average score
                    var weakestTeam = teams
                        .OrderBy(t => t.Count == 0
                            ? 0
                            : t.Average(p => scoreMap.GetValueOrDefault(p.Id, 50)))
                        .First();
                    weakestTeam.Add(leftover);
                }
            }

            // ── 8. Build response ─────────────────────────────────────────────
            var result = teams
                .Where(t => t.Count > 0)
                .Select((t, idx) => new
                {
                    teamIndex = idx + 1,
                    memberCount = t.Count,
                    members = t.Select(p => new
                    {
                        studentId = p.Id,
                        userId = p.UserId,
                        name = p.User?.Name ?? string.Empty,
                        matchScore = scoreMap.GetValueOrDefault(p.Id, 50),
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
    }
}