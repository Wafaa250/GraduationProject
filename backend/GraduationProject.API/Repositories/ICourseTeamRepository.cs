using GraduationProject.API.Models;

namespace GraduationProject.API.Interfaces
{
    public interface ICourseTeamRepository
    {
        /// <summary>Returns saved teams for a project. Empty if not generated yet.</summary>
        Task<IEnumerable<CourseTeam>> GetByProjectIdAsync(int projectId);

        /// <summary>Deletes all existing teams for a project then saves the new ones.</summary>
        Task<IEnumerable<CourseTeam>> SaveTeamsAsync(int projectId, List<CourseTeam> teams);

        Task<CourseTeam?> GetTeamByIndexAsync(int projectId, int teamIndex);

        Task AddMemberAsync(int teamId, int studentProfileId, int userId);
        Task RemoveMemberAsync(int teamId, int studentProfileId);
    }
}
