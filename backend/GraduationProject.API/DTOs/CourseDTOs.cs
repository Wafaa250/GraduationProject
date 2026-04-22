// DTOs/CourseDTOs.cs
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace GraduationProject.API.DTOs
{
    // ══════════════════════════════════════════════════════════════════
    // COURSE
    // ══════════════════════════════════════════════════════════════════

    public class CreateCourseDto
    {
        [Required(ErrorMessage = "Course name is required")]
        [MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        [Required(ErrorMessage = "Course code is required")]
        [MaxLength(50)]
        public string Code { get; set; } = string.Empty;

        // ── NEW ──────────────────────────────────────────────────────
        /// <summary>Optional semester label, e.g. "Fall 2025".</summary>
        [MaxLength(100)]
        public string? Semester { get; set; }

        /// <summary>
        /// true  (default) → all sections share ONE project setting.
        /// false           → each section has its own project setting.
        /// </summary>
        public bool UseSharedProjectAcrossSections { get; set; } = true;

        /// <summary>
        /// Applies only when UseSharedProjectAcrossSections == true.
        /// true  (default) → teams may cross sections.
        /// false           → teams must stay within the same section.
        /// </summary>
        public bool AllowCrossSectionTeams { get; set; } = true;
    }

    public class CourseDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public int DoctorId { get; set; }
        public string DoctorName { get; set; } = string.Empty;
        public string? Semester { get; set; }
        public bool UseSharedProjectAcrossSections { get; set; }
        public bool AllowCrossSectionTeams { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class CourseDetailDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public int DoctorId { get; set; }
        public string DoctorName { get; set; } = string.Empty;
        public string? Semester { get; set; }
        public bool UseSharedProjectAcrossSections { get; set; }
        public bool AllowCrossSectionTeams { get; set; }
        public int StudentCount { get; set; }
        public int TeamCount { get; set; }
        public int SectionCount { get; set; }
        public DateTime CreatedAt { get; set; }

        /// <summary>Active shared project setting (null when UseSharedProjectAcrossSections == false).</summary>
        public CourseProjectSettingDto? ProjectSetting { get; set; }

        /// <summary>All sections of this course.</summary>
        public List<CourseSectionDto> Sections { get; set; } = new();
    }

    // ══════════════════════════════════════════════════════════════════
    // COURSE SECTION  (NEW)
    // ══════════════════════════════════════════════════════════════════

    public class CreateCourseSectionDto
    {
        [Required(ErrorMessage = "Section number is required")]
        [Range(1, 999, ErrorMessage = "Section number must be between 1 and 999")]
        public int SectionNumber { get; set; }
    }

    public class CourseSectionDto
    {
        public int Id { get; set; }
        public int CourseId { get; set; }
        public int SectionNumber { get; set; }
        public int StudentCount { get; set; }
        public DateTime CreatedAt { get; set; }

        /// <summary>Active per-section project setting (null when UseSharedProjectAcrossSections == true).</summary>
        public SectionProjectSettingDto? ProjectSetting { get; set; }
    }

    // ══════════════════════════════════════════════════════════════════
    // ENROLLMENT
    // ══════════════════════════════════════════════════════════════════

    /// <summary>Enroll students into a course (no section assignment yet).</summary>
    public class AddStudentsDto
    {
        [Required]
        [MinLength(1, ErrorMessage = "At least one studentId is required")]
        public List<string> StudentIds { get; set; } = new();
    }

    /// <summary>Enroll/assign students directly into a specific section.</summary>
    public class AddStudentsToSectionDto
    {
        [Required]
        [MinLength(1, ErrorMessage = "At least one studentId is required")]
        public List<string> StudentIds { get; set; } = new();
    }

    public class CourseStudentDto
    {
        public int Id { get; set; }
        public int StudentId { get; set; }
        public string UniversityId { get; set; } = string.Empty;
        public int UserId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string University { get; set; } = string.Empty;
        public string Major { get; set; } = string.Empty;
        public string AcademicYear { get; set; } = string.Empty;
        public string? ProfilePictureBase64 { get; set; }
        public int? SectionId { get; set; }     // NEW
        public int? SectionNumber { get; set; }     // NEW — convenience field
        public DateTime EnrolledAt { get; set; }
    }

    // ══════════════════════════════════════════════════════════════════
    // PROJECT SETTING — SHARED (course-level)
    // ══════════════════════════════════════════════════════════════════

    public class UpsertCourseProjectSettingDto
    {
        [Required(ErrorMessage = "Title is required")]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        public string? Description { get; set; }

        [Range(2, 10, ErrorMessage = "Team size must be between 2 and 10")]
        public int TeamSize { get; set; } = 2;

        public IFormFile? File { get; set; }
    }

    public class CourseProjectSettingDto
    {
        public int Id { get; set; }
        public int CourseId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int TeamSize { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public string? FileUrl { get; set; }
        public string? FileName { get; set; }
    }

    // ══════════════════════════════════════════════════════════════════
    // PROJECT SETTING — PER SECTION  (NEW)
    // ══════════════════════════════════════════════════════════════════

    public class UpsertSectionProjectSettingDto
    {
        [Required(ErrorMessage = "Title is required")]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        public string? Description { get; set; }

        [Range(2, 10, ErrorMessage = "Team size must be between 2 and 10")]
        public int TeamSize { get; set; } = 2;
    }

    public class SectionProjectSettingDto
    {
        public int Id { get; set; }
        public int CourseSectionId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int TeamSize { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    // ══════════════════════════════════════════════════════════════════
    // PARTNER REQUESTS (GET /courses/{id}/partner-requests)
    // ══════════════════════════════════════════════════════════════════

    public class PartnerRequestParticipantDto
    {
        public int StudentId { get; set; }
        public string Name { get; set; } = string.Empty;
    }

    /// <summary>
    /// One row in the incoming or outgoing partner-request list.
    /// <see cref="Status"/> is always set: pending, accepted, rejected, or cancelled.
    /// </summary>
    public class PartnerRequestListItemDto
    {
        public int RequestId { get; set; }
        public string Direction { get; set; } = string.Empty;
        /// <summary>pending | accepted | rejected | cancelled</summary>
        public string Status { get; set; } = "pending";
        public int CourseId { get; set; }
        public int? TeamId { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? RespondedAt { get; set; }
        public PartnerRequestParticipantDto Sender { get; set; } = new();
        public PartnerRequestParticipantDto Receiver { get; set; } = new();
    }

    public class PartnerRequestsListDto
    {
        public List<PartnerRequestListItemDto> Incoming { get; set; } = new();
        public List<PartnerRequestListItemDto> Outgoing { get; set; } = new();
    }

    // ══════════════════════════════════════════════════════════════════
    // MULTI-PROJECT SUPPORT  (NEW)
    // ══════════════════════════════════════════════════════════════════

    /// <summary>
    /// Lightweight list item returned from GET /api/courses/{courseId}/projects
    /// and GET /api/courses/sections/{sectionId}/projects.
    ///
    /// Used to let the doctor see every project setting they have created for
    /// a course/section (active + inactive) so they can switch between them.
    /// </summary>
    public class CourseProjectSettingListItemDto
    {
        public int Id { get; set; }
        public int? CourseId { get; set; }           // populated for shared-course projects
        public int? CourseSectionId { get; set; }    // populated for per-section projects
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int TeamSize { get; set; }
        public bool IsActive { get; set; }
        public int TeamCount { get; set; }           // how many teams are using this project
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public string? FileUrl { get; set; }
        public string? FileName { get; set; }
    }
}