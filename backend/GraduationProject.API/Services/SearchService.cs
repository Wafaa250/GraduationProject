using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using GraduationProject.API.Data;
using GraduationProject.API.DTOs;
using GraduationProject.API.Helpers;
using GraduationProject.API.Models;
using Microsoft.EntityFrameworkCore;

namespace GraduationProject.API.Services
{
    public class SearchService : ISearchService
    {
        private const int DefaultLimit = 5;
        private const int SuggestionPoolSize = 80;
        private readonly ApplicationDbContext _db;

        public SearchService(ApplicationDbContext db) => _db = db;

        public async Task<SearchSuggestionsResponseDto> GetSuggestionsAsync(int userId, int limit = DefaultLimit)
        {
            var take = Math.Clamp(limit, 3, 5);
            var student = await _db.StudentProfiles
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.UserId == userId);

            if (student == null)
                return await BuildGenericSuggestionsAsync(take);

            var skillNames = await ResolveSkillNamesAsync(
                SkillHelper.ParseIntList(student.TechnicalSkills)
                    .Concat(SkillHelper.ParseIntList(student.Roles))
                    .Take(12)
                    .ToList());

            var activeCompanyIds = await _db.CompanyRequests
                .AsNoTracking()
                .Where(r =>
                    r.Status == CompanyRequestStatus.Submitted
                    && r.RequestStatus == CompanyRequestLifecycleStatus.Active)
                .GroupBy(r => r.CompanyProfileId)
                .Select(g => g.Key)
                .ToListAsync();
            var activeSet = activeCompanyIds.ToHashSet();

            var students = await _db.StudentProfiles
                .AsNoTracking()
                .Include(s => s.User)
                .Where(s => s.UserId != userId)
                .OrderByDescending(s => s.Id)
                .Take(SuggestionPoolSize)
                .ToListAsync();

            var suggestedStudents = students
                .Select(s =>
                {
                    var score = ScoreStudentMatch(student, s, skillNames);
                    return (Profile: s, Score: score);
                })
                .OrderByDescending(x => x.Score)
                .ThenBy(x => x.Profile.User!.Name)
                .Take(take)
                .Select(x => new SearchHitDto
                {
                    Id = x.Profile.UserId,
                    Title = x.Profile.User?.Name ?? "Student",
                    Subtitle = x.Profile.Major ?? "Student",
                    AvatarBase64 = x.Profile.ProfilePictureBase64,
                    RoleType = "student",
                    Url = $"/students/{x.Profile.UserId}",
                })
                .ToList();

            var companies = await _db.CompanyProfiles
                .AsNoTracking()
                .OrderByDescending(c => c.Id)
                .Take(SuggestionPoolSize)
                .ToListAsync();

            var suggestedCompanies = companies
                .Select(c =>
                {
                    var score = ScoreCompanyMatch(c, student, skillNames);
                    if (activeSet.Contains(c.Id)) score += 3;
                    return (Company: c, Score: score);
                })
                .OrderByDescending(x => x.Score)
                .ThenBy(x => x.Company.CompanyName)
                .Take(take)
                .Select(x => new SearchHitDto
                {
                    Id = x.Company.Id,
                    Title = x.Company.CompanyName,
                    Subtitle = TruncateDescription(x.Company.Description, x.Company.Industry),
                    RoleType = "company",
                    Url = "/browse-projects",
                })
                .ToList();

            var orgQuery = _db.StudentAssociationProfiles.AsNoTracking().AsQueryable();
            if (!string.IsNullOrWhiteSpace(student.Faculty))
            {
                var faculty = student.Faculty.Trim();
                orgQuery = orgQuery.Where(p => p.Faculty == null || p.Faculty == faculty);
            }

            var associations = await orgQuery
                .OrderByDescending(a => a.Id)
                .Take(SuggestionPoolSize)
                .ToListAsync();

