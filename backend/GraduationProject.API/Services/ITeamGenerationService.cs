namespace GraduationProject.API.Services
{
    public record StudentForTeam(
        int StudentProfileId,
        int UserId,
        string Name,
        List<string> Skills,
        string? Major,
        string? Bio
    );

    public record GeneratedTeamMember(
        int StudentId,
        int UserId,
        string Name,
        double MatchScore,
        List<string> Skills
    );

    public record GeneratedTeam(
        int TeamIndex,
        int MemberCount,
        List<GeneratedTeamMember> Members
    );

    public record GenerateTeamsResult(
        int ProjectId,
        string ProjectTitle,
        int TeamSize,
        int TeamCount,
        List<GeneratedTeam> Teams
    );

    public interface ITeamGenerationService
    {
        Task<GenerateTeamsResult> GenerateTeamsAsync(
            int courseId,
            int projectId,
            string projectTitle,
            string? projectDescription,
            int teamSize,
            List<StudentForTeam> students);
    }
}
