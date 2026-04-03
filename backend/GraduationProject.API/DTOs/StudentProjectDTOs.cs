// DTOs/StudentProjectDTOs.cs
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace GraduationProject.API.DTOs
{
    // ── Create ────────────────────────────────────────────────────────────────
    public class CreateStudentProjectDto
    {
        [Required(ErrorMessage = "Project name is required")]
        [MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        public string? Description { get; set; }

        // Skills كـ strings من الفرونت e.g. ["React", "Python"]
        public List<string> RequiredSkills { get; set; } = new();

        [Range(0, 10, ErrorMessage = "Partners count must be between 0 and 10")]
        public int PartnersCount { get; set; } = 0;
    }

    // ── Update ────────────────────────────────────────────────────────────────
    public class UpdateStudentProjectDto
    {
        [MaxLength(200)]
        public string? Name { get; set; }

        public string? Description { get; set; }

        public List<string>? RequiredSkills { get; set; }

        [Range(0, 10, ErrorMessage = "Partners count must be between 0 and 10")]
        public int? PartnersCount { get; set; }
    }

    // ── Member ────────────────────────────────────────────────────────────────
    public class StudentProjectMemberDto
    {
        public int StudentId { get; set; }   // StudentProfile.Id
        public int UserId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string University { get; set; } = string.Empty;
        public string Major { get; set; } = string.Empty;
        public string? ProfilePicture { get; set; }

        // ── Backend-only role ─────────────────────────────────────────────────
        // Possible values: "leader" | "member"
        // Kept in DTO for internal service-to-service use.
        // NOT intended for UI differentiation.
        public string Role { get; set; } = "member";

        public DateTime JoinedAt { get; set; }
    }

    // ── Response ──────────────────────────────────────────────────────────────
    public class StudentProjectResponseDto
    {
        public int Id { get; set; }
        public int OwnerId { get; set; }   // StudentProfile.Id
        public int OwnerUserId { get; set; }
        public string OwnerName { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public List<string> RequiredSkills { get; set; } = new();
        public int PartnersCount { get; set; }
        public int CurrentMembers { get; set; }
        public bool IsFull { get; set; }

        // ── Caller-aware helpers ──────────────────────────────────────────────
        /// <summary>True when the authenticated user is the project owner.</summary>
        public bool IsOwner { get; set; }

        /// <summary>
        /// How many more members can join.
        /// TotalCapacity = PartnersCount + 1 (leader occupies one slot).
        /// RemainingSeats = TotalCapacity - CurrentMembers  (min 0).
        /// </summary>
        public int RemainingSeats { get; set; }

        public List<StudentProjectMemberDto> Members { get; set; } = new();
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}