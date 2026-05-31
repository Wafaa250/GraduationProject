using System.Text.Json;
using GraduationProject.API.Data;
using GraduationProject.API.DTOs;
using GraduationProject.API.Helpers;
using GraduationProject.API.Models;
using GraduationProject.API.Services.Recommendations;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace GraduationProject.API.Services
{
    public class CompanyRequestTeamRecommendationService : ICompanyRequestTeamRecommendationService
    {
        private const string AlgorithmVersion = "v1-team-deterministic-semantic";
        private readonly ApplicationDbContext _db;
        private readonly IRecommendationNormalizationService _normalizer;
        private readonly IRecommendationScoringEngine _scoring;
        private readonly IRecommendationSemanticService _semantic;
        private readonly ILogger<CompanyRequestTeamRecommendationService> _logger;
        private readonly IGraduationProjectNotificationService _notifications;

        public CompanyRequestTeamRecommendationService(
            ApplicationDbContext db,
            IRecommendationNormalizationService normalizer,
            IRecommendationScoringEngine scoring,
            IRecommendationSemanticService semantic,
            ILogger<CompanyRequestTeamRecommendationService> logger,
            IGraduationProjectNotificationService notifications)
        {
            _db = db;
            _normalizer = normalizer;
            _scoring = scoring;
            _semantic = semantic;
            _logger = logger;
            _notifications = notifications;
        }

        public async Task<CompanyRequestTeamRecommendationResultDto> GenerateAsync(
            int companyProfileId, int requestId, GenerateCompanyRequestTeamRecommendationsDto dto)
        {
            if (!dto.ForceRegenerate)
            {
                var latest = await GetLatestAsync(companyProfileId, requestId);
                if (latest != null) return latest;
            }
            return await GenerateInternalAsync(companyProfileId, requestId, dto);
        }

        public async Task<CompanyRequestTeamRecommendationResultDto> RegenerateAsync(
            int companyProfileId, int requestId, GenerateCompanyRequestTeamRecommendationsDto dto)
        {
            dto.ForceRegenerate = true;
            return await GenerateInternalAsync(companyProfileId, requestId, dto);
        }

        public async Task<CompanyRequestTeamRecommendationResultDto?> GetLatestAsync(int companyProfileId, int requestId)
        {
            var run = await _db.CompanyRequestTeamRecommendationRuns
                .AsNoTracking()
                .Where(r => r.CompanyProfileId == companyProfileId && r.CompanyRequestId == requestId && r.Status == CompanyRequestTeamRecommendationRunStatus.Completed)
                .OrderByDescending(r => r.GeneratedAt)
                .ThenByDescending(r => r.Id)
                .FirstOrDefaultAsync();
            if (run == null) return null;
            return await LoadRunResultAsync(run);
        }

        public async Task<CompanyRequestTeamRecommendationRunHistoryDto?> ListRunsAsync(int companyProfileId, int requestId)
        {
            var runs = await _db.CompanyRequestTeamRecommendationRuns
                .AsNoTracking()
                .Where(r => r.CompanyProfileId == companyProfileId && r.CompanyRequestId == requestId)
                .OrderByDescending(r => r.GeneratedAt)
                .ThenByDescending(r => r.Id)
                .Take(20)
                .ToListAsync();
            if (runs.Count == 0) return null;

            var counts = await _db.CompanyRequestTeamRecommendations
                .AsNoTracking()
                .Where(t => runs.Select(r => r.Id).Contains(t.RunId))
                .GroupBy(t => t.RunId)
                .Select(g => new { RunId = g.Key, Count = g.Count() })
                .ToListAsync();
            var countMap = counts.ToDictionary(x => x.RunId, x => x.Count);

            return new CompanyRequestTeamRecommendationRunHistoryDto
            {
                CompanyRequestId = requestId,
                TotalRuns = runs.Count,
                Runs = runs.Select(r => new CompanyRequestTeamRecommendationRunDto
                {
                    RunId = r.Id,
                    CompanyRequestId = r.CompanyRequestId,
                    AlgorithmVersion = r.AlgorithmVersion,
                    Status = r.Status,
                    GeneratedAt = r.GeneratedAt,
                    CompletedAt = r.CompletedAt,
                    TotalTeams = countMap.TryGetValue(r.Id, out var c) ? c : 0,
                }).ToList(),
            };
        }

        private async Task<CompanyRequestTeamRecommendationResultDto> GenerateInternalAsync(
            int companyProfileId, int requestId, GenerateCompanyRequestTeamRecommendationsDto dto)
        {
            var request = await _db.CompanyRequests
                .Include(r => r.Roles)
                .ThenInclude(role => role.Skills)
                .FirstOrDefaultAsync(r => r.Id == requestId && r.CompanyProfileId == companyProfileId);

            if (request == null) throw new ArgumentException("Company request not found.");
            if (!string.Equals(request.RequestType, CompanyRequestType.AiBuiltTeam, StringComparison.OrdinalIgnoreCase))
                throw new ArgumentException("Team recommendations require ai-built-team request type.");
            if (request.Status == CompanyRequestStatus.Draft)
                throw new ArgumentException("Team recommendations are available only for submitted requests.");
            if (CompanyRequestLifecycleStatus.IsModificationBlocked(request.RequestStatus))
            {
                var message = request.RequestStatus == CompanyRequestLifecycleStatus.Paused
                    ? "This request is paused."
                    : "This request has been closed.";
                throw new ArgumentException(message);
            }
            if (request.Roles.Count == 0)
                throw new ArgumentException("Team recommendations require at least one role.");

            var students = await _db.StudentProfiles
                .Include(s => s.User)
                .Include(s => s.StudentSkills)
                .AsNoTracking()
                .Where(s => s.User != null)
                .ToListAsync();

            var skillMap = await _db.Skills.AsNoTracking().ToDictionaryAsync(s => s.Id, s => s.Name);

            var roleCandidateMap = new Dictionary<int, List<RoleCandidate>>();
            foreach (var role in request.Roles.OrderBy(r => r.SortOrder).ThenBy(r => r.Id))
            {
                var reqSkills = _normalizer.NormalizeMany(role.Skills.Select(s => s.SkillName));
                var reqRoles = _normalizer.NormalizeMany(new[] { role.RoleName });
                var reqText = _normalizer.NormalizeMany(new[] { request.Title, request.Description, request.Category, role.Notes ?? string.Empty });
                var reqTools = _normalizer.NormalizeMany(reqSkills.Where(s => s.Contains("figma", StringComparison.OrdinalIgnoreCase) || s.Contains("excel", StringComparison.OrdinalIgnoreCase) || s.Contains("autocad", StringComparison.OrdinalIgnoreCase)));

                var scored = students.Select(s =>
                {
                    var skills = ResolveStudentSkills(s, skillMap);
                    var tools = _normalizer.NormalizeMany(SkillHelper.ParseStringList(s.Tools));
                    var interestSignals = _normalizer.NormalizeMany(new[] { s.LookingFor ?? string.Empty, s.Languages ?? string.Empty }.Concat(SkillHelper.ParseStringList(s.Languages)));
                    var disciplineSignals = _normalizer.NormalizeMany(new[] { s.Major ?? string.Empty, s.Faculty ?? string.Empty }.Concat(SkillHelper.ParseStringList(s.Roles)));
                    var score = _scoring.Score(
                        new RecommendationRequestContext
                        {
                            RequestId = request.Id,
                            RequestedSkills = reqSkills,
                            RequestedRoles = reqRoles,
                            RequestedTools = reqTools,
                            TextSignals = reqText,
                            Collaboration = CompanyRequestEnumConverters.ToWireValue(request.CollaborationFormat),
                        },
                        new RecommendationCandidateContext
                        {
                            Skills = skills,
                            Tools = tools,
                            InterestSignals = interestSignals,
                            DisciplineSignals = disciplineSignals,
                            Bio = s.Bio,
                            Availability = s.Availability,
                        });

                    return new RoleCandidate
                    {
                        RoleId = role.Id,
                        RoleName = role.RoleName,
                        Student = s,
                        Score = score.TotalScore,
                        Reason = score.ReasonSummary,
                        Highlights = score.Highlights,
                        Skills = skills,
                        Tools = tools,
                        InterestSignals = interestSignals,
                        DisciplineSignals = disciplineSignals,
                        Passes = score.PassesThreshold,
                    };
                })
                .Where(c => c.Passes)
                .OrderByDescending(c => c.Score)
                .ThenBy(c => c.Student.Id)
                .Take(Math.Clamp(dto.CandidatePoolPerRole <= 0 ? 20 : dto.CandidatePoolPerRole, 5, 50))
                .ToList();

                var semanticMap = await _semantic.ScoreCandidatesAsync(
                    new RecommendationRequestContext
                    {
                        RequestId = request.Id,
                        RequestedSkills = reqSkills,
                        RequestedRoles = reqRoles,
                        RequestedTools = reqTools,
                        TextSignals = reqText,
                        Collaboration = CompanyRequestEnumConverters.ToWireValue(request.CollaborationFormat),
                    },
                    scored.Select(c => new RecommendationSemanticCandidate
                    {
                        StudentProfileId = c.Student.Id,
                        Content = OpenAiRecommendationSemanticService.BuildStudentDocument(
                            new RecommendationCandidateContext
                            {
                                Skills = c.Skills,
                                Tools = c.Tools,
                                InterestSignals = c.InterestSignals,
                                DisciplineSignals = c.DisciplineSignals,
                                Bio = c.Student.Bio,
                                Availability = c.Student.Availability,
                            },
                            c.Student.Id),
                    }).ToList());

                foreach (var c in scored)
                {
                    c.SemanticSimilarity = semanticMap.TryGetValue(c.Student.Id, out var sim) ? sim : 0;
                    c.Score = Math.Clamp(c.Score + SemanticBoost(c.SemanticSimilarity), 0, 100);
                }

                roleCandidateMap[role.Id] = scored
                    .OrderByDescending(c => c.Score)
                    .ThenByDescending(c => c.SemanticSimilarity)
                    .ThenBy(c => c.Student.Id)
                    .ToList();
            }

            var orderedRoles = request.Roles.OrderBy(r => r.SortOrder).ThenBy(r => r.Id).ToList();
            foreach (var role in orderedRoles)
            {
                var poolSize = roleCandidateMap.TryGetValue(role.Id, out var pool) ? pool.Count : 0;
                _logger.LogInformation(
                    "Team recommendation role pool requestId={RequestId} roleId={RoleId} roleName={RoleName} candidates={Count}",
                    requestId,
                    role.Id,
                    role.RoleName,
                    poolSize);
                if (poolSize == 0)
                {
                    _logger.LogWarning(
                        "No passing candidates for role {RoleName} (id={RoleId}) on request {RequestId}",
                        role.RoleName,
                        role.Id,
                        requestId);
                }
            }

            var teams = ComposeTeams(
                orderedRoles,
                roleCandidateMap,
                dto.TeamCount <= 0 ? 3 : Math.Clamp(dto.TeamCount, 1, 5));

            if (teams.Count == 0)
            {
                _logger.LogWarning(
                    "Team composition produced zero teams for request {RequestId} with {RoleCount} roles and {StudentCount} students",
                    requestId,
                    orderedRoles.Count,
                    students.Count);
            }
            else
            {
                _logger.LogInformation(
                    "Team composition produced {TeamCount} teams for request {RequestId}",
                    teams.Count,
                    requestId);
            }

            var run = new CompanyRequestTeamRecommendationRun
            {
                CompanyRequestId = request.Id,
                CompanyProfileId = companyProfileId,
                AlgorithmVersion = AlgorithmVersion,
                Status = CompanyRequestTeamRecommendationRunStatus.Completed,
                GeneratedAt = DateTime.UtcNow,
                CompletedAt = DateTime.UtcNow,
            };
            _db.CompanyRequestTeamRecommendationRuns.Add(run);
            await _db.SaveChangesAsync();

            var teamEntities = new List<CompanyRequestTeamRecommendation>();
            foreach (var t in teams)
            {
                var entity = new CompanyRequestTeamRecommendation
                {
                    RunId = run.Id,
                    CompanyRequestId = request.Id,
                    TeamRank = t.TeamRank,
                    TotalScore = t.TotalScore,
                    RoleCoverageScore = t.RoleCoverageScore,
                    CompatibilityScore = t.CompatibilityScore,
                    SummaryReason = t.SummaryReason,
                    StrengthsJson = JsonSerializer.Serialize(t.Strengths),
                    RisksJson = JsonSerializer.Serialize(t.Risks),
                    CreatedAt = DateTime.UtcNow,
                };
                teamEntities.Add(entity);
            }
            _db.CompanyRequestTeamRecommendations.AddRange(teamEntities);
            await _db.SaveChangesAsync();

            var memberEntities = new List<CompanyRequestTeamRecommendationMember>();
            for (var i = 0; i < teamEntities.Count; i++)
            {
                foreach (var m in teams[i].Members)
                {
                    memberEntities.Add(new CompanyRequestTeamRecommendationMember
                    {
                        TeamRecommendationId = teamEntities[i].Id,
                        CompanyRequestRoleId = m.RoleId,
                        StudentProfileId = m.Student.Id,
                        RoleScore = m.Score,
                        SemanticSimilarity = m.SemanticSimilarity,
                        AssignmentReason = m.Reason,
                        HighlightsJson = JsonSerializer.Serialize(m.Highlights),
                        CreatedAt = DateTime.UtcNow,
                    });
                }
            }
            _db.CompanyRequestTeamRecommendationMembers.AddRange(memberEntities);
            await _db.SaveChangesAsync();

            await _notifications.NotifyCompanyAiRecommendationsReadyAsync(
                companyProfileId,
                requestId,
                CompanyRequestMapper.BuildActivitySubject(request),
                run.Id,
                isTeamRecommendations: true);

            return await LoadRunResultAsync(run);
        }

        private async Task<CompanyRequestTeamRecommendationResultDto> LoadRunResultAsync(CompanyRequestTeamRecommendationRun run)
        {
            var teams = await _db.CompanyRequestTeamRecommendations
                .AsNoTracking()
                .Where(t => t.RunId == run.Id)
                .OrderBy(t => t.TeamRank)
                .ThenBy(t => t.Id)
                .ToListAsync();

            var teamIds = teams.Select(t => t.Id).ToList();
            var members = await _db.CompanyRequestTeamRecommendationMembers
                .AsNoTracking()
                .Where(m => teamIds.Contains(m.TeamRecommendationId))
                .Include(m => m.StudentProfile).ThenInclude(s => s.User)
                .Include(m => m.CompanyRequestRole)
                .OrderBy(m => m.TeamRecommendationId)
                .ThenBy(m => m.CompanyRequestRoleId)
                .ThenBy(m => m.StudentProfileId)
                .ToListAsync();

            var teamDtos = teams.Select(t =>
            {
                var m = members.Where(x => x.TeamRecommendationId == t.Id).ToList();
                return new CompanyRequestTeamRecommendationDto
                {
                    TeamId = t.Id,
                    TeamRank = t.TeamRank,
                    TotalScore = t.TotalScore,
                    RoleCoverageScore = t.RoleCoverageScore,
                    CompatibilityScore = t.CompatibilityScore,
                    SummaryReason = t.SummaryReason,
                    Strengths = SkillHelper.ParseStringList(t.StrengthsJson),
                    Risks = SkillHelper.ParseStringList(t.RisksJson),
                    Members = m.Select(x =>
                    {
                        var contact = StudentDiscoveryContactMapper.Map(x.StudentProfile);
                        return new CompanyRequestTeamRecommendationMemberDto
                        {
                            CompanyRequestRoleId = x.CompanyRequestRoleId,
                            RoleName = x.CompanyRequestRole?.RoleName ?? string.Empty,
                            StudentProfileId = x.StudentProfileId,
                            UserId = x.StudentProfile.UserId,
                            StudentName = x.StudentProfile.User?.Name ?? string.Empty,
                            Major = x.StudentProfile.Major,
                            Faculty = x.StudentProfile.Faculty,
                            University = x.StudentProfile.University,
                            RoleScore = x.RoleScore,
                            SemanticSimilarity = x.SemanticSimilarity,
                            AssignmentReason = x.AssignmentReason,
                            Highlights = SkillHelper.ParseStringList(x.HighlightsJson),
                            Email = contact.Email,
                            Linkedin = contact.Linkedin,
                            Github = contact.Github,
                            Portfolio = contact.Portfolio,
                        };
                    }).ToList(),
                };
            }).ToList();

            return new CompanyRequestTeamRecommendationResultDto
            {
                Run = new CompanyRequestTeamRecommendationRunDto
                {
                    RunId = run.Id,
                    CompanyRequestId = run.CompanyRequestId,
                    AlgorithmVersion = run.AlgorithmVersion,
                    Status = run.Status,
                    GeneratedAt = run.GeneratedAt,
                    CompletedAt = run.CompletedAt,
                    TotalTeams = teamDtos.Count,
                },
                Teams = teamDtos,
            };
        }

        private List<ComposedTeam> ComposeTeams(
            List<CompanyRequestRole> roles,
            Dictionary<int, List<RoleCandidate>> roleCandidates,
            int teamCount)
        {
            var teams = new List<ComposedTeam>();
            var signatures = new HashSet<string>(StringComparer.Ordinal);

            void Backtrack(int idx, List<RoleCandidate> picked)
            {
                if (teams.Count >= teamCount * 6) return;
                if (idx >= roles.Count)
                {
                    var signature = string.Join("-", picked.Select(p => p.Student.Id).OrderBy(x => x));
                    if (!signatures.Add(signature)) return;
                    teams.Add(EvaluateTeam(picked));
                    return;
                }

                var role = roles[idx];
                if (!roleCandidates.TryGetValue(role.Id, out var candidates) || candidates.Count == 0)
                    return;

                foreach (var c in candidates.Take(8))
                {
                    if (picked.Any(p => p.Student.Id == c.Student.Id)) continue;
                    picked.Add(c);
                    Backtrack(idx + 1, picked);
                    picked.RemoveAt(picked.Count - 1);
                }
            }

            Backtrack(0, new List<RoleCandidate>());

            return teams
                .OrderByDescending(t => t.TotalScore)
                .ThenByDescending(t => t.CompatibilityScore)
                .ThenBy(t => string.Join("-", t.Members.Select(m => m.Student.Id).OrderBy(x => x)))
                .Take(teamCount)
                .Select((t, i) =>
                {
                    t.TeamRank = i + 1;
                    return t;
                })
                .ToList();
        }

        private static ComposedTeam EvaluateTeam(List<RoleCandidate> members)
        {
            var roleCoverage = members.Count == 0 ? 0 : (int)Math.Round(members.Average(m => m.Score));
            var disciplineGroups = members.Select(m => (m.Student.Major ?? m.Student.Faculty ?? string.Empty).Trim().ToLowerInvariant()).Where(s => !string.IsNullOrWhiteSpace(s)).Distinct().Count();
            var compatibility = Math.Clamp(55 + Math.Min(20, disciplineGroups * 5) + (int)Math.Round(members.Average(m => m.SemanticSimilarity) * 20), 0, 100);
            var total = Math.Clamp((int)Math.Round(roleCoverage * 0.75 + compatibility * 0.25), 0, 100);

            var strengths = new List<string>();
            var risks = new List<string>();
            if (members.All(m => m.Score >= 70))
                strengths.Add("Strong role coverage across requested positions");
            if (compatibility >= 70)
                strengths.Add("Good team compatibility and complementary profile signals");
            else
                risks.Add("Compatibility is moderate; monitor collaboration alignment");
            if (members.Any(m => m.Score < 55))
                risks.Add("At least one role has limited fit and may require fallback candidates");

            var summary = compatibility >= 70
                ? "Balanced team composition with strong role coverage and good compatibility."
                : "Team composition covers required roles with moderate compatibility trade-offs.";

            return new ComposedTeam
            {
                TotalScore = total,
                RoleCoverageScore = roleCoverage,
                CompatibilityScore = compatibility,
                SummaryReason = summary,
                Strengths = strengths,
                Risks = risks,
                Members = members.OrderBy(m => m.RoleId).ToList(),
            };
        }

        private static int SemanticBoost(double similarity)
        {
            if (similarity < 0.45) return 0;
            if (similarity < 0.55) return 3;
            if (similarity < 0.65) return 6;
            if (similarity < 0.75) return 9;
            return 12;
        }

        private List<string> ResolveStudentSkills(StudentProfile student, Dictionary<int, string> skillMap)
        {
            var names = new List<string>();
            names.AddRange(SkillHelper.ParseStringList(student.Roles));
            names.AddRange(SkillHelper.ParseStringList(student.TechnicalSkills));
            names.AddRange(SkillHelper.ParseStringList(student.Tools));
            foreach (var id in SkillHelper.ParseIntList(student.Roles)
                         .Concat(SkillHelper.ParseIntList(student.TechnicalSkills))
                         .Concat(SkillHelper.ParseIntList(student.Tools)))
            {
                if (skillMap.TryGetValue(id, out var n))
                    names.Add(n);
            }
            if (student.StudentSkills != null)
            {
                foreach (var ss in student.StudentSkills)
                {
                    if (skillMap.TryGetValue(ss.SkillId, out var n))
                        names.Add(n);
                }
            }
            return _normalizer.NormalizeMany(names);
        }

        private class RoleCandidate
        {
            public int RoleId { get; set; }
            public string RoleName { get; set; } = string.Empty;
            public StudentProfile Student { get; set; } = null!;
            public int Score { get; set; }
            public bool Passes { get; set; }
            public string Reason { get; set; } = string.Empty;
            public List<string> Highlights { get; set; } = new();
            public List<string> Skills { get; set; } = new();
            public List<string> Tools { get; set; } = new();
            public List<string> InterestSignals { get; set; } = new();
            public List<string> DisciplineSignals { get; set; } = new();
            public double SemanticSimilarity { get; set; }
        }

        private class ComposedTeam
        {
            public int TeamRank { get; set; }
            public int TotalScore { get; set; }
            public int RoleCoverageScore { get; set; }
            public int CompatibilityScore { get; set; }
            public string SummaryReason { get; set; } = string.Empty;
            public List<string> Strengths { get; set; } = new();
            public List<string> Risks { get; set; } = new();
            public List<RoleCandidate> Members { get; set; } = new();
        }
    }
}
