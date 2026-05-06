using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using GraduationProject.API.Data;
using GraduationProject.API.Hubs;
using GraduationProject.API.Models;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace GraduationProject.API.Services
{
    public class GraduationProjectNotificationService : IGraduationProjectNotificationService
    {
        public const string Category = "graduation_project";

        private readonly ApplicationDbContext _db;
        private readonly IHubContext<NotificationsHub> _hubContext;

        public GraduationProjectNotificationService(
            ApplicationDbContext db,
            IHubContext<NotificationsHub> hubContext)
        {
            _db = db;
            _hubContext = hubContext;
        }

        public async Task NotifyProjectCreatedAsync(int projectId, string projectName, int ownerStudentProfileId, CancellationToken ct = default)
        {
            var ownerUserId = await GetStudentUserIdAsync(ownerStudentProfileId, ct);
            if (!ownerUserId.HasValue) return;

            var title = "Graduation project created";
            var body = $"Your project \"{projectName}\" was created successfully.";
            await TryAddAsync(ownerUserId.Value, "project_created", projectId, title, body, $"gp:created:{projectId}:{ownerUserId}", ct);
        }

        public async Task NotifyProjectUpdatedAsync(
            int projectId,
            string projectName,
            int actorUserId,
            CancellationToken ct = default)
        {
            var recipients = await GetProjectMemberUserIdsAsync(projectId, ct);
            var supervisorUserId = await GetSupervisorUserIdForProjectAsync(projectId, ct);
            if (supervisorUserId.HasValue)
                recipients.Add(supervisorUserId.Value);

            recipients.Remove(actorUserId);

            var title = "Graduation project updated";
            var body = $"The project \"{projectName}\" was updated.";
            await AddManyParallelBodiesAsync(recipients, "project_updated", projectId, title, body, ct);
        }

        public async Task NotifyProjectDeletedAsync(
            int projectId,
            string projectName,
            int actorUserId,
            CancellationToken ct = default)
        {
            var recipients = await GetProjectMemberUserIdsAsync(projectId, ct);
            var supervisorUserId = await GetSupervisorUserIdForProjectAsync(projectId, ct);
            if (supervisorUserId.HasValue)
                recipients.Add(supervisorUserId.Value);

            recipients.Remove(actorUserId);

            var title = "Graduation project deleted";
            var body = $"The project \"{projectName}\" was deleted.";
            await AddManyParallelBodiesAsync(recipients, "project_deleted", null, title, body, ct);
        }

        public async Task NotifyMemberJoinedAsync(
            int projectId,
            string projectName,
            int joinedStudentProfileId,
            CancellationToken ct = default)
        {
            var joinerUserId = await GetStudentUserIdAsync(joinedStudentProfileId, ct);
            var joinerName = await GetStudentDisplayNameAsync(joinedStudentProfileId, ct) ?? "A student";

            var recipients = await GetProjectMemberUserIdsAsync(projectId, ct);
            if (joinerUserId.HasValue)
                recipients.Remove(joinerUserId.Value);

            var title = "New team member";
            var body = $"{joinerName} joined \"{projectName}\".";
            await AddManyParallelBodiesAsync(recipients, "member_joined", projectId, title, body, ct);
        }

        public async Task NotifyMemberLeftAsync(
            int projectId,
            string projectName,
            int leftStudentProfileId,
            CancellationToken ct = default)
        {
            var leaverUserId = await GetStudentUserIdAsync(leftStudentProfileId, ct);
            var leaverName = await GetStudentDisplayNameAsync(leftStudentProfileId, ct) ?? "A member";

            var recipients = await GetProjectMemberUserIdsAsync(projectId, ct);
            if (leaverUserId.HasValue)
                recipients.Remove(leaverUserId.Value);

            var title = "Member left the project";
            var body = $"{leaverName} left \"{projectName}\".";
            await AddManyParallelBodiesAsync(recipients, "member_left", projectId, title, body, ct);
        }

        public async Task NotifyMemberRemovedAsync(
            int projectId,
            string projectName,
            int removedStudentProfileId,
            int actorUserId,
            CancellationToken ct = default)
        {
            var removedUserId = await GetStudentUserIdAsync(removedStudentProfileId, ct);
            var removedName = await GetStudentDisplayNameAsync(removedStudentProfileId, ct) ?? "A member";

            if (removedUserId.HasValue)
            {
                await TryAddAsync(
                    removedUserId.Value,
                    "member_removed_self",
                    projectId,
                    "Removed from graduation project",
                    $"You were removed from the team for \"{projectName}\".",
                    dedupKey: null,
                    ct);
            }

            var recipients = await GetProjectMemberUserIdsAsync(projectId, ct);
            if (removedUserId.HasValue)
                recipients.Remove(removedUserId.Value);
            recipients.Remove(actorUserId);

            var title = "Team member removed";
            var body = $"{removedName} was removed from \"{projectName}\".";
            await AddManyParallelBodiesAsync(recipients, "member_removed_team", projectId, title, body, ct);
        }

        public async Task NotifyLeaderChangedAsync(
            int projectId,
            string projectName,
            int oldLeaderStudentProfileId,
            int newLeaderStudentProfileId,
            CancellationToken ct = default)
        {
            var oldUserId = await GetStudentUserIdAsync(oldLeaderStudentProfileId, ct);
            var newUserId = await GetStudentUserIdAsync(newLeaderStudentProfileId, ct);
            var oldName = await GetStudentDisplayNameAsync(oldLeaderStudentProfileId, ct) ?? "Previous leader";
            var newName = await GetStudentDisplayNameAsync(newLeaderStudentProfileId, ct) ?? "New leader";

            if (newUserId.HasValue)
            {
                await TryAddAsync(
                    newUserId.Value,
                    "leader_changed_new",
                    projectId,
                    "You are the project leader",
                    $"You are now the project leader for \"{projectName}\".",
                    dedupKey: null,
                    ct);
            }

            if (oldUserId.HasValue)
            {
                await TryAddAsync(
                    oldUserId.Value,
                    "leader_changed_old",
                    projectId,
                    "Leadership transferred",
                    $"You transferred leadership of \"{projectName}\" to {newName}.",
                    dedupKey: null,
                    ct);
            }

            var memberUserIds = await GetProjectMemberUserIdsAsync(projectId, ct);
            if (oldUserId.HasValue)
                memberUserIds.Remove(oldUserId.Value);
            if (newUserId.HasValue)
                memberUserIds.Remove(newUserId.Value);

            var title = "Project leadership changed";
            var body = $"{oldName} transferred leadership of \"{projectName}\" to {newName}.";
            await AddManyParallelBodiesAsync(memberUserIds, "leader_changed_members", projectId, title, body, ct);
        }

        public async Task NotifyInvitationReceivedAsync(
            int invitationId,
            int projectId,
            string projectName,
            int senderStudentProfileId,
            int receiverStudentProfileId,
            CancellationToken ct = default)
        {
            var receiverUserId = await GetStudentUserIdAsync(receiverStudentProfileId, ct);
            if (!receiverUserId.HasValue) return;

            var senderName = await GetStudentDisplayNameAsync(senderStudentProfileId, ct) ?? "A student";

            await TryAddAsync(
                receiverUserId.Value,
                "invitation_received",
                projectId,
                "Team invitation received",
                $"{senderName} invited you to join \"{projectName}\".",
                $"gp:invite:{invitationId}:{receiverUserId.Value}",
                ct);
        }

        public async Task NotifySupervisionRequestReceivedAsync(
            int supervisorRequestId,
            int projectId,
            string projectName,
            int leaderStudentProfileId,
            int doctorProfileId,
            CancellationToken ct = default)
        {
            var doctorUserId = await GetDoctorUserIdByProfileIdAsync(doctorProfileId, ct);
            if (!doctorUserId.HasValue) return;

            var leaderName = await GetStudentDisplayNameAsync(leaderStudentProfileId, ct) ?? "A student";

            await TryAddAsync(
                doctorUserId.Value,
                "supervision_request_received",
                projectId,
                "Supervision request",
                $"{leaderName} requested you to supervise \"{projectName}\".",
                $"gp:supervisor_req:{supervisorRequestId}:{doctorUserId.Value}",
                ct);
        }

        public async Task NotifySupervisionRequestAcceptedAsync(
            int supervisorRequestId,
            int projectId,
            string projectName,
            int senderStudentProfileId,
            int doctorProfileId,
            CancellationToken ct = default)
        {
            var studentUserId = await GetStudentUserIdAsync(senderStudentProfileId, ct);
            if (!studentUserId.HasValue) return;

            var doctorName = await GetDoctorDisplayNameAsync(doctorProfileId, ct) ?? "Your supervisor";

            await TryAddAsync(
                studentUserId.Value,
                "supervision_request_accepted",
                projectId,
                "Supervision request accepted",
                $"Dr. {doctorName} accepted supervising \"{projectName}\".",
                $"gp:supervisor_accept:{supervisorRequestId}:{studentUserId.Value}",
                ct);
        }

        public async Task NotifySupervisionRequestRejectedAsync(
            int supervisorRequestId,
            int projectId,
            string projectName,
            int senderStudentProfileId,
            int doctorProfileId,
            CancellationToken ct = default)
        {
            var studentUserId = await GetStudentUserIdAsync(senderStudentProfileId, ct);
            if (!studentUserId.HasValue) return;

            var doctorName = await GetDoctorDisplayNameAsync(doctorProfileId, ct) ?? "The doctor";

            await TryAddAsync(
                studentUserId.Value,
                "supervision_request_rejected",
                projectId,
                "Supervision request declined",
                $"Dr. {doctorName} declined your supervision request for \"{projectName}\".",
                $"gp:supervisor_reject:{supervisorRequestId}:{studentUserId.Value}",
                ct);
        }

        private async Task TryAddAsync(
            int userId,
            string eventType,
            int? projectId,
            string title,
            string body,
            string? dedupKey,
            CancellationToken ct)
        {
            if (await ShouldSkipDedupAsync(userId, dedupKey, ct))
                return;

            var notification = new UserNotification
            {
                UserId = userId,
                Category = Category,
                EventType = eventType,
                ProjectId = projectId,
                Title = title,
                Body = body,
                DedupKey = dedupKey,
                CreatedAt = DateTime.UtcNow,
                ReadAt = null,
            };
            _db.UserNotifications.Add(notification);
            await _db.SaveChangesAsync(ct);
            await PushRealtimeAsync(notification, ct);
        }

        private async Task AddManyParallelBodiesAsync(
            IEnumerable<int> userIds,
            string eventType,
            int? projectId,
            string title,
            string body,
            CancellationToken ct)
        {
            var now = DateTime.UtcNow;
            var list = userIds.Distinct().ToList();
            var toAdd = new List<UserNotification>(list.Count);
            foreach (var userId in list)
            {
                toAdd.Add(new UserNotification
                {
                    UserId = userId,
                    Category = Category,
                    EventType = eventType,
                    ProjectId = projectId,
                    Title = title,
                    Body = body,
                    DedupKey = null,
                    CreatedAt = now,
                    ReadAt = null,
                });
            }

            if (toAdd.Count == 0)
                return;

            _db.UserNotifications.AddRange(toAdd);
            await _db.SaveChangesAsync(ct);
            await PushRealtimeBatchAsync(toAdd, ct);
        }

        private async Task<bool> ShouldSkipDedupAsync(int userId, string? dedupKey, CancellationToken ct)
        {
            if (dedupKey == null)
                return false;
            return await _db.UserNotifications.AnyAsync(
                n => n.UserId == userId && n.DedupKey == dedupKey,
                ct);
        }

        private async Task<HashSet<int>> GetProjectMemberUserIdsAsync(int projectId, CancellationToken ct)
        {
            var rows = await _db.StudentProjectMembers
                .AsNoTracking()
                .Where(m => m.ProjectId == projectId)
                .Join(
                    _db.StudentProfiles.AsNoTracking(),
                    m => m.StudentId,
                    s => s.Id,
                    (_, s) => s.UserId)
                .Distinct()
                .ToListAsync(ct);

            return rows.ToHashSet();
        }

        private async Task<int?> GetSupervisorUserIdForProjectAsync(int projectId, CancellationToken ct)
        {
            var doctorProfileId = await _db.StudentProjects
                .AsNoTracking()
                .Where(p => p.Id == projectId)
                .Select(p => p.SupervisorId)
                .FirstOrDefaultAsync(ct);

            if (!doctorProfileId.HasValue) return null;

            return await GetDoctorUserIdByProfileIdAsync(doctorProfileId.Value, ct);
        }

        private async Task<int?> GetDoctorUserIdByProfileIdAsync(int doctorProfileId, CancellationToken ct) =>
            await _db.DoctorProfiles
                .AsNoTracking()
                .Where(d => d.Id == doctorProfileId)
                .Select(d => (int?)d.UserId)
                .FirstOrDefaultAsync(ct);

        private async Task<int?> GetStudentUserIdAsync(int studentProfileId, CancellationToken ct) =>
            await _db.StudentProfiles
                .AsNoTracking()
                .Where(s => s.Id == studentProfileId)
                .Select(s => (int?)s.UserId)
                .FirstOrDefaultAsync(ct);

        private async Task<string?> GetStudentDisplayNameAsync(int studentProfileId, CancellationToken ct) =>
            await _db.StudentProfiles
                .AsNoTracking()
                .Where(s => s.Id == studentProfileId)
                .Join(_db.Users.AsNoTracking(), s => s.UserId, u => u.Id, (_, u) => u.Name)
                .FirstOrDefaultAsync(ct);

        private async Task<string?> GetDoctorDisplayNameAsync(int doctorProfileId, CancellationToken ct) =>
            await _db.DoctorProfiles
                .AsNoTracking()
                .Where(d => d.Id == doctorProfileId)
                .Join(_db.Users.AsNoTracking(), d => d.UserId, u => u.Id, (_, u) => u.Name)
                .FirstOrDefaultAsync(ct);

        private async Task PushRealtimeBatchAsync(
            IEnumerable<UserNotification> notifications,
            CancellationToken ct)
        {
            foreach (var notification in notifications)
                await PushRealtimeAsync(notification, ct);
        }

        private async Task PushRealtimeAsync(UserNotification notification, CancellationToken ct)
        {
            await _hubContext.Clients
                .User(notification.UserId.ToString())
                .SendAsync("NotificationCreated", new
                {
                    notification.Id,
                    notification.Title,
                    notification.Body,
                    notification.EventType,
                    notification.ProjectId,
                    notification.CreatedAt,
                    notification.ReadAt,
                }, ct);
        }
    }
}
