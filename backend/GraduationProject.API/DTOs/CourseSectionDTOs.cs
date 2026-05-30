using System.ComponentModel.DataAnnotations;

namespace GraduationProject.API.DTOs
{
    // ── Request ───────────────────────────────────────────────────────────────

    public class CreateCourseSectionDto
    {
        [Required(ErrorMessage = "Section name is required.")]
        [StringLength(200, MinimumLength = 1)]
        public string Name { get; set; } = string.Empty;

        /// <summary>e.g. ["mon","wed","fri"]</summary>
        public List<string> Days { get; set; } = new();

        /// <summary>HH:mm format e.g. "09:00"</summary>
        [StringLength(5)]
        public string? TimeFrom { get; set; }

        /// <summary>HH:mm format e.g. "11:00"</summary>
        [StringLength(5)]
        public string? TimeTo { get; set; }

        [Range(1, 10000, ErrorMessage = "Capacity must be at least 1.")]
        public int Capacity { get; set; }
    }

    // ── Response ──────────────────────────────────────────────────────────────

    public class CourseSectionResponseDto
    {
        public int Id { get; set; }
        public int CourseId { get; set; }
        public string Name { get; set; } = string.Empty;
        public List<string> Days { get; set; } = new();
        public string? TimeFrom { get; set; }
        public string? TimeTo { get; set; }
        public int Capacity { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
