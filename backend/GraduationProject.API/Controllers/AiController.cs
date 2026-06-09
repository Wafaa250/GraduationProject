using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using GraduationProject.API.Data;
using GraduationProject.API.DTOs;
using GraduationProject.API.Helpers;
using GraduationProject.API.Models;
using GraduationProject.API.Services;

namespace GraduationProject.API.Controllers
{
    [ApiController]
    [Route("api/ai")]
    [Authorize]
    public class AiController : ControllerBase
    {
        private const int MaxCandidates = 20;
        private const int MaxSupervisorCandidates = 15;
        /// <summary>Students at or below this score are omitted from teammate recommendations.</summary>
        private const int MinTeammateMatchScore = 1;

        private readonly ApplicationDbContext _db;
        private readonly IAiStudentRecommendationService _aiService;
        private readonly ISupervisorRecommendationResolver _supervisorRecommendations;
        private readonly ILogger<AiController> _logger;

        public AiController(
            ApplicationDbContext db,
            IAiStudentRecommendationService aiService,
            ISupervisorRecommendationResolver supervisorRecommendations,
            ILogger<AiController> logger)
        {
            _db = db;
            _aiService = aiService;
            _supervisorRecommendations = supervisorRecommendations;
            _logger = logger;
        }

        [HttpPost("recommend-students")]
        public async Task<IActionResult> RecommendStudents([FromBody] RecommendStudentsRequest request)
        {
            if (request == null || request.ProjectId <= 0)
                return BadRequest(new { message = "Valid projectId is required." });

            var caller = await GetStudentProfileAsync();
            if (caller == null)
                return Forbid();

            var project = await _db.StudentProjects
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Id == request.ProjectId);

            if (project == null)
                return NotFound(new { message = "Project not found." });

            var isOwner = project.OwnerId == caller.Id;
            var isLeader = await _db.StudentProjectMembers
                .AnyAsync(m => m.ProjectId == request.ProjectId && m.StudentId == caller.Id && m.Role == "leader");

            if (!isOwner && !isLeader)
                return StatusCode(403, new { message = "Only the project owner or team leader can request AI recommendations." });

            var memberIds = await _db.StudentProjectMembers
                .AsNoTracking()
                .Where(m => m.ProjectId == request.ProjectId)
                .Select(m => m.StudentId)
                .ToListAsync();

            var graduationProjectOwnerIds = await _db.StudentProjects
                .AsNoTracking()
                .Select(p => p.OwnerId)
                .ToListAsync();
            var gpOwnerSet = graduationProjectOwnerIds.ToHashSet();

            var projectOwner = await _db.StudentProfiles
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.Id == project.OwnerId);

            if (projectOwner == null)
                return NotFound(new { message = "Project owner not found." });

            var requiredSkillNames = SkillHelper.ParseStringList(project.RequiredSkills);
            var allSkills = await _db.Skills
                .AsNoTracking()
                .Select(s => new { s.Id, s.Name })
                .ToListAsync();
            var requiredSkillIds = GraduationTeammateMatchHelper.ResolveSkillIds(
                allSkills.Select(s => (s.Id, s.Name)),
                requiredSkillNames);

            var totalStudents = await _db.StudentProfiles.AsNoTracking().CountAsync();

            var afterExcludeOwner = await _db.StudentProfiles
                .AsNoTracking()
                .Where(s => s.Id != project.OwnerId)
                .CountAsync();

            var afterExcludeMembers = await _db.StudentProfiles
                .AsNoTracking()
                .Where(s => s.Id != project.OwnerId && !memberIds.Contains(s.Id))
                .CountAsync();

            var afterExcludeGpOwners = await _db.StudentProfiles
                .AsNoTracking()
                .Where(s => s.Id != project.OwnerId &&
                            !memberIds.Contains(s.Id) &&
                            !gpOwnerSet.Contains(s.Id))
                .CountAsync();

            var ownerMajor = projectOwner.Major;
            var students = await _db.StudentProfiles
                .Include(s => s.User)
                .AsNoTracking()
                .Where(s => s.Major != null && ownerMajor != null &&
                            s.Major.ToLower() == ownerMajor.ToLower() &&
                            s.Id != project.OwnerId &&
                            !memberIds.Contains(s.Id) &&
                            !gpOwnerSet.Contains(s.Id))
                .ToListAsync();

            _logger.LogInformation(
                "recommend-students projectId={ProjectId} pipeline: totalStudents={Total}, " +
                "afterExcludeOwner={AfterOwner}, afterExcludeMembers={AfterMembers}, " +
                "afterExcludeGpOwners={AfterGpOwners}, afterMajorFilter={AfterMajor} " +
                "(ownerMajor={OwnerMajor}, requiredSkillNames={SkillCount}, resolvedSkillIds={ResolvedIds})",
                request.ProjectId,
                totalStudents,
                afterExcludeOwner,
                afterExcludeMembers,
                afterExcludeGpOwners,
                students.Count,
                ownerMajor ?? "(null)",
                requiredSkillNames.Count,
                requiredSkillIds.Count);

