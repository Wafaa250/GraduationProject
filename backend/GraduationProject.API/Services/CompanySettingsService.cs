using System;
using System.Linq;
using System.Threading.Tasks;
using GraduationProject.API.Data;
using GraduationProject.API.DTOs;
using GraduationProject.API.Models;
using Microsoft.EntityFrameworkCore;

namespace GraduationProject.API.Services
{
    public class CompanySettingsService : ICompanySettingsService
    {
        private readonly ApplicationDbContext _db;

        public CompanySettingsService(ApplicationDbContext db) => _db = db;

        public async Task<CompanySettingsDto> GetSettingsAsync(int companyProfileId, int userId)
        {
            var ownerName = await _db.CompanyMembers
                .AsNoTracking()
                .Include(m => m.User)
                .Where(m =>
                    m.CompanyProfileId == companyProfileId &&
                    m.Role == CompanyMemberRoles.Owner)
                .Select(m => m.User.Name)
                .FirstOrDefaultAsync() ?? "—";

            var membersCount = await _db.CompanyMembers
                .AsNoTracking()
                .CountAsync(m => m.CompanyProfileId == companyProfileId);

            var activeRequestsCount = await _db.CompanyRequests
                .AsNoTracking()
                .CountAsync(r =>
                    r.CompanyProfileId == companyProfileId &&
                    r.Status != CompanyRequestStatus.Draft &&
                    r.RequestStatus == CompanyRequestLifecycleStatus.Active);

            var preferences = await _db.CompanyMemberNotificationPreferences
                .AsNoTracking()
                .FirstOrDefaultAsync(p =>
                    p.CompanyProfileId == companyProfileId &&
                    p.UserId == userId);

            return new CompanySettingsDto
            {
                Notifications = MapPreferences(preferences),
                Workspace = new CompanyWorkspaceSummaryDto
                {
                    OwnerName = ownerName,
                    MembersCount = membersCount,
                    ActiveRequestsCount = activeRequestsCount,
                },
            };
        }

        public async Task<CompanyNotificationPreferencesDto> UpdateNotificationsAsync(
            int companyProfileId,
            int userId,
            UpdateCompanyNotificationPreferencesDto dto)
        {
            var row = await _db.CompanyMemberNotificationPreferences
                .FirstOrDefaultAsync(p =>
                    p.CompanyProfileId == companyProfileId &&
                    p.UserId == userId);

            if (row == null)
            {
                row = new CompanyMemberNotificationPreference
                {
                    CompanyProfileId = companyProfileId,
                    UserId = userId,
                };
                _db.CompanyMemberNotificationPreferences.Add(row);
            }

            row.NotifyAiRecommendations = dto.NotifyAiRecommendations;
            row.NotifySavedRecommendations = dto.NotifySavedRecommendationsActivity;
            row.NotifyRequestStatusUpdates = dto.NotifyRequestStatusUpdates;
            row.NotifyWorkspaceMemberChanges = dto.NotifyWorkspaceMemberChanges;
            row.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();
            return MapPreferences(row);
        }

        private static CompanyNotificationPreferencesDto MapPreferences(
            CompanyMemberNotificationPreference? preferences) =>
            new()
            {
                NotifyAiRecommendations = preferences?.NotifyAiRecommendations ?? true,
                NotifySavedRecommendationsActivity = preferences?.NotifySavedRecommendations ?? true,
                NotifyRequestStatusUpdates = preferences?.NotifyRequestStatusUpdates ?? true,
                NotifyWorkspaceMemberChanges = preferences?.NotifyWorkspaceMemberChanges ?? true,
            };
    }
}
