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
        private const int MaxPreviewTopStudents = 5;
        /// <summary>Students at or below this score are omitted from teammate recommendations.</summary>
        private const int MinTeammateMatchScore = 1;
        private const string InsufficientPreviewMessage =
            "AI preview will become available once sufficient project information is provided.";

        private readonly ApplicationDbContext _db;
        private readonly IAiStudentRecommendationService _aiService;
        private readonly ILogger<AiController> _logger;

        public AiController(
            ApplicationDbContext db,
            IAiStudentRecommendationService aiService,
            ILogger<AiController> logger)
        {
            _db = db;
            _aiService = aiService;
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
                .Include(p => p.Members)
                .FirstOrDefaultAsync(p => p.Id == request.ProjectId);

            if (project == null)
                return NotFound(new { message = "Project not found." });

            var isOwner = project.OwnerId == caller.Id;
            var isLeader = await _db.StudentProjectMembers
                .AnyAsync(m => m.ProjectId == request.ProjectId && m.StudentId == caller.Id && m.Role == "leader");

            if (!isOwner && !isLeader)
                return StatusCode(403, new { message = "Only the project owner or team leader can request AI recommendations." });

            if (project.Members.Count >= project.PartnersCount)
            {
                _logger.LogInformation(
                    "RecommendStudents projectId={ProjectId} returning empty: project is full ({Members}/{Capacity})",
                    request.ProjectId,
                    project.Members.Count,
                    project.PartnersCount);
                return Ok(new List<object>());
            }

            var projectOwner = await _db.StudentProfiles
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.Id == project.OwnerId);

            if (projectOwner == null)
                return NotFound(new { message = "Project owner not found." });

            var requiredSkillNames = SkillHelper.GetProjectMatchingSkillNames(
                project.RequiredSkills,
                project.Technologies);
            var preferredRoleNames = SkillHelper.ParseStringList(project.PreferredRoles);
            var requiredRoles = SkillHelper.ParseStringList(project.RequiredRoles);
            var requiredSkillIds = await ResolveRequiredSkillIdsAsync(requiredSkillNames);

            _logger.LogInformation(
                "RecommendStudents projectId={ProjectId} requiredSkills={Skills} preferredRoles={PreferredRoles} requiredRoles={RequiredRoles} resolvedSkillIds={SkillIdCount}",
                request.ProjectId,
                string.Join(", ", requiredSkillNames),
                string.Join(", ", preferredRoleNames),
                string.Join(", ", requiredRoles),
                requiredSkillIds.Count);

            var totalStudentsInDb = await _db.StudentProfiles.AsNoTracking().CountAsync();

            var ownerMajor = projectOwner.Major;
            var studentsSameMajor = await _db.StudentProfiles
                .Include(s => s.User)
                .AsNoTracking()
                .Where(s => s.Major != null && ownerMajor != null &&
                            s.Major.ToLower() == ownerMajor.ToLower())
                .ToListAsync();

            var studentsBeforeEligibility = studentsSameMajor.Count;
            var students = new List<StudentProfile>();
            foreach (var student in studentsSameMajor)
            {
                if (await GraduationProjectInviteEligibilityHelper.CanBeInvitedToProjectAsync(
                        _db, project, student.Id))
                {
                    students.Add(student);
                }
            }

            var studentsAfterEligibility = students.Count;

            _logger.LogInformation(
                "RecommendStudents projectId={ProjectId} totalStudentsLoaded={Total} candidatesBeforeEligibilityFiltering={Before} candidatesAfterEligibilityFiltering={After}",
                request.ProjectId,
                totalStudentsInDb,
                studentsBeforeEligibility,
                studentsAfterEligibility);

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
                        University = s.University ?? string.Empty,
                        Bio = s.Bio ?? string.Empty,
                        Skills = skillNames,
                        CommonSkills = commonCount,
                        FallbackScore = fallbackScore
                    };
                })
                .OrderByDescending(c => c.FallbackScore)
                .ThenBy(c => c.StudentId)
                .Take(MaxCandidates)
                .ToList();

            var candidatesBeforeRanking = candidates.Count;

            if (candidates.Count == 0)
            {
                _logger.LogWarning(
                    "RecommendStudents projectId={ProjectId} returning empty: no inviteable students in major '{Major}'",
                    request.ProjectId,
                    ownerMajor);
                LogRecommendStudentsEligibilityRules();
                return Ok(new List<object>());
            }

            var aiProject = new AiProjectInput
            {
                Title = project.Name,
                Abstract = project.Abstract ?? string.Empty,
                RequiredSkills = requiredSkillNames,
                PreferredRoles = preferredRoleNames,
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
                    .Select(r => (
                        Candidate: candidateMap[r.StudentId],
                        Score: Math.Clamp(r.MatchScore, 0, 100),
                        Reason: r.Reason))
                    .Where(x => QualifiesAsTeammateRecommendation(x.Score))
                    .OrderByDescending(x => x.Score)
                    .ThenBy(x => x.Candidate.StudentId)
                    .ToList();

                if (sanitized.Count > 0)
                {
                    var finalAi = await MapInviteableStudentRecommendationsAsync(project, sanitized);
                    LogRecommendStudentsSummary(
                        request.ProjectId,
                        totalStudentsInDb,
                        studentsBeforeEligibility,
                        studentsAfterEligibility,
                        candidatesBeforeRanking,
                        finalAi.Count,
                        "ai");
                    return Ok(finalAi);
                }
            }

            // Fallback to rule-based skill overlap when OpenAI is unavailable or returns no qualifying rows.
            var fallbackRanked = candidates
                .Where(c => QualifiesAsTeammateRecommendation(c.FallbackScore))
                .OrderByDescending(c => c.FallbackScore)
                .ThenBy(c => c.StudentId)
                .Select(c => (c, c.FallbackScore, (string?)null));

            var finalFallback = await MapInviteableStudentRecommendationsAsync(project, fallbackRanked);
            LogRecommendStudentsSummary(
                request.ProjectId,
                totalStudentsInDb,
                studentsBeforeEligibility,
                studentsAfterEligibility,
                candidatesBeforeRanking,
                finalFallback.Count,
                aiResults != null && aiResults.Count > 0 ? "fallback-after-ai-filter" : "fallback-rule-based");

            return Ok(finalFallback);
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

            var requiredSkillNames = SkillHelper.GetProjectMatchingSkillNames(
                project.RequiredSkills,
                project.Technologies);
            var requiredSkillsNormalized = requiredSkillNames
                .Where(s => !string.IsNullOrWhiteSpace(s))
                .Select(s => s.Trim())
                .ToList();

            var projectOwner = await _db.StudentProfiles
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.Id == project.OwnerId);

            // Match supervisors to the project owner's major (not only the caller's).
            var majorForMatch = projectOwner?.Major?.Trim() ?? caller.Major?.Trim();
            var isComputerEngineeringStudent =
                string.Equals(majorForMatch, "Computer Engineering", StringComparison.OrdinalIgnoreCase);

            _logger.LogInformation(
                "RecommendSupervisors route=POST /api/ai/recommend-supervisors projectId={ProjectId} majorForMatch={Major} callerMajor={CallerMajor}",
                request.ProjectId,
                majorForMatch ?? "(null)",
                caller.Major ?? "(null)");

            var allDoctorsInDb = await _db.DoctorProfiles
                .Include(d => d.User)
                .AsNoTracking()
                .Where(d => !string.IsNullOrEmpty(d.Department))
                .ToListAsync();

            var doctors = string.IsNullOrWhiteSpace(majorForMatch)
                ? new List<DoctorProfile>()
                : allDoctorsInDb
                    .Where(d => DepartmentMatchesStudentMajor(d.Department, majorForMatch, isComputerEngineeringStudent))
                    .ToList();

            if (doctors.Count == 0 && allDoctorsInDb.Count > 0)
            {
                _logger.LogWarning(
                    "RecommendSupervisors projectId={ProjectId} no department match for major '{Major}'; using all doctors with a department ({Count})",
                    request.ProjectId,
                    majorForMatch,
                    allDoctorsInDb.Count);
                doctors = allDoctorsInDb;
            }

            _logger.LogInformation(
                "RecommendSupervisors projectId={ProjectId} doctorsLoaded={DoctorCount}",
                request.ProjectId,
                doctors.Count);

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
            {
                _logger.LogWarning(
                    "RecommendSupervisors projectId={ProjectId} returning empty: no doctors with Department set in database",
                    request.ProjectId);
                return Ok(new List<object>());
            }

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
            var candidateById = candidates.ToDictionary(c => c.DoctorId);

            if (aiResults != null && aiResults.Count > 0)
            {
                var validIds = candidateById.Keys.ToHashSet();
                var sanitized = aiResults
                    .Where(r => validIds.Contains(r.DoctorId))
                    .Select(r =>
                    {
                        var row = candidateById[r.DoctorId];
                        return MapSupervisorRecommendation(
                            row,
                            Math.Clamp(r.MatchScore, 0, 100),
                            r.Reason);
                    })
                    .ToList();

                if (sanitized.Count > 0)
                {
                    _logger.LogInformation(
                        "RecommendSupervisors projectId={ProjectId} finalCount={Count} source=ai",
                        request.ProjectId,
                        sanitized.Count);
                    return Ok(sanitized);
                }
            }

            var fallback = candidates
                .Select(c => MapSupervisorRecommendation(c, c.FallbackScore, null))
                .ToList();

            _logger.LogInformation(
                "RecommendSupervisors projectId={ProjectId} finalCount={Count} source={Source}",
                request.ProjectId,
                fallback.Count,
                aiResults != null && aiResults.Count > 0 ? "fallback-after-ai-filter" : "fallback-rule-based");

            return Ok(fallback);
        }

        /// <summary>
        /// Wizard-time AI matching preview (no saved project required).
        /// Reuses the same teammate candidate pool + RankStudentsAsync pipeline as recommend-students.
        /// </summary>
        [HttpPost("project-preview")]
        public async Task<IActionResult> ProjectPreview([FromBody] ProjectPreviewRequestDto dto)
        {
            if (dto == null)
                return BadRequest(new { message = "Request body is required." });

            var caller = await GetStudentProfileAsync();
            if (caller == null)
                return Forbid();

            if (!HasSufficientPreviewInput(dto))
                return Ok(ProjectPreviewResponseDto.Unavailable(InsufficientPreviewMessage));

            var mergedSkills = SkillHelper.NormalizeUniqueStrings(
                dto.RequiredSkills.Concat(dto.Technologies));

            var preferredRoles = SkillHelper.NormalizeUniqueStrings(dto.PreferredRoles);
            var requiredRoles = SkillHelper.NormalizeUniqueStrings(dto.RequiredRoles);
            var roleLabels = SkillHelper.NormalizeUniqueStrings(preferredRoles.Concat(requiredRoles));

            var aiProject = new AiProjectInput
            {
                Title = dto.Title.Trim(),
                Abstract = BuildPreviewAbstract(dto),
                RequiredSkills = mergedSkills,
                PreferredRoles = roleLabels,
            };

            var candidates = await BuildTeammateCandidatesAsync(
                caller,
                mergedSkills,
                excludeStudentIds: Array.Empty<int>());

            if (candidates.Count == 0)
            {
                return Ok(new ProjectPreviewResponseDto
                {
                    IsAvailable = true,
                    Message = "No matching candidates found in your cohort yet based on the current project details.",
                    RoleCoverageLabel = BuildRoleCoverageLabel(requiredRoles.Count, dto.TeamSize),
                    DomainOverlapLabel = ComputeDomainOverlapLabel(0, 0, dto.Interests),
                });
            }

            var ranked = await RankTeammateCandidatesAsync(aiProject, candidates);
            if (ranked.Count == 0)
            {
                return Ok(new ProjectPreviewResponseDto
                {
                    IsAvailable = true,
                    Message = "No matching candidates found in your cohort yet based on the current project details.",
                    RoleCoverageLabel = BuildRoleCoverageLabel(requiredRoles.Count, dto.TeamSize),
                    DomainOverlapLabel = ComputeDomainOverlapLabel(0, candidates.Count, dto.Interests),
                });
            }

            var topScores = ranked.Take(3).Select(r => r.Score).ToList();
            var compatibilityScore = topScores.Count > 0
                ? (int)Math.Round(topScores.Average())
                : 0;

            var interestMatches = ranked.Count(r =>
                CandidateMatchesInterests(r.Candidate, dto.Interests, mergedSkills));

            return Ok(new ProjectPreviewResponseDto
            {
                IsAvailable = true,
                EstimatedCompatibleStudentsCount = ranked.Count,
                CompatibilityScore = compatibilityScore,
                TopMatchingSkills = ExtractTopMatchingSkills(mergedSkills, ranked),
                TopMatchingRoles = ExtractTopMatchingRoles(roleLabels, ranked),
                DomainOverlapLabel = ComputeDomainOverlapLabel(interestMatches, ranked.Count, dto.Interests),
                RoleCoverageLabel = BuildRoleCoverageLabel(requiredRoles.Count, dto.TeamSize),
                TopRecommendedStudents = ranked
                    .Take(MaxPreviewTopStudents)
                    .Select(r => new ProjectPreviewStudentDto
                    {
                        StudentId = r.Candidate.StudentId,
                        Name = r.Candidate.Name,
                        Major = r.Candidate.Major,
                        MatchScore = r.Score,
                        Skills = r.Candidate.Skills.Take(8).ToList(),
                    })
                    .ToList(),
            });
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

            var normalized = requiredSkillNames
                .Select(n => n.Trim().ToLowerInvariant())
                .Where(n => n.Length > 0)
                .ToHashSet();

            var skills = await _db.Skills.AsNoTracking().ToListAsync();
            return skills
                .Where(s => normalized.Contains(s.Name.Trim().ToLowerInvariant()))
                .Select(s => s.Id)
                .ToList();
        }

        private async Task<List<object>> MapInviteableStudentRecommendationsAsync(
            StudentProject project,
            IEnumerable<(CandidateRow Candidate, int Score, string? Reason)> ranked)
        {
            var projectForValidation = await _db.StudentProjects
                .AsNoTracking()
                .Include(p => p.Members)
                .FirstAsync(p => p.Id == project.Id);

            var output = new List<object>();
            foreach (var (candidate, score, reason) in ranked)
            {
                if (!await GraduationProjectInviteEligibilityHelper.CanBeInvitedToProjectAsync(
                        _db, projectForValidation, candidate.StudentId))
                {
                    continue;
                }

                output.Add(MapStudentRecommendation(candidate, score, reason));
            }

            return output;
        }

        private void LogRecommendStudentsSummary(
            int projectId,
            int totalStudentsLoaded,
            int beforeEligibility,
            int afterEligibility,
            int candidatePoolForRanking,
            int finalCount,
            string source)
        {
            _logger.LogInformation(
                "RecommendStudents projectId={ProjectId} totalStudentsLoaded={TotalLoaded} candidatesBeforeEligibilityFiltering={Before} candidatesAfterEligibilityFiltering={After} candidatePoolForRanking={Pool} finalRecommendationCount={Final} source={Source}",
                projectId,
                totalStudentsLoaded,
                beforeEligibility,
                afterEligibility,
                candidatePoolForRanking,
                finalCount,
                source);
            LogRecommendStudentsEligibilityRules();
        }

        private void LogRecommendStudentsEligibilityRules()
        {
            foreach (var rule in GraduationProjectInviteEligibilityHelper.EligibilityRuleDescriptions)
                _logger.LogInformation("RecommendStudents eligibility rule: {Rule}", rule);
        }

        private static bool DepartmentMatchesStudentMajor(
            string? department,
            string major,
            bool includeElectricalForComputerEngineering)
        {
            if (string.IsNullOrWhiteSpace(department) || string.IsNullOrWhiteSpace(major))
                return false;

            var dept = department.Trim().ToLowerInvariant();
            var maj = major.Trim().ToLowerInvariant();

            if (dept == maj || dept.Contains(maj, StringComparison.Ordinal) || maj.Contains(dept, StringComparison.Ordinal))
                return true;

            if (includeElectricalForComputerEngineering &&
                dept.Contains("electrical engineering", StringComparison.Ordinal))
                return true;

            return false;
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

        private static bool HasSufficientPreviewInput(ProjectPreviewRequestDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Title) || dto.Title.Trim().Length < 3)
                return false;

            var skills = SkillHelper.NormalizeUniqueStrings(
                dto.RequiredSkills.Concat(dto.Technologies));
            return skills.Count > 0;
        }

        private static string BuildPreviewAbstract(ProjectPreviewRequestDto dto)
        {
            var parts = new List<string>();
            if (!string.IsNullOrWhiteSpace(dto.Abstract))
                parts.Add(dto.Abstract.Trim());
            if (!string.IsNullOrWhiteSpace(dto.ProjectType))
                parts.Add($"Project stage: {dto.ProjectType.Trim()}");
            if (dto.Interests.Count > 0)
                parts.Add($"Interests: {string.Join(", ", dto.Interests)}");
            if (dto.SkillPriorities.Count > 0)
                parts.Add($"Skill priorities: {string.Join(", ", dto.SkillPriorities)}");
            if (dto.RequiredRoles.Count > 0)
                parts.Add($"Required roles: {string.Join(", ", dto.RequiredRoles)}");
            return string.Join("\n", parts);
        }

        private async Task<List<CandidateRow>> BuildTeammateCandidatesAsync(
            StudentProfile owner,
            List<string> requiredSkillNames,
            IReadOnlyCollection<int> excludeStudentIds)
        {
            var requiredSkillIds = await ResolveRequiredSkillIdsAsync(requiredSkillNames);

            var gpOwnerIds = await _db.StudentProjects
                .AsNoTracking()
                .Select(p => p.OwnerId)
                .ToListAsync();
            var gpOwnerSet = gpOwnerIds.ToHashSet();

            var ownerMajor = owner.Major;
            var students = await _db.StudentProfiles
                .Include(s => s.User)
                .AsNoTracking()
                .Where(s => s.Major != null && ownerMajor != null &&
                            s.Major.ToLower() == ownerMajor.ToLower() &&
                            s.Id != owner.Id &&
                            !excludeStudentIds.Contains(s.Id) &&
                            !gpOwnerSet.Contains(s.Id))
                .ToListAsync();

            var allSkillIds = students
                .SelectMany(GetStudentSkillIds)
                .Concat(requiredSkillIds)
                .Distinct()
                .ToList();

            var skillNameMap = await _db.Skills
                .Where(s => allSkillIds.Contains(s.Id))
                .ToDictionaryAsync(s => s.Id, s => s.Name);

            return students
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
                        .Distinct(StringComparer.OrdinalIgnoreCase)
                        .ToList();

                    return new CandidateRow
                    {
                        StudentId = s.Id,
                        Name = s.User?.Name ?? string.Empty,
                        Major = s.Major ?? string.Empty,
                        University = s.University ?? string.Empty,
                        Bio = s.Bio ?? string.Empty,
                        Skills = skillNames,
                        CommonSkills = commonCount,
                        FallbackScore = fallbackScore,
                    };
                })
                .Where(c => requiredSkillIds.Count == 0 || c.CommonSkills > 0)
                .OrderByDescending(c => c.FallbackScore)
                .ThenBy(c => c.StudentId)
                .Take(MaxCandidates)
                .ToList();
        }

        private async Task<List<RankedTeammateRow>> RankTeammateCandidatesAsync(
            AiProjectInput aiProject,
            List<CandidateRow> candidates)
        {
            if (candidates.Count == 0)
                return new List<RankedTeammateRow>();

            var aiStudents = candidates.Select(c => new AiStudentInput
            {
                StudentId = c.StudentId,
                Name = c.Name,
                Skills = c.Skills,
                Major = c.Major,
                Bio = c.Bio,
            }).ToList();

            var candidateMap = candidates.ToDictionary(c => c.StudentId);
            var aiResults = await _aiService.RankStudentsAsync(aiProject, aiStudents);

            if (aiResults != null && aiResults.Count > 0)
            {
                var sanitized = aiResults
                    .Where(r => candidateMap.ContainsKey(r.StudentId))
                    .Select(r => new RankedTeammateRow
                    {
                        Candidate = candidateMap[r.StudentId],
                        Score = Math.Clamp(r.MatchScore, 0, 100),
                        Reason = r.Reason,
                    })
                    .Where(x => QualifiesAsTeammateRecommendation(x.Score))
                    .OrderByDescending(x => x.Score)
                    .ThenBy(x => x.Candidate.StudentId)
                    .ToList();

                if (sanitized.Count > 0)
                    return sanitized;
            }

            return candidates
                .Where(c => QualifiesAsTeammateRecommendation(c.FallbackScore))
                .OrderByDescending(c => c.FallbackScore)
                .ThenBy(c => c.StudentId)
                .Select(c => new RankedTeammateRow
                {
                    Candidate = c,
                    Score = c.FallbackScore,
                    Reason = null,
                })
                .ToList();
        }

        private static List<string> ExtractTopMatchingSkills(
            List<string> projectSkills,
            List<RankedTeammateRow> ranked)
        {
            if (projectSkills.Count == 0 || ranked.Count == 0)
                return new List<string>();

            var projectSet = new HashSet<string>(projectSkills, StringComparer.OrdinalIgnoreCase);
            var counts = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);

            foreach (var row in ranked.Take(10))
            {
                foreach (var skill in row.Candidate.Skills)
                {
                    if (!projectSet.Contains(skill)) continue;
                    counts[skill] = counts.GetValueOrDefault(skill) + 1;
                }
            }

            return counts
                .OrderByDescending(kv => kv.Value)
                .ThenBy(kv => kv.Key, StringComparer.OrdinalIgnoreCase)
                .Take(5)
                .Select(kv => kv.Key)
                .ToList();
        }

        private static List<string> ExtractTopMatchingRoles(
            List<string> projectRoles,
            List<RankedTeammateRow> ranked)
        {
            if (projectRoles.Count == 0 || ranked.Count == 0)
                return new List<string>();

            var matched = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            foreach (var role in projectRoles)
            {
                foreach (var row in ranked.Take(10))
                {
                    if (row.Candidate.Skills.Any(skill =>
                            skill.Contains(role, StringComparison.OrdinalIgnoreCase) ||
                            role.Contains(skill, StringComparison.OrdinalIgnoreCase)))
                    {
                        matched.Add(role);
                        break;
                    }
                }
            }

            return matched.Take(5).ToList();
        }

        private static bool CandidateMatchesInterests(
            CandidateRow candidate,
            List<string> interests,
            List<string> projectSkills)
        {
            if (interests.Count > 0)
            {
                var haystack = string.Join(" ",
                    new[] { candidate.Bio, candidate.Major, string.Join(" ", candidate.Skills) }
                        .Where(s => !string.IsNullOrWhiteSpace(s)));

                return interests.Any(interest =>
                    haystack.Contains(interest, StringComparison.OrdinalIgnoreCase));
            }

            return projectSkills.Any(skill =>
                candidate.Skills.Any(s =>
                    s.Equals(skill, StringComparison.OrdinalIgnoreCase)));
        }

        private static string ComputeDomainOverlapLabel(
            int matchedCount,
            int totalRanked,
            List<string> interests)
        {
            if (totalRanked <= 0)
                return interests.Count > 0 ? "Limited" : "—";

            var rate = (double)matchedCount / totalRanked * 100;
            if (rate >= 70) return "High";
            if (rate >= 40) return "Medium";
            if (rate > 0) return "Low";
            return "Limited";
        }

        private static string BuildRoleCoverageLabel(int requiredRoleCount, int teamSize) =>
            $"{Math.Max(0, requiredRoleCount)}/{Math.Max(1, teamSize)}";

        private static object MapStudentRecommendation(
            CandidateRow candidate,
            int matchScore,
            string? reason)
        {
            return new
            {
                studentId = candidate.StudentId,
                matchScore,
                reason = reason ?? string.Empty,
                name = candidate.Name,
                major = candidate.Major,
                university = candidate.University,
                skills = candidate.Skills
            };
        }

        private static object MapSupervisorRecommendation(
            SupervisorCandidateRow candidate,
            int matchScore,
            string? reason)
        {
            return new
            {
                doctorId = candidate.DoctorId,
                doctorName = candidate.Name,
                specialization = candidate.Specialization ?? string.Empty,
                matchScore,
                reason = reason ?? string.Empty
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
            public string Name { get; set; } = string.Empty;
            public string Major { get; set; } = string.Empty;
            public string University { get; set; } = string.Empty;
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

        private class RankedTeammateRow
        {
            public CandidateRow Candidate { get; set; } = null!;
            public int Score { get; set; }
            public string? Reason { get; set; }
        }
    }
}