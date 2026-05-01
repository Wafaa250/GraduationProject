namespace GraduationProject.API.Models
{
    public class SectionEnrollment
    {
        public int Id { get; set; }

        public int CourseSectionId { get; set; }

        public int StudentProfileId { get; set; }

        public DateTime EnrolledAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public CourseSection Section { get; set; } = null!;
        public StudentProfile Student { get; set; } = null!;
    }
}
