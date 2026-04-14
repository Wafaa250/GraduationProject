// Models/Course.cs
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace GraduationProject.API.Models
{
    // ===========================
    // COURSE
    // ===========================
    /// <summary>
    /// A course created by a doctor.
    /// Students are enrolled directly — no invite flow.
    /// </summary>
    [Table("courses")]
    public class Course
    {
        [Column("id")] public int Id { get; set; }
        [Column("name")] public string Name { get; set; } = string.Empty;
        [Column("code")] public string Code { get; set; } = string.Empty;
        [Column("doctor_id")] public int DoctorId { get; set; }  // DoctorProfile.Id
        [Column("created_at")] public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public DoctorProfile Doctor { get; set; } = null!;
        public ICollection<CourseEnrollment> Enrollments { get; set; } = new List<CourseEnrollment>();
        public ICollection<CourseProjectSetting> ProjectSettings { get; set; } = new List<CourseProjectSetting>();
        public ICollection<CourseTeam> Teams { get; set; } = new List<CourseTeam>();
        public ICollection<CoursePartnerRequest> PartnerRequests { get; set; } = new List<CoursePartnerRequest>();
    }

    // ===========================
    // COURSE ENROLLMENT
    // ===========================
    /// <summary>
    /// Direct enrollment of a student in a course.
    /// No invite flow; no status field.
    /// Unique index: (CourseId, StudentId).
    /// </summary>
    [Table("course_enrollments")]
    public class CourseEnrollment
    {
        [Column("id")] public int Id { get; set; }
        [Column("course_id")] public int CourseId { get; set; }  // Course.Id
        [Column("student_id")] public int StudentId { get; set; }  // StudentProfile.Id
        [Column("created_at")] public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public Course Course { get; set; } = null!;
        public StudentProfile Student { get; set; } = null!;
    }

    // ===========================
    // COURSE PROJECT SETTING
    // ===========================
    /// <summary>
    /// Simple project settings defined by the doctor for a course.
    /// Not a full independent project — only lightweight settings
    /// (title, description, team size, active flag).
    /// A course can have multiple settings over time; IsActive marks the current one.
    /// </summary>
    [Table("course_project_settings")]
    public class CourseProjectSetting
    {
        [Column("id")] public int Id { get; set; }
        [Column("course_id")] public int CourseId { get; set; }  // Course.Id
        [Column("title")] public string Title { get; set; } = string.Empty;
        [Column("description")] public string? Description { get; set; }
        [Column("team_size")] public int TeamSize { get; set; } = 2;
        [Column("is_active")] public bool IsActive { get; set; } = true;
        [Column("created_at")] public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        [Column("updated_at")] public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>Relative URL to the uploaded file, e.g. /project-files/{guid}.pdf</summary>
        [Column("file_url")] public string? FileUrl { get; set; }

        /// <summary>Original file name as provided by the uploader.</summary>
        [Column("file_name")] public string? FileName { get; set; }

        // Navigation
        public Course Course { get; set; } = null!;
        public ICollection<CourseTeam> Teams { get; set; } = new List<CourseTeam>();
    }

    // ===========================
    // COURSE TEAM
    // ===========================
    /// <summary>
    /// One team inside a course, linked to a project setting.
    /// </summary>
    [Table("course_teams")]
    public class CourseTeam
    {
        [Column("id")] public int Id { get; set; }
        [Column("course_id")] public int CourseId { get; set; }  // Course.Id
        [Column("project_setting_id")] public int ProjectSettingId { get; set; }  // CourseProjectSetting.Id
        [Column("leader_student_id")] public int LeaderStudentId { get; set; }  // StudentProfile.Id
        [Column("created_at")] public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public Course Course { get; set; } = null!;
        public CourseProjectSetting ProjectSetting { get; set; } = null!;
        public StudentProfile Leader { get; set; } = null!;
        public ICollection<CourseTeamMember> Members { get; set; } = new List<CourseTeamMember>();
    }

    // ===========================
    // COURSE TEAM MEMBER
    // ===========================
    /// <summary>
    /// A student member of a course team.
    /// Unique index: (TeamId, StudentId)  — prevents duplicate rows in the same team.
    /// Unique index: (CourseId, StudentId) — prevents a student from joining more than
    ///   one team within the same course (the cross-team constraint).
    /// CourseId is denormalised from CourseTeam to make the cross-team index possible
    /// at the database level; it must always equal Team.CourseId.
    /// Role: "leader" | "member"
    /// </summary>
    [Table("course_team_members")]
    public class CourseTeamMember
    {
        [Column("id")] public int Id { get; set; }
        [Column("team_id")] public int TeamId { get; set; }  // CourseTeam.Id
        [Column("course_id")] public int CourseId { get; set; }  // Course.Id  (denormalised from CourseTeam — always == Team.CourseId)
        [Column("student_id")] public int StudentId { get; set; }  // StudentProfile.Id

        // "leader" | "member"
        [Column("role")] public string Role { get; set; } = "member";
        [Column("joined_at")] public DateTime JoinedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public CourseTeam Team { get; set; } = null!;
        public Course Course { get; set; } = null!;
        public StudentProfile Student { get; set; } = null!;
    }

    // ===========================
    // COURSE PARTNER REQUEST
    // ===========================
    /// <summary>
    /// A partner/team-up request between two students inside the same course.
    /// TeamId is nullable: set once the request is accepted and a team is created/joined.
    /// Status: "pending" | "accepted" | "rejected" | "cancelled"
    /// </summary>
    [Table("course_partner_requests")]
    public class CoursePartnerRequest
    {
        [Column("id")] public int Id { get; set; }
        [Column("course_id")] public int CourseId { get; set; }  // Course.Id
        [Column("sender_student_id")] public int SenderStudentId { get; set; }  // StudentProfile.Id
        [Column("receiver_student_id")] public int ReceiverStudentId { get; set; } // StudentProfile.Id
        [Column("team_id")] public int? TeamId { get; set; }  // CourseTeam.Id (nullable)

        // "pending" | "accepted" | "rejected" | "cancelled"
        [Column("status")] public string Status { get; set; } = "pending";
        [Column("created_at")] public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        [Column("responded_at")] public DateTime? RespondedAt { get; set; }

        // Navigation
        public Course Course { get; set; } = null!;
        public StudentProfile Sender { get; set; } = null!;
        public StudentProfile Receiver { get; set; } = null!;
        public CourseTeam? Team { get; set; }
    }
}