            var suggestedAssociations = associations
                .Select(a =>
                {
                    var score = 0;
                    if (!string.IsNullOrWhiteSpace(student.Faculty)
                        && string.Equals(student.Faculty.Trim(), a.Faculty?.Trim(), StringComparison.OrdinalIgnoreCase))
                        score += 5;
                    if (!string.IsNullOrWhiteSpace(student.Major)
                        && string.Equals(student.Major.Trim(), a.Category?.Trim(), StringComparison.OrdinalIgnoreCase))
                        score += 2;
                    return (Association: a, Score: score);
                })
                .OrderByDescending(x => x.Score)
                .ThenBy(x => x.Association.AssociationName)
                .Take(take)
                .Select(x => new SearchHitDto
                {
                    Id = x.Association.Id,
                    Title = x.Association.AssociationName,
                    Subtitle = x.Association.Faculty ?? x.Association.Category ?? "Student Association",
                    AvatarUrl = x.Association.LogoUrl,
                    RoleType = "association",
                    Url = $"/organizations/{x.Association.Id}",
                })
                .ToList();

            return new SearchSuggestionsResponseDto
            {
                Students = suggestedStudents,
                Companies = suggestedCompanies,
                Associations = suggestedAssociations,
            };
        }

        private async Task<SearchSuggestionsResponseDto> BuildGenericSuggestionsAsync(int take)
        {
            var studentRows = await _db.StudentProfiles
                .AsNoTracking()
                .Include(s => s.User)
                .OrderByDescending(s => s.Id)
                .Take(take)
                .ToListAsync();
            var students = studentRows.Select(s => new SearchHitDto
            {
                Id = s.UserId,
                Title = s.User?.Name ?? "Student",
                Subtitle = s.Major ?? "Student",
                AvatarBase64 = s.ProfilePictureBase64,
                RoleType = "student",
                Url = $"/students/{s.UserId}",
            }).ToList();

            var companies = await _db.CompanyProfiles
                .AsNoTracking()
                .OrderByDescending(c => c.Id)
                .Take(take)
                .Select(c => new SearchHitDto
                {
                    Id = c.Id,
                    Title = c.CompanyName,
                    Subtitle = c.Industry ?? "Company",
                    RoleType = "company",
                    Url = "/browse-projects",
                })
                .ToListAsync();

            var associations = await _db.StudentAssociationProfiles
                .AsNoTracking()
                .OrderByDescending(a => a.Id)
                .Take(take)
                .Select(a => new SearchHitDto
                {
                    Id = a.Id,
                    Title = a.AssociationName,
                    Subtitle = a.Faculty ?? a.Category ?? "Student Association",
                    AvatarUrl = a.LogoUrl,
                    RoleType = "association",
                    Url = $"/organizations/{a.Id}",
                })
                .ToListAsync();

            return new SearchSuggestionsResponseDto
            {
                Students = students,
                Companies = companies,
                Associations = associations,
            };
        }

        public async Task<GlobalSearchResponseDto> SearchAsync(string? query, int perCategoryLimit = DefaultLimit)
        {
            var term = query?.Trim();
            if (string.IsNullOrWhiteSpace(term))
                return new GlobalSearchResponseDto();

            var limit = Math.Clamp(perCategoryLimit, 1, 20);
            var pattern = $"%{term}%";

            return new GlobalSearchResponseDto
            {
                Students = await SearchStudentsAsync(pattern, limit),
                Doctors = await SearchDoctorsAsync(pattern, limit),
                Companies = await SearchCompaniesAsync(pattern, limit),
                Associations = await SearchAssociationsAsync(pattern, limit),
                Projects = await SearchProjectsAsync(pattern, limit),
                ProjectRequests = await SearchProjectRequestsAsync(pattern, limit),
                RecruitmentCampaigns = await SearchRecruitmentCampaignsAsync(pattern, limit),
                Events = await SearchEventsAsync(pattern, limit),
                Opportunities = await SearchOpportunitiesAsync(pattern, limit),
            };
        }

