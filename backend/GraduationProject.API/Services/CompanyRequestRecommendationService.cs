using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using GraduationProject.API.Data;
using GraduationProject.API.DTOs;
using GraduationProject.API.Helpers;
using GraduationProject.API.Models;
using GraduationProject.API.Services.Recommendations;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace GraduationProject.API.Services
{
    public class CompanyRequestRecommendationService : ICompanyRequestRecommendationService
    {
        private const string AlgorithmVersion = "v1-deterministic";
        private const int DefaultLimit = 20;
        private const int MaxLimit = 50;

        private readonly ApplicationDbContext _db;
        private readonly IRecommendationNormalizationService _normalizer;
        private readonly IRecommendationScoringEngine _scoring;
        private readonly IRecommendationSemanticService _semantic;
        private readonly ILogger<CompanyRequestRecommendationService> _logger;
        private readonly bool _diagnosticsEnabled;
        private static readonly TimeSpan FreshnessWindow = TimeSpan.FromHours(24);

        public CompanyRequestRecommendationService(
            ApplicationDbContext db,
            IRecommendationNormalizationService normalizer,
            IRecommendationScoringEngine scoring,
            IRecommendationSemanticService semantic,
            ILogger<CompanyRequestRecommendationService> logger,
            IConfiguration configuration,
            IHostEnvironment environment)
        {
            _db = db;
            _normalizer = normalizer;
            _scoring = scoring;
            _semantic = semantic;
            _logger = logger;
            _diagnosticsEnabled =
                environment.IsDevelopment() &&
                configuration.GetValue<bool>("RecommendationDiagnostics:Enabled");
        }

        public async Task<CompanyRequestRecommendationResultDto> GenerateAsync(
            int companyProfileId,
            int requestId,
            CompanyRequestRecommendationGenerateDto dto)
        {
            if (!dto.ForceRegenerate)
            {
                var existing = await GetLatestAsync(companyProfileId, requestId);
                if (existing != null && !existing.Run.IsStale)
                    return existing;
            }

            return await GenerateInternalAsync(companyProfileId, requestId, dto, generationSource: "manual");
        }

        public async Task<CompanyRequestRecommendationResultDto> RegenerateAsync(
            int companyProfileId,
            int requestId,
            CompanyRequestRecommendationGenerateDto dto)
        {
            dto.ForceRegenerate = true;
            return await GenerateInternalAsync(companyProfileId, requestId, dto, generationSource: "manual-regenerate");
        }

        public async Task<CompanyRequestRecommendationResultDto?> GetLatestAsync(int companyProfileId, int requestId)
        {
            var request = await _db.CompanyRequests
                .AsNoTracking()
                .FirstOrDefaultAsync(r => r.Id == requestId && r.CompanyProfileId == companyProfileId);
            if (request == null) return null;

            var run = await _db.CompanyRequestRecommendationRuns
                .AsNoTracking()
                .Where(r =>
                    r.CompanyRequestId == requestId &&
                    r.CompanyProfileId == companyProfileId &&
                    r.Status == CompanyRequestRecommendationRunStatus.Completed)
                .OrderByDescending(r => r.GeneratedAt)
                .ThenByDescending(r => r.Id)
                .FirstOrDefaultAsync();

            if (run == null) return null;

            var isStale = IsRunStale(run, request, out var staleReason);

            var items = await _db.CompanyRequestRecommendations
                .AsNoTracking()
                .Where(i => i.RunId == run.Id)
                .Include(i => i.StudentProfile)
                .ThenInclude(s => s.User)
                .Include(i => i.StudentProfile)
                .ThenInclude(s => s.StudentSkills)
                .OrderBy(i => i.Rank)
                .ThenBy(i => i.StudentProfileId)
                .ToListAsync();

            var skillIdMap = await _db.Skills
                .AsNoTracking()
                .ToDictionaryAsync(s => s.Id, s => s.Name);

            var invitationRows = await _db.CompanyRequestInvitations
                .AsNoTracking()
                .Where(i => i.CompanyRequestId == requestId)
                .OrderByDescending(i => i.CreatedAt)
                .ToListAsync();
            var invitationByStudent = invitationRows
                .GroupBy(i => i.StudentProfileId)
                .ToDictionary(g => g.Key, g => g.First().Status);

            var dtoItems = items.Select(i =>
            {
                var breakdown = DeserializeBreakdown(i.ScoreBreakdownJson);
                var highlights = SkillHelper.ParseStringList(i.HighlightsJson);
                invitationByStudent.TryGetValue(i.StudentProfileId, out var status);
                return MapItem(i, i.StudentProfile, breakdown, highlights, status, skillIdMap);
            }).ToList();

            return new CompanyRequestRecommendationResultDto
            {
                Run = BuildRunDto(run, dtoItems.Count, isLatest: true, isStale, staleReason, "cached"),
                Items = dtoItems,
            };
        }

        public async Task<CompanyRequestRecommendationRunHistoryDto?> ListRunsAsync(int companyProfileId, int requestId)
        {
            var request = await _db.CompanyRequests
                .AsNoTracking()
                .FirstOrDefaultAsync(r => r.Id == requestId && r.CompanyProfileId == companyProfileId);
            if (request == null) return null;

            var runs = await _db.CompanyRequestRecommendationRuns
                .AsNoTracking()
                .Where(r => r.CompanyRequestId == requestId && r.CompanyProfileId == companyProfileId)
                .OrderByDescending(r => r.GeneratedAt)
                .ThenByDescending(r => r.Id)
                .Take(20)
                .ToListAsync();

            if (runs.Count == 0) return null;

            var counts = await _db.CompanyRequestRecommendations
                .AsNoTracking()
                .Where(i => runs.Select(r => r.Id).Contains(i.RunId))
                .GroupBy(i => i.RunId)
                .Select(g => new { RunId = g.Key, Count = g.Count() })
                .ToListAsync();
            var countMap = counts.ToDictionary(x => x.RunId, x => x.Count);

            var latestRunId = runs.First().Id;
            var runDtos = runs.Select(r =>
            {
                var stale = IsRunStale(r, request, out var staleReason);
                return BuildRunDto(
                    r,
                    countMap.TryGetValue(r.Id, out var count) ? count : 0,
                    isLatest: r.Id == latestRunId,
                    isStale: stale,
                    staleReason,
                    generationSource: "history");
            }).ToList();

            return new CompanyRequestRecommendationRunHistoryDto
            {
                CompanyRequestId = requestId,
                TotalRuns = runs.Count,
                Runs = runDtos,
            };
        }

        private async Task<CompanyRequestRecommendationResultDto> GenerateInternalAsync(
            int companyProfileId,
            int requestId,
            CompanyRequestRecommendationGenerateDto dto,
            string generationSource)
        {
            var request = await _db.CompanyRequests
                .Include(r => r.Roles)
                .ThenInclude(role => role.Skills)
                .FirstOrDefaultAsync(r => r.Id == requestId && r.CompanyProfileId == companyProfileId);

            if (request == null)
                throw new ArgumentException("Company request not found.");

            if (request.Status is CompanyRequestStatus.Draft or CompanyRequestStatus.Archived)
                throw new ArgumentException("Recommendations are available only for active requests.");

            var requestedSkillNames = _normalizer.NormalizeMany(
                request.Roles.SelectMany(r => r.Skills).Select(s => s.SkillName));
            var requestedRoleNames = _normalizer.NormalizeMany(request.Roles.Select(r => r.RoleName));
            var requestTextSignals = _normalizer.NormalizeMany(new[]
            {
                request.Title,
                request.Description,
                request.Category,
                request.ScopeNotes ?? string.Empty,
            }.Concat(requestedSkillNames).Concat(requestedRoleNames));
            var requestToolSignals = _normalizer.NormalizeMany(requestedSkillNames.Where(s =>
                s.Contains("figma", StringComparison.OrdinalIgnoreCase) ||
                s.Contains("autocad", StringComparison.OrdinalIgnoreCase) ||
                s.Contains("revit", StringComparison.OrdinalIgnoreCase) ||
                s.Contains("excel", StringComparison.OrdinalIgnoreCase) ||
                s.Contains("power bi", StringComparison.OrdinalIgnoreCase)));

            var limit = Math.Clamp(dto.Limit <= 0 ? DefaultLimit : dto.Limit, 1, MaxLimit);

            var students = await _db.StudentProfiles
                .Include(s => s.User)
                .Include(s => s.StudentSkills)
                .AsNoTracking()
                .ToListAsync();

            var invitationRows = await _db.CompanyRequestInvitations
                .AsNoTracking()
                .Where(i => i.CompanyRequestId == requestId)
                .OrderByDescending(i => i.CreatedAt)
                .ToListAsync();

            var invitationByStudent = invitationRows
                .GroupBy(i => i.StudentProfileId)
                .ToDictionary(g => g.Key, g => g.First().Status);

            var skillIdMap = await _db.Skills
                .AsNoTracking()
                .ToDictionaryAsync(s => s.Id, s => s.Name);

            var scored = students
                .Where(s => s.User != null)
                .Select(s => BuildCandidateScore(
                    s,
                    requestedSkillNames,
                    requestedRoleNames,
                    requestToolSignals,
                    requestTextSignals,
                    CompanyRequestEnumConverters.ToWireValue(request.CollaborationFormat),
                    invitationByStudent.TryGetValue(s.Id, out var status) ? status : null,
                    skillIdMap))
                .Where(r => r.Score.PassesThreshold)
                .OrderByDescending(r => r.TotalScore)
                .ThenByDescending(r => r.Score.Breakdown.SkillOverlap)
                .ThenByDescending(r => r.Score.DisciplineRelevance)
                .ThenBy(r => r.Student.Id)
                .Take(Math.Max(limit * 3, 60))
                .ToList();

            var requestContext = new RecommendationRequestContext
            {
                RequestId = requestId,
                RequestedSkills = requestedSkillNames,
                RequestedRoles = requestedRoleNames,
                RequestedTools = requestToolSignals,
                TextSignals = requestTextSignals,
                Collaboration = CompanyRequestEnumConverters.ToWireValue(request.CollaborationFormat),
            };
            var semanticCandidates = scored
                .Select(r => new RecommendationSemanticCandidate
                {
                    StudentProfileId = r.Student.Id,
                    Content = OpenAiRecommendationSemanticService.BuildStudentDocument(
                        new RecommendationCandidateContext
                        {
                            Skills = r.StudentSkills,
                            Tools = _normalizer.NormalizeMany(SkillHelper.ParseStringList(r.Student.Tools)),
                            InterestSignals = _normalizer.NormalizeMany(new[]
                            {
                                r.Student.LookingFor ?? string.Empty,
                                r.Student.Languages ?? string.Empty,
                            }.Concat(SkillHelper.ParseStringList(r.Student.Languages))),
                            DisciplineSignals = _normalizer.NormalizeMany(new[]
                            {
                                r.Student.Major ?? string.Empty,
                                r.Student.Faculty ?? string.Empty,
                            }.Concat(SkillHelper.ParseStringList(r.Student.Roles))),
                            Bio = r.Student.Bio,
                            Availability = r.Student.Availability,
                            InvitationStatus = r.InvitationStatus,
                        },
                        r.Student.Id),
                })
                .ToList();

            var semanticScores = await _semantic.ScoreCandidatesAsync(requestContext, semanticCandidates);
            foreach (var row in scored)
            {
                if (!semanticScores.TryGetValue(row.Student.Id, out var sim))
                    continue;
                row.SemanticSimilarity = sim;
                row.SemanticBoost = ComputeSemanticBoost(sim);
                row.TotalScore = Math.Clamp(row.TotalScore + row.SemanticBoost, 0, 100);
                if (row.SemanticBoost > 0)
                    row.Score.Highlights.Insert(0, $"Semantic alignment confidence: {(int)Math.Round(sim * 100)}%");
            }

            scored = scored
                .OrderByDescending(r => r.TotalScore)
                .ThenByDescending(r => r.SemanticSimilarity)
                .ThenByDescending(r => r.Score.Breakdown.SkillOverlap)
                .ThenBy(r => r.Student.Id)
                .Take(limit)
                .ToList();

            if (_diagnosticsEnabled)
                LogDiagnostics(requestId, scored);

            var run = new CompanyRequestRecommendationRun
            {
                CompanyRequestId = requestId,
                CompanyProfileId = companyProfileId,
                AlgorithmVersion = AlgorithmVersion,
                Status = CompanyRequestRecommendationRunStatus.Completed,
                GeneratedAt = DateTime.UtcNow,
                CompletedAt = DateTime.UtcNow,
            };
            _db.CompanyRequestRecommendationRuns.Add(run);
            await _db.SaveChangesAsync();

            var entities = scored.Select((row, idx) => new CompanyRequestRecommendation
            {
                RunId = run.Id,
                CompanyRequestId = requestId,
                StudentProfileId = row.Student.Id,
                Rank = idx + 1,
                Score = row.TotalScore,
                ScoreBreakdownJson = JsonSerializer.Serialize(row.Score.Breakdown),
                ReasonSummary = row.Score.ReasonSummary,
                HighlightsJson = JsonSerializer.Serialize(row.Score.Highlights),
                Source = "deterministic",
                CreatedAt = DateTime.UtcNow,
            }).ToList();

            _db.CompanyRequestRecommendations.AddRange(entities);
            await _db.SaveChangesAsync();

            return MapResult(run, entities, scored, generationSource, isStale: false, staleReason: null);
        }

        private CandidateScoreRow BuildCandidateScore(
            StudentProfile student,
            List<string> requestedSkillNames,
            List<string> requestedRoleNames,
            List<string> requestToolSignals,
            List<string> requestTextSignals,
            string? requestCollaboration,
            string? invitationStatus,
            Dictionary<int, string> skillIdMap)
        {
            var studentSkills = ResolveStudentSkills(student, skillIdMap);
            var roleSignals = _normalizer.NormalizeMany(new[]
            {
                student.Major ?? string.Empty,
                student.Faculty ?? string.Empty,
                student.LookingFor ?? string.Empty,
                student.Availability ?? string.Empty,
            }.Concat(SkillHelper.ParseStringList(student.Roles)));
            var tools = _normalizer.NormalizeMany(SkillHelper.ParseStringList(student.Tools));
            var interestSignals = _normalizer.NormalizeMany(new[]
            {
                student.LookingFor ?? string.Empty,
                student.Languages ?? string.Empty,
            }.Concat(SkillHelper.ParseStringList(student.Languages)));

            var score = _scoring.Score(
                new RecommendationRequestContext
                {
                    RequestedSkills = requestedSkillNames,
                    RequestedRoles = requestedRoleNames,
                    RequestedTools = requestToolSignals,
                    TextSignals = requestTextSignals,
                    Collaboration = requestCollaboration,
                },
                new RecommendationCandidateContext
                {
                    Skills = studentSkills,
                    Tools = tools,
                    InterestSignals = interestSignals,
                    DisciplineSignals = roleSignals,
                    Bio = student.Bio,
                    Availability = student.Availability,
                    InvitationStatus = invitationStatus,
                });

            return new CandidateScoreRow
            {
                Student = student,
                TotalScore = score.TotalScore,
                InvitationStatus = invitationStatus,
                StudentSkills = studentSkills,
                Score = score,
            };
        }

        private static List<string> ResolveStudentSkills(StudentProfile student, Dictionary<int, string> skillIdMap)
        {
            var names = new List<string>();
            names.AddRange(SkillHelper.ParseStringList(student.Roles));
            names.AddRange(SkillHelper.ParseStringList(student.TechnicalSkills));
            names.AddRange(SkillHelper.ParseStringList(student.Tools));

            foreach (var id in SkillHelper.ParseIntList(student.Roles)
                         .Concat(SkillHelper.ParseIntList(student.TechnicalSkills))
                         .Concat(SkillHelper.ParseIntList(student.Tools)))
            {
                if (skillIdMap.TryGetValue(id, out var name))
                    names.Add(name);
            }

            if (student.StudentSkills != null)
            {
                foreach (var row in student.StudentSkills)
                {
                    if (skillIdMap.TryGetValue(row.SkillId, out var name))
                        names.Add(name);
                }
            }

            return SkillHelper.NormalizeUniqueStrings(names);
        }

        private static CompanyRequestRecommendationScoreBreakdownDto DeserializeBreakdown(string? json)
        {
            if (string.IsNullOrWhiteSpace(json))
                return new CompanyRequestRecommendationScoreBreakdownDto();
            try
            {
                return JsonSerializer.Deserialize<CompanyRequestRecommendationScoreBreakdownDto>(json) ??
                       new CompanyRequestRecommendationScoreBreakdownDto();
            }
            catch
            {
                return new CompanyRequestRecommendationScoreBreakdownDto();
            }
        }

        private static CompanyRequestRecommendationResultDto MapResult(
            CompanyRequestRecommendationRun run,
            List<CompanyRequestRecommendation> entities,
            List<CandidateScoreRow> scored,
            string generationSource,
            bool isStale,
            string? staleReason)
        {
            var scoredMap = scored.ToDictionary(s => s.Student.Id);
            var items = entities.Select(e =>
            {
                var s = scoredMap[e.StudentProfileId];
                return new CompanyRequestRecommendationItemDto
                {
                    Id = e.Id,
                    Rank = e.Rank,
                    Score = e.Score,
                    ReasonSummary = s.Score.ReasonSummary,
                    Highlights = s.Score.Highlights,
                    Source = e.Source,
                    ScoreBreakdown = s.Score.Breakdown,
                    InvitationAlreadySent = s.InvitationStatus is CompanyRequestInvitationStatus.Pending or CompanyRequestInvitationStatus.Accepted,
                    InvitationStatus = s.InvitationStatus,
                    Student = new CompanyRequestRecommendationStudentDto
                    {
                        StudentProfileId = s.Student.Id,
                        UserId = s.Student.UserId,
                        Name = s.Student.User.Name,
                        AcademicYear = s.Student.AcademicYear,
                        Bio = s.Student.Bio,
                        Major = s.Student.Major,
                        Faculty = s.Student.Faculty,
                        University = s.Student.University,
                        Skills = s.StudentSkills,
                    },
                };
            }).ToList();

            return new CompanyRequestRecommendationResultDto
            {
                Run = BuildRunDto(run, items.Count, isLatest: true, isStale, staleReason, generationSource),
                Items = items,
            };
        }

        private static CompanyRequestRecommendationRunDto BuildRunDto(
            CompanyRequestRecommendationRun run,
            int totalCandidates,
            bool isLatest,
            bool isStale,
            string? staleReason,
            string generationSource)
        {
            return new CompanyRequestRecommendationRunDto
            {
                RunId = run.Id,
                CompanyRequestId = run.CompanyRequestId,
                AlgorithmVersion = run.AlgorithmVersion,
                Status = run.Status,
                GenerationSource = generationSource,
                GeneratedAt = run.GeneratedAt,
                CompletedAt = run.CompletedAt,
                TotalCandidates = totalCandidates,
                IsLatest = isLatest,
                IsStale = isStale,
                StaleReason = staleReason,
            };
        }

        private static int ComputeSemanticBoost(double similarity)
        {
            if (similarity < 0.45) return 0;
            if (similarity < 0.55) return 3;
            if (similarity < 0.65) return 6;
            if (similarity < 0.75) return 9;
            return 12;
        }

        private static bool IsRunStale(
            CompanyRequestRecommendationRun run,
            CompanyRequest request,
            out string? staleReason)
        {
            if (request.UpdatedAt > run.GeneratedAt)
            {
                staleReason = "request-updated";
                return true;
            }

            if (DateTime.UtcNow - run.GeneratedAt > FreshnessWindow)
            {
                staleReason = "run-expired";
                return true;
            }

            staleReason = null;
            return false;
        }

        private void LogDiagnostics(int requestId, List<CandidateScoreRow> scored)
        {
            foreach (var row in scored.Take(30))
            {
                _logger.LogDebug(
                    "RecommendationDiagnostics request={RequestId} student={StudentId} total={Total} pass={Pass} discipline={Discipline} semantic={Semantic} semanticBoost={SemanticBoost} breakdown={@Breakdown} highlights={@Highlights}",
                    requestId,
                    row.Student.Id,
                    row.TotalScore,
                    row.Score.PassesThreshold,
                    row.Score.DisciplineRelevance,
                    row.SemanticSimilarity,
                    row.SemanticBoost,
                    row.Score.Breakdown,
                    row.Score.Highlights);
            }
        }

        private static CompanyRequestRecommendationItemDto MapItem(
            CompanyRequestRecommendation recommendation,
            StudentProfile student,
            CompanyRequestRecommendationScoreBreakdownDto breakdown,
            List<string> highlights,
            string? invitationStatus,
            Dictionary<int, string> skillIdMap)
        {
            return new CompanyRequestRecommendationItemDto
            {
                Id = recommendation.Id,
                Rank = recommendation.Rank,
                Score = recommendation.Score,
                ReasonSummary = recommendation.ReasonSummary,
                Highlights = highlights,
                Source = recommendation.Source,
                ScoreBreakdown = breakdown,
                InvitationAlreadySent = invitationStatus is CompanyRequestInvitationStatus.Pending or CompanyRequestInvitationStatus.Accepted,
                InvitationStatus = invitationStatus,
                Student = new CompanyRequestRecommendationStudentDto
                {
                    StudentProfileId = student.Id,
                    UserId = student.UserId,
                    Name = student.User?.Name ?? string.Empty,
                    AcademicYear = student.AcademicYear,
                    Bio = student.Bio,
                    Major = student.Major,
                    Faculty = student.Faculty,
                    University = student.University,
                    Skills = ResolveStudentSkills(student, skillIdMap),
                },
            };
        }

        private class CandidateScoreRow
        {
            public StudentProfile Student { get; set; } = null!;
            public int TotalScore { get; set; }
            public string? InvitationStatus { get; set; }
            public List<string> StudentSkills { get; set; } = new();
            public RecommendationScoreResult Score { get; set; } = new();
            public double SemanticSimilarity { get; set; }
            public int SemanticBoost { get; set; }
        }
    }
}
