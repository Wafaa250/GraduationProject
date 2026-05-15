using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using GraduationProject.API.DTOs;

namespace GraduationProject.API.Services
{
    public interface IGraduationProjectNotificationService
    {
        Task NotifyProjectCreatedAsync(int projectId, string projectName, int ownerStudentProfileId, CancellationToken ct = default);

        Task NotifyProjectUpdatedAsync(
            int projectId,
            string projectName,
            int actorUserId,
            CancellationToken ct = default);

        Task NotifyProjectDeletedAsync(
            int projectId,
            string projectName,
            int actorUserId,
            CancellationToken ct = default);

        Task NotifyMemberJoinedAsync(
            int projectId,
            string projectName,
            int joinedStudentProfileId,
            CancellationToken ct = default);

        Task NotifyMemberLeftAsync(
            int projectId,
            string projectName,
            int leftStudentProfileId,
            CancellationToken ct = default);

        Task NotifyMemberRemovedAsync(
            int projectId,
            string projectName,
            int removedStudentProfileId,
            int actorUserId,
            CancellationToken ct = default);

        Task NotifyLeaderChangedAsync(
            int projectId,
            string projectName,
            int oldLeaderStudentProfileId,
            int newLeaderStudentProfileId,
            CancellationToken ct = default);

        Task NotifyInvitationReceivedAsync(
            int invitationId,
            int projectId,
            string projectName,
            int senderStudentProfileId,
            int receiverStudentProfileId,
            CancellationToken ct = default);

        Task NotifyInvitationRejectedAsync(
            int invitationId,
            int projectId,
            string projectName,
            int senderStudentProfileId,
            int receiverStudentProfileId,
            CancellationToken ct = default);

        Task NotifyInvitationCancelledBySenderAsync(
            int invitationId,
            int projectId,
            string projectName,
            int senderStudentProfileId,
            int receiverStudentProfileId,
            CancellationToken ct = default);

        Task NotifyInvitationExpiredAfterAcceptanceAsync(
            int invitationId,
            int projectId,
            string projectName,
            int senderStudentProfileId,
            int acceptedStudentProfileId,
            string acceptedProjectName,
            CancellationToken ct = default);

        Task NotifySupervisionRequestReceivedAsync(
            int supervisorRequestId,
            int projectId,
            string projectName,
            int leaderStudentProfileId,
            int doctorProfileId,
            CancellationToken ct = default);

        Task NotifySupervisionRequestAcceptedAsync(
            int supervisorRequestId,
            int projectId,
            string projectName,
            int senderStudentProfileId,
            int doctorProfileId,
            CancellationToken ct = default);

        Task NotifySupervisionRequestRejectedAsync(
            int supervisorRequestId,
            int projectId,
            string projectName,
            int senderStudentProfileId,
            int doctorProfileId,
            CancellationToken ct = default);

        Task NotifySupervisionRequestAutoRejectedAsync(
            int supervisorRequestId,
            int projectId,
            string projectName,
            int doctorProfileId,
            int acceptedDoctorProfileId,
            CancellationToken ct = default);

        Task NotifySupervisorCancellationRequestedAsync(
            int cancellationRequestId,
            int projectId,
            string projectName,
            int leaderStudentProfileId,
            int doctorProfileId,
            CancellationToken ct = default);

        Task NotifySupervisorCancellationAcceptedAsync(
            int cancellationRequestId,
            int projectId,
            string projectName,
            int leaderStudentProfileId,
            int doctorProfileId,
            CancellationToken ct = default);

        Task NotifySupervisorCancellationRejectedAsync(
            int cancellationRequestId,
            int projectId,
            string projectName,
            int leaderStudentProfileId,
            int doctorProfileId,
            CancellationToken ct = default);

        Task NotifySupervisionCancelledByDoctorAsync(
            int projectId,
            string projectName,
            int doctorProfileId,
            CancellationToken ct = default);

        Task NotifyDirectMessageAsync(
            int conversationId,
            int messageId,
            int senderUserId,
            string senderName,
            string previewText,
            IEnumerable<int> recipientUserIds,
            DateTime createdAt,
            CancellationToken ct = default);

        Task NotifyConversationStartedAsync(
            int conversationId,
            int starterUserId,
            string starterName,
            IEnumerable<int> recipientUserIds,
            CancellationToken ct = default);

        Task NotifyMessageEditedAsync(
            int conversationId,
            MessageDto messagePayload,
            IEnumerable<int> recipientUserIds,
            CancellationToken ct = default);

        Task NotifyMessageDeletedAsync(
            int conversationId,
            MessageDto messagePayload,
            IEnumerable<int> recipientUserIds,
            CancellationToken ct = default);

        Task NotifySectionChatMessageAsync(
            int sectionId,
            int courseId,
            int senderUserId,
            string senderName,
            string previewText,
            IEnumerable<int> recipientUserIds,
            CancellationToken ct = default);

        Task NotifyTeamChatMessageAsync(
            int teamId,
            int projectId,
            int senderUserId,
            string senderName,
            string previewText,
            IEnumerable<int> recipientUserIds,
            CancellationToken ct = default);

        Task NotifyCourseProjectCreatedAsync(
            int courseProjectId,
            int courseId,
            string projectTitle,
            bool applyToAllSections,
            IEnumerable<int> sectionIds,
            CancellationToken ct = default);

        Task NotifyCourseProjectUpdatedAsync(
            int courseProjectId,
            int courseId,
            string projectTitle,
            bool applyToAllSections,
            IEnumerable<int> sectionIds,
            CancellationToken ct = default);

        Task NotifyCourseProjectDeletedAsync(
            int courseProjectId,
            int courseId,
            string projectTitle,
            bool applyToAllSections,
            IEnumerable<int> sectionIds,
            CancellationToken ct = default);

        Task NotifyCourseTeamsGeneratedAsync(
            int courseProjectId,
            string projectTitle,
            IEnumerable<int> assignedUserIds,
            CancellationToken ct = default);

        Task NotifyCourseTeamMemberAddedAsync(
            int courseProjectId,
            string projectTitle,
            int addedStudentProfileId,
            int newTeamIndex,
            IEnumerable<int> newTeamMemberUserIds,
            int? oldTeamIndex,
            IEnumerable<int>? oldTeamMemberUserIds,
            CancellationToken ct = default);

        Task NotifyCourseTeamMemberRemovedAsync(
            int courseProjectId,
            string projectTitle,
            int removedStudentProfileId,
            int teamIndex,
            IEnumerable<int> remainingTeamMemberUserIds,
            CancellationToken ct = default);

        Task NotifyStudentsAddedToSectionAsync(
            int sectionId,
            string sectionName,
            int courseId,
            string courseName,
            IEnumerable<int> studentProfileIds,
            CancellationToken ct = default);

        Task MarkChatScopeReadAsync(
            int userId,
            string scope,
            CancellationToken ct = default);

        Task NotifyOrganizationFollowersNewEventAsync(
            int organizationProfileId,
            string organizationName,
            int eventId,
            string eventTitle,
            CancellationToken ct = default);
    }
}

