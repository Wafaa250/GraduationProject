using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using GraduationProject.API.Data;
using GraduationProject.API.DTOs;
using GraduationProject.API.Helpers;
using GraduationProject.API.Models;
using GraduationProject.API.Services.Recommendations;
using Microsoft.EntityFrameworkCore;

namespace GraduationProject.API.Services
{
    public class CompanySavedRecommendationService : ICompanySavedRecommendationService
    {
        private readonly ApplicationDbContext _db;
        private readonly ICompanyActivityService _activity;
        private readonly IGraduationProjectNotificationService _notifications;

        public CompanySavedRecommendationService(
            ApplicationDbContext db,
            ICompanyActivityService activity,
            IGraduationProjectNotificationService notifications)
        {
            _db = db;
            _activity = activity;
            _notifications = notifications;
        }

        public async Task<CompanySavedRecommendationsPageDto> ListAllAsync(int companyProfileId)
        {
            var students = await _db.CompanySavedStudentRecommendations
                .AsNoTracking()
                .Include(s => s.CompanyRequest)
                .Include(s => s.StudentProfile).ThenInclude(p => p.User)
                .Include(s => s.SavedByUser)
                .Where(s => s.CompanyProfileId == companyProfileId)
                .OrderByDescending(s => s.CreatedAt)
                .ToListAsync();

            var teams = await _db.CompanySavedTeamRecommendations
                .AsNoTracking()
                .Include(t => t.CompanyRequest)
                .Include(t => t.TeamRecommendation)
                    .ThenInclude(tr => tr.Members)
                    .ThenInclude(m => m.StudentProfile)
                    .ThenInclude(s => s.User)
                .Include(t => t.SavedByUser)
                .Where(t => t.CompanyProfileId == companyProfileId)
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();

            var requestIds = students.Select(s => s.CompanyRequestId)
                .Concat(teams.Select(t => t.CompanyRequestId))
                .Distinct()
                .ToList();

            var recommendationLookup = await BuildStudentRecommendationLookupAsync(requestIds);

            return new CompanySavedRecommendationsPageDto
            {
                Students = students.Select(s => MapSavedStudent(s, recommendationLookup)).ToList(),
                Teams = teams.Select(MapSavedTeam).ToList(),
            };
        }

        public async Task<CompanySavedRecommendationIdsDto> GetSavedIdsForRequestAsync(
            int companyProfileId,
            int requestId)
        {
            if (!await RequestBelongsToCompanyAsync(companyProfileId, requestId))
            {
                return new CompanySavedRecommendationIdsDto();
            }

            var studentIds = await _db.CompanySavedStudentRecommendations
                .AsNoTracking()
                .Where(s => s.CompanyProfileId == companyProfileId && s.CompanyRequestId == requestId)
                .Select(s => s.StudentProfileId)
                .ToListAsync();

            var teamIds = await _db.CompanySavedTeamRecommendations
                .AsNoTracking()
                .Where(s => s.CompanyProfileId == companyProfileId && s.CompanyRequestId == requestId)
                .Select(s => s.TeamRecommendationId)
                .ToListAsync();

            return new CompanySavedRecommendationIdsDto
            {
                StudentProfileIds = studentIds,
                TeamRecommendationIds = teamIds,
            };
        }

