using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using GraduationProject.API.Data;
using GraduationProject.API.DTOs;
using GraduationProject.API.Helpers;
using GraduationProject.API.Models;
using Microsoft.EntityFrameworkCore;

namespace GraduationProject.API.Services
{
    public interface ICompanyTalentMatchService
    {
        Task<CompanyTalentSearchResultDto> SearchAsync(int companyProfileId, CompanyTalentSearchDto dto);
    }

    public class CompanyTalentMatchService : ICompanyTalentMatchService
    {
        private const int MaxCandidates = 25;
        private const int MinMatchScore = 40;

        private readonly ApplicationDbContext _db;
        private readonly IAiStudentRecommendationService _ai;

        public CompanyTalentMatchService(ApplicationDbContext db, IAiStudentRecommendationService ai)
        {
            _db = db;
            _ai = ai;
        }

        public async Task<CompanyTalentSearchResultDto> SearchAsync(int companyProfileId, CompanyTalentSearchDto dto)
        {
            var requiredSkillNames = dto.RequiredSkills
                .Where(s => !string.IsNullOrWhiteSpace(s))
                .Select(s => s.Trim())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            var requiredSkillIds = await ResolveRequiredSkillIdsAsync(requiredSkillNames);
            var preferredMajor = dto.PreferredMajor?.Trim();

            IQueryable<StudentProfile> studentsQuery = _db.StudentProfiles
                .Include(s => s.User)
                .Include(s => s.StudentSkills)
                .AsNoTracking();

            if (!string.IsNullOrWhiteSpace(preferredMajor))
            {
                var majorLower = preferredMajor.ToLower();
                studentsQuery = studentsQuery.Where(s =>
                    s.Major != null && s.Major.ToLower().Contains(majorLower));
            }

            var students = await studentsQuery.ToListAsync();

            var allSkillIds = students
                .SelectMany(GetStudentSkillIds)
                .Concat(requiredSkillIds)
                .Distinct()
                .ToList();

            var skillNameMap = await _db.Skills
                .AsNoTracking()
                .Where(s => allSkillIds.Contains(s.Id))
                .ToDictionaryAsync(s => s.Id, s => s.Name);

            var candidates = new List<CandidateRow>();
            foreach (var s in students)
            {
                var skillIds = GetStudentSkillIds(s).Distinct().ToList();
                var skillNames = skillIds
                    .Where(skillNameMap.ContainsKey)
                    .Select(id => skillNameMap[id])
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .ToList();

                AppendJsonSkillNames(s.Roles, skillNames);
                AppendJsonSkillNames(s.TechnicalSkills, skillNames);
                AppendJsonSkillNames(s.Tools, skillNames);

                skillNames = skillNames.Distinct(StringComparer.OrdinalIgnoreCase).ToList();

                var commonCount = requiredSkillIds.Count == 0
                    ? 0
                    : requiredSkillIds.Count(id => skillIds.Contains(id));

                if (requiredSkillIds.Count > 0 && commonCount == 0 && skillNames.Count == 0)
                    continue;

                var fallbackScore = requiredSkillIds.Count > 0
                    ? (int)Math.Min((double)commonCount / requiredSkillIds.Count * 100, 100)
                    : 45;

                candidates.Add(new CandidateRow
                {
                    StudentProfileId = s.Id,
                    UserId = s.UserId,
                    Name = s.User?.Name ?? string.Empty,
                    Major = s.Major ?? string.Empty,
                    University = s.University ?? string.Empty,
                    AcademicYear = s.AcademicYear,
                    Bio = s.Bio ?? string.Empty,
                    Skills = skillNames,
                    CommonSkills = commonCount,
                    FallbackScore = fallbackScore,
                });
            }

            var ranked = candidates
                .OrderByDescending(c => c.FallbackScore)
                .ThenBy(c => c.StudentProfileId)
                .Take(MaxCandidates)
                .ToList();

            var usedAi = false;
            List<CompanyTalentCandidateDto> results;

            if (ranked.Count > 0)
            {
                var aiNeed = new AiCompanyTalentInput
                {
                    Title = dto.Title.Trim(),
                    Description = dto.Description.Trim(),
                    RequiredSkills = requiredSkillNames,
                    PreferredMajor = preferredMajor,
                    EngagementType = dto.EngagementType?.Trim(),
                    Duration = dto.Duration?.Trim(),
                };

                var aiStudents = ranked.Select(c => new AiStudentInput
                {
                    StudentId = c.StudentProfileId,
                    Name = c.Name,
                    Skills = c.Skills,
                    Major = c.Major,
                    Bio = c.Bio,
                }).ToList();

                var aiResults = await _ai.RankStudentsForCompanyTalentAsync(aiNeed, aiStudents);
                var map = ranked.ToDictionary(c => c.StudentProfileId);

                if (aiResults != null && aiResults.Count > 0)
                {
                    usedAi = true;
                    results = aiResults
                        .Where(r => map.ContainsKey(r.StudentId) && r.MatchScore >= MinMatchScore)
                        .OrderByDescending(r => r.MatchScore)
                        .Select(r => MapCandidate(map[r.StudentId], r.MatchScore, r.Reason, r.Highlights))
                        .ToList();
                }
                else
                {
                    results = ranked
                        .Where(c => c.FallbackScore >= MinMatchScore)
                        .Select(c => MapCandidate(
                            c,
                            c.FallbackScore,
                            BuildFallbackReason(c, requiredSkillNames),
                            BuildFallbackHighlights(c, requiredSkillNames)))
                        .ToList();
                }
            }
            else
            {
                results = new List<CompanyTalentCandidateDto>();
            }

            int? requestId = null;
            if (dto.SaveRequest)
            {
                var entity = new CompanyTalentRequest
                {
                    CompanyProfileId = companyProfileId,
                    Title = dto.Title.Trim(),
                    Description = dto.Description.Trim(),
                    RequiredSkills = requiredSkillNames.Count > 0
                        ? JsonSerializer.Serialize(requiredSkillNames)
                        : null,
                    PreferredMajor = preferredMajor,
                    EngagementType = dto.EngagementType?.Trim(),
                    Duration = dto.Duration?.Trim(),
                    CreatedAt = DateTime.UtcNow,
                };
                _db.CompanyTalentRequests.Add(entity);
                await _db.SaveChangesAsync();
                requestId = entity.Id;
            }

            return new CompanyTalentSearchResultDto
            {
                RequestId = requestId,
                Title = dto.Title.Trim(),
                UsedAi = usedAi,
                Candidates = results,
            };
        }