        private async Task<List<SearchHitDto>> SearchStudentsAsync(string pattern, int limit)
        {
            var rows = await _db.StudentProfiles
                .AsNoTracking()
                .Include(s => s.User)
                .Include(s => s.StudentSkills).ThenInclude(ss => ss.Skill)
                .Where(s =>
                    EF.Functions.ILike(s.User.Name, pattern)
                    || (s.StudentId != null && EF.Functions.ILike(s.StudentId, pattern))
                    || (s.Major != null && EF.Functions.ILike(s.Major, pattern))
                    || (s.Faculty != null && EF.Functions.ILike(s.Faculty, pattern))
                    || (s.Roles != null && EF.Functions.ILike(s.Roles, pattern))
                    || (s.TechnicalSkills != null && EF.Functions.ILike(s.TechnicalSkills, pattern))
                    || (s.Tools != null && EF.Functions.ILike(s.Tools, pattern))
                    || s.StudentSkills.Any(ss => EF.Functions.ILike(ss.Skill.Name, pattern)))
                .OrderBy(s => s.User.Name)
                .Take(limit)
                .ToListAsync();

            return rows.Select(s => new SearchHitDto
            {
                Id = s.UserId,
                Title = s.User?.Name ?? "Student",
                Subtitle = s.Major ?? "Student",
                AvatarBase64 = s.ProfilePictureBase64,
                RoleType = "student",
                Url = $"/students/{s.UserId}",
            }).ToList();
        }

        private async Task<List<SearchHitDto>> SearchDoctorsAsync(string pattern, int limit)
        {
            var rows = await _db.DoctorProfiles
                .AsNoTracking()
                .Include(d => d.User)
                .Where(d =>
                    EF.Functions.ILike(d.User.Name, pattern)
                    || EF.Functions.ILike(d.Department, pattern)
                    || (d.Specialization != null && EF.Functions.ILike(d.Specialization, pattern))
                    || (d.Faculty != null && EF.Functions.ILike(d.Faculty, pattern))
                    || (d.ResearchSkills != null && EF.Functions.ILike(d.ResearchSkills, pattern))
                    || (d.TechnicalSkills != null && EF.Functions.ILike(d.TechnicalSkills, pattern)))
                .OrderBy(d => d.User.Name)
                .Take(limit)
                .ToListAsync();

            return rows.Select(d => new SearchHitDto
            {
                Id = d.UserId,
                Title = d.User?.Name ?? "Doctor",
                Subtitle = !string.IsNullOrWhiteSpace(d.Department) ? d.Department : d.Specialization,
                AvatarBase64 = d.ProfilePictureBase64,
                RoleType = "doctor",
                Url = $"/doctors/{d.UserId}",
            }).ToList();
        }

        private async Task<List<SearchHitDto>> SearchCompaniesAsync(string pattern, int limit)
        {
            var rows = await _db.CompanyProfiles
                .AsNoTracking()
                .Where(c =>
                    EF.Functions.ILike(c.CompanyName, pattern)
                    || (c.Industry != null && EF.Functions.ILike(c.Industry, pattern))
                    || (c.Description != null && EF.Functions.ILike(c.Description, pattern))
                    || (c.AreasOfInterest != null && EF.Functions.ILike(c.AreasOfInterest, pattern)))
                .OrderBy(c => c.CompanyName)
                .Take(limit)
                .ToListAsync();

            return rows.Select(c => new SearchHitDto
            {
                Id = c.Id,
                Title = c.CompanyName,
                Subtitle = TruncateDescription(c.Description, c.Industry),
                RoleType = "company",
                Url = $"/browse-projects",
            }).ToList();
        }