        public async Task<(bool saved, string? error)> SaveStudentAsync(
            int companyProfileId,
            int requestId,
            int studentProfileId,
            int savedByUserId)
        {
            if (!await RequestBelongsToCompanyAsync(companyProfileId, requestId))
                return (false, "Request not found.");

            if (await IsRequestModificationBlockedAsync(companyProfileId, requestId))
            {
                var paused = await IsRequestPausedAsync(companyProfileId, requestId);
                return (false, paused ? "This request is paused." : "This request has been closed.");
            }

            var studentExists = await _db.StudentProfiles
                .AsNoTracking()
                .AnyAsync(s => s.Id == studentProfileId);
            if (!studentExists)
                return (false, "Student profile not found.");

            var existing = await _db.CompanySavedStudentRecommendations
                .FirstOrDefaultAsync(s =>
                    s.CompanyProfileId == companyProfileId &&
                    s.CompanyRequestId == requestId &&
                    s.StudentProfileId == studentProfileId);

            if (existing != null)
                return (true, null);

            _db.CompanySavedStudentRecommendations.Add(new CompanySavedStudentRecommendation
            {
                CompanyProfileId = companyProfileId,
                CompanyRequestId = requestId,
                StudentProfileId = studentProfileId,
                SavedByUserId = savedByUserId,
                CreatedAt = DateTime.UtcNow,
            });
            await _db.SaveChangesAsync();

            var actor = await _db.Users.AsNoTracking()
                .Where(u => u.Id == savedByUserId)
                .Select(u => u.Name)
                .FirstOrDefaultAsync() ?? "A team member";
            var studentName = await _db.StudentProfiles
                .AsNoTracking()
                .Where(s => s.Id == studentProfileId)
                .Select(s => s.User!.Name)
                .FirstOrDefaultAsync() ?? "a candidate";

            await _activity.LogAsync(
                companyProfileId,
                savedByUserId,
                CompanyActivityTypes.StudentSaved,
                $"{actor} saved {studentName}");

            var request = await _db.CompanyRequests
                .AsNoTracking()
                .Include(r => r.Roles)
                .FirstOrDefaultAsync(r => r.Id == requestId && r.CompanyProfileId == companyProfileId);

            if (request != null)
            {
                await _notifications.NotifyCompanyStudentRecommendationSavedAsync(
                    companyProfileId,
                    requestId,
                    CompanyRequestMapper.BuildActivitySubject(request),
                    actor,
                    studentName,
                    savedByUserId);
            }

            return (true, null);
        }

        public async Task<(bool removed, string? error)> UnsaveStudentAsync(
            int companyProfileId,
            int requestId,
            int studentProfileId)
        {
            var row = await _db.CompanySavedStudentRecommendations
                .FirstOrDefaultAsync(s =>
                    s.CompanyProfileId == companyProfileId &&
                    s.CompanyRequestId == requestId &&
                    s.StudentProfileId == studentProfileId);

            if (row == null)
                return (false, "Saved recommendation not found.");

            _db.CompanySavedStudentRecommendations.Remove(row);
            await _db.SaveChangesAsync();
            return (true, null);
        }

        public async Task<(bool saved, string? error)> SaveTeamAsync(
            int companyProfileId,
            int requestId,
            int teamRecommendationId,
            int savedByUserId)
        {
            if (!await RequestBelongsToCompanyAsync(companyProfileId, requestId))
                return (false, "Request not found.");

            if (await IsRequestModificationBlockedAsync(companyProfileId, requestId))
            {
                var paused = await IsRequestPausedAsync(companyProfileId, requestId);
                return (false, paused ? "This request is paused." : "This request has been closed.");
            }

            var teamExists = await _db.CompanyRequestTeamRecommendations
                .AsNoTracking()
                .AnyAsync(t =>
                    t.Id == teamRecommendationId &&
                    t.CompanyRequestId == requestId);

            if (!teamExists)
                return (false, "Team recommendation not found for this request.");

            var existing = await _db.CompanySavedTeamRecommendations
                .FirstOrDefaultAsync(s =>
                    s.CompanyProfileId == companyProfileId &&
                    s.CompanyRequestId == requestId &&
                    s.TeamRecommendationId == teamRecommendationId);

            if (existing != null)
                return (true, null);

            _db.CompanySavedTeamRecommendations.Add(new CompanySavedTeamRecommendation
            {
                CompanyProfileId = companyProfileId,
                CompanyRequestId = requestId,
                TeamRecommendationId = teamRecommendationId,
                SavedByUserId = savedByUserId,
                CreatedAt = DateTime.UtcNow,
            });
            await _db.SaveChangesAsync();

            var actor = await _db.Users.AsNoTracking()
                .Where(u => u.Id == savedByUserId)
                .Select(u => u.Name)
                .FirstOrDefaultAsync() ?? "A team member";
            var teamRank = await _db.CompanyRequestTeamRecommendations
                .AsNoTracking()
                .Where(t => t.Id == teamRecommendationId)
                .Select(t => t.TeamRank)
                .FirstOrDefaultAsync();

            await _activity.LogAsync(
                companyProfileId,
                savedByUserId,
                CompanyActivityTypes.TeamSaved,
                $"{actor} saved Team #{teamRank}");

            var request = await _db.CompanyRequests
                .AsNoTracking()
                .Include(r => r.Roles)
                .FirstOrDefaultAsync(r => r.Id == requestId && r.CompanyProfileId == companyProfileId);

            if (request != null)
            {
                await _notifications.NotifyCompanyTeamRecommendationSavedAsync(
                    companyProfileId,
                    requestId,
                    CompanyRequestMapper.BuildActivitySubject(request),
                    actor,
                    teamRank,
                    savedByUserId);
            }

            return (true, null);
        }

