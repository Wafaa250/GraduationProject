namespace GraduationProject.API.Models
{
    public class Course
    {
        public int Id { get; set; }

        public string Name { get; set; } = string.Empty;

        public string Code { get; set; } = string.Empty;

        public string? Semester { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // FK → doctor_profiles.id
        public int DoctorId { get; set; }

        // Navigation
        public DoctorProfile Doctor { get; set; } = null!;
    }
}