namespace GraduationProject.API.Models
{
    public class CourseSection
    {
        public int Id { get; set; }

        public int CourseId { get; set; }

        public string Name { get; set; } = string.Empty;

        /// <summary>JSON array stored as string e.g. ["mon","wed"]</summary>
        public string Days { get; set; } = "[]";

        public string? TimeFrom { get; set; }

        public string? TimeTo { get; set; }

        public int Capacity { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public Course Course { get; set; } = null!;
    }
}
