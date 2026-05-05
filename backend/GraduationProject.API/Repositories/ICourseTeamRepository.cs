using GraduationProject.API.Models;

namespace GraduationProject.API.Interfaces
{
    public interface ICourseTeamRepository
    {
        /// <summary>Returns saved teams for one course project only.</summary>
        Task<IEnumerable<CourseTeam>> GetTeamsByProjectAsync(int projectId);

        /// <summary>Removes all teams (and members) for <paramref name="projectId"/> only.</summary>
        Task DeleteTeamsForProjectAsync(int projectId);

        /// <summary>Atomically replaces teams for <paramref name="projectId"/>; other projects are untouched.</summary>
        Task<IEnumerable<CourseTeam>> SaveTeamsAsync(int projectId, List<CourseTeam> teams);

        Task<CourseTeam?> GetTeamByIndexAsync(int projectId, int teamIndex);

        Task AddMemberAsync(int teamId, int studentProfileId, int userId);
        Task RemoveMemberAsync(int teamId, int studentProfileId);
    }
}
