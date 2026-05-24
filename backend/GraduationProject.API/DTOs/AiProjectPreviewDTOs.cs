using System.Collections.Generic;

namespace GraduationProject.API.DTOs
{
    public class ProjectPreviewRequestDto
    {
        public string ProjectType { get; set; } = "GP";
        public string Title { get; set; } = string.Empty;
        public string? Abstract { get; set; }
        public List<string> RequiredSkills { get; set; } = new();
        public List<string> Technologies { get; set; } = new();
        public List<string> PreferredRoles { get; set; } = new();
        public List<string> RequiredRoles { get; set; } = new();
        public List<string> SkillPriorities { get; set; } = new();
        public List<string> Interests { get; set; } = new();
        public int TeamSize { get; set; } = 1;
    }

    public class ProjectPreviewStudentDto
    {
        public int StudentId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Major { get; set; } = string.Empty;
        public int MatchScore { get; set; }
        public List<string> Skills { get; set; } = new();
    }

    public class ProjectPreviewResponseDto
    {
        public bool IsAvailable { get; set; }
        public string? Message { get; set; }
        public int EstimatedCompatibleStudentsCount { get; set; }
        public int CompatibilityScore { get; set; }
        public List<string> TopMatchingSkills { get; set; } = new();
        public List<string> TopMatchingRoles { get; set; } = new();
        public string? DomainOverlapLabel { get; set; }
        public string? RoleCoverageLabel { get; set; }
        public List<ProjectPreviewStudentDto> TopRecommendedStudents { get; set; } = new();

        public static ProjectPreviewResponseDto Unavailable(string message) => new()
        {
            IsAvailable = false,
            Message = message,
        };
    }
}
