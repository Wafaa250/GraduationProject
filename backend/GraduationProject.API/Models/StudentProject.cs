// Models/StudentProject.cs
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace GraduationProject.API.Models
{
    [Table("graduation_projects")]
    public class StudentProject
    {
        [Column("id")] public int Id { get; set; }
        [Column("owner_id")] public int OwnerId { get; set; }  // StudentProfile.Id
        [Column("name")] public string Name { get; set; } = string.Empty;
        [Column("abstract")] public string? Abstract { get; set; }

        // "GP1" | "GP2" | "GP" — GP1/GP2 only for Engineering & IT faculty students
        [Column("project_type")] public string ProjectType { get; set; } = "GP";

        // JSON array of strings e.g. ["React","Python"]
        [Column("required_skills")] public string? RequiredSkills { get; set; }

        // JSON array of technology labels e.g. ["React","Docker"] (separate from required skills)
        [Column("technologies")] public string? Technologies { get; set; }

        // JSON array of interest labels e.g. ["Machine Learning","FinTech"]
        [Column("interests")] public string? Interests { get; set; }

        // Uploaded abstract document (PDF/DOCX) — metadata only; binary on disk
        [Column("abstract_file_name")] public string? AbstractFileName { get; set; }
        [Column("abstract_file_path")] public string? AbstractFilePath { get; set; }
        [Column("abstract_file_uploaded_at")] public DateTime? AbstractFileUploadedAt { get; set; }

        // JSON array of teammate role labels e.g. ["Frontend Developer","Backend Developer"]
        [Column("preferred_roles")] public string? PreferredRoles { get; set; }

        // JSON array of required teammate roles e.g. ["ML Engineer","Backend Dev"]
        [Column("required_roles")] public string? RequiredRoles { get; set; }

        // JSON array of skill/quality priorities e.g. ["Communication","Technical depth"]
        [Column("skill_priorities")] public string? SkillPriorities { get; set; }

        // When true, project is visible on the teammate matching board
        [Column("looking_for_teammates")] public bool LookingForTeammates { get; set; } = true;

        // عدد الشركاء المطلوبين (الأونر مشمول) — 0 يعني solo
        [Column("partners_count")] public int PartnersCount { get; set; } = 0;

        // ── Supervisor ───────────────────────────────────────────────────────
        // Null until a doctor accepts a supervision request
        [Column("supervisor_id")] public int? SupervisorId { get; set; }  // DoctorProfile.Id

        [Column("created_at")] public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        [Column("updated_at")] public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public StudentProfile Owner { get; set; } = null!;
        public DoctorProfile? Supervisor { get; set; }
        public ICollection<StudentProjectMember> Members { get; set; } = new List<StudentProjectMember>();
        public ICollection<ProjectInvitation> Invitations { get; set; } = new List<ProjectInvitation>();
        public ICollection<SupervisorRequest> SupervisorRequests { get; set; } = new List<SupervisorRequest>();
        public ICollection<SupervisorCancellationRequest> SupervisorCancellationRequests { get; set; } = new List<SupervisorCancellationRequest>();
    }

    [Table("graduation_project_members")]
    public class StudentProjectMember
    {
        [Column("id")] public int Id { get; set; }
        [Column("project_id")] public int ProjectId { get; set; }  // StudentProject.Id
        [Column("student_id")] public int StudentId { get; set; }  // StudentProfile.Id

        // ── Backend-only role field ──────────────────────────────────────────
        // Possible values: "leader" | "member"
        // Used purely for internal system logic — never surfaced to the UI.
        [Column("role")] public string Role { get; set; } = "member";

        [Column("joined_at")] public DateTime JoinedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public StudentProject Project { get; set; } = null!;
        public StudentProfile Student { get; set; } = null!;
    }

    [Table("project_invitations")]
    public class ProjectInvitation
    {
        [Column("id")] public int Id { get; set; }
        [Column("project_id")] public int ProjectId { get; set; }  // StudentProject.Id
        [Column("sender_id")] public int SenderId { get; set; }  // StudentProfile.Id
        [Column("receiver_id")] public int ReceiverId { get; set; }  // StudentProfile.Id

        // "pending" | "accepted" | "rejected" | "cancelled" | "expired"
        [Column("status")] public string Status { get; set; } = "pending";

        [Column("created_at")] public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        [Column("responded_at")] public DateTime? RespondedAt { get; set; }

        // Navigation
        public StudentProject Project { get; set; } = null!;
        public StudentProfile Sender { get; set; } = null!;
        public StudentProfile Receiver { get; set; } = null!;
    }

    [Table("supervisor_requests")]
    public class SupervisorRequest
    {
        [Column("id")] public int Id { get; set; }
        [Column("project_id")] public int ProjectId { get; set; }  // StudentProject.Id
        [Column("doctor_id")] public int DoctorId { get; set; }  // DoctorProfile.Id
        [Column("sender_id")] public int SenderId { get; set; }  // StudentProfile.Id (leader)

        // "pending" | "accepted" | "rejected"
        [Column("status")] public string Status { get; set; } = "pending";

        [Column("created_at")] public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        [Column("responded_at")] public DateTime? RespondedAt { get; set; }

        /// <summary>Optional note from the doctor when accepting or rejecting.</summary>
        [Column("doctor_response_note")] public string? DoctorResponseNote { get; set; }

        // Navigation
        public StudentProject Project { get; set; } = null!;
        public DoctorProfile Doctor { get; set; } = null!;
        public StudentProfile Sender { get; set; } = null!;
    }

    [Table("supervisor_cancellation_requests")]
    public class SupervisorCancellationRequest
    {
        [Column("id")] public int Id { get; set; }
        [Column("project_id")] public int ProjectId { get; set; }  // StudentProject.Id
        [Column("doctor_id")] public int DoctorId { get; set; }  // DoctorProfile.Id
        [Column("sender_id")] public int SenderId { get; set; }  // StudentProfile.Id (leader)

        // "pending" | "accepted" | "rejected"
        [Column("status")] public string Status { get; set; } = "pending";

        [Column("created_at")] public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        [Column("responded_at")] public DateTime? RespondedAt { get; set; }

        // Navigation
        public StudentProject Project { get; set; } = null!;
        public DoctorProfile Doctor { get; set; } = null!;
        public StudentProfile Sender { get; set; } = null!;
    }
}