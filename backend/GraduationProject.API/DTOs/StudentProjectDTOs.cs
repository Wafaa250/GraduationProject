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

        public string? Abstract { get; set; }

        /// <summary>
        /// Required for Engineering &amp; IT faculty students: "GP1" | "GP2" | "GP".
        /// For all other faculties, always "GP" (set automatically by the server).
        /// </summary>
        public string ProjectType { get; set; } = "GP";

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

        public string? Abstract { get; set; }

        public string? ProjectType { get; set; }

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

    // 🟢 NEW: Supervisor DTO
    public class SupervisorDto
    {
        public int DoctorId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Specialization { get; set; }
        public string? Department { get; set; }
    }

    /// <summary>Recommended supervisors ranked by skill match.</summary>
    public class RecommendedSupervisorDto
    {
        public int DoctorId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Specialization { get; set; } = string.Empty;
        public int MatchScore { get; set; }
    }

    // ── Response ──────────────────────────────────────────────────────────────
    public class StudentProjectResponseDto
    {
        public int Id { get; set; }
        public int OwnerId { get; set; }   // StudentProfile.Id
        public int OwnerUserId { get; set; }
        public string OwnerName { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Abstract { get; set; }

        /// <summary>"GP1" | "GP2" | "GP"</summary>
        public string ProjectType { get; set; } = "GP";

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

        // 🟢 NEW: Supervisor info
        public SupervisorDto? Supervisor { get; set; }

        public List<StudentProjectMemberDto> Members { get; set; } = new();
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    // ── Available Student (for invite browsing) ───────────────────────────────
    public class ProjectAvailableStudentDto
    {
        public int StudentId { get; set; }        // StudentProfile.Id
        public int UserId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Major { get; set; } = string.Empty;
        public string University { get; set; } = string.Empty;
        public string AcademicYear { get; set; } = string.Empty;
        public string? ProfilePicture { get; set; }
        public List<string> Skills { get; set; } = new();
        public int MatchScore { get; set; }

        // ── Caller-aware status flags ─────────────────────────────────────────
        /// <summary>True when this student is already a member of the project.</summary>
        public bool IsMember { get; set; }

        /// <summary>True when a pending invitation has already been sent to this student.</summary>
        public bool HasPendingInvite { get; set; }

        /// <summary>True when this student is the project owner.</summary>
        public bool IsOwner { get; set; }

        /// <summary>True when the project has no remaining seats.</summary>
        public bool IsProjectFull { get; set; }

        /// <summary>
        /// Computed convenience flag.
        /// True when the caller can send an invite to this student:
        /// not a member, no pending invite, not the owner, and project is not full.
        /// </summary>
        public bool CanInvite { get; set; }
    }
}