using System.ComponentModel.DataAnnotations;

namespace GraduationProject.API.DTOs
{
    // ── Request ───────────────────────────────────────────────────────────────

    public class CreateCourseProjectDto
    {
        [Required]
        [StringLength(300, MinimumLength = 1)]
        public string Title { get; set; } = string.Empty;

        [StringLength(2000)]
        public string? Description { get; set; }

        [Range(1, 50)]
        public int TeamSize { get; set; } = 4;

        /// <summary>If true, SectionIds is ignored and all course sections are targeted.</summary>
        public bool ApplyToAllSections { get; set; } = true;

        /// <summary>Only relevant when ApplyToAllSections = true.</summary>
        public bool AllowCrossSectionTeams { get; set; } = false;

        /// <summary>"doctor" | "student"</summary>
        [StringLength(20)]
        public string AiMode { get; set; } = "doctor";

        /// <summary>
        /// When ApplyToAllSections = false, specifies which section IDs this project targets.
        /// Ignored when ApplyToAllSections = true.
        /// </summary>
        public List<int> SectionIds { get; set; } = new();
    }

    /// <summary>Same shape as create — full replacement.</summary>
    public class UpdateCourseProjectDto : CreateCourseProjectDto { }

    public class AddTeamMemberDto
    {
        [Required]
        [StringLength(100)]
        public string UniversityId { get; set; } = string.Empty;
    }

    // ── Response ──────────────────────────────────────────────────────────────

    public class CourseProjectSectionDto
    {
        public int SectionId { get; set; }
        public string SectionName { get; set; } = string.Empty;
    }

    /// <summary>
    /// Matches the DoctorCourseProject interface in doctorCoursesApi.ts.
    /// </summary>
    public class CourseProjectResponseDto
    {
        public int Id { get; set; }
        public int CourseId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int TeamSize { get; set; }
        public bool ApplyToAllSections { get; set; }
        public bool AllowCrossSectionTeams { get; set; }
        public string AiMode { get; set; } = "doctor";
        public DateTime CreatedAt { get; set; }
        public List<CourseProjectSectionDto> Sections { get; set; } = new();
    }
}