        private async Task<List<SearchHitDto>> SearchAssociationsAsync(string pattern, int limit)
        {
            var rows = await _db.StudentAssociationProfiles
                .AsNoTracking()
                .Where(a =>
                    EF.Functions.ILike(a.AssociationName, pattern)
                    || EF.Functions.ILike(a.Username, pattern)
                    || (a.Description != null && EF.Functions.ILike(a.Description, pattern))
                    || (a.Faculty != null && EF.Functions.ILike(a.Faculty, pattern))
                    || (a.Category != null && EF.Functions.ILike(a.Category, pattern)))
                .OrderBy(a => a.AssociationName)
                .Take(limit)
                .ToListAsync();

            return rows.Select(a => new SearchHitDto
            {
                Id = a.Id,
                Title = a.AssociationName,
                Subtitle = a.Faculty ?? a.Category ?? "Student Association",
                AvatarUrl = a.LogoUrl,
                RoleType = "association",
                Url = $"/organizations/{a.Id}",
            }).ToList();
        }

        private async Task<List<SearchHitDto>> SearchProjectsAsync(string pattern, int limit)
        {
            var rows = await _db.StudentProjects
                .AsNoTracking()
                .Where(p =>
                    EF.Functions.ILike(p.Name, pattern)
                    || (p.Abstract != null && EF.Functions.ILike(p.Abstract, pattern))
                    || (p.RequiredSkills != null && EF.Functions.ILike(p.RequiredSkills, pattern)))
                .OrderByDescending(p => p.CreatedAt)
                .Take(limit)
                .ToListAsync();

            return rows.Select(p => new SearchHitDto
            {
                Id = p.Id,
                Title = p.Name,
                Subtitle = p.ProjectType,
                RoleType = "project",
                Url = "/browse-projects",
            }).ToList();
        }

        private async Task<List<SearchHitDto>> SearchProjectRequestsAsync(string pattern, int limit)
        {
            var rows = await _db.CompanyRequests
                .AsNoTracking()
                .Include(r => r.CompanyProfile)
                .Include(r => r.Roles).ThenInclude(role => role.Skills)
                .Where(r =>
                    r.Status == CompanyRequestStatus.Submitted
                    && r.RequestStatus == CompanyRequestLifecycleStatus.Active
                    && (EF.Functions.ILike(r.Title, pattern)
                        || EF.Functions.ILike(r.Description, pattern)
                        || EF.Functions.ILike(r.Category, pattern)
                        || r.Roles.Any(role =>
                            EF.Functions.ILike(role.RoleName, pattern)
                            || role.Skills.Any(sk => EF.Functions.ILike(sk.SkillName, pattern)))))
                .OrderByDescending(r => r.SubmittedAt ?? r.CreatedAt)
                .Take(limit)
                .ToListAsync();

            return rows.Select(r => new SearchHitDto
            {
                Id = r.Id,
                Title = r.Title,
                Subtitle = r.CompanyProfile?.CompanyName ?? r.Category,
                RoleType = "projectRequest",
                Url = "/browse-projects",
            }).ToList();
        }

        private async Task<List<SearchHitDto>> SearchRecruitmentCampaignsAsync(string pattern, int limit)
        {
            var rows = await _db.StudentOrganizationRecruitmentCampaigns
                .AsNoTracking()
                .Include(c => c.OrganizationProfile)
                .Where(c =>
                    c.IsPublished
                    && (EF.Functions.ILike(c.Title, pattern)
                        || EF.Functions.ILike(c.Description, pattern)))
                .OrderByDescending(c => c.CreatedAt)
                .Take(limit)
                .ToListAsync();

            return rows.Select(c => new SearchHitDto
            {
                Id = c.Id,
                OrganizationId = c.OrganizationProfileId,
                Title = c.Title,
                Subtitle = c.OrganizationProfile?.AssociationName ?? "Recruitment",
                AvatarUrl = c.OrganizationProfile?.LogoUrl,
                RoleType = "recruitment",
                Url = $"/association/recruitment/{c.Id}",
            }).ToList();
        }