        public async Task<(bool removed, string? error)> UnsaveTeamAsync(
            int companyProfileId,
            int requestId,
            int teamRecommendationId)
        {
            var row = await _db.CompanySavedTeamRecommendations
                .FirstOrDefaultAsync(s =>
                    s.CompanyProfileId == companyProfileId &&
                    s.CompanyRequestId == requestId &&
                    s.TeamRecommendationId == teamRecommendationId);

            if (row == null)
                return (false, "Saved team not found.");

            _db.CompanySavedTeamRecommendations.Remove(row);
            await _db.SaveChangesAsync();
            return (true, null);
        }

        public async Task<(bool updated, string? error)> UpdateStudentNoteAsync(
            int companyProfileId,
            int requestId,
            int studentProfileId,
            string? note,
            int? actingUserId = null)
        {
            var row = await _db.CompanySavedStudentRecommendations
                .FirstOrDefaultAsync(s =>
                    s.CompanyProfileId == companyProfileId &&
                    s.CompanyRequestId == requestId &&
                    s.StudentProfileId == studentProfileId);

            if (row == null)
                return (false, "Saved recommendation not found.");

            row.Note = string.IsNullOrWhiteSpace(note) ? null : note.Trim();
            await _db.SaveChangesAsync();

            if (actingUserId.HasValue && !string.IsNullOrWhiteSpace(row.Note))
            {
                var actor = await _db.Users.AsNoTracking()
                    .Where(u => u.Id == actingUserId.Value)
                    .Select(u => u.Name)
                    .FirstOrDefaultAsync() ?? "A team member";

                await _activity.LogAsync(
                    companyProfileId,
                    actingUserId.Value,
                    CompanyActivityTypes.NoteAdded,
                    $"{actor} added a note");
            }

            return (true, null);
        }

        public async Task<(bool updated, string? error)> UpdateTeamNoteAsync(
            int companyProfileId,
            int requestId,
            int teamRecommendationId,
            string? note,
            int? actingUserId = null)
        {
            var row = await _db.CompanySavedTeamRecommendations
                .FirstOrDefaultAsync(s =>
                    s.CompanyProfileId == companyProfileId &&
                    s.CompanyRequestId == requestId &&
                    s.TeamRecommendationId == teamRecommendationId);

            if (row == null)
                return (false, "Saved team not found.");

            row.Note = string.IsNullOrWhiteSpace(note) ? null : note.Trim();
            await _db.SaveChangesAsync();

            if (actingUserId.HasValue && !string.IsNullOrWhiteSpace(row.Note))
            {
                var actor = await _db.Users.AsNoTracking()
                    .Where(u => u.Id == actingUserId.Value)
                    .Select(u => u.Name)
                    .FirstOrDefaultAsync() ?? "A team member";

                await _activity.LogAsync(
                    companyProfileId,
                    actingUserId.Value,
                    CompanyActivityTypes.NoteAdded,
                    $"{actor} added a note");
            }

            return (true, null);
        }

