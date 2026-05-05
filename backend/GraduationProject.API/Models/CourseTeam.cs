namespace GraduationProject.API.Models
{
    public class CourseTeam
    {
        public int Id { get; set; }

        /// <summary>Teams are always scoped to a single course project; never shared across projects.</summary>
        public int CourseProjectId { get; set; }

        /// <summary>Display index used by frontend (0-based).</summary>
        public int TeamIndex { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public CourseProject Project { get; set; } = null!;
        public ICollection<CourseTeamMember> Members { get; set; } = new List<CourseTeamMember>();
    }

    public class CourseTeamMember
    {
        public int Id { get; set; }

        public int CourseTeamId { get; set; }

        public int StudentProfileId { get; set; }

        public int UserId { get; set; }

        public double MatchScore { get; set; }

        // Navigation
        public CourseTeam Team { get; set; } = null!;
        public StudentProfile Student { get; set; } = null!;
    }

    public class CourseTeamMessage
    {
        public int Id { get; set; }

        public int CourseTeamId { get; set; }

        public int SenderUserId { get; set; }

        public string Text { get; set; } = string.Empty;

        public DateTime SentAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public CourseTeam Team { get; set; } = null!;
        public User Sender { get; set; } = null!;
    }
}