        private async Task<List<SearchHitDto>> SearchEventsAsync(string pattern, int limit)
        {
            var rows = await _db.StudentOrganizationEvents
                .AsNoTracking()
                .Include(e => e.OrganizationProfile)
                .Where(e =>
                    EF.Functions.ILike(e.Title, pattern)
                    || EF.Functions.ILike(e.Description, pattern))
                .OrderByDescending(e => e.EventDate)
                .Take(limit)
                .ToListAsync();

            return rows.Select(e => new SearchHitDto
            {
                Id = e.Id,
                OrganizationId = e.OrganizationProfileId,
                Title = e.Title,
                Subtitle = e.OrganizationProfile?.AssociationName ?? e.EventType,
                AvatarUrl = e.OrganizationProfile?.LogoUrl,
                RoleType = "event",
                Url = $"/association/events/{e.Id}",
            }).ToList();
        }

        private async Task<List<SearchHitDto>> SearchOpportunitiesAsync(string pattern, int limit)
        {
            var rows = await _db.CompanyTalentRequests
                .AsNoTracking()
                .Include(t => t.CompanyProfile)
                .Where(t =>
                    EF.Functions.ILike(t.Title, pattern)
                    || EF.Functions.ILike(t.Description, pattern)
                    || (t.RequiredSkills != null && EF.Functions.ILike(t.RequiredSkills, pattern))
                    || (t.PreferredMajor != null && EF.Functions.ILike(t.PreferredMajor, pattern)))
                .OrderByDescending(t => t.CreatedAt)
                .Take(limit)
                .ToListAsync();

            return rows.Select(t => new SearchHitDto
            {
                Id = t.Id,
                Title = t.Title,
                Subtitle = t.CompanyProfile?.CompanyName ?? t.EngagementType ?? "Opportunity",
                RoleType = "opportunity",
                Url = "/browse-projects",
            }).ToList();
        }

        private static int ScoreStudentMatch(StudentProfile viewer, StudentProfile candidate, List<string> skillNames)
        {
            var score = 0;
            if (!string.IsNullOrWhiteSpace(viewer.Faculty)
                && string.Equals(viewer.Faculty.Trim(), candidate.Faculty?.Trim(), StringComparison.OrdinalIgnoreCase))
                score += 5;
            if (!string.IsNullOrWhiteSpace(viewer.Major)
                && string.Equals(viewer.Major.Trim(), candidate.Major?.Trim(), StringComparison.OrdinalIgnoreCase))
                score += 5;

            var skillText = string.Join(" ", candidate.TechnicalSkills, candidate.Roles, candidate.Tools)
                .ToLowerInvariant();
            foreach (var skill in skillNames)
            {
                if (!string.IsNullOrWhiteSpace(skill) && skillText.Contains(skill.ToLowerInvariant()))
                    score += 1;
            }

            return score;
        }

        private static int ScoreCompanyMatch(CompanyProfile company, StudentProfile student, List<string> skillNames)
        {
            var score = 0;
            var haystack = string.Join(
                " ",
                company.Industry,
                company.AreasOfInterest,
                company.Description).ToLowerInvariant();

            if (!string.IsNullOrWhiteSpace(student.Major)
                && haystack.Contains(student.Major.Trim().ToLowerInvariant()))
                score += 3;

            foreach (var skill in skillNames)
            {
                if (!string.IsNullOrWhiteSpace(skill) && haystack.Contains(skill.ToLowerInvariant()))
                    score += 2;
            }

            return score;
        }

        private async Task<List<string>> ResolveSkillNamesAsync(List<int> skillIds)
        {
            if (skillIds.Count == 0) return new List<string>();
            return await _db.Skills.AsNoTracking()
                .Where(s => skillIds.Contains(s.Id))
                .Select(s => s.Name)
                .ToListAsync();
        }

        private static string? TruncateDescription(string? description, string? fallback, int maxLen = 72)
        {
            var text = !string.IsNullOrWhiteSpace(description) ? description.Trim() : fallback?.Trim();
            if (string.IsNullOrWhiteSpace(text)) return fallback;
            if (text.Length <= maxLen) return text;
            return text[..maxLen].TrimEnd() + "…";
        }
    }
}