        private async Task<bool> RequestBelongsToCompanyAsync(int companyProfileId, int requestId) =>
            await _db.CompanyRequests
                .AsNoTracking()
                .AnyAsync(r => r.Id == requestId && r.CompanyProfileId == companyProfileId);

        private async Task<bool> IsRequestModificationBlockedAsync(int companyProfileId, int requestId) =>
            await _db.CompanyRequests
                .AsNoTracking()
                .AnyAsync(r =>
                    r.Id == requestId &&
                    r.CompanyProfileId == companyProfileId &&
                    (r.RequestStatus == CompanyRequestLifecycleStatus.Paused ||
                     r.RequestStatus == CompanyRequestLifecycleStatus.Closed));

        private async Task<bool> IsRequestPausedAsync(int companyProfileId, int requestId) =>
            await _db.CompanyRequests
                .AsNoTracking()
                .AnyAsync(r =>
                    r.Id == requestId &&
                    r.CompanyProfileId == companyProfileId &&
                    r.RequestStatus == CompanyRequestLifecycleStatus.Paused);

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

        private static CompanySavedStudentRecommendationDto MapSavedStudent(
            CompanySavedStudentRecommendation saved,
            Dictionary<(int RequestId, int StudentProfileId), CompanyRequestRecommendation> recommendationLookup)
        {
            var student = saved.StudentProfile;
            var contact = StudentDiscoveryContactMapper.Map(student);
            recommendationLookup.TryGetValue(
                (saved.CompanyRequestId, saved.StudentProfileId),
                out var recommendation);

            return new CompanySavedStudentRecommendationDto
            {
                Id = saved.Id,
                CompanyRequestId = saved.CompanyRequestId,
                RequestTitle = saved.CompanyRequest?.Title ?? "Project request",
                StudentProfileId = saved.StudentProfileId,
                StudentName = student.User?.Name ?? "Student",
                Major = student.Major ?? student.Faculty,
                University = student.University,
                AcademicYear = student.AcademicYear,
                MatchScore = recommendation?.Score,
                ReasonSummary = recommendation?.ReasonSummary,
                Highlights = recommendation == null
                    ? new List<string>()
                    : SkillHelper.ParseStringList(recommendation.HighlightsJson),
                Email = contact.Email,
                Linkedin = contact.Linkedin,
                Github = contact.Github,
                Portfolio = contact.Portfolio,
                SavedByName = saved.SavedByUser?.Name ?? "Team member",
                SavedAt = saved.CreatedAt,
                Note = saved.Note,
            };
        }

        private static CompanySavedTeamRecommendationDto MapSavedTeam(CompanySavedTeamRecommendation saved)
        {
            var team = saved.TeamRecommendation;
            return new CompanySavedTeamRecommendationDto
            {
                Id = saved.Id,
                CompanyRequestId = saved.CompanyRequestId,
                RequestTitle = saved.CompanyRequest?.Title ?? "Project request",
                TeamRecommendationId = saved.TeamRecommendationId,
                TeamRank = team?.TeamRank ?? 0,
                TotalScore = team?.TotalScore ?? 0,
                RoleCoverageScore = team?.RoleCoverageScore ?? 0,
                CompatibilityScore = team?.CompatibilityScore ?? 0,
                MemberCount = team?.Members?.Count ?? 0,
                SummaryReason = team?.SummaryReason ?? string.Empty,
                MemberNames = team?.Members?
                    .OrderBy(m => m.CompanyRequestRoleId)
                    .Select(m => m.StudentProfile?.User?.Name ?? string.Empty)
                    .Where(n => !string.IsNullOrWhiteSpace(n))
                    .ToList() ?? new List<string>(),
                SavedByName = saved.SavedByUser?.Name ?? "Team member",
                SavedAt = saved.CreatedAt,
                Note = saved.Note,
            };
        }
    }
}
