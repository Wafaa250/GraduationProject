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
    public class CompanyRequestInvitationService : ICompanyRequestInvitationService
    {
        private readonly ApplicationDbContext _db;
        private readonly IGraduationProjectNotificationService _notifications;

        public CompanyRequestInvitationService(
            ApplicationDbContext db,
            IGraduationProjectNotificationService notifications)
        {
            _db = db;
            _notifications = notifications;
        }

        public async Task<CompanyRequestInvitationDetailDto> CreateAsync(
            int companyProfileId,
            int invitedByUserId,
            int requestId,
            CreateCompanyRequestInvitationDto dto)
        {
            var request = await _db.CompanyRequests
                .Include(r => r.Roles)
                .Include(r => r.CompanyProfile)
                .FirstOrDefaultAsync(r => r.Id == requestId && r.CompanyProfileId == companyProfileId);

            if (request == null)
                throw new ArgumentException("Company request not found.");

            if (request.Status == CompanyRequestStatus.Draft)
                throw new ArgumentException("Invitations are allowed only for submitted requests.");

            if (CompanyRequestLifecycleStatus.IsModificationBlocked(request.RequestStatus))
            {
                var message = request.RequestStatus == CompanyRequestLifecycleStatus.Paused
                    ? "This request is paused."
                    : "This request has been closed.";
                throw new ArgumentException(message);
            }

            var student = await _db.StudentProfiles
                .Include(s => s.User)
                .FirstOrDefaultAsync(s => s.Id == dto.StudentProfileId);
            if (student == null)
                throw new ArgumentException("Student profile not found.");

            if (dto.CompanyRequestRoleId.HasValue && request.Roles.All(r => r.Id != dto.CompanyRequestRoleId.Value))
                throw new ArgumentException("Role does not belong to the selected request.");

            var duplicatePendingExists = await _db.CompanyRequestInvitations.AnyAsync(i =>
                i.CompanyRequestId == requestId &&
                i.StudentProfileId == dto.StudentProfileId &&
                i.Status == CompanyRequestInvitationStatus.Pending);

            if (duplicatePendingExists)
                throw new ArgumentException("A pending invitation already exists for this student and request.");

            var invitation = new CompanyRequestInvitation
            {
                CompanyRequestId = requestId,
                CompanyProfileId = companyProfileId,
                StudentProfileId = dto.StudentProfileId,
                InvitedByUserId = invitedByUserId,
                CompanyRequestRoleId = dto.CompanyRequestRoleId,
                Message = dto.Message?.Trim(),
                Status = CompanyRequestInvitationStatus.Pending,
                MatchScore = dto.MatchScore,
                Source = dto.Source?.Trim(),
                CreatedAt = DateTime.UtcNow,
            };

            _db.CompanyRequestInvitations.Add(invitation);
            await _db.SaveChangesAsync();

            await _notifications.NotifyCompanyRequestInvitationReceivedAsync(
                invitation.Id,
                dto.StudentProfileId,
                companyProfileId,
                requestId,
                request.CompanyProfile?.CompanyName ?? "A company",
                request.Title);

            return await GetDetailByIdAsync(invitation.Id);
        }

        public async Task<IReadOnlyList<CompanyRequestInvitationSummaryDto>> ListByRequestAsync(
            int companyProfileId,
            int requestId)
        {
            var ownsRequest = await _db.CompanyRequests.AnyAsync(r =>
                r.Id == requestId && r.CompanyProfileId == companyProfileId);

            if (!ownsRequest)
                throw new ArgumentException("Company request not found.");

            var rows = await CompanyInvitationQuery()
                .Where(i => i.CompanyRequestId == requestId)
                .OrderByDescending(i => i.CreatedAt)
                .ToListAsync();

            return rows.Select(MapSummary).ToList();
        }

        public async Task<IReadOnlyList<CompanyRequestInvitationSummaryDto>> ListCompanyInvitationsAsync(int companyProfileId)
        {
            var rows = await CompanyInvitationQuery()
                .Where(i => i.CompanyProfileId == companyProfileId)
                .OrderByDescending(i => i.CreatedAt)
                .ToListAsync();

            return rows.Select(MapSummary).ToList();
        }

        public async Task<CompanyRequestInvitationDetailDto?> CancelAsync(
            int companyProfileId,
            int requestId,
            int invitationId)
        {
            var invitation = await _db.CompanyRequestInvitations
                .Include(i => i.CompanyRequest)
                .Include(i => i.CompanyProfile)
                .FirstOrDefaultAsync(i =>
                    i.Id == invitationId &&
                    i.CompanyRequestId == requestId &&
                    i.CompanyProfileId == companyProfileId);

            if (invitation == null) return null;

            if (invitation.Status != CompanyRequestInvitationStatus.Pending)
                throw new ArgumentException("Only pending invitations can be cancelled.");

            invitation.Status = CompanyRequestInvitationStatus.Cancelled;
            invitation.CancelledAt = DateTime.UtcNow;
            invitation.RespondedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();

            await _notifications.NotifyCompanyRequestInvitationCancelledAsync(
                invitation.Id,
                invitation.StudentProfileId,
                invitation.CompanyProfileId,
                invitation.CompanyRequestId,
                invitation.CompanyProfile.CompanyName,
                invitation.CompanyRequest.Title);

            return await GetDetailByIdAsync(invitation.Id);
        }

        public async Task<IReadOnlyList<CompanyRequestInvitationSummaryDto>> ListStudentInvitationsAsync(int studentProfileId)
        {
            var rows = await StudentInvitationQuery()
                .Where(i => i.StudentProfileId == studentProfileId)
                .OrderByDescending(i => i.CreatedAt)
                .ToListAsync();

            return rows.Select(MapSummary).ToList();
        }

        public async Task<CompanyRequestInvitationDetailDto?> GetStudentInvitationByIdAsync(int studentProfileId, int invitationId)
        {
            var invitation = await StudentInvitationQuery()
                .FirstOrDefaultAsync(i => i.Id == invitationId && i.StudentProfileId == studentProfileId);

            return invitation == null ? null : MapDetail(invitation);
        }

        public Task<CompanyRequestInvitationDetailDto?> AcceptAsync(int studentProfileId, int invitationId) =>
            RespondAsync(studentProfileId, invitationId, CompanyRequestInvitationStatus.Accepted);

        public Task<CompanyRequestInvitationDetailDto?> RejectAsync(int studentProfileId, int invitationId) =>
            RespondAsync(studentProfileId, invitationId, CompanyRequestInvitationStatus.Rejected);

        private async Task<CompanyRequestInvitationDetailDto?> RespondAsync(
            int studentProfileId,
            int invitationId,
            string nextStatus)
        {
            var invitation = await _db.CompanyRequestInvitations
                .Include(i => i.CompanyRequest)
                .Include(i => i.CompanyProfile)
                .Include(i => i.StudentProfile).ThenInclude(s => s.User)
                .FirstOrDefaultAsync(i => i.Id == invitationId && i.StudentProfileId == studentProfileId);

            if (invitation == null) return null;

            if (invitation.Status != CompanyRequestInvitationStatus.Pending)
                throw new ArgumentException("Only pending invitations can be responded to.");

            invitation.Status = nextStatus;
            invitation.RespondedAt = DateTime.UtcNow;
            if (nextStatus == CompanyRequestInvitationStatus.Cancelled)
                invitation.CancelledAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();

            var studentName = invitation.StudentProfile.User?.Name ?? "A student";
            if (nextStatus == CompanyRequestInvitationStatus.Accepted)
            {
                await _notifications.NotifyCompanyRequestInvitationAcceptedAsync(
                    invitation.Id,
                    invitation.CompanyProfileId,
                    invitation.CompanyRequestId,
                    invitation.CompanyProfile.CompanyName,
                    invitation.CompanyRequest.Title,
                    studentName);
            }
            else if (nextStatus == CompanyRequestInvitationStatus.Rejected)
            {
                await _notifications.NotifyCompanyRequestInvitationRejectedAsync(
                    invitation.Id,
                    invitation.CompanyProfileId,
                    invitation.CompanyRequestId,
                    invitation.CompanyProfile.CompanyName,
                    invitation.CompanyRequest.Title,
                    studentName);
            }

            return await GetDetailByIdAsync(invitation.Id);
        }

        private IQueryable<CompanyRequestInvitation> CompanyInvitationQuery() =>
            _db.CompanyRequestInvitations
                .AsNoTracking()
                .Include(i => i.CompanyRequest)
                .Include(i => i.CompanyRequestRole)
                .Include(i => i.CompanyProfile)
                .Include(i => i.StudentProfile).ThenInclude(s => s.User);

        private IQueryable<CompanyRequestInvitation> StudentInvitationQuery() =>
            _db.CompanyRequestInvitations
                .AsNoTracking()
                .Include(i => i.CompanyRequest)
                .Include(i => i.CompanyRequestRole)
                .Include(i => i.CompanyProfile)
                .Include(i => i.StudentProfile).ThenInclude(s => s.User);

        private async Task<CompanyRequestInvitationDetailDto> GetDetailByIdAsync(int invitationId)
        {
            var invitation = await StudentInvitationQuery()
                .FirstAsync(i => i.Id == invitationId);
            return MapDetail(invitation);
        }

        private static CompanyRequestInvitationSummaryDto MapSummary(CompanyRequestInvitation invitation) =>
            new CompanyRequestInvitationSummaryDto
            {
                Id = invitation.Id,
                CompanyRequestId = invitation.CompanyRequestId,
                CompanyProfileId = invitation.CompanyProfileId,
                StudentProfileId = invitation.StudentProfileId,
                InvitedByUserId = invitation.InvitedByUserId,
                CompanyRequestRoleId = invitation.CompanyRequestRoleId,
                CompanyRequestRoleName = invitation.CompanyRequestRole?.RoleName,
                Message = invitation.Message,
                Status = invitation.Status,
                MatchScore = invitation.MatchScore,
                Source = invitation.Source,
                CreatedAt = invitation.CreatedAt,
                RespondedAt = invitation.RespondedAt,
                CancelledAt = invitation.CancelledAt,
            };

        private static CompanyRequestInvitationDetailDto MapDetail(CompanyRequestInvitation invitation) =>
            new CompanyRequestInvitationDetailDto
            {
                Id = invitation.Id,
                CompanyRequestId = invitation.CompanyRequestId,
                CompanyProfileId = invitation.CompanyProfileId,
                StudentProfileId = invitation.StudentProfileId,
                InvitedByUserId = invitation.InvitedByUserId,
                CompanyRequestRoleId = invitation.CompanyRequestRoleId,
                CompanyRequestRoleName = invitation.CompanyRequestRole?.RoleName,
                Message = invitation.Message,
                Status = invitation.Status,
                MatchScore = invitation.MatchScore,
                Source = invitation.Source,
                CreatedAt = invitation.CreatedAt,
                RespondedAt = invitation.RespondedAt,
                CancelledAt = invitation.CancelledAt,
                CompanyName = invitation.CompanyProfile.CompanyName,
                RequestTitle = invitation.CompanyRequest.Title,
                StudentName = invitation.StudentProfile.User.Name,
                StudentEmail = invitation.StudentProfile.User.Email,
                StudentMajor = invitation.StudentProfile.Major,
                StudentUniversity = invitation.StudentProfile.University,
                StudentFaculty = invitation.StudentProfile.Faculty,
            };
    }
}
