using System.Threading;
using System.Threading.Tasks;

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
    }
}
