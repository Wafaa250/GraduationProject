namespace GraduationProject.API.Interfaces
{
    public class CourseTeamConversationResult
    {
        public int ConversationId { get; set; }
        public string Title { get; set; } = string.Empty;
        public int ParticipantCount { get; set; }
    }

    public interface ICourseTeamConversationService
    {
        Task<CourseTeamConversationResult?> EnsureTeamConversationAsync(int teamId);

        Task SyncTeamConversationParticipantsAsync(int teamId);

        Task EnsureTeamConversationsForProjectAsync(int projectId);

        Task<bool> CanUserAccessTeamAsync(int userId, int teamId);
    }
}
