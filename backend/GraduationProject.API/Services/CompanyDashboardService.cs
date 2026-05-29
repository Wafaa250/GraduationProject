using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using GraduationProject.API.Data;
using GraduationProject.API.DTOs;
using GraduationProject.API.Models;
using Microsoft.EntityFrameworkCore;

namespace GraduationProject.API.Services
{
    public class CompanyDashboardService : ICompanyDashboardService
    {
        private readonly ApplicationDbContext _db;

        public CompanyDashboardService(ApplicationDbContext db) => _db = db;

        public async Task<CompanyDashboardDto> GetDashboardAsync(int companyProfileId)
        {
            var profile = await _db.CompanyProfiles
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Id == companyProfileId);

            var activeRequestsQuery = _db.CompanyRequests
                .AsNoTracking()
                .Where(r =>
                    r.CompanyProfileId == companyProfileId &&
                    r.Status != CompanyRequestStatus.Draft &&
                    r.RequestStatus == CompanyRequestLifecycleStatus.Active);

            var activeRequestsCount = await activeRequestsQuery.CountAsync();

            var savedStudentsCount = await _db.CompanySavedStudentRecommendations
                .AsNoTracking()
                .CountAsync(s => s.CompanyProfileId == companyProfileId);

            var savedTeamsCount = await _db.CompanySavedTeamRecommendations
                .AsNoTracking()
                .CountAsync(t => t.CompanyProfileId == companyProfileId);

            var workspaceMembersCount = await _db.CompanyMembers
                .AsNoTracking()
                .CountAsync(m => m.CompanyProfileId == companyProfileId);

            var previewRequests = await activeRequestsQuery
                .Include(r => r.Roles)
                .OrderByDescending(r => r.CreatedAt)
                .Take(3)
                .ToListAsync();

            var previewRequestIds = previewRequests.Select(r => r.Id).ToList();

            var savedStudentCounts = previewRequestIds.Count == 0
                ? new Dictionary<int, int>()
                : await _db.CompanySavedStudentRecommendations
                    .AsNoTracking()
                    .Where(s =>
                        s.CompanyProfileId == companyProfileId &&
                        previewRequestIds.Contains(s.CompanyRequestId))
                    .GroupBy(s => s.CompanyRequestId)
                    .Select(g => new { RequestId = g.Key, Count = g.Count() })
                    .ToDictionaryAsync(x => x.RequestId, x => x.Count);

            var savedTeamCounts = previewRequestIds.Count == 0
                ? new Dictionary<int, int>()
                : await _db.CompanySavedTeamRecommendations
                    .AsNoTracking()
                    .Where(t =>
                        t.CompanyProfileId == companyProfileId &&
                        previewRequestIds.Contains(t.CompanyRequestId))
                    .GroupBy(t => t.CompanyRequestId)
                    .Select(g => new { RequestId = g.Key, Count = g.Count() })
                    .ToDictionaryAsync(x => x.RequestId, x => x.Count);

            var recentActivity = await _db.CompanyActivityLogs
                .AsNoTracking()
                .Include(a => a.User)
                .Where(a => a.CompanyProfileId == companyProfileId)
                .OrderByDescending(a => a.CreatedAt)
                .Take(15)
                .Select(a => new CompanyDashboardActivityItemDto
                {
                    Id = a.Id,
                    ActivityType = a.ActivityType,
                    Description = a.Description,
                    ActorName = a.User.Name,
                    CreatedAt = a.CreatedAt,
                })
                .ToListAsync();

            var recentSavedStudents = await _db.CompanySavedStudentRecommendations
                .AsNoTracking()
                .Include(s => s.StudentProfile).ThenInclude(p => p.User)
                .Where(s => s.CompanyProfileId == companyProfileId)
                .OrderByDescending(s => s.CreatedAt)
                .Take(6)
                .ToListAsync();

            var recentStudentRequestIds = recentSavedStudents
                .Select(s => s.CompanyRequestId)
                .Distinct()
                .ToList();

            var studentScoreLookup = await BuildStudentRecommendationLookupAsync(recentStudentRequestIds);

