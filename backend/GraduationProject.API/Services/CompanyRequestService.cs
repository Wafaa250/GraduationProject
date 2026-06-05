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
    public class CompanyRequestService : ICompanyRequestService
    {
        private readonly ApplicationDbContext _db;
        private readonly ICompanyActivityService _activity;
        private readonly IGraduationProjectNotificationService _notifications;

        public CompanyRequestService(
            ApplicationDbContext db,
            ICompanyActivityService activity,
            IGraduationProjectNotificationService notifications)
        {
            _db = db;
            _activity = activity;
            _notifications = notifications;
        }

        public async Task<CompanyRequestDetailDto?> GetDraftAsync(int companyProfileId)
        {
            var entity = await LoadRequestQuery()
                .FirstOrDefaultAsync(r =>
                    r.CompanyProfileId == companyProfileId &&
                    r.Status == CompanyRequestStatus.Draft);

            return entity == null ? null : CompanyRequestMapper.ToDetailDto(entity);
        }

        public async Task<CompanyRequestDetailDto> SaveDraftAsync(
            int companyProfileId,
            SaveCompanyRequestDraftDto dto,
            int? actingUserId = null)
        {
            var entity = await _db.CompanyRequests
                .Include(r => r.Roles)
                .ThenInclude(role => role.Skills)
                .FirstOrDefaultAsync(r =>
                    r.CompanyProfileId == companyProfileId &&
                    r.Status == CompanyRequestStatus.Draft);

            if (entity == null)
            {
                entity = new CompanyRequest
                {
                    CompanyProfileId = companyProfileId,
                    Status = CompanyRequestStatus.Draft,
                    CreatedAt = DateTime.UtcNow,
                    CreatedByUserId = actingUserId,
                };
                _db.CompanyRequests.Add(entity);
            }

            CompanyRequestMapper.ApplyDraftFields(entity, dto);
            var roleDrafts = CompanyRequestMapper.NormalizeRoles(
                dto.RequestType,
                dto.TargetRole,
                dto.RequiredSkills,
                dto.Roles);
            CompanyRequestMapper.ReplaceRoles(entity, roleDrafts);
            entity.UpdatedAt = DateTime.UtcNow;
            entity.UpdatedByUserId = actingUserId;

            await _db.SaveChangesAsync();
            return CompanyRequestMapper.ToDetailDto(await RequireLoadedAsync(entity.Id));
        }

        public async Task DeleteDraftAsync(int companyProfileId)
        {
            var entity = await _db.CompanyRequests
                .FirstOrDefaultAsync(r =>
                    r.CompanyProfileId == companyProfileId &&
                    r.Status == CompanyRequestStatus.Draft);

            if (entity == null) return;

            _db.CompanyRequests.Remove(entity);
            await _db.SaveChangesAsync();
        }

        public async Task<CompanyRequestDetailDto> SubmitAsync(
            int companyProfileId,
            CreateCompanyRequestDto dto,
            int? actingUserId = null)
        {
            ValidateSubmit(dto);

            var entity = await _db.CompanyRequests
                .Include(r => r.Roles)
                .ThenInclude(role => role.Skills)
                .FirstOrDefaultAsync(r =>
                    r.CompanyProfileId == companyProfileId &&
                    r.Status == CompanyRequestStatus.Draft);

            if (entity == null)
            {
                entity = new CompanyRequest
                {
                    CompanyProfileId = companyProfileId,
                    CreatedAt = DateTime.UtcNow,
                    CreatedByUserId = actingUserId,
                };
                _db.CompanyRequests.Add(entity);
            }
            else if (entity.CreatedByUserId == null && actingUserId.HasValue)
            {
                entity.CreatedByUserId = actingUserId;
            }

            CompanyRequestMapper.ApplyDraftFields(entity, dto);
            var roleDrafts = CompanyRequestMapper.NormalizeRoles(
                dto.RequestType,
                dto.TargetRole,
                dto.RequiredSkills,
                dto.Roles);
            ValidateRolesForSubmit(dto.RequestType, roleDrafts);

            CompanyRequestMapper.ReplaceRoles(entity, roleDrafts);

            entity.Status = CompanyRequestStatus.Submitted;
            entity.RequestStatus = CompanyRequestLifecycleStatus.Active;
            entity.IsPublishedToHub = false;
            entity.PublishedToHubAt = null;
            entity.WizardStep = null;
            entity.SubmittedAt = DateTime.UtcNow;
            entity.UpdatedAt = DateTime.UtcNow;
            entity.UpdatedByUserId = actingUserId;

            await _db.SaveChangesAsync();

            if (actingUserId.HasValue)
            {
                var actor = await _db.Users.AsNoTracking()
                    .Where(u => u.Id == actingUserId.Value)
                    .Select(u => u.Name)
                    .FirstOrDefaultAsync() ?? "A team member";

                var title = string.IsNullOrWhiteSpace(entity.Title)
                    ? "a project"
                    : entity.Title.Trim();
                var roleLabel = roleDrafts.FirstOrDefault()?.RoleName?.Trim();
                var subject = string.IsNullOrWhiteSpace(roleLabel) ? title : roleLabel;

                await _activity.LogAsync(
                    companyProfileId,
                    actingUserId.Value,
                    CompanyActivityTypes.RequestCreated,
                    $"{actor} created {subject} request");
            }

            return CompanyRequestMapper.ToDetailDto(await RequireLoadedAsync(entity.Id));
        }

        public async Task<IReadOnlyList<CompanyRequestSummaryDto>> ListAsync(
            int companyProfileId,
            bool includeDraft = false)
        {
            var query = _db.CompanyRequests
                .AsNoTracking()
                .Include(r => r.Roles)
                .ThenInclude(role => role.Skills)
                .Where(r => r.CompanyProfileId == companyProfileId);

            if (!includeDraft)
                query = query.Where(r => r.Status != CompanyRequestStatus.Draft);

            var rows = await query
                .OrderByDescending(r => r.SubmittedAt ?? r.UpdatedAt)
                .ToListAsync();

            return rows.Select(CompanyRequestMapper.ToSummaryDto).ToList();
        }

        public async Task<CompanyRequestDetailDto?> GetByIdAsync(int companyProfileId, int requestId)
        {
            var entity = await LoadRequestQuery()
                .AsNoTracking()
                .FirstOrDefaultAsync(r =>
                    r.Id == requestId && r.CompanyProfileId == companyProfileId);

            return entity == null ? null : CompanyRequestMapper.ToDetailDto(entity);
        }

        public async Task<CompanyRequestDetailDto?> UpdateStatusAsync(
            int companyProfileId,
            int requestId,
            string status,
            int? actingUserId = null)
        {
            var normalized = NormalizeLifecycleStatus(status);
            if (normalized == null)
                return null;

            var entity = await _db.CompanyRequests
                .Include(r => r.Roles)
                .FirstOrDefaultAsync(r =>
                    r.Id == requestId && r.CompanyProfileId == companyProfileId);

            if (entity == null) return null;
            if (entity.Status == CompanyRequestStatus.Draft)
                return null;
            if (entity.RequestStatus == CompanyRequestLifecycleStatus.Closed)
                return null;
            if (entity.RequestStatus == normalized)
            {
                return CompanyRequestMapper.ToDetailDto(await RequireLoadedAsync(entity.Id));
            }

            var previous = entity.RequestStatus;
            entity.RequestStatus = normalized;
            if (normalized == CompanyRequestLifecycleStatus.Closed)
            {
                entity.IsPublishedToHub = false;
                entity.PublishedToHubAt = null;
            }
            entity.UpdatedAt = DateTime.UtcNow;
            entity.UpdatedByUserId = actingUserId;

            await _db.SaveChangesAsync();

            if (actingUserId.HasValue)
            {
                var actor = await _db.Users.AsNoTracking()
                    .Where(u => u.Id == actingUserId.Value)
                    .Select(u => u.Name)
                    .FirstOrDefaultAsync() ?? "A team member";
                var subject = CompanyRequestMapper.BuildActivitySubject(entity);
                var activityType = normalized switch
                {
                    CompanyRequestLifecycleStatus.Paused => CompanyActivityTypes.RequestPaused,
                    CompanyRequestLifecycleStatus.Closed => CompanyActivityTypes.RequestClosed,
                    CompanyRequestLifecycleStatus.Active when previous == CompanyRequestLifecycleStatus.Paused
                        => CompanyActivityTypes.RequestReactivated,
                    _ => null,
                };
                var description = normalized switch
                {
                    CompanyRequestLifecycleStatus.Paused => $"{actor} paused {subject} request",
                    CompanyRequestLifecycleStatus.Closed => $"{actor} closed {subject} request",
                    CompanyRequestLifecycleStatus.Active when previous == CompanyRequestLifecycleStatus.Paused
                        => $"{actor} reactivated {subject} request",
                    _ => null,
                };

                if (activityType != null && description != null)
                {
                    await _activity.LogAsync(
                        companyProfileId,
                        actingUserId.Value,
                        activityType,
                        description);

                    await _notifications.NotifyCompanyRequestStatusChangedAsync(
                        companyProfileId,
                        requestId,
                        subject,
                        normalized,
                        actingUserId);
                }
            }

            return CompanyRequestMapper.ToDetailDto(await RequireLoadedAsync(entity.Id));
        }

        public async Task<CompanyRequestDetailDto?> UpdateAsync(
            int companyProfileId,
            int requestId,
            CreateCompanyRequestDto dto,
            int? actingUserId = null)
        {
            ValidateSubmit(dto);

            var entity = await _db.CompanyRequests
                .Include(r => r.Roles)
                .ThenInclude(role => role.Skills)
                .FirstOrDefaultAsync(r =>
                    r.Id == requestId && r.CompanyProfileId == companyProfileId);

            if (entity == null) return null;

            if (entity.Status == CompanyRequestStatus.Draft)
                throw new ArgumentException("Use draft endpoints to update a draft request.");

            if (!IsEditableStatus(entity.Status, entity.RequestStatus))
                return null;

            CompanyRequestMapper.ApplyDraftFields(entity, dto);
            var roleDrafts = CompanyRequestMapper.NormalizeRoles(
                dto.RequestType,
                dto.TargetRole,
                dto.RequiredSkills,
                dto.Roles);
            ValidateRolesForSubmit(dto.RequestType, roleDrafts);
            CompanyRequestMapper.ReplaceRoles(entity, roleDrafts);
            entity.WizardStep = null;
            entity.UpdatedAt = DateTime.UtcNow;
            entity.UpdatedByUserId = actingUserId;

            await _db.SaveChangesAsync();
            return CompanyRequestMapper.ToDetailDto(await RequireLoadedAsync(entity.Id));
        }

        public async Task<CompanyRequestDetailDto?> PublishToHubAsync(
            int companyProfileId,
            int requestId,
            int? actingUserId = null)
        {
            var entity = await _db.CompanyRequests
                .FirstOrDefaultAsync(r =>
                    r.Id == requestId && r.CompanyProfileId == companyProfileId);

            if (entity == null || !CompanyRequestHubVisibility.CanPublishToHub(entity))
                return null;

            entity.IsPublishedToHub = true;
            entity.PublishedToHubAt = DateTime.UtcNow;
            entity.UpdatedAt = DateTime.UtcNow;
            entity.UpdatedByUserId = actingUserId;

            await _db.SaveChangesAsync();

            if (actingUserId.HasValue)
            {
                var actor = await _db.Users.AsNoTracking()
                    .Where(u => u.Id == actingUserId.Value)
                    .Select(u => u.Name)
                    .FirstOrDefaultAsync() ?? "A team member";
                var subject = CompanyRequestMapper.BuildActivitySubject(entity);
                await _activity.LogAsync(
                    companyProfileId,
                    actingUserId.Value,
                    CompanyActivityTypes.RequestPublished,
                    $"{actor} published {subject} to the Communication Hub");
            }

            return CompanyRequestMapper.ToDetailDto(await RequireLoadedAsync(entity.Id));
        }

        public async Task<CompanyRequestDetailDto?> UnpublishFromHubAsync(
            int companyProfileId,
            int requestId,
            int? actingUserId = null)
        {
            var entity = await _db.CompanyRequests
                .FirstOrDefaultAsync(r =>
                    r.Id == requestId && r.CompanyProfileId == companyProfileId);

            if (entity == null || !CompanyRequestHubVisibility.CanUnpublishFromHub(entity))
                return null;

            entity.IsPublishedToHub = false;
            entity.PublishedToHubAt = null;
            entity.UpdatedAt = DateTime.UtcNow;
            entity.UpdatedByUserId = actingUserId;

            await _db.SaveChangesAsync();

            if (actingUserId.HasValue)
            {
                var actor = await _db.Users.AsNoTracking()
                    .Where(u => u.Id == actingUserId.Value)
                    .Select(u => u.Name)
                    .FirstOrDefaultAsync() ?? "A team member";
                var subject = CompanyRequestMapper.BuildActivitySubject(entity);
                await _activity.LogAsync(
                    companyProfileId,
                    actingUserId.Value,
                    CompanyActivityTypes.RequestUnpublished,
                    $"{actor} removed {subject} from the Communication Hub");
            }

            return CompanyRequestMapper.ToDetailDto(await RequireLoadedAsync(entity.Id));
        }

        public async Task<bool> DeleteAsync(int companyProfileId, int requestId)
        {
            var entity = await _db.CompanyRequests
                .FirstOrDefaultAsync(r =>
                    r.Id == requestId && r.CompanyProfileId == companyProfileId);

            if (entity == null) return false;

            if (entity.Status == CompanyRequestStatus.Draft)
                return false;

            _db.CompanyRequests.Remove(entity);
            await _db.SaveChangesAsync();
            return true;
        }

        private IQueryable<CompanyRequest> LoadRequestQuery() =>
            _db.CompanyRequests
                .Include(r => r.Roles)
                .ThenInclude(role => role.Skills);

        private async Task<CompanyRequest> RequireLoadedAsync(int id) =>
            await LoadRequestQuery().FirstAsync(r => r.Id == id);

        private static void ValidateSubmit(CreateCompanyRequestDto dto)
        {
            if (!IsValidRequestType(dto.RequestType))
                throw new ArgumentException("Invalid request type.");

            if (string.IsNullOrWhiteSpace(dto.Title))
                throw new ArgumentException("Title is required.");

            if (string.IsNullOrWhiteSpace(dto.Description))
                throw new ArgumentException("Description is required.");

            var category = CompanyRequestMapper.ResolveCategory(
                dto.CategoryChoice,
                dto.CategoryOther);
            if (string.IsNullOrWhiteSpace(category))
                throw new ArgumentException("Category is required.");

            if (!dto.DurationOngoing)
            {
                if (dto.DurationValue is < 1 or > 99)
                    throw new ArgumentException("Duration value is required.");
                if (CompanyRequestEnumConverters.TryParseDurationUnit(dto.DurationUnit) == null)
                    throw new ArgumentException("Duration unit is required and must be valid.");
            }

            if (CompanyRequestEnumConverters.TryParseCollaborationFormat(dto.CollaborationType) == null)
                throw new ArgumentException("Collaboration format is required and must be valid.");
        }

        private static void ValidateRolesForSubmit(string requestType, List<CompanyRequestMapper.RoleDraft> roles)
        {
            if (string.Equals(requestType, CompanyRequestType.Individual, StringComparison.OrdinalIgnoreCase))
            {
                if (roles.Count != 1 || string.IsNullOrWhiteSpace(roles[0].RoleName))
                    throw new ArgumentException("Individual requests require one role.");
                if (roles[0].Skills.Count == 0)
                    throw new ArgumentException("At least one skill is required.");
                return;
            }

            if (string.Equals(requestType, CompanyRequestType.AiBuiltTeam, StringComparison.OrdinalIgnoreCase))
            {
                if (roles.Count == 0)
                    throw new ArgumentException("AI-built team requests require at least one role.");
                if (roles.Any(r => string.IsNullOrWhiteSpace(r.RoleName) || r.Skills.Count == 0))
                    throw new ArgumentException("Each role must have a name and at least one skill.");
            }
        }

        private static bool IsValidRequestType(string? type) =>
            string.Equals(type, CompanyRequestType.Individual, StringComparison.OrdinalIgnoreCase)
            || string.Equals(type, CompanyRequestType.AiBuiltTeam, StringComparison.OrdinalIgnoreCase);

        private static string? NormalizeLifecycleStatus(string status)
        {
            var raw = status.Trim();
            if (string.Equals(raw, "Active", StringComparison.OrdinalIgnoreCase))
                return CompanyRequestLifecycleStatus.Active;
            if (string.Equals(raw, "Paused", StringComparison.OrdinalIgnoreCase))
                return CompanyRequestLifecycleStatus.Paused;
            if (string.Equals(raw, "Closed", StringComparison.OrdinalIgnoreCase))
                return CompanyRequestLifecycleStatus.Closed;

            var normalized = raw.ToLowerInvariant();
            return CompanyRequestLifecycleStatus.IsValid(normalized) ? normalized : null;
        }

        private static bool IsEditableStatus(string workflowStatus, string lifecycleStatus) =>
            workflowStatus is CompanyRequestStatus.Submitted
                or CompanyRequestStatus.Matching
                or CompanyRequestStatus.Matched
            && !CompanyRequestLifecycleStatus.IsModificationBlocked(lifecycleStatus);
    }
}
