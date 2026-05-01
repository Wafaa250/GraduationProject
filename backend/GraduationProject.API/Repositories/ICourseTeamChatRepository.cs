using GraduationProject.API.Models;

namespace GraduationProject.API.Interfaces
{
    public interface ICourseTeamChatRepository
    {
        Task<IEnumerable<CourseTeamMessage>> GetMessagesAsync(int courseTeamId, int limit = 100);
        Task<CourseTeamMessage> SendMessageAsync(CourseTeamMessage message);
        Task<bool> IsTeamMemberAsync(int courseTeamId, int userId);
    }
}
