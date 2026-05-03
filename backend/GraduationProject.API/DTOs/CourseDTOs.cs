using System.ComponentModel.DataAnnotations;

namespace GraduationProject.API.DTOs
{
    // ── Request ───────────────────────────────────────────────────────────────

    public class CreateCourseDto
    {
        [Required(ErrorMessage = "Course name is required.")]
        [StringLength(200, MinimumLength = 2)]
        public string Name { get; set; } = string.Empty;

        [Required(ErrorMessage = "Course code is required.")]
        [StringLength(50, MinimumLength = 1)]
        public string Code { get; set; } = string.Empty;

        [StringLength(100)]
        public string? Semester { get; set; }

    }

    // ── Response ──────────────────────────────────────────────────────────────

    /// <summary>
    /// Matches the DoctorCourse interface expected by the frontend.
    /// </summary>
    public class CourseResponseDto
    {
        public int CourseId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public string? Semester { get; set; }
        public DateTime CreatedAt { get; set; }
        public int DoctorId { get; set; }
        public string DoctorName { get; set; } = string.Empty;
    }
}