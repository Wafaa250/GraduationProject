// Controllers/CoursePartnerRecommendationsController.cs
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
    /// AI-powered partner recommendations for the Course Teams module.
    ///
    /// Endpoint
    /// ─────────
    ///   GET /api/courses/{courseId}/recommended-partners?mode=complementary
    ///   GET /api/courses/{courseId}/recommended-partners?mode=similar
    ///
    /// Access: students only (must be enrolled in the course).
    ///
    /// Filtering (before AI is called):
    ///   • Excludes the calling student themselves.
    ///   • Excludes students already in the caller's own team.
    ///   • Excludes students whose team is already full.
    ///
    /// Fallback:
    ///   If the AI service fails or returns no results, a simple
    ///   skill-intersection / skill-difference score is computed
    ///   locally so the endpoint never returns an empty error.
    /// </summary>
    [ApiController]
    [Route("api/courses/{courseId:int}")]
    [Authorize]
    public class CoursePartnerRecommendationsController : ControllerBase
    {
        private readonly ApplicationDbContext            _db;
        private readonly IAiPartnerRecommendationService _ai;

        public CoursePartnerRecommendationsController(
            ApplicationDbContext            db,
            IAiPartnerRecommendationService ai)
        {
            _db = db;
            _ai = ai;
        }

        // =====================================================================
        // GET /api/courses/{courseId}/recommended-partners
        //
        // Query params:
        //   mode  — "complementary" (default) | "similar"
        //
        // Response shape (array):
        // [
        //   {
        //     "studentId":  10,
        //     "userId":     42,
        //     "name":       "Ahmad",
        //     "skills":     ["react", "frontend"],
        //     "matchScore": 90,
        //     "reason":     "Complements your backend skills"
        //   }
        // ]
        // =====================================================================
        [HttpGet("recommended-partners")]
        public async Task<IActionResult> GetRecommendedPartners(
            int    courseId,
            [FromQuery] string mode = "complementary")
        {
            // ── 1. Validate mode ──────────────────────────────────────────────
            var modeNorm = (mode ?? "complementary").Trim().ToLowerInvariant();
            if (modeNorm != "complementary" && modeNorm != "similar")
                return BadRequest(new { message = "mode must be 'complementary' or 'similar'." });

            // ── 2. Student only + enrollment guard ────────────────────────────
            if (AuthorizationHelper.GetRole(User) != "student")
                return StatusCode(403, new { message = "Only students can access this endpoint." });

            var userId  = AuthorizationHelper.GetUserId(User);
            var current = await _db.StudentProfiles
                .Include(s => s.User)
                .FirstOrDefaultAsync(s => s.UserId == userId);

            if (current == null)
                return NotFound(new { message = "Student profile not found." });

            // ── 3. Course exists ──────────────────────────────────────────────
            var course = await _db.Courses.AsNoTracking()
                .FirstOrDefaultAsync(c => c.Id == courseId);

            if (course == null)
                return NotFound(new { message = "Course not found." });

            // ── 4. Caller must be enrolled ────────────────────────────────────
            var enrolled = await _db.CourseEnrollments
                .AnyAsync(e => e.CourseId == courseId && e.StudentId == current.Id);

            if (!enrolled)
                return StatusCode(403, new { message = "You are not enrolled in this course." });

            // ── 5. Active project setting (provides TeamSize) ─────────────────
            var setting = await _db.CourseProjectSettings
                .AsNoTracking()
                .Where(ps => ps.CourseId == courseId && ps.IsActive)
                .OrderByDescending(ps => ps.CreatedAt)
                .FirstOrDefaultAsync();

            // If there is no project setting we still proceed; we just won't be
            // able to filter out "full" teams (there is no defined max size).
            var teamSize = setting?.TeamSize ?? int.MaxValue;

            // ── 6. Load all enrolled students (excluding caller) ──────────────
            var enrolledStudentIds = await _db.CourseEnrollments
                .AsNoTracking()
                .Where(e => e.CourseId == courseId && e.StudentId != current.Id)
                .Select(e => e.StudentId)
                .ToListAsync();

            if (enrolledStudentIds.Count == 0)
                return Ok(new List<object>());

            // ── 7. Determine caller's own teamId (nullable) ───────────────────
            var callerMembership = await _db.CourseTeamMembers
                .AsNoTracking()
                .FirstOrDefaultAsync(m => m.CourseId == courseId && m.StudentId == current.Id);

            var callerTeamId = callerMembership?.TeamId; // null → caller has no team yet

            // ── 8. Load team membership for all enrolled candidates ───────────
            //   For each team: count members so we can skip full ones.
            var membershipRows = await _db.CourseTeamMembers
                .AsNoTracking()
                .Where(m => m.CourseId == courseId)
                .GroupBy(m => m.TeamId)
                .Select(g => new { TeamId = g.Key, MemberCount = g.Count() })
                .ToListAsync();

            var teamSizeMap = membershipRows.ToDictionary(x => x.TeamId, x => x.MemberCount);

            // StudentId → their teamId (null if not yet in a team)
            var studentTeamMap = await _db.CourseTeamMembers
                .AsNoTracking()
                .Where(m => m.CourseId == courseId && enrolledStudentIds.Contains(m.StudentId))
                .ToDictionaryAsync(m => m.StudentId, m => m.TeamId);

            // ── 9. Filter candidates ──────────────────────────────────────────
            //   Exclude:
            //     a) students in the same team as the caller
            //     b) students whose team is already full
            var eligibleIds = enrolledStudentIds
                .Where(sid =>
                {
                    // (a) same team as caller
                    if (callerTeamId.HasValue &&
                        studentTeamMap.TryGetValue(sid, out var theirTeamId) &&
                        theirTeamId == callerTeamId.Value)
                        return false;

                    // (b) their team is full
                    if (studentTeamMap.TryGetValue(sid, out var tid) &&
                        teamSizeMap.TryGetValue(tid, out var count) &&
                        count >= teamSize)
                        return false;

                    return true;
                })
                .ToList();

            if (eligibleIds.Count == 0)
                return Ok(new List<object>());

            // ── 10. Load full profiles for eligible candidates ────────────────
            var candidateProfiles = await _db.StudentProfiles
                .AsNoTracking()
                .Include(s => s.User)
                .Where(s => eligibleIds.Contains(s.Id))
                .ToListAsync();

            // ── 11. Resolve skills (IDs JSON → names) for all students ─────────
            var currentSkills = await SkillHelper.IdsJsonToNames(_db, current.TechnicalSkills);

            var candidateSkillsMap = new Dictionary<int, List<string>>();
            foreach (var cp in candidateProfiles)
            {
                var skills = await SkillHelper.IdsJsonToNames(_db, cp.TechnicalSkills);
                // Also include roles and tools so the AI has richer context
                var roles  = await SkillHelper.IdsJsonToNames(_db, cp.Roles);
                var tools  = await SkillHelper.IdsJsonToNames(_db, cp.Tools);
                candidateSkillsMap[cp.Id] = skills
                    .Concat(roles)
                    .Concat(tools)
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .ToList();
            }

            // Also enrich current student's skill list the same way
            var currentRoles = await SkillHelper.IdsJsonToNames(_db, current.Roles);
            var currentTools = await SkillHelper.IdsJsonToNames(_db, current.Tools);
            var currentAllSkills = currentSkills
                .Concat(currentRoles)
                .Concat(currentTools)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            // ── 12. Build AI input objects ────────────────────────────────────
            var aiCurrent = new AiPartnerCurrentStudent
            {
                StudentId = current.Id,
                Name      = current.User?.Name ?? string.Empty,
                Skills    = currentAllSkills,
                Major     = current.Major ?? string.Empty,
                Bio       = current.Bio   ?? string.Empty
            };

            var aiCandidates = candidateProfiles.Select(cp => new AiPartnerCandidate
            {
                StudentId = cp.Id,
                Name      = cp.User?.Name ?? string.Empty,
                Skills    = candidateSkillsMap.GetValueOrDefault(cp.Id, new List<string>()),
                Major     = cp.Major ?? string.Empty,
                Bio       = cp.Bio   ?? string.Empty
            }).ToList();

            // ── 13. Call AI ───────────────────────────────────────────────────
            var aiResults = await _ai.RankPartnersAsync(aiCurrent, aiCandidates, modeNorm);

            // ── 14. Fallback: simple local scoring if AI failed ───────────────
            List<(int StudentId, int Score, string Reason)> scores;

            if (aiResults != null && aiResults.Count > 0)
            {
                // Map AI results back (studentId is the key)
                var aiMap = aiResults.ToDictionary(r => r.StudentId);
                scores = aiCandidates
                    .Select(c =>
                    {
                        if (aiMap.TryGetValue(c.StudentId, out var r))
                            return (c.StudentId, r.MatchScore, r.Reason);

                        // Candidate not in AI output — give a neutral score
                        return (c.StudentId, 50, "No AI ranking available.");
                    })
                    .ToList();
            }
            else
            {
                // AI unavailable — fall back to skill-overlap / skill-diff count
                scores = aiCandidates
                    .Select(c =>
                    {
                        int score;
                        string reason;

                        if (modeNorm == "similar")
                        {
                            var intersection = c.Skills
                                .Intersect(currentAllSkills, StringComparer.OrdinalIgnoreCase)
                                .Count();
                            var denominator = Math.Max(
                                currentAllSkills.Count + c.Skills.Count - intersection, 1);
                            score  = (int)Math.Round((double)intersection / denominator * 100);
                            reason = intersection > 0
                                ? $"Shares {intersection} skill(s) with you."
                                : "No overlapping skills found.";
                        }
                        else // complementary
                        {
                            var missing = currentAllSkills.Count == 0
                                ? c.Skills.Count
                                : c.Skills
                                    .Except(currentAllSkills, StringComparer.OrdinalIgnoreCase)
                                    .Count();
                            var denominator = Math.Max(c.Skills.Count, 1);
                            score  = (int)Math.Round((double)missing / denominator * 100);
                            reason = missing > 0
                                ? $"Brings {missing} skill(s) you don't have."
                                : "Skills overlap significantly with yours.";
                        }

                        return (c.StudentId, score, reason);
                    })
                    .ToList();
            }

            // ── 15. Build response ────────────────────────────────────────────
            var profileMap = candidateProfiles.ToDictionary(p => p.Id);
            var scoreMap   = scores.ToDictionary(s => s.StudentId);

            var response = eligibleIds
                .Where(id => profileMap.ContainsKey(id) && scoreMap.ContainsKey(id))
                .Select(id =>
                {
                    var p = profileMap[id];
                    var s = scoreMap[id];
                    return new
                    {
                        studentId  = id,
                        userId     = p.UserId,
                        name       = p.User?.Name ?? string.Empty,
                        skills     = candidateSkillsMap.GetValueOrDefault(id, new List<string>()),
                        matchScore = s.Score,
                        reason     = s.Reason
                    };
                })
                .OrderByDescending(x => x.matchScore)
                .ThenBy(x => x.name, StringComparer.OrdinalIgnoreCase)
                .ToList<object>();

            return Ok(response);
        }
    }
}
