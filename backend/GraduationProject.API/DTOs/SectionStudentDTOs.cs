using System.ComponentModel.DataAnnotations;

namespace GraduationProject.API.DTOs
{
    // ── Request ───────────────────────────────────────────────────────────────

    public class AddSectionStudentsDto
    {
        /// <summary>List of university student IDs (e.g. "2021001").</summary>
        [Required]
        [MinLength(1, ErrorMessage = "At least one student ID is required.")]
        public List<string> StudentIds { get; set; } = new();
    }

    // ── Response ──────────────────────────────────────────────────────────────

    /// <summary>
    /// Matches the DoctorCourseStudent interface expected by the frontend.
    /// </summary>
    public class SectionStudentResponseDto
    {
        public int StudentId { get; set; }
        public string? Name { get; set; }
        public string? UniversityId { get; set; }
        public string? University { get; set; }
        public string? Major { get; set; }
        public string? Email { get; set; }
        public DateTime EnrolledAt { get; set; }
    }

    // ── Add result ────────────────────────────────────────────────────────────

    public class AddSectionStudentsResultDto
    {
        public int Added { get; set; }
        public List<string> NotFound { get; set; } = new();
        public List<string> AlreadyEnrolled { get; set; } = new();
    }
}