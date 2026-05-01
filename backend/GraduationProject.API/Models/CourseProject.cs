namespace GraduationProject.API.Models
{
    public class CourseProject
    {
        public int Id { get; set; }

        public int CourseId { get; set; }

        public string Title { get; set; } = string.Empty;

        public string? Description { get; set; }

        public int TeamSize { get; set; } = 2;

        /// <summary>When true, project applies to all sections of the course.</summary>
        public bool ApplyToAllSections { get; set; } = true;

        /// <summary>
        /// Only meaningful when ApplyToAllSections = true.
        /// Allows teams to include members from different sections.
        /// </summary>
        public bool AllowCrossSectionTeams { get; set; } = false;

        /// <summary>"doctor" = AI assigns teams | "student" = students choose partners.</summary>
        public string AiMode { get; set; } = "doctor";

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public Course Course { get; set; } = null!;
        public ICollection<CourseProjectSection> Sections { get; set; } = new List<CourseProjectSection>();
    }

    /// <summary>Join table: which sections a project targets when ApplyToAllSections = false.</summary>
    public class CourseProjectSection
    {
        public int Id { get; set; }
        public int CourseProjectId { get; set; }
        public int CourseSectionId { get; set; }

        public CourseProject Project { get; set; } = null!;
        public CourseSection Section { get; set; } = null!;
    }
}