            if (students.Count == 0)
            {
                _logger.LogWarning(
                    "recommend-students projectId={ProjectId}: no candidates after major/affiliation filters",
                    request.ProjectId);
                return Ok(new List<object>());
            }

            var skillNameMap = allSkills.ToDictionary(s => s.Id, s => s.Name);

            var candidates = students
                .Select(s =>
                {
                    var skillIds = GetStudentSkillIds(s).Distinct().ToList();
                    var fallbackScore = GraduationTeammateMatchHelper.ComputeMatchScore(skillIds, requiredSkillIds);
                    var commonCount = requiredSkillIds.Count == 0
                        ? 0
                        : skillIds.Count(id => requiredSkillIds.Contains(id));

                    var skillNames = skillIds
                        .Where(skillNameMap.ContainsKey)
                        .Select(id => skillNameMap[id])
                        .Distinct()
                        .ToList();

                    return new CandidateRow
                    {
                        StudentId = s.Id,
                        UserId = s.UserId,
                        Name = s.User?.Name ?? string.Empty,
                        Major = s.Major ?? string.Empty,
                        University = s.University ?? string.Empty,
                        Bio = s.Bio ?? string.Empty,
                        Skills = skillNames,
                        CommonSkills = commonCount,
                        FallbackScore = fallbackScore
                    };
                })
                .Where(c => QualifiesAsTeammateRecommendation(c.FallbackScore))
                .OrderByDescending(c => c.FallbackScore)
                .ThenByDescending(c => c.CommonSkills)
                .ThenBy(c => c.StudentId)
                .Take(MaxCandidates)
                .ToList();

            _logger.LogInformation(
                "recommend-students projectId={ProjectId}: scoredCandidates={Scored}, " +
                "withSkillOverlap={WithOverlap}, final={Final}",
                request.ProjectId,
                students.Count,
                candidates.Count(c => c.CommonSkills > 0),
                candidates.Count);

            if (candidates.Count == 0)
            {
                _logger.LogWarning(
                    "recommend-students projectId={ProjectId}: all {Count} same-major candidates scored below minimum ({Min})",
                    request.ProjectId,
                    students.Count,
                    MinTeammateMatchScore);
                return Ok(new List<object>());
            }

            var aiProject = new AiProjectInput
            {
                Title = project.Name,
                Abstract = project.Abstract ?? string.Empty,
                RequiredSkills = requiredSkillNames
            };

            var aiStudents = candidates.Select(c => new AiStudentInput
            {
                StudentId = c.StudentId,
                Name = c.Name,
                Skills = c.Skills,
                Major = c.Major,
                Bio = c.Bio
            }).ToList();

            var candidateMap = candidates.ToDictionary(c => c.StudentId);

            var aiResults = await _aiService.RankStudentsAsync(aiProject, aiStudents);
            if (aiResults != null && aiResults.Count > 0)
            {
                var sanitized = aiResults
                    .Where(r => candidateMap.ContainsKey(r.StudentId))
                    .Select(r => new
                    {
                        Candidate = candidateMap[r.StudentId],
                        Score = Math.Clamp(r.MatchScore, 0, 100),
                        r.Reason
                    })
                    .Where(x => QualifiesAsTeammateRecommendation(x.Score))
                    .OrderByDescending(x => x.Score)
                    .ThenBy(x => x.Candidate.StudentId)
                    .Select(x => MapStudentRecommendation(x.Candidate, x.Score, x.Reason))
                    .ToList();

                if (sanitized.Count > 0)
                    return Ok(sanitized);
            }

            // Fallback to rule-based skill overlap when OpenAI is unavailable or returns no qualifying rows.
            var fallback = candidates
                .Where(c => QualifiesAsTeammateRecommendation(c.FallbackScore))
                .OrderByDescending(c => c.FallbackScore)
                .ThenBy(c => c.StudentId)
                .Select(c => MapStudentRecommendation(c, c.FallbackScore, null))
                .ToList();

