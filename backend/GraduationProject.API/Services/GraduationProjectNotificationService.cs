using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using GraduationProject.API.Data;
using GraduationProject.API.DTOs;
using GraduationProject.API.Hubs;
using GraduationProject.API.Models;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace GraduationProject.API.Services
{
    public class GraduationProjectNotificationService : IGraduationProjectNotificationService
    {
        public const string Category = "graduation_project";
        public const string ChatCategory = "chat";
        public const string CourseCategory = "course";
        public const string OrganizationEventCategory = "organization_event";
        public const string OrganizationRecruitmentCategory = "organization_recruitment";
        public const string CompanyCategory = "company";

        private readonly ApplicationDbContext _db;
        private readonly IHubContext<NotificationsHub> _hubContext;
        private readonly ILogger<GraduationProjectNotificationService> _logger;

        public GraduationProjectNotificationService(
            ApplicationDbContext db,
            IHubContext<NotificationsHub> hubContext,
            ILogger<GraduationProjectNotificationService> logger)
        {
            _db = db;
            _hubContext = hubContext;
            _logger = logger;
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
            LogInvitationEvent("INVITATION CREATED", "graduation_project_team", invitationId, receiverStudentProfileId);

            var receiverUserId = await GetStudentUserIdAsync(receiverStudentProfileId, ct);
            if (!receiverUserId.HasValue)
            {
                _logger.LogWarning(
                    "[Notifications] NOTIFICATION SKIPPED flow=graduation_project_team invitationId={InvitationId} reason=receiver_user_not_found studentProfileId={StudentProfileId}",
                    invitationId, receiverStudentProfileId);
                return;
            }

            var senderName = await GetStudentDisplayNameAsync(senderStudentProfileId, ct) ?? "A student";

            await TryAddAsync(
                receiverUserId.Value,
                "invitation_received",
                projectId,
                "Team invitation received",
                $"{senderName} invited you to join \"{projectName}\".",
                $"gp:invite:{invitationId}:{receiverUserId.Value}",
                ct,
                flow: "graduation_project_team",
                invitationId: invitationId);
        }

        public async Task NotifyInvitationRejectedAsync(
            int invitationId,
            int projectId,
            string projectName,
            int senderStudentProfileId,
            int receiverStudentProfileId,
            CancellationToken ct = default)
        {
            var senderUserId = await GetStudentUserIdAsync(senderStudentProfileId, ct);
            if (!senderUserId.HasValue) return;

            var receiverName = await GetStudentDisplayNameAsync(receiverStudentProfileId, ct) ?? "The student";

            await TryAddAsync(
                senderUserId.Value,
                "invitation_rejected",
                projectId,
                "Team invitation declined",
                $"{receiverName} declined your invitation to join \"{projectName}\".",
                $"gp:invite_reject:{invitationId}:{senderUserId.Value}",
                ct);
        }

        public async Task NotifyInvitationAcceptedAsync(
            int invitationId,
            int projectId,
            string projectName,
            int senderStudentProfileId,
            int receiverStudentProfileId,
            CancellationToken ct = default)
        {
            var senderUserId = await GetStudentUserIdAsync(senderStudentProfileId, ct);
            if (!senderUserId.HasValue) return;

            var receiverName = await GetStudentDisplayNameAsync(receiverStudentProfileId, ct) ?? "The student";

            await TryAddAsync(
                senderUserId.Value,
                "invitation_accepted",
                projectId,
                "Team invitation accepted",
                $"{receiverName} accepted your invitation.",
                $"gp:invite_accept:{invitationId}:{senderUserId.Value}",
                ct);
        }

        public async Task NotifyInvitationCancelledBySenderAsync(
            int invitationId,
            int projectId,
            string projectName,
            int senderStudentProfileId,
            int receiverStudentProfileId,
            CancellationToken ct = default)
        {
            var receiverUserId = await GetStudentUserIdAsync(receiverStudentProfileId, ct);
            if (!receiverUserId.HasValue) return;

            var senderName = await GetStudentDisplayNameAsync(senderStudentProfileId, ct) ?? "The leader";

            await TryAddAsync(
                receiverUserId.Value,
                "invitation_cancelled_by_sender",
                projectId,
                "Team invitation cancelled",
                $"{senderName} cancelled your invitation to join \"{projectName}\".",
                $"gp:invite_cancel:{invitationId}:{receiverUserId.Value}",
                ct);
        }

        public async Task NotifyInvitationExpiredAfterAcceptanceAsync(
            int invitationId,
            int projectId,
            string projectName,
            int senderStudentProfileId,
            int acceptedStudentProfileId,
            string acceptedProjectName,
            CancellationToken ct = default)
        {
            var senderUserId = await GetStudentUserIdAsync(senderStudentProfileId, ct);
            if (!senderUserId.HasValue) return;

            var studentName = await GetStudentDisplayNameAsync(acceptedStudentProfileId, ct) ?? "The student";

            await TryAddAsync(
                senderUserId.Value,
                "invitation_expired_after_acceptance",
                projectId,
                "Invitation expired",
                $"{studentName} accepted another invitation (\"{acceptedProjectName}\"). Your invitation to \"{projectName}\" is now expired.",
                $"gp:invite_expired:{invitationId}:{senderUserId.Value}",
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
            LogInvitationEvent("INVITATION CREATED", "supervision_request", supervisorRequestId, doctorProfileId);

            var doctorUserId = await GetDoctorUserIdByProfileIdAsync(doctorProfileId, ct);
            if (!doctorUserId.HasValue)
            {
                _logger.LogWarning(
                    "[Notifications] NOTIFICATION SKIPPED flow=supervision_request requestId={RequestId} reason=doctor_user_not_found doctorProfileId={DoctorProfileId}",
                    supervisorRequestId, doctorProfileId);
                return;
            }

            var leaderName = await GetStudentDisplayNameAsync(leaderStudentProfileId, ct) ?? "A student";

            await TryAddAsync(
                doctorUserId.Value,
                "supervision_request_received",
                projectId,
                "Supervision request",
                $"{leaderName} requested you to supervise \"{projectName}\".",
                $"gp:supervisor_req:{supervisorRequestId}:{doctorUserId.Value}",
                ct,
                flow: "supervision_request",
                invitationId: supervisorRequestId);
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

        public async Task NotifySupervisionRequestAutoRejectedAsync(
            int supervisorRequestId,
            int projectId,
            string projectName,
            int doctorProfileId,
            int acceptedDoctorProfileId,
            CancellationToken ct = default)
        {
            var doctorUserId = await GetDoctorUserIdByProfileIdAsync(doctorProfileId, ct);
            if (!doctorUserId.HasValue) return;

            var acceptedDoctorName = await GetDoctorDisplayNameAsync(acceptedDoctorProfileId, ct) ?? "another doctor";

            await TryAddAsync(
                doctorUserId.Value,
                "supervision_request_auto_rejected",
                projectId,
                "Supervision request closed",
                $"Your pending supervision request for \"{projectName}\" was auto-rejected because Dr. {acceptedDoctorName} accepted the project.",
                $"gp:supervisor_auto_reject:{supervisorRequestId}:{doctorUserId.Value}",
                ct);
        }

        public async Task NotifySupervisorCancellationRequestedAsync(
            int cancellationRequestId,
            int projectId,
            string projectName,
            int leaderStudentProfileId,
            int doctorProfileId,
            CancellationToken ct = default)
        {
            var doctorUserId = await GetDoctorUserIdByProfileIdAsync(doctorProfileId, ct);
            if (!doctorUserId.HasValue) return;

            var leaderName = await GetStudentDisplayNameAsync(leaderStudentProfileId, ct) ?? "The team leader";

            await TryAddAsync(
                doctorUserId.Value,
                "supervisor_cancellation_requested",
                projectId,
                "Supervisor cancellation request",
                $"{leaderName} requested to cancel your supervision for \"{projectName}\".",
                $"gp:supervisor_cancel_req:{cancellationRequestId}:{doctorUserId.Value}",
                ct);
        }

        public async Task NotifySupervisorCancellationAcceptedAsync(
            int cancellationRequestId,
            int projectId,
            string projectName,
            int leaderStudentProfileId,
            int doctorProfileId,
            CancellationToken ct = default)
        {
            var recipients = await GetProjectMemberUserIdsAsync(projectId, ct);
            var ownerUserId = await GetProjectOwnerUserIdAsync(projectId, ct);
            if (ownerUserId.HasValue)
                recipients.Add(ownerUserId.Value);

            if (recipients.Count == 0)
                return;

            var doctorName = await GetDoctorDisplayNameAsync(doctorProfileId, ct) ?? "The supervisor";
            await AddManyParallelBodiesAsync(
                recipients,
                "supervisor_cancellation_accepted",
                projectId,
                "Supervisor cancellation accepted",
                $"Dr. {doctorName} accepted the supervision cancellation request for \"{projectName}\".",
                ct);
        }

        public async Task NotifySupervisorCancellationRejectedAsync(
            int cancellationRequestId,
            int projectId,
            string projectName,
            int leaderStudentProfileId,
            int doctorProfileId,
            CancellationToken ct = default)
        {
            var recipients = await GetProjectMemberUserIdsAsync(projectId, ct);
            var ownerUserId = await GetProjectOwnerUserIdAsync(projectId, ct);
            if (ownerUserId.HasValue)
                recipients.Add(ownerUserId.Value);

            if (recipients.Count == 0)
                return;

            var doctorName = await GetDoctorDisplayNameAsync(doctorProfileId, ct) ?? "The supervisor";
            await AddManyParallelBodiesAsync(
                recipients,
                "supervisor_cancellation_rejected",
                projectId,
                "Supervisor cancellation rejected",
                $"Dr. {doctorName} rejected the supervision cancellation request for \"{projectName}\".",
                ct);
        }

        public async Task NotifySupervisionCancelledByDoctorAsync(
            int projectId,
            string projectName,
            int doctorProfileId,
            CancellationToken ct = default)
        {
            var recipients = await GetProjectMemberUserIdsAsync(projectId, ct);
            var ownerUserId = await GetProjectOwnerUserIdAsync(projectId, ct);
            if (ownerUserId.HasValue)
                recipients.Add(ownerUserId.Value);

            if (recipients.Count == 0)
                return;

            var doctorName = await GetDoctorDisplayNameAsync(doctorProfileId, ct) ?? "The supervisor";
            await AddManyParallelBodiesAsync(
                recipients,
                "supervision_cancelled_by_doctor",
                projectId,
                "Supervision cancelled",
                $"Dr. {doctorName} cancelled supervision for \"{projectName}\".",
                ct);
        }

        public async Task NotifyDirectMessageAsync(
            int conversationId,
            int messageId,
            int senderUserId,
            string senderName,
            string previewText,
            IEnumerable<int> recipientUserIds,
            DateTime createdAt,
            CancellationToken ct = default)
        {
            var title = $"New message from {senderName}";
            var body = string.IsNullOrWhiteSpace(previewText) ? "You received a new message." : previewText;
            var recipients = recipientUserIds.Where(id => id != senderUserId).Distinct().ToList();
            foreach (var recipientId in recipients)
            {
                await TryAddGenericAsync(
                    recipientId,
                    ChatCategory,
                    "direct_message",
                    conversationId,
                    title,
                    body,
                    $"chat:direct:{conversationId}:{messageId}:{recipientId}",
                    ct);

                await _hubContext.Clients.User(recipientId.ToString()).SendAsync(
                    "ReceiveMessage",
                    new
                    {
                        conversationId,
                        id = messageId,
                        senderId = senderUserId,
                        text = previewText,
                        createdAt,
                        edited = false,
                        deleted = false,
                        seen = false
                    },
                    ct);
            }
        }

        public async Task NotifyConversationStartedAsync(
            int conversationId,
            int starterUserId,
            string starterName,
            IEnumerable<int> recipientUserIds,
            CancellationToken ct = default)
        {
            var recipients = recipientUserIds.Where(id => id != starterUserId).Distinct().ToList();
            foreach (var recipientId in recipients)
            {
                await TryAddGenericAsync(
                    recipientId,
                    ChatCategory,
                    "conversation_started",
                    conversationId,
                    "New conversation started",
                    $"{starterName} started a conversation with you.",
                    $"chat:conversation_started:{conversationId}:{recipientId}",
                    ct);

                await _hubContext.Clients.User(recipientId.ToString()).SendAsync(
                    "ConversationStarted",
                    new { conversationId, starterUserId },
                    ct);
            }
        }

        public async Task NotifyMessageEditedAsync(
            int conversationId,
            MessageDto messagePayload,
            IEnumerable<int> recipientUserIds,
            CancellationToken ct = default)
        {
            foreach (var recipientId in recipientUserIds.Distinct())
            {
                await _hubContext.Clients.User(recipientId.ToString()).SendAsync(
                    "MessageEdited",
                    new
                    {
                        conversationId,
                        messagePayload.Id,
                        messagePayload.SenderId,
                        messagePayload.Text,
                        messagePayload.CreatedAt,
                        messagePayload.Edited,
                        messagePayload.Deleted,
                        messagePayload.Seen
                    },
                    ct);
            }
        }

        public async Task NotifyMessageDeletedAsync(
            int conversationId,
            MessageDto messagePayload,
            IEnumerable<int> recipientUserIds,
            CancellationToken ct = default)
        {
            foreach (var recipientId in recipientUserIds.Distinct())
            {
                await _hubContext.Clients.User(recipientId.ToString()).SendAsync(
                    "MessageDeleted",
                    new
                    {
                        conversationId,
                        messagePayload.Id,
                        messagePayload.SenderId,
                        messagePayload.Text,
                        messagePayload.CreatedAt,
                        messagePayload.Edited,
                        messagePayload.Deleted,
                        messagePayload.Seen
                    },
                    ct);
            }
        }

        public async Task NotifySectionChatMessageAsync(
            int sectionId,
            int courseId,
            int senderUserId,
            string senderName,
            string previewText,
            IEnumerable<int> recipientUserIds,
            CancellationToken ct = default)
        {
            var title = $"New section message from {senderName}";
            var body = string.IsNullOrWhiteSpace(previewText) ? "New message in your section chat." : previewText;
            foreach (var recipientId in recipientUserIds.Where(id => id != senderUserId).Distinct())
            {
                await TryAddGenericAsync(
                    recipientId,
                    ChatCategory,
                    "section_message",
                    courseId,
                    title,
                    body,
                    $"chat:section:{sectionId}:{DateTime.UtcNow.Ticks}:{recipientId}",
                    ct);
            }
        }

        public async Task NotifyTeamChatMessageAsync(
            int teamId,
            int projectId,
            int senderUserId,
            string senderName,
            string previewText,
            IEnumerable<int> recipientUserIds,
            CancellationToken ct = default)
        {
            var title = $"New team message from {senderName}";
            var body = string.IsNullOrWhiteSpace(previewText) ? "New message in your team chat." : previewText;
            foreach (var recipientId in recipientUserIds.Where(id => id != senderUserId).Distinct())
            {
                await TryAddGenericAsync(
                    recipientId,
                    ChatCategory,
                    "team_message",
                    projectId,
                    title,
                    body,
                    $"chat:team:{teamId}:{DateTime.UtcNow.Ticks}:{recipientId}",
                    ct);
            }
        }

        public async Task NotifyCourseProjectCreatedAsync(
            int courseProjectId,
            int courseId,
            string projectTitle,
            bool applyToAllSections,
            IEnumerable<int> sectionIds,
            CancellationToken ct = default)
        {
            var recipients = await GetCourseRecipientUserIdsAsync(courseId, applyToAllSections, sectionIds, ct);
            await AddManyByCategoryAsync(
                recipients,
                CourseCategory,
                "course_project_created",
                courseProjectId,
                "New course project",
                $"A new course project \"{projectTitle}\" is now available.",
                ct);
        }

        public async Task NotifyCourseProjectUpdatedAsync(
            int courseProjectId,
            int courseId,
            string projectTitle,
            bool applyToAllSections,
            IEnumerable<int> sectionIds,
            CancellationToken ct = default)
        {
            var recipients = await GetCourseRecipientUserIdsAsync(courseId, applyToAllSections, sectionIds, ct);
            await AddManyByCategoryAsync(
                recipients,
                CourseCategory,
                "course_project_updated",
                courseProjectId,
                "Course project updated",
                $"The course project \"{projectTitle}\" was updated.",
                ct);
        }

        public async Task NotifyCourseProjectDeletedAsync(
            int courseProjectId,
            int courseId,
            string projectTitle,
            bool applyToAllSections,
            IEnumerable<int> sectionIds,
            CancellationToken ct = default)
        {
            var recipients = await GetCourseRecipientUserIdsAsync(courseId, applyToAllSections, sectionIds, ct);
            await AddManyByCategoryAsync(
                recipients,
                CourseCategory,
                "course_project_deleted",
                null,
                "Course project deleted",
                $"The course project \"{projectTitle}\" was deleted.",
                ct);
        }

        public async Task NotifyCourseTeamsGeneratedAsync(
            int courseProjectId,
            string projectTitle,
            IEnumerable<int> assignedUserIds,
            CancellationToken ct = default)
        {
            await AddManyByCategoryAsync(
                assignedUserIds.Where(id => id > 0).Distinct(),
                CourseCategory,
                "course_teams_generated",
                courseProjectId,
                "Your team has been assigned",
                $"Teams were generated for \"{projectTitle}\".",
                ct);
        }

        public async Task NotifyCourseTeamMemberAddedAsync(
            int courseProjectId,
            string projectTitle,
            int addedStudentProfileId,
            int newTeamIndex,
            IEnumerable<int> newTeamMemberUserIds,
            int? oldTeamIndex,
            IEnumerable<int>? oldTeamMemberUserIds,
            CancellationToken ct = default)
        {
            var addedUserId = await GetStudentUserIdAsync(addedStudentProfileId, ct);
            var addedName = await GetStudentDisplayNameAsync(addedStudentProfileId, ct) ?? "A student";

            if (addedUserId.HasValue)
            {
                var moveSuffix = oldTeamIndex.HasValue ? $" (moved from Team {oldTeamIndex.Value + 1})" : string.Empty;
                await TryAddGenericAsync(
                    addedUserId.Value,
                    CourseCategory,
                    "course_team_member_added_self",
                    courseProjectId,
                    "Added to a course team",
                    $"You were added to Team {newTeamIndex + 1} in \"{projectTitle}\"{moveSuffix}.",
                    dedupKey: null,
                    ct);
            }

            var teamRecipients = newTeamMemberUserIds
                .Where(id => id > 0)
                .Distinct()
                .ToHashSet();
            if (addedUserId.HasValue)
                teamRecipients.Remove(addedUserId.Value);

            await AddManyByCategoryAsync(
                teamRecipients,
                CourseCategory,
                "course_team_member_added_team",
                courseProjectId,
                "Team member added",
                $"{addedName} joined your team in \"{projectTitle}\".",
                ct);

            if (oldTeamIndex.HasValue && oldTeamMemberUserIds != null)
            {
                var oldRecipients = oldTeamMemberUserIds
                    .Where(id => id > 0)
                    .Distinct()
                    .ToHashSet();
                if (addedUserId.HasValue)
                    oldRecipients.Remove(addedUserId.Value);

                await AddManyByCategoryAsync(
                    oldRecipients,
                    CourseCategory,
                    "course_team_member_moved",
                    courseProjectId,
                    "Team member moved",
                    $"{addedName} was moved to Team {newTeamIndex + 1} in \"{projectTitle}\".",
                    ct);
            }
        }

        public async Task NotifyCourseTeamMemberRemovedAsync(
            int courseProjectId,
            string projectTitle,
            int removedStudentProfileId,
            int teamIndex,
            IEnumerable<int> remainingTeamMemberUserIds,
            CancellationToken ct = default)
        {
            var removedUserId = await GetStudentUserIdAsync(removedStudentProfileId, ct);
            var removedName = await GetStudentDisplayNameAsync(removedStudentProfileId, ct) ?? "A student";

            if (removedUserId.HasValue)
            {
                await TryAddGenericAsync(
                    removedUserId.Value,
                    CourseCategory,
                    "course_team_member_removed_self",
                    courseProjectId,
                    "Removed from a course team",
                    $"You were removed from Team {teamIndex + 1} in \"{projectTitle}\".",
                    dedupKey: null,
                    ct);
            }

            await AddManyByCategoryAsync(
                remainingTeamMemberUserIds
                    .Where(id => id > 0)
                    .Distinct()
                    .Where(id => !removedUserId.HasValue || id != removedUserId.Value),
                CourseCategory,
                "course_team_member_removed_team",
                courseProjectId,
                "Team member removed",
                $"{removedName} was removed from your team in \"{projectTitle}\".",
                ct);
        }

        public async Task NotifyStudentsAddedToSectionAsync(
            int sectionId,
            string sectionName,
            int courseId,
            string courseName,
            IEnumerable<int> studentProfileIds,
            CancellationToken ct = default)
        {
            var profileIds = studentProfileIds
                .Where(id => id > 0)
                .Distinct()
                .ToList();
            if (profileIds.Count == 0)
                return;

            var userIds = await _db.StudentProfiles
                .AsNoTracking()
                .Where(s => profileIds.Contains(s.Id))
                .Select(s => s.UserId)
                .Distinct()
                .ToListAsync(ct);

            await AddManyByCategoryAsync(
                userIds,
                CourseCategory,
                "course_section_enrollment_added",
                courseId,
                "Added to section",
                $"You were added to section \"{sectionName}\" in course \"{courseName}\".",
                ct);
        }

        public async Task NotifyRecruitmentApplicationAcceptedAsync(
            int applicationId,
            int studentProfileId,
            string organizationName,
            string campaignTitle,
            string positionRoleTitle,
            string membershipKind,
            CancellationToken ct = default)
        {
            var userId = await GetStudentUserIdAsync(studentProfileId, ct);
            if (!userId.HasValue)
                return;

            var title = "Recruitment acceptance";
            var body =
                $"You have been accepted into {campaignTitle}. You joined {organizationName} as {positionRoleTitle}.";
            if (string.Equals(membershipKind, OrganizationMembershipKinds.Leadership, StringComparison.Ordinal))
            {
                body =
                    $"You have been accepted into {campaignTitle}. You are now a leadership member of {organizationName} as {positionRoleTitle}.";
            }

            await TryAddGenericAsync(
                userId.Value,
                OrganizationRecruitmentCategory,
                "recruitment_application_accepted",
                applicationId,
                title,
                body,
                $"recruitment:accepted:{applicationId}:{userId}",
                ct);
        }

        public async Task NotifyRecruitmentApplicationRejectedAsync(
            int applicationId,
            int studentProfileId,
            string positionRoleTitle,
            CancellationToken ct = default)
        {
            var userId = await GetStudentUserIdAsync(studentProfileId, ct);
            if (!userId.HasValue)
                return;

            var title = "Application update";
            var body = $"Your application for {positionRoleTitle} was not selected.";
            await TryAddGenericAsync(
                userId.Value,
                OrganizationRecruitmentCategory,
                "recruitment_application_rejected",
                applicationId,
                title,
                body,
                $"recruitment:rejected:{applicationId}:{userId}",
                ct);
        }

        public async Task NotifyOrganizationFollowersNewEventAsync(
            int organizationProfileId,
            string organizationName,
            int eventId,
            string eventTitle,
            CancellationToken ct = default)
        {
            var userIds = await _db.OrganizationFollows
                .AsNoTracking()
                .Where(f => f.OrganizationProfileId == organizationProfileId)
                .Join(_db.StudentProfiles.AsNoTracking(), f => f.StudentProfileId, s => s.Id, (_, s) => s.UserId)
                .Distinct()
                .ToListAsync(ct);

            if (userIds.Count == 0)
                return;

            var title = "New event from a Student Organization";
            var body = $"{organizationName} posted a new event: {eventTitle}";

            foreach (var userId in userIds)
            {
                await TryAddGenericAsync(
                    userId,
                    OrganizationEventCategory,
                    "organization_event",
                    organizationProfileId,
                    title,
                    body,
                    $"organization_event:{eventId}:{userId}",
                    ct);
            }
        }

        public async Task MarkChatScopeReadAsync(int userId, string scope, CancellationToken ct = default)
        {
            if (userId <= 0 || string.IsNullOrWhiteSpace(scope))
                return;

            var prefix = $"chat:{scope.Trim()}:";
            var rows = await _db.UserNotifications
                .Where(n => n.UserId == userId && n.Category == ChatCategory && n.ReadAt == null && n.DedupKey != null && n.DedupKey.StartsWith(prefix))
                .ToListAsync(ct);

            if (rows.Count == 0)
                return;

            var now = DateTime.UtcNow;
            foreach (var row in rows)
                row.ReadAt = now;

            await _db.SaveChangesAsync(ct);
        }
        public async Task<int?> NotifyCourseTeammateInvitationPendingAsync(
            int receiverUserId,
            int courseProjectId,
            string senderName,
            string projectTitle,
            string dedupKey,
            CancellationToken ct = default)
        {
            LogInvitationEvent("INVITATION CREATED", "course_team", courseProjectId, receiverUserId);

            await ClearStaleCourseInvitationDedupAsync(receiverUserId, dedupKey, ct);

            if (await ShouldSkipDedupAsync(receiverUserId, dedupKey, ct))
            {
                _logger.LogWarning(
                    "[Notifications] NOTIFICATION SKIPPED flow=course_team projectId={ProjectId} recipientUserId={RecipientUserId} reason=dedup_exists dedupKey={DedupKey}",
                    courseProjectId, receiverUserId, dedupKey);
                return null;
            }

            var notification = new UserNotification
            {
                UserId = receiverUserId,
                Category = CourseCategory,
                EventType = "course_teammate_invitation_pending",
                ProjectId = courseProjectId,
                Title = "Team request received",
                Body = $"{senderName} invited you to join their team for \"{projectTitle}\".",
                DedupKey = dedupKey,
                CreatedAt = DateTime.UtcNow,
                ReadAt = null,
            };

            return await PersistAndPushAsync(notification, ct, "course_team", courseProjectId);
        }

        public async Task NotifyCourseTeammateInvitationAcceptedAsync(
            int senderUserId,
            int courseProjectId,
            int invitationNotificationId,
            string receiverName,
            string projectTitle,
            CancellationToken ct = default)
        {
            var name = string.IsNullOrWhiteSpace(receiverName) ? "A student" : receiverName.Trim();
            var title = string.IsNullOrWhiteSpace(projectTitle) ? "the course project" : projectTitle.Trim();
            await TryAddGenericAsync(
                senderUserId,
                CourseCategory,
                "course_teammate_invitation_accepted",
                courseProjectId,
                "Invitation accepted",
                $"{name} accepted your invitation.",
                $"course-team-invite-accepted:{invitationNotificationId}",
                ct,
                flow: "course_team",
                invitationId: invitationNotificationId);
        }

        public async Task NotifyCourseTeammateInvitationRejectedAsync(
            int senderUserId,
            int courseProjectId,
            string receiverName,
            string projectTitle,
            CancellationToken ct = default)
        {
            var name = string.IsNullOrWhiteSpace(receiverName) ? "A student" : receiverName.Trim();
            await TryAddGenericAsync(
                senderUserId,
                CourseCategory,
                "course_teammate_invitation_rejected",
                courseProjectId,
                "Invitation rejected",
                $"{name} rejected your invitation.",
                $"course-team-invite-rejected:{courseProjectId}:{senderUserId}:{DateTime.UtcNow.Ticks}",
                ct,
                flow: "course_team",
                invitationId: courseProjectId);
        }

        public async Task PushStoredNotificationAsync(int notificationId, CancellationToken ct = default)
        {
            var notification = await _db.UserNotifications
                .AsNoTracking()
                .FirstOrDefaultAsync(n => n.Id == notificationId, ct);

            if (notification == null)
            {
                _logger.LogWarning(
                    "[Notifications] SIGNALR SKIPPED notificationId={NotificationId} reason=row_not_found",
                    notificationId);
                return;
            }

            await PushRealtimeAsync(notification, ct);
        }

        public async Task NotifyCompanyRequestInvitationReceivedAsync(
            int invitationId,
            int studentProfileId,
            int companyProfileId,
            int requestId,
            string companyName,
            string requestTitle,
            CancellationToken ct = default)
        {
            LogInvitationEvent("INVITATION CREATED", "company_request", invitationId, studentProfileId);

            var studentUserId = await GetStudentUserIdAsync(studentProfileId, ct);
            if (!studentUserId.HasValue)
            {
                _logger.LogWarning(
                    "[Notifications] NOTIFICATION SKIPPED flow=company_request invitationId={InvitationId} reason=student_user_not_found studentProfileId={StudentProfileId}",
                    invitationId, studentProfileId);
                return;
            }

            await TryAddGenericAsync(
                studentUserId.Value,
                CompanyCategory,
                "company_request_invitation_received",
                requestId,
                "Company invitation received",
                $"{companyName} invited you to join \"{requestTitle}\".",
                $"company:invite:{invitationId}:{studentUserId.Value}",
                ct,
                flow: "company_request",
                invitationId: invitationId);
        }

        public async Task NotifyCompanyRequestInvitationCancelledAsync(
            int invitationId,
            int studentProfileId,
            int companyProfileId,
            int requestId,
            string companyName,
            string requestTitle,
            CancellationToken ct = default)
        {
            var studentUserId = await GetStudentUserIdAsync(studentProfileId, ct);
            if (!studentUserId.HasValue) return;

            await TryAddGenericAsync(
                studentUserId.Value,
                CompanyCategory,
                "company_request_invitation_cancelled",
                requestId,
                "Company invitation cancelled",
                $"{companyName} cancelled your invitation to \"{requestTitle}\".",
                $"company:invite_cancel:{invitationId}:{studentUserId.Value}",
                ct,
                flow: "company_request",
                invitationId: invitationId);
        }

        public async Task NotifyCompanyRequestInvitationAcceptedAsync(
            int invitationId,
            int companyProfileId,
            int requestId,
            string companyName,
            string requestTitle,
            string studentName,
            CancellationToken ct = default)
        {
            var recipients = await GetCompanyRecipientsAsync(
                companyProfileId,
                ownersOnly: true,
                _ => true,
                excludeUserId: null,
                ct: ct);

            var title = "Invitation accepted";
            var body = $"{studentName} accepted your invitation to \"{requestTitle}\".";
            foreach (var userId in recipients)
            {
                await TryAddGenericAsync(
                    userId,
                    CompanyCategory,
                    "company_request_invitation_accepted",
                    requestId,
                    title,
                    body,
                    $"company:invite_accept:{invitationId}:{userId}",
                    ct,
                    flow: "company_request",
                    invitationId: invitationId);
            }
        }

        public async Task NotifyCompanyRequestInvitationRejectedAsync(
            int invitationId,
            int companyProfileId,
            int requestId,
            string companyName,
            string requestTitle,
            string studentName,
            CancellationToken ct = default)
        {
            var recipients = await GetCompanyRecipientsAsync(
                companyProfileId,
                ownersOnly: true,
                _ => true,
                excludeUserId: null,
                ct: ct);

            var title = "Invitation declined";
            var body = $"{studentName} declined your invitation to \"{requestTitle}\".";
            foreach (var userId in recipients)
            {
                await TryAddGenericAsync(
                    userId,
                    CompanyCategory,
                    "company_request_invitation_rejected",
                    requestId,
                    title,
                    body,
                    $"company:invite_reject:{invitationId}:{userId}",
                    ct,
                    flow: "company_request",
                    invitationId: invitationId);
            }
        }

        private async Task TryAddAsync(
            int userId,
            string eventType,
            int? projectId,
            string title,
            string body,
            string? dedupKey,
            CancellationToken ct,
            string? flow = null,
            int? invitationId = null)
        {
            if (await ShouldSkipDedupAsync(userId, dedupKey, ct))
            {
                _logger.LogWarning(
                    "[Notifications] NOTIFICATION SKIPPED flow={Flow} invitationId={InvitationId} recipientUserId={RecipientUserId} reason=dedup_exists dedupKey={DedupKey}",
                    flow ?? "graduation_project", invitationId, userId, dedupKey);
                return;
            }

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
            await PersistAndPushAsync(notification, ct, flow ?? Category, invitationId);
        }

        private async Task TryAddGenericAsync(
            int userId,
            string category,
            string eventType,
            int? projectId,
            string title,
            string body,
            string? dedupKey,
            CancellationToken ct,
            string? flow = null,
            int? invitationId = null)
        {
            if (await ShouldSkipDedupAsync(userId, dedupKey, ct))
            {
                _logger.LogWarning(
                    "[Notifications] NOTIFICATION SKIPPED flow={Flow} invitationId={InvitationId} recipientUserId={RecipientUserId} reason=dedup_exists dedupKey={DedupKey}",
                    flow ?? category, invitationId, userId, dedupKey);
                return;
            }

            var notification = new UserNotification
            {
                UserId = userId,
                Category = category,
                EventType = eventType,
                ProjectId = projectId,
                Title = title,
                Body = body,
                DedupKey = dedupKey,
                CreatedAt = DateTime.UtcNow,
                ReadAt = null,
            };
            await PersistAndPushAsync(notification, ct, flow ?? category, invitationId);
        }

        private async Task<int?> PersistAndPushAsync(
            UserNotification notification,
            CancellationToken ct,
            string flow,
            int? invitationId)
        {
            _db.UserNotifications.Add(notification);
            try
            {
                await _db.SaveChangesAsync(ct);
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(
                    ex,
                    "[Notifications] NOTIFICATION FAILED flow={Flow} invitationId={InvitationId} recipientUserId={RecipientUserId} eventType={EventType} dedupKey={DedupKey}",
                    flow, invitationId, notification.UserId, notification.EventType, notification.DedupKey);
                throw;
            }

            _logger.LogInformation(
                "[Notifications] NOTIFICATION CREATED flow={Flow} invitationId={InvitationId} notificationId={NotificationId} recipientUserId={RecipientUserId} category={Category} eventType={EventType}",
                flow, invitationId, notification.Id, notification.UserId, notification.Category, notification.EventType);

            await PushRealtimeAsync(notification, ct);
            return notification.Id;
        }

        private async Task ClearStaleCourseInvitationDedupAsync(int receiverUserId, string dedupKey, CancellationToken ct)
        {
            var staleRows = await _db.UserNotifications
                .Where(n =>
                    n.UserId == receiverUserId &&
                    n.Category == CourseCategory &&
                    n.DedupKey == dedupKey &&
                    n.EventType != "course_teammate_invitation_pending")
                .ToListAsync(ct);

            if (staleRows.Count == 0) return;

            foreach (var row in staleRows)
                row.DedupKey = null;

            await _db.SaveChangesAsync(ct);
            _logger.LogInformation(
                "[Notifications] Cleared {Count} stale course invitation dedup row(s) for userId={UserId} dedupKey={DedupKey}",
                staleRows.Count, receiverUserId, dedupKey);
        }

        private void LogInvitationEvent(string phase, string flow, int invitationId, int recipientProfileOrUserId) =>
            _logger.LogInformation(
                "[Notifications] {Phase} flow={Flow} invitationId={InvitationId} recipientRef={RecipientRef}",
                phase, flow, invitationId, recipientProfileOrUserId);

        private async Task AddManyParallelBodiesAsync(
            IEnumerable<int> userIds,
            string eventType,
            int? projectId,
            string title,
            string body,
            CancellationToken ct)
            => await AddManyByCategoryAsync(userIds, Category, eventType, projectId, title, body, ct);

        private async Task AddManyByCategoryAsync(
            IEnumerable<int> userIds,
            string category,
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
                    Category = category,
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

        private async Task<HashSet<int>> GetCourseRecipientUserIdsAsync(
            int courseId,
            bool applyToAllSections,
            IEnumerable<int> sectionIds,
            CancellationToken ct)
        {
            var targetSectionIds = applyToAllSections
                ? await _db.CourseSections
                    .AsNoTracking()
                    .Where(s => s.CourseId == courseId)
                    .Select(s => s.Id)
                    .ToListAsync(ct)
                : sectionIds
                    .Distinct()
                    .ToList();

            if (targetSectionIds.Count == 0)
                return new HashSet<int>();

            var recipients = await _db.SectionEnrollments
                .AsNoTracking()
                .Where(e => targetSectionIds.Contains(e.CourseSectionId))
                .Join(_db.StudentProfiles.AsNoTracking(), e => e.StudentProfileId, s => s.Id, (_, s) => s.UserId)
                .Distinct()
                .ToListAsync(ct);

            return recipients.ToHashSet();
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

        private async Task<int?> GetProjectOwnerUserIdAsync(int projectId, CancellationToken ct) =>
            await _db.StudentProjects
                .AsNoTracking()
                .Where(p => p.Id == projectId)
                .Join(_db.StudentProfiles.AsNoTracking(), p => p.OwnerId, s => s.Id, (_, s) => (int?)s.UserId)
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
            try
            {
                await _hubContext.Clients
                    .User(notification.UserId.ToString())
                    .SendAsync("NotificationCreated", new
                    {
                        notification.Id,
                        notification.Title,
                        notification.Body,
                        notification.EventType,
                        notification.Category,
                        notification.ProjectId,
                        notification.DedupKey,
                        notification.CreatedAt,
                        notification.ReadAt,
                    }, ct);

                _logger.LogInformation(
                    "[Notifications] SIGNALR SENT notificationId={NotificationId} recipientUserId={RecipientUserId} eventType={EventType} category={Category}",
                    notification.Id, notification.UserId, notification.EventType, notification.Category);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "[Notifications] SIGNALR FAILED notificationId={NotificationId} recipientUserId={RecipientUserId} eventType={EventType}",
                    notification.Id, notification.UserId, notification.EventType);
            }
        }

        // ── COMPANY WORKSPACE ────────────────────────────────────────────────

        public async Task NotifyCompanyAiRecommendationsReadyAsync(
            int companyProfileId,
            int requestId,
            string requestLabel,
            int runId,
            bool isTeamRecommendations,
            int? actorUserId = null,
            CancellationToken ct = default)
        {
            var recipients = await GetCompanyRecipientsAsync(
                companyProfileId,
                ownersOnly: false,
                p => p?.NotifyAiRecommendations ?? true,
                actorUserId,
                ct: ct);

            if (recipients.Count == 0)
                return;

            var title = "New AI recommendations";
            var body = $"New AI recommendations are available for {requestLabel}.";
            var eventType = isTeamRecommendations
                ? "company_team_recommendations_ready"
                : "company_ai_recommendations_ready";
            var dedupSuffix = isTeamRecommendations
                ? $"team_run:{runId}"
                : $"student_run:{runId}";

            await AddManyCompanyWithDedupAsync(
                recipients,
                eventType,
                requestId,
                title,
                body,
                dedupSuffix,
                ct);
        }

        public async Task NotifyCompanyStudentRecommendationSavedAsync(
            int companyProfileId,
            int requestId,
            string requestLabel,
            string actorName,
            string studentName,
            int? actorUserId = null,
            CancellationToken ct = default)
        {
            var recipients = await GetCompanyRecipientsAsync(
                companyProfileId,
                ownersOnly: true,
                p => p?.NotifySavedRecommendations ?? true,
                actorUserId,
                excludeActor: false,
                ct: ct);

            if (recipients.Count == 0)
                return;

            var title = "Recommendation saved";
            var body = $"{actorName} saved {studentName} for {requestLabel}.";
            await AddManyByCategoryAsync(
                recipients,
                CompanyCategory,
                "company_student_recommendation_saved",
                requestId,
                title,
                body,
                ct);
        }

        public async Task NotifyCompanyTeamRecommendationSavedAsync(
            int companyProfileId,
            int requestId,
            string requestLabel,
            string actorName,
            int teamRank,
            int? actorUserId = null,
            CancellationToken ct = default)
        {
            var recipients = await GetCompanyRecipientsAsync(
                companyProfileId,
                ownersOnly: true,
                p => p?.NotifySavedRecommendations ?? true,
                actorUserId,
                excludeActor: false,
                ct: ct);

            if (recipients.Count == 0)
                return;

            var title = "Team recommendation saved";
            var body = $"{actorName} saved Team #{teamRank} for {requestLabel}.";
            await AddManyByCategoryAsync(
                recipients,
                CompanyCategory,
                "company_team_recommendation_saved",
                requestId,
                title,
                body,
                ct);
        }

        public async Task NotifyCompanyRequestStatusChangedAsync(
            int companyProfileId,
            int requestId,
            string requestLabel,
            string lifecycleStatus,
            int? actorUserId = null,
            CancellationToken ct = default)
        {
            var recipients = await GetCompanyRecipientsAsync(
                companyProfileId,
                ownersOnly: false,
                p => p?.NotifyRequestStatusUpdates ?? true,
                actorUserId,
                ct: ct);

            if (recipients.Count == 0)
                return;

            var (title, body, eventType) = lifecycleStatus switch
            {
                CompanyRequestLifecycleStatus.Paused => (
                    "Request paused",
                    $"{requestLabel} request was paused.",
                    "company_request_paused"),
                CompanyRequestLifecycleStatus.Active => (
                    "Request reactivated",
                    $"{requestLabel} request was reactivated.",
                    "company_request_reactivated"),
                CompanyRequestLifecycleStatus.Closed => (
                    "Request closed",
                    $"{requestLabel} request was closed.",
                    "company_request_closed"),
                _ => (null, null, null),
            };

            if (title == null || body == null || eventType == null)
                return;

            await AddManyByCategoryAsync(
                recipients,
                CompanyCategory,
                eventType,
                requestId,
                title,
                body,
                ct);
        }

        public async Task NotifyCompanyMemberAddedAsync(
            int companyProfileId,
            string memberName,
            int? actorUserId = null,
            CancellationToken ct = default)
        {
            var recipients = await GetCompanyRecipientsAsync(
                companyProfileId,
                ownersOnly: true,
                p => p?.NotifyWorkspaceMemberChanges ?? true,
                actorUserId,
                excludeActor: false,
                ct: ct);

            if (recipients.Count == 0)
                return;

            var title = "Workspace member added";
            var body = $"{memberName} was added to the workspace.";
            await AddManyByCategoryAsync(
                recipients,
                CompanyCategory,
                "company_member_added",
                companyProfileId,
                title,
                body,
                ct);
        }

        public async Task NotifyCompanyMemberRemovedAsync(
            int companyProfileId,
            string memberName,
            int? actorUserId = null,
            CancellationToken ct = default)
        {
            var recipients = await GetCompanyRecipientsAsync(
                companyProfileId,
                ownersOnly: true,
                p => p?.NotifyWorkspaceMemberChanges ?? true,
                actorUserId,
                excludeActor: false,
                ct: ct);

            if (recipients.Count == 0)
                return;

            var title = "Workspace member removed";
            var body = $"{memberName} was removed from the workspace.";
            await AddManyByCategoryAsync(
                recipients,
                CompanyCategory,
                "company_member_removed",
                companyProfileId,
                title,
                body,
                ct);
        }

        private async Task<List<int>> GetCompanyRecipientsAsync(
            int companyProfileId,
            bool ownersOnly,
            Func<CompanyMemberNotificationPreference?, bool> isEnabled,
            int? excludeUserId,
            bool excludeActor = true,
            CancellationToken ct = default)
        {
            var memberIds = new List<int>();

            if (ownersOnly)
            {
                memberIds = await _db.CompanyMembers
                    .AsNoTracking()
                    .Where(m =>
                        m.CompanyProfileId == companyProfileId &&
                        m.Role == CompanyMemberRoles.Owner)
                    .Select(m => m.UserId)
                    .ToListAsync(ct);

                var profileOwnerId = await _db.CompanyProfiles
                    .AsNoTracking()
                    .Where(p => p.Id == companyProfileId)
                    .Select(p => (int?)p.UserId)
                    .FirstOrDefaultAsync(ct);

                if (profileOwnerId.HasValue && !memberIds.Contains(profileOwnerId.Value))
                    memberIds.Add(profileOwnerId.Value);
            }
            else
            {
                memberIds = await _db.CompanyMembers
                    .AsNoTracking()
                    .Where(m => m.CompanyProfileId == companyProfileId)
                    .Select(m => m.UserId)
                    .ToListAsync(ct);
            }

            if (excludeActor && excludeUserId.HasValue)
                memberIds = memberIds.Where(id => id != excludeUserId.Value).ToList();

            if (memberIds.Count == 0)
                return memberIds;

            var prefs = await _db.CompanyMemberNotificationPreferences
                .AsNoTracking()
                .Where(p =>
                    p.CompanyProfileId == companyProfileId &&
                    memberIds.Contains(p.UserId))
                .ToDictionaryAsync(p => p.UserId, ct);

            return memberIds
                .Where(userId => isEnabled(prefs.GetValueOrDefault(userId)))
                .Distinct()
                .ToList();
        }

        private async Task AddManyCompanyWithDedupAsync(
            IEnumerable<int> userIds,
            string eventType,
            int? projectId,
            string title,
            string body,
            string dedupSuffix,
            CancellationToken ct)
        {
            foreach (var userId in userIds.Distinct())
            {
                await TryAddGenericAsync(
                    userId,
                    CompanyCategory,
                    eventType,
                    projectId,
                    title,
                    body,
                    $"company:{dedupSuffix}:{userId}",
                    ct);
            }
        }
    }
}

