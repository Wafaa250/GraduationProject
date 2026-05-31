namespace GraduationProject.API.DTOs
{
    public class CourseWorkspaceStatsDto
    {
        public int Sections { get; set; }
        public int Students { get; set; }
        public int CourseProjectCount { get; set; }
    }

    public class CourseProjectWorkspaceDto : CourseProjectResponseDto
    {
        public int TeamCount { get; set; }
    }

    public class CourseSectionWorkspaceDto : CourseSectionResponseDto
    {
        public int StudentCount { get; set; }
        public int CourseProjectCount { get; set; }
    }

    public class CourseWorkspaceTeamDto
    {
        public int CourseProjectId { get; set; }
        public string CourseProjectTitle { get; set; } = string.Empty;
        public int TeamId { get; set; }
        public int TeamIndex { get; set; }
        public int MemberCount { get; set; }
        public List<CourseWorkspaceTeamMemberDto> Members { get; set; } = new();
    }

    public class CourseWorkspaceTeamMemberDto
    {
        public int StudentId { get; set; }
        public int UserId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? UniversityId { get; set; }
    }

    public class CourseWorkspaceResponseDto
    {
        public CourseResponseDto Course { get; set; } = null!;
        public CourseWorkspaceStatsDto Stats { get; set; } = null!;
        public List<CourseSectionWorkspaceDto> Sections { get; set; } = new();
        public List<SectionStudentResponseDto> Students { get; set; } = new();
        public List<CourseProjectWorkspaceDto> CourseProjects { get; set; } = new();
        public List<CourseWorkspaceTeamDto> Teams { get; set; } = new();
    }
}
