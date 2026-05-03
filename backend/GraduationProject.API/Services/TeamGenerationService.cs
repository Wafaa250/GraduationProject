namespace GraduationProject.API.Services
{
    /// <summary>Deterministic grouping by team size; replace with ML/AI when available.</summary>
    public class TeamGenerationService : ITeamGenerationService
    {
        public Task<GenerateTeamsResult> GenerateTeamsAsync(
            int projectId,
            string projectTitle,
            string? projectDescription,
            int teamSize,
            List<StudentForTeam> students)
        {
            _ = projectDescription;

            var size = Math.Max(1, teamSize);
            if (students.Count == 0)
            {
                return Task.FromResult(new GenerateTeamsResult(
                    ProjectId: projectId,
                    ProjectTitle: projectTitle,
                    TeamSize: size,
                    TeamCount: 0,
                    Teams: new List<GeneratedTeam>()));
            }

            var teams = new List<GeneratedTeam>();
            var teamIndex = 0;

            for (var i = 0; i < students.Count; i += size)
            {
                var chunk = students.Skip(i).Take(size).ToList();
                var members = new List<GeneratedTeamMember>();
                var j = 0;
                foreach (var s in chunk)
                {
                    members.Add(new GeneratedTeamMember(
                        StudentId: s.StudentProfileId,
                        UserId: s.UserId,
                        Name: s.Name,
                        MatchScore: 88.0 - (j * 3 % 12),
                        Skills: s.Skills
                    ));
                    j++;
                }

                teams.Add(new GeneratedTeam(
                    TeamIndex: teamIndex++,
                    MemberCount: members.Count,
                    Members: members
                ));
            }

            return Task.FromResult(new GenerateTeamsResult(
                projectId,
                projectTitle,
                size,
                teams.Count,
                teams));
        }
    }
}
