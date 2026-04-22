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
        [Column("doctor_id")] public int DoctorId { get; set; }
        [Column("created_at")] public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // ── NEW ──────────────────────────────────────────────────────────────
        /// <summary>e.g. "Fall 2025", "Spring 2026". Nullable — not required.</summary>
        [Column("semester")] public string? Semester { get; set; }

        /// <summary>
        /// true  → all sections share ONE CourseProjectSetting.
        /// false → each section has its own SectionProjectSetting.
        /// </summary>
        [Column("use_shared_project_across_sections")]
        public bool UseSharedProjectAcrossSections { get; set; } = true;

        /// <summary>
        /// Applies ONLY when UseSharedProjectAcrossSections == true.
        /// true  → teams may include students from different sections.
        /// false → teams must be formed within the same section.
        /// </summary>
        [Column("allow_cross_section_teams")]
        public bool AllowCrossSectionTeams { get; set; } = true;

        // ── Navigation ───────────────────────────────────────────────────────
        public DoctorProfile Doctor { get; set; } = null!;
        public ICollection<CourseSection> Sections { get; set; } = new List<CourseSection>();
        public ICollection<CourseEnrollment> Enrollments { get; set; } = new List<CourseEnrollment>();
        public ICollection<CourseProjectSetting> ProjectSettings { get; set; } = new List<CourseProjectSetting>();
        /// <summary>
        /// New multi-project model (parallel to legacy <see cref="CourseProjectSetting"/>).
        /// </summary>
        public ICollection<CourseProject> CourseProjects { get; set; } = new List<CourseProject>();
        public ICollection<CourseTeam> Teams { get; set; } = new List<CourseTeam>();
        public ICollection<CoursePartnerRequest> PartnerRequests { get; set; } = new List<CoursePartnerRequest>();
    }

    // ===========================
    // COURSE SECTION  (NEW)
    // ===========================
    /// <summary>
    /// An optional sub-grouping inside a course.
    /// A course may have one section (effectively no section split) or many.
    /// </summary>
    [Table("course_sections")]
    public class CourseSection
    {
        [Column("id")] public int Id { get; set; }
        [Column("course_id")] public int CourseId { get; set; }

        /// <summary>Human-readable section name, e.g. "Section A — Morning".</summary>
        [Column("name")] public string Name { get; set; } = string.Empty;

        /// <summary>
        /// Weekdays the section meets, stored as a JSON array of weekday ids
        /// ("mon","tue","wed","thu","fri","sat","sun"), e.g. <c>["mon","wed"]</c>.
        /// Nullable / empty-array when no schedule is set.
        /// </summary>
        [Column("days")] public string? Days { get; set; }

        /// <summary>Meeting start time (wall-clock, no timezone).</summary>
        [Column("time_from")] public TimeOnly? TimeFrom { get; set; }

        /// <summary>Meeting end time (wall-clock, no timezone).</summary>
        [Column("time_to")] public TimeOnly? TimeTo { get; set; }

        /// <summary>Maximum number of students in this section. Defaults to 0 (unspecified).</summary>
        [Column("capacity")] public int Capacity { get; set; }

        [Column("created_at")] public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public Course Course { get; set; } = null!;
        public ICollection<CourseEnrollment> Enrollments { get; set; } = new List<CourseEnrollment>();
        public ICollection<SectionProjectSetting> ProjectSettings { get; set; } = new List<SectionProjectSetting>();
        public ICollection<CourseProjectSection> CourseProjectSections { get; set; } =
            new List<CourseProjectSection>();
    }

    // ===========================
    // COURSE ENROLLMENT  (UPDATED)
    // ===========================
    /// <summary>
    /// Direct enrollment of a student in a course, optionally tied to a section.
    /// Unique index: (CourseId, StudentId).
    /// </summary>
    [Table("course_enrollments")]
    public class CourseEnrollment
    {
        [Column("id")] public int Id { get; set; }
        [Column("course_id")] public int CourseId { get; set; }
        [Column("student_id")] public int StudentId { get; set; }
        [Column("created_at")] public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // ── NEW ──────────────────────────────────────────────────────────────
        /// <summary>Nullable — null means the student is enrolled in the course but
        /// not yet assigned to any section.</summary>
        [Column("course_section_id")] public int? CourseSectionId { get; set; }

        // Navigation
        public Course Course { get; set; } = null!;
        public StudentProfile Student { get; set; } = null!;
        public CourseSection? Section { get; set; }
    }

    // ===========================
    // COURSE PROJECT  (multi-project; new model)
    // ===========================
    /// <summary>
    /// A project definition under a course. Can apply to all sections or to explicit
    /// <see cref="CourseProjectSection"/> rows. Coexists with legacy
    /// <see cref="CourseProjectSetting"/> / <see cref="SectionProjectSetting"/>.
    /// </summary>
    [Table("course_projects")]
    public class CourseProject
    {
        [Column("id")] public int Id { get; set; }
        [Column("course_id")] public int CourseId { get; set; }
        [Column("title")] public string Title { get; set; } = string.Empty;
        [Column("description")] public string? Description { get; set; }
        [Column("team_size")] public int TeamSize { get; set; } = 2;
        [Column("apply_to_all_sections")] public bool ApplyToAllSections { get; set; }
        [Column("allow_cross_section_teams")] public bool AllowCrossSectionTeams { get; set; }
        [Column("created_at")] public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public Course Course { get; set; } = null!;
        public ICollection<CourseProjectSection> CourseProjectSections { get; set; } =
            new List<CourseProjectSection>();
    }

    /// <summary>
    /// Join of <see cref="CourseProject"/> to a specific <see cref="CourseSection"/>.
    /// When <see cref="CourseProject.ApplyToAllSections"/> is true, this collection is
    /// typically empty; when false, rows define which sections the project applies to.
    /// </summary>
    [Table("course_project_sections")]
    public class CourseProjectSection
    {
        [Column("id")] public int Id { get; set; }
        [Column("course_project_id")] public int CourseProjectId { get; set; }
        [Column("course_section_id")] public int CourseSectionId { get; set; }

        public CourseProject CourseProject { get; set; } = null!;
        public CourseSection CourseSection { get; set; } = null!;
    }

    // ===========================
    // COURSE PROJECT SETTING  (UNCHANGED — shared project case)
    // ===========================
    /// <summary>
    /// Lightweight project settings at the course level.
    /// Used when Course.UseSharedProjectAcrossSections == true.
    /// </summary>
    [Table("course_project_settings")]
    public class CourseProjectSetting
    {
        [Column("id")] public int Id { get; set; }
        [Column("course_id")] public int CourseId { get; set; }
        [Column("title")] public string Title { get; set; } = string.Empty;
        [Column("description")] public string? Description { get; set; }
        [Column("team_size")] public int TeamSize { get; set; } = 2;
        [Column("is_active")] public bool IsActive { get; set; } = true;
        [Column("created_at")] public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        [Column("updated_at")] public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        [Column("file_url")] public string? FileUrl { get; set; }
        [Column("file_name")] public string? FileName { get; set; }

        // Navigation
        public Course Course { get; set; } = null!;
        public ICollection<CourseTeam> Teams { get; set; } = new List<CourseTeam>();
    }

    // ===========================
    // SECTION PROJECT SETTING  (NEW)
    // ===========================
    /// <summary>
    /// Per-section project settings.
    /// Used when Course.UseSharedProjectAcrossSections == false.
    /// Teams formed under this setting MUST be from the same section.
    /// </summary>
    [Table("section_project_settings")]
    public class SectionProjectSetting
    {
        [Column("id")] public int Id { get; set; }
        [Column("course_section_id")] public int CourseSectionId { get; set; }
        [Column("title")] public string Title { get; set; } = string.Empty;
        [Column("description")] public string? Description { get; set; }
        [Column("team_size")] public int TeamSize { get; set; } = 2;
        [Column("is_active")] public bool IsActive { get; set; } = true;
        [Column("created_at")] public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        [Column("updated_at")] public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public CourseSection Section { get; set; } = null!;
    }

    // ===========================
    // COURSE TEAM  (UNCHANGED)
    // ===========================
    [Table("course_teams")]
    public class CourseTeam
    {
        [Column("id")] public int Id { get; set; }
        [Column("course_id")] public int CourseId { get; set; }
        [Column("project_setting_id")] public int ProjectSettingId { get; set; }
        [Column("leader_student_id")] public int LeaderStudentId { get; set; }
        [Column("created_at")] public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public Course Course { get; set; } = null!;
        public CourseProjectSetting ProjectSetting { get; set; } = null!;
        public StudentProfile Leader { get; set; } = null!;
        public ICollection<CourseTeamMember> Members { get; set; } = new List<CourseTeamMember>();
    }

    // ===========================
    // COURSE TEAM MEMBER  (UNCHANGED)
    // ===========================
    [Table("course_team_members")]
    public class CourseTeamMember
    {
        [Column("id")] public int Id { get; set; }
        [Column("team_id")] public int TeamId { get; set; }
        [Column("course_id")] public int CourseId { get; set; }
        [Column("student_id")] public int StudentId { get; set; }

        // ── NEW ──────────────────────────────────────────────────────────────
        /// <summary>
        /// Denormalised from CourseTeam.ProjectSettingId.
        /// Always equals <c>Team.ProjectSettingId</c>; set by the service layer
        /// when adding a member.
        ///
        /// Powers the uniqueness constraint (ProjectSettingId, StudentId):
        /// a student can belong to AT MOST ONE team per project setting
        /// (but may belong to different teams under different projects in
        /// the same course).
        /// </summary>
        [Column("project_setting_id")] public int ProjectSettingId { get; set; }

        [Column("role")] public string Role { get; set; } = "member";
        [Column("joined_at")] public DateTime JoinedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public CourseTeam Team { get; set; } = null!;
        public Course Course { get; set; } = null!;
        public StudentProfile Student { get; set; } = null!;
    }

    // ===========================
    // COURSE PARTNER REQUEST  (UNCHANGED)
    // ===========================
    [Table("course_partner_requests")]
    public class CoursePartnerRequest
    {
        [Column("id")] public int Id { get; set; }
        [Column("course_id")] public int CourseId { get; set; }
        [Column("sender_student_id")] public int SenderStudentId { get; set; }
        [Column("receiver_student_id")] public int ReceiverStudentId { get; set; }
        [Column("team_id")] public int? TeamId { get; set; }
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