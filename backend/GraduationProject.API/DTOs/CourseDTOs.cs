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
    }

    public class CourseDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public int DoctorId { get; set; }
        public string DoctorName { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }

    public class CourseDetailDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public int DoctorId { get; set; }
        public string DoctorName { get; set; } = string.Empty;
        public int StudentCount { get; set; }
        public int TeamCount { get; set; }
        public DateTime CreatedAt { get; set; }

        /// <summary>Active project setting, if one exists.</summary>
        public CourseProjectSettingDto? ProjectSetting { get; set; }
    }

    // ══════════════════════════════════════════════════════════════════
    // ENROLLMENT
    // ══════════════════════════════════════════════════════════════════

    public class AddStudentsDto
    {
        [Required]
        [MinLength(1, ErrorMessage = "At least one studentId is required")]
        public List<string> StudentIds { get; set; } = new();
    }

    public class CourseStudentDto
    {
        public int Id { get; set; }          // StudentProfile.Id (duplicate-safe key)
        public int StudentId { get; set; }   // StudentProfile.Id
        public string UniversityId { get; set; } = string.Empty; // StudentProfile.StudentId (university ID string)
        public int UserId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string University { get; set; } = string.Empty;
        public string Major { get; set; } = string.Empty;
        public string AcademicYear { get; set; } = string.Empty;
        public string? ProfilePictureBase64 { get; set; }
        public DateTime EnrolledAt { get; set; }
    }

    // ══════════════════════════════════════════════════════════════════
    // PROJECT SETTING
    // ══════════════════════════════════════════════════════════════════

    public class UpsertCourseProjectSettingDto
    {
        [Required(ErrorMessage = "Title is required")]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        public string? Description { get; set; }

        [Range(2, 10, ErrorMessage = "Team size must be between 2 and 10")]
        public int TeamSize { get; set; } = 2;

        /// <summary>Optional project brief / specification file (PDF or any document).</summary>
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

        /// <summary>Relative URL of the uploaded file, null when no file has been attached.</summary>
        public string? FileUrl { get; set; }

        /// <summary>Original file name as provided by the uploader, null when no file has been attached.</summary>
        public string? FileName { get; set; }
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
}