        private static void AppendJsonSkillNames(string? json, List<string> target)
        {
            foreach (var name in SkillHelper.ParseStringList(json))
            {
                if (!string.IsNullOrWhiteSpace(name))
                    target.Add(name.Trim());
            }
        }

        private async Task<List<int>> ResolveRequiredSkillIdsAsync(List<string> requiredSkillNames)
        {
            if (requiredSkillNames.Count == 0) return new List<int>();

            return await _db.Skills
                .AsNoTracking()
                .Where(s => requiredSkillNames.Contains(s.Name))
                .Select(s => s.Id)
                .ToListAsync();
        }

        private static List<int> GetStudentSkillIds(StudentProfile student)
        {
            var fromJson = SkillHelper.ParseIntList(student.Roles)
                .Concat(SkillHelper.ParseIntList(student.TechnicalSkills))
                .Concat(SkillHelper.ParseIntList(student.Tools));

            var fromTable = student.StudentSkills?.Select(ss => ss.SkillId) ?? Enumerable.Empty<int>();
            return fromJson.Concat(fromTable).Distinct().ToList();
        }

        private static CompanyTalentCandidateDto MapCandidate(
            CandidateRow row,
            int score,
            string reason,
            List<string>? highlights)
        {
            return new CompanyTalentCandidateDto
            {
                StudentProfileId = row.StudentProfileId,
                UserId = row.UserId,
                Name = row.Name,
                Major = row.Major,
                University = row.University,
                AcademicYear = row.AcademicYear,
                Bio = row.Bio,
                Skills = row.Skills,
                MatchScore = Math.Clamp(score, 0, 100),
                Reason = reason ?? string.Empty,
                Highlights = highlights?
                    .Where(h => !string.IsNullOrWhiteSpace(h))
                    .Select(h => h.Trim())
                    .Take(4)
                    .ToList() ?? new List<string>(),
            };
        }

        private static string BuildFallbackReason(CandidateRow c, List<string> required)
        {
            if (required.Count > 0 && c.CommonSkills > 0)
                return $"{c.Name} aligns with {c.CommonSkills} of {required.Count} required skills for this role, with a {c.Major} background at {c.University}.";
            if (c.Skills.Count > 0)
                return $"{c.Name} brings relevant skills ({string.Join(", ", c.Skills.Take(4))}) that overlap with your talent search criteria.";
            return $"{c.Name} is listed as a potential match based on profile and major ({c.Major}). Review their full profile for fit.";
        }

        private static List<string> BuildFallbackHighlights(CandidateRow c, List<string> required)
        {
            var list = new List<string>();
            if (!string.IsNullOrWhiteSpace(c.Major))
                list.Add($"Major: {c.Major}");
            if (c.Skills.Count > 0)
                list.Add($"Skills: {string.Join(", ", c.Skills.Take(3))}");
            var matched = c.Skills
                .Where(sk => required.Any(r => string.Equals(r, sk, StringComparison.OrdinalIgnoreCase)))
                .Take(2)
                .ToList();
            if (matched.Count > 0)
                list.Add($"Matches required: {string.Join(", ", matched)}");
            return list.Take(4).ToList();
        }

        private class CandidateRow
        {
            public int StudentProfileId { get; set; }
            public int UserId { get; set; }
            public string Name { get; set; } = string.Empty;
            public string Major { get; set; } = string.Empty;
            public string University { get; set; } = string.Empty;
            public string? AcademicYear { get; set; }
            public string Bio { get; set; } = string.Empty;
            public List<string> Skills { get; set; } = new();
            public int CommonSkills { get; set; }
            public int FallbackScore { get; set; }
        }
    }
}
