namespace GraduationProject.API.Models
{
    public class Course
    {
        public int Id { get; set; }

        public string Name { get; set; } = string.Empty;

        public string Code { get; set; } = string.Empty;

        public string? Semester { get; set; }

        public string? AcademicYear { get; set; }

        public string? Description { get; set; }

        public bool AllowCourseProjects { get; set; } = true;

        public bool AllowTeamFormation { get; set; } = true;

        public bool AllowAiTeamSuggestions { get; set; } = true;

        public bool AllowStudentCollaboration { get; set; } = true;

        /// <summary>"doctor" = AI generated teams | "student" = student selected teams.</summary>
        public string DefaultTeamFormationStrategy { get; set; } = "doctor";

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // FK → doctor_profiles.id
        public int DoctorId { get; set; }

        // Navigation
        public DoctorProfile Doctor { get; set; } = null!;
    }
}