            var recentSavedTeams = await _db.CompanySavedTeamRecommendations
                .AsNoTracking()
                .Include(t => t.TeamRecommendation).ThenInclude(tr => tr.Members)
                .Where(t => t.CompanyProfileId == companyProfileId)
                .OrderByDescending(t => t.CreatedAt)
                .Take(4)
                .ToListAsync();

            return new CompanyDashboardDto
            {
                CompanyName = profile?.CompanyName ?? "Your company",
                ActiveRequests = activeRequestsCount,
                SavedStudents = savedStudentsCount,
                SavedTeams = savedTeamsCount,
                WorkspaceMembers = workspaceMembersCount,
                ActiveRequestsPreview = previewRequests.Select(r => new CompanyDashboardRequestPreviewDto
                {
                    Id = r.Id,
                    Title = string.IsNullOrWhiteSpace(r.Title) ? "Untitled project request" : r.Title.Trim(),
                    RequestedRole = FormatRequestedRole(r.Roles),
                    Status = r.RequestStatus,
                    SavedStudentsCount = savedStudentCounts.GetValueOrDefault(r.Id),
                    SavedTeamsCount = savedTeamCounts.GetValueOrDefault(r.Id),
                    CreatedAt = r.CreatedAt,
                }).ToList(),
                RecentActivity = recentActivity,
                RecentSavedStudents = recentSavedStudents.Select(s =>
                {
                    studentScoreLookup.TryGetValue(
                        (s.CompanyRequestId, s.StudentProfileId),
                        out var recommendation);

                    var student = s.StudentProfile;
                    return new CompanyDashboardSavedStudentDto
                    {
                        CompanyRequestId = s.CompanyRequestId,
                        StudentProfileId = s.StudentProfileId,
                        StudentName = student.User?.Name ?? "Student",
                        University = student.University,
                        Major = student.Major ?? student.Faculty,
                        MatchScore = recommendation?.Score,
                        SavedAt = s.CreatedAt,
                    };
                }).ToList(),
                RecentSavedTeams = recentSavedTeams.Select(t =>
                {
                    var team = t.TeamRecommendation;
                    var rank = team?.TeamRank ?? 0;
                    return new CompanyDashboardSavedTeamDto
                    {
                        CompanyRequestId = t.CompanyRequestId,
                        TeamRecommendationId = t.TeamRecommendationId,
                        TeamName = rank > 0 ? $"Team #{rank}" : "Saved team",
                        MatchScore = team?.TotalScore ?? 0,
                        MemberCount = team?.Members?.Count ?? 0,
                        SavedAt = t.CreatedAt,
                    };
                }).ToList(),
            };
        }

        private static string FormatRequestedRole(IEnumerable<CompanyRequestRole> roles)
        {
            var names = roles
                .Select(r => r.RoleName?.Trim())
                .Where(n => !string.IsNullOrWhiteSpace(n))
                .Distinct()
                .ToList();

            return names.Count == 0 ? "—" : string.Join(" · ", names);
        }

        private async Task<Dictionary<(int RequestId, int StudentProfileId), CompanyRequestRecommendation>> BuildStudentRecommendationLookupAsync(
            List<int> requestIds)
        {
            if (requestIds.Count == 0)
                return new Dictionary<(int, int), CompanyRequestRecommendation>();

            var runs = await _db.CompanyRequestRecommendationRuns
                .AsNoTracking()
                .Where(r =>
                    requestIds.Contains(r.CompanyRequestId) &&
                    r.Status == CompanyRequestRecommendationRunStatus.Completed)
                .OrderByDescending(r => r.GeneratedAt)
                .ThenByDescending(r => r.Id)
                .ToListAsync();

            var latestRunIds = runs
                .GroupBy(r => r.CompanyRequestId)
                .Select(g => g.First().Id)
                .ToList();

            if (latestRunIds.Count == 0)
                return new Dictionary<(int, int), CompanyRequestRecommendation>();

            var recommendations = await _db.CompanyRequestRecommendations
                .AsNoTracking()
                .Where(r => latestRunIds.Contains(r.RunId))
                .ToListAsync();

            return recommendations.ToDictionary(
                r => (r.CompanyRequestId, r.StudentProfileId),
                r => r);
        }
    }
}
