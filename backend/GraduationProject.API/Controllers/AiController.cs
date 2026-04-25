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
    [ApiController]
    [Route("api/ai")]
    [Authorize]
    public class AiController : ControllerBase
    {
        private const int MaxCandidates = 20;
        private const int MaxSupervisorCandidates = 15;

        private readonly ApplicationDbContext _db;
        private readonly IAiStudentRecommendationService _aiService;

        public AiController(ApplicationDbContext db, IAiStudentRecommendationService aiService)
        {
            _db = db;
            _aiService = aiService;
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

            var isLeader = await _db.StudentProjectMembers
                .AnyAsync(m => m.ProjectId == request.ProjectId && m.StudentId == caller.Id && m.Role == "leader");

            if (!isLeader)
                return StatusCode(403, new { message = "Only project leader can request AI recommendations." });

            var projectOwner = await _db.StudentProfiles
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.Id == project.OwnerId);

            if (projectOwner == null)
                return NotFound(new { message = "Project owner not found." });

            var requiredSkillNames = SkillHelper.ParseStringList(project.RequiredSkills);
            var requiredSkillIds = await ResolveRequiredSkillIdsAsync(requiredSkillNames);

            var ownerMajor = projectOwner.Major;
            var students = await _db.StudentProfiles
                .Include(s => s.User)
                .AsNoTracking()
                .Where(s => s.Major != null && ownerMajor != null &&
                            s.Major.ToLower() == ownerMajor.ToLower())
                .ToListAsync();

            var allSkillIds = students
                .SelectMany(GetStudentSkillIds)
                .Concat(requiredSkillIds)
                .Distinct()
                .ToList();

            var skillNameMap = await _db.Skills
                .Where(s => allSkillIds.Contains(s.Id))
                .ToDictionaryAsync(s => s.Id, s => s.Name);

            var candidates = students
                .Select(s =>
                {
                    var skillIds = GetStudentSkillIds(s).Distinct().ToList();
                    var commonCount = requiredSkillIds.Count == 0
                        ? 0
                        : requiredSkillIds.Count(id => skillIds.Contains(id));

                    var fallbackScore = requiredSkillIds.Count > 0
                        ? (int)Math.Min((double)commonCount / requiredSkillIds.Count * 100, 100)
                        : 50;

                    var skillNames = skillIds
                        .Where(skillNameMap.ContainsKey)
                        .Select(id => skillNameMap[id])
                        .Distinct()
                        .ToList();

                    return new CandidateRow
                    {
                        StudentId = s.Id,
                        Name = s.User?.Name ?? string.Empty,
                        Major = s.Major ?? string.Empty,
                        Bio = s.Bio ?? string.Empty,
                        Skills = skillNames,
                        CommonSkills = commonCount,
                        FallbackScore = fallbackScore
                    };
                })
                .Where(c => requiredSkillIds.Count == 0 || c.CommonSkills > 0)
                .OrderByDescending(c => c.FallbackScore)
                .ThenBy(c => c.StudentId)
                .Take(MaxCandidates)
                .ToList();

            if (candidates.Count == 0)
                return Ok(new List<object>());

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

            var aiResults = await _aiService.RankStudentsAsync(aiProject, aiStudents);
            if (aiResults != null && aiResults.Count > 0)
            {
                var validIds = candidates.Select(c => c.StudentId).ToHashSet();
                var sanitized = aiResults
                    .Where(r => validIds.Contains(r.StudentId))
                    .Select(r => new
                    {
                        studentId = r.StudentId,
                        matchScore = Math.Clamp(r.MatchScore, 0, 100),
                        reason = r.Reason ?? string.Empty
                    })
                    .ToList();

                if (sanitized.Count > 0)
                    return Ok(sanitized);
            }

            // Fallback to existing rule-based scoring style.
            var fallback = candidates
                .Select(c => new
                {
                    studentId = c.StudentId,
                    matchScore = c.FallbackScore,
                    reason = (string?)null
                })
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

            // Allow both the project owner AND the team leader to request recommendations
            var isOwner = project.OwnerId == caller.Id;
            var isLeader = await _db.StudentProjectMembers
                .AnyAsync(m => m.ProjectId == request.ProjectId && m.StudentId == caller.Id && m.Role == "leader");

            if (!isOwner && !isLeader)
                return StatusCode(403, new { message = "Only project leader can request AI recommendations." });

            var requiredSkillNames = SkillHelper.ParseStringList(project.RequiredSkills);
            var requiredSkillsNormalized = requiredSkillNames
                .Where(s => !string.IsNullOrWhiteSpace(s))
                .Select(s => s.Trim())
                .ToList();

            var student = caller; // already fetched above, no need for a second DB call


            // Special case: Computer Engineering students also see Electrical Engineering supervisors.
            var isComputerEngineeringStudent =
                string.Equals(student.Major?.Trim(), "Computer Engineering", StringComparison.OrdinalIgnoreCase);

            var doctors = await _db.DoctorProfiles
                .Include(d => d.User)
                .Where(d =>
                    !string.IsNullOrEmpty(d.Department) &&
                    !string.IsNullOrEmpty(student.Major) &&
                    (
                        d.Department.ToLower().Contains(student.Major.ToLower()) ||
                        (isComputerEngineeringStudent &&
                         d.Department.ToLower().Contains("electrical engineering"))
                    )
                )
                .AsNoTracking()
                .ToListAsync();

            var candidates = doctors
                .Select(d =>
                {
                    var specialization = d.Specialization ?? string.Empty;
                    var matchedSkills = requiredSkillsNormalized.Count == 0
                        ? 0
                        : requiredSkillsNormalized.Count(skill =>
                            specialization.IndexOf(skill, StringComparison.OrdinalIgnoreCase) >= 0);

                    // If no required skills, give everyone a base score of 50 so AI can rank by bio/specialization.
                    // If there ARE required skills but a doctor has 0 matches, still include them with score 0
                    // so the AI can use bio + specialization context to rank properly.
                    var fallbackScore = requiredSkillsNormalized.Count > 0
                        ? (int)Math.Min((double)matchedSkills / requiredSkillsNormalized.Count * 100, 100)
                        : 50;

                    return new SupervisorCandidateRow
                    {
                        DoctorId = d.Id,
                        Name = d.User?.Name ?? string.Empty,
                        Specialization = specialization,
                        Bio = d.Bio ?? string.Empty,
                        MatchedSkills = matchedSkills,
                        FallbackScore = fallbackScore
                    };
                })
                // Always include ALL doctors from the same department — AI will rank them.
                // Do not filter by MatchedSkills here; a doctor can be a good match based on
                // bio and specialization even if skill keywords don't appear verbatim.
                .OrderByDescending(c => c.FallbackScore)
                .ThenBy(c => c.DoctorId)
                .Take(MaxSupervisorCandidates)
                .ToList();

            if (candidates.Count == 0)
                return NotFound(new { message = "No supervisors found in your department. Make sure doctors have their department set." });

            var aiProject = new AiProjectInput
            {
                Title = project.Name,
                Abstract = project.Abstract ?? string.Empty,
                RequiredSkills = requiredSkillNames
            };

            var aiDoctors = candidates.Select(c => new AiDoctorInput
            {
                DoctorId = c.DoctorId,
                Name = c.Name,
                Specialization = c.Specialization,
                Bio = c.Bio
            }).ToList();

            var aiResults = await _aiService.RankSupervisorsAsync(aiProject, aiDoctors);
            if (aiResults != null && aiResults.Count > 0)
            {
                var validIds = candidates.Select(c => c.DoctorId).ToHashSet();
                var sanitized = aiResults
                    .Where(r => validIds.Contains(r.DoctorId))
                    .Select(r => new
                    {
                        doctorId = r.DoctorId,
                        matchScore = Math.Clamp(r.MatchScore, 0, 100),
                        reason = r.Reason ?? string.Empty
                    })
                    .ToList();

                if (sanitized.Count > 0)
                    return Ok(sanitized);
            }

            var fallback = candidates
                .Select(c => new
                {
                    doctorId = c.DoctorId,
                    matchScore = c.FallbackScore,
                    reason = (string?)null
                })
                .ToList();

            return Ok(fallback);
        }

        private async Task<StudentProfile?> GetStudentProfileAsync()
        {
            if (AuthorizationHelper.GetRole(User) != "student") return null;
            var userId = AuthorizationHelper.GetUserId(User);
            return await _db.StudentProfiles
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.UserId == userId);
        }

        private async Task<List<int>> ResolveRequiredSkillIdsAsync(List<string> requiredSkillNames)
        {
            if (requiredSkillNames.Count == 0) return new List<int>();

            return await _db.Skills
                .Where(s => requiredSkillNames.Contains(s.Name))
                .Select(s => s.Id)
                .ToListAsync();
        }

        private static List<int> GetStudentSkillIds(StudentProfile student)
        {
            return SkillHelper.ParseIntList(student.Roles)
                .Concat(SkillHelper.ParseIntList(student.TechnicalSkills))
                .Concat(SkillHelper.ParseIntList(student.Tools))
                .Distinct()
                .ToList();
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
            public string Name { get; set; } = string.Empty;
            public string Major { get; set; } = string.Empty;
            public string Bio { get; set; } = string.Empty;
            public List<string> Skills { get; set; } = new();
            public int CommonSkills { get; set; }
            public int FallbackScore { get; set; }
        }

        private class SupervisorCandidateRow
        {
            public int DoctorId { get; set; }
            public string Name { get; set; } = string.Empty;
            public string Specialization { get; set; } = string.Empty;
            public string Bio { get; set; } = string.Empty;
            public int MatchedSkills { get; set; }
            public int FallbackScore { get; set; }
        }
    }
}