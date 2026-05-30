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

        [Required(ErrorMessage = "Semester is required.")]
        [StringLength(100)]
        public string Semester { get; set; } = string.Empty;

        [Required(ErrorMessage = "Academic year is required.")]
        [StringLength(100)]
        public string AcademicYear { get; set; } = string.Empty;

        [StringLength(600)]
        public string? Description { get; set; }

        public bool AllowCourseProjects { get; set; } = true;

        public bool AllowTeamFormation { get; set; } = true;

        public bool AllowAiTeamSuggestions { get; set; } = true;

        public bool AllowStudentCollaboration { get; set; } = true;

        /// <summary>"doctor" (AI generated) or "student" (student selected).</summary>
        [StringLength(20)]
        public string DefaultTeamFormationStrategy { get; set; } = "doctor";
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
        public string? AcademicYear { get; set; }
        public string? Description { get; set; }
        public bool AllowCourseProjects { get; set; }
        public bool AllowTeamFormation { get; set; }
        public bool AllowAiTeamSuggestions { get; set; }
        public bool AllowStudentCollaboration { get; set; }
        public string DefaultTeamFormationStrategy { get; set; } = "doctor";
        public DateTime CreatedAt { get; set; }
        public int DoctorId { get; set; }
        public string DoctorName { get; set; } = string.Empty;
    }
}
