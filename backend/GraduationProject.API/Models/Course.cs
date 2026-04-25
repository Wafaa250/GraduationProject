// Models/Course.cs
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace GraduationProject.API.Models
{
    [Table("courses")]
    public class Course
    {
        [Column("id")] public int Id { get; set; }
        [Column("name")] public string Name { get; set; } = string.Empty;
        [Column("code")] public string Code { get; set; } = string.Empty;
        [Column("doctor_id")] public int DoctorId { get; set; }
        [Column("created_at")] public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        [Column("semester")] public string? Semester { get; set; }
        [Column("use_shared_project_across_sections")]
        public bool UseSharedProjectAcrossSections { get; set; } = true;
        [Column("allow_cross_section_teams")]
        public bool AllowCrossSectionTeams { get; set; } = true;

        public DoctorProfile Doctor { get; set; } = null!;
        public ICollection<CourseSection> Sections { get; set; } = new List<CourseSection>();
        public ICollection<CourseEnrollment> Enrollments { get; set; } = new List<CourseEnrollment>();
        public ICollection<CourseProjectSetting> ProjectSettings { get; set; } = new List<CourseProjectSetting>();
        public ICollection<CourseProject> CourseProjects { get; set; } = new List<CourseProject>();
        public ICollection<CourseTeam> Teams { get; set; } = new List<CourseTeam>();
        public ICollection<CoursePartnerRequest> PartnerRequests { get; set; } = new List<CoursePartnerRequest>();
    }

    [Table("course_sections")]
    public class CourseSection
    {
        [Column("id")] public int Id { get; set; }
        [Column("course_id")] public int CourseId { get; set; }
        [Column("name")] public string Name { get; set; } = string.Empty;
        [Column("days")] public string? Days { get; set; }
        [Column("time_from")] public TimeOnly? TimeFrom { get; set; }
        [Column("time_to")] public TimeOnly? TimeTo { get; set; }
        [Column("capacity")] public int Capacity { get; set; }
        [Column("created_at")] public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public Course Course { get; set; } = null!;
        public ICollection<CourseEnrollment> Enrollments { get; set; } = new List<CourseEnrollment>();
        public ICollection<SectionProjectSetting> ProjectSettings { get; set; } = new List<SectionProjectSetting>();
        public ICollection<CourseProjectSection> CourseProjectSections { get; set; } = new List<CourseProjectSection>();
        public ICollection<SectionChatMessage> ChatMessages { get; set; } = new List<SectionChatMessage>();
    }

    [Table("course_enrollments")]
    public class CourseEnrollment
    {
        [Column("id")] public int Id { get; set; }
        [Column("course_id")] public int CourseId { get; set; }
        [Column("student_id")] public int StudentId { get; set; }
        [Column("created_at")] public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        [Column("course_section_id")] public int? CourseSectionId { get; set; }

        public Course Course { get; set; } = null!;
        public StudentProfile Student { get; set; } = null!;
        public CourseSection? Section { get; set; }
    }

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
        [Column("ai_mode")] public string AiMode { get; set; } = "doctor";
        [Column("created_at")] public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public Course Course { get; set; } = null!;
        public ICollection<CourseProjectSection> CourseProjectSections { get; set; } = new List<CourseProjectSection>();
    }

    [Table("course_project_sections")]
    public class CourseProjectSection
    {
        [Column("id")] public int Id { get; set; }
        [Column("course_project_id")] public int CourseProjectId { get; set; }
        [Column("course_section_id")] public int CourseSectionId { get; set; }

        public CourseProject CourseProject { get; set; } = null!;
        public CourseSection CourseSection { get; set; } = null!;
    }

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

        public Course Course { get; set; } = null!;
        public ICollection<CourseTeam> Teams { get; set; } = new List<CourseTeam>();
    }

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

        public CourseSection Section { get; set; } = null!;
    }

    [Table("course_teams")]
    public class CourseTeam
    {
        [Column("id")] public int Id { get; set; }
        [Column("course_id")] public int CourseId { get; set; }
        [Column("project_setting_id")] public int ProjectSettingId { get; set; }
        [Column("course_project_id")] public int? CourseProjectId { get; set; }
        [Column("leader_student_id")] public int LeaderStudentId { get; set; }
        [Column("created_at")] public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public Course Course { get; set; } = null!;
        public CourseProjectSetting ProjectSetting { get; set; } = null!;
        public CourseProject? CourseProject { get; set; }
        public StudentProfile Leader { get; set; } = null!;
        public ICollection<CourseTeamMember> Members { get; set; } = new List<CourseTeamMember>();
    }

    [Table("course_team_members")]
    public class CourseTeamMember
    {
        [Column("id")] public int Id { get; set; }
        [Column("team_id")] public int TeamId { get; set; }
        [Column("course_id")] public int CourseId { get; set; }
        [Column("student_id")] public int StudentId { get; set; }
        [Column("project_setting_id")] public int ProjectSettingId { get; set; }
        [Column("role")] public string Role { get; set; } = "member";
        [Column("joined_at")] public DateTime JoinedAt { get; set; } = DateTime.UtcNow;

        public CourseTeam Team { get; set; } = null!;
        public Course Course { get; set; } = null!;
        public StudentProfile Student { get; set; } = null!;
    }

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

        public Course Course { get; set; } = null!;
        public StudentProfile Sender { get; set; } = null!;
        public StudentProfile Receiver { get; set; } = null!;
        public CourseTeam? Team { get; set; }
    }
}