            return Ok(fallback);
        }

        [HttpPost("recommend-supervisors")]
        public async Task<IActionResult> RecommendSupervisors([FromBody] RecommendSupervisorsRequest request)
        {
            if (request == null || request.ProjectId <= 0)
                return BadRequest(new { message = "Valid projectId is required." });

            var caller = await GetStudentProfileAsync();
            if (caller == null)
                return Forbid();

            var project = await _db.StudentProjects
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Id == request.ProjectId);

            if (project == null)
                return NotFound(new { message = "Project not found." });

            var isOwner = project.OwnerId == caller.Id;
            var isLeader = await _db.StudentProjectMembers
                .AnyAsync(m => m.ProjectId == request.ProjectId && m.StudentId == caller.Id && m.Role == "leader");

            if (!isOwner && !isLeader)
                return StatusCode(403, new { message = "Only project leader can request AI recommendations." });

            var (matched, audit) = await _supervisorRecommendations.ResolveAsync(caller, project);

            if (matched.Count == 0)
            {
                audit.TotalReturned = 0;
                return Ok(Array.Empty<object>());
            }

            var requiredSkillNames = SkillHelper.ParseStringList(project.RequiredSkills)
                .Where(s => !string.IsNullOrWhiteSpace(s))
                .Select(s => s.Trim())
                .ToList();

            var rankedCandidates = matched
                .Select(c => RecommendedSupervisorHelper.MapMatchedDoctor(c, project.RequiredSkills))
                .Where(RecommendedSupervisorHelper.IsPublishable)
                .OrderByDescending(c => c.MatchScore)
                .ThenBy(c => c.DoctorId)
                .Take(MaxSupervisorCandidates)
                .ToList();

            if (rankedCandidates.Count == 0)
            {
                audit.TotalReturned = 0;
                return Ok(Array.Empty<object>());
            }

            var candidateById = rankedCandidates.ToDictionary(c => c.DoctorId);

            var aiProject = new AiProjectInput
            {
                Title = project.Name,
                Abstract = project.Abstract ?? string.Empty,
                RequiredSkills = requiredSkillNames,
            };

            var aiDoctors = rankedCandidates.Select(c => new AiDoctorInput
            {
                DoctorId = c.DoctorId,
                Name = c.Name,
                Specialization = c.Specialization,
                Bio = matched.First(m => m.Doctor.Id == c.DoctorId).Doctor.Bio ?? string.Empty,
            }).ToList();

            var aiResults = await _aiService.RankSupervisorsAsync(aiProject, aiDoctors);
            if (aiResults != null && aiResults.Count > 0)
            {
                var sanitized = aiResults
                    .Where(r => candidateById.ContainsKey(r.DoctorId))
                    .Select(r =>
                    {
                        var candidate = candidateById[r.DoctorId];
                        var matchedSkillCount = requiredSkillNames.Count == 0
                            ? 0
                            : requiredSkillNames.Count(skill =>
                                candidate.Specialization.IndexOf(skill, StringComparison.OrdinalIgnoreCase) >= 0);

                        var reason = string.IsNullOrWhiteSpace(r.Reason)
                            ? RecommendedSupervisorHelper.BuildSkillMatchReason(
                                matchedSkillCount,
                                requiredSkillNames.Count,
                                candidate.Name)
                            : r.Reason.Trim();

                        return new RecommendedSupervisorDto
                        {
                            DoctorId = candidate.DoctorId,
                            UserId = candidate.UserId,
                            Name = candidate.Name,
                            Specialization = candidate.Specialization,
                            MatchScore = Math.Clamp(r.MatchScore, 0, 100),
                            Reason = reason,
                        };
                    })
                    .Where(RecommendedSupervisorHelper.IsPublishable)
                    .ToList();

                if (sanitized.Count > 0)
                {
                    audit.AfterAiScoring = sanitized.Count;
                    audit.TotalReturned = sanitized.Count;
                    _logger.LogInformation(
                        "recommend-supervisors projectId={ProjectId} aiReturned={Count} matchTier={Tier}",
                        request.ProjectId,
                        sanitized.Count,
                        audit.MatchTierUsed);
                    return Ok(sanitized);
                }
            }

            audit.AfterAiScoring = rankedCandidates.Count;
            audit.TotalReturned = rankedCandidates.Count;
            _logger.LogInformation(
                "recommend-supervisors projectId={ProjectId} fallbackReturned={Count} matchTier={Tier}",
                request.ProjectId,
                rankedCandidates.Count,
                audit.MatchTierUsed);

            return Ok(rankedCandidates);
        }

        private async Task<StudentProfile?> GetStudentProfileAsync()
        {
            if (AuthorizationHelper.GetRole(User) != "student") return null;
            var userId = AuthorizationHelper.GetUserId(User);
            return await _db.StudentProfiles
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.UserId == userId);
        }

        private static List<int> GetStudentSkillIds(StudentProfile student)
        {
            return SkillHelper.ParseIntList(student.Roles)
                .Concat(SkillHelper.ParseIntList(student.TechnicalSkills))
                .Concat(SkillHelper.ParseIntList(student.Tools))
                .Distinct()
                .ToList();
        }

        private static bool QualifiesAsTeammateRecommendation(int matchScore) =>
            matchScore >= MinTeammateMatchScore;

        private static object MapStudentRecommendation(
            CandidateRow candidate,
            int matchScore,
            string? reason)
        {
            return new
            {
                studentId = candidate.StudentId,
                userId = candidate.UserId,
                matchScore,
                reason = reason ?? string.Empty,
                name = candidate.Name,
                major = candidate.Major,
                university = candidate.University,
                skills = candidate.Skills
            };
        }

        public class RecommendStudentsRequest
        {
            public int ProjectId { get; set; }
        }

        public class RecommendSupervisorsRequest
        {
            public int ProjectId { get; set; }
        }

        private class CandidateRow
        {
            public int StudentId { get; set; }
            public int UserId { get; set; }
            public string Name { get; set; } = string.Empty;
            public string Major { get; set; } = string.Empty;
            public string University { get; set; } = string.Empty;
            public string Bio { get; set; } = string.Empty;
            public List<string> Skills { get; set; } = new();
            public int CommonSkills { get; set; }
            public int FallbackScore { get; set; }
        }
    }
}