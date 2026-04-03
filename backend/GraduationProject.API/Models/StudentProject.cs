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
        [Column("description")] public string? Description { get; set; }

        // JSON array of strings e.g. ["React","Python"]
        [Column("required_skills")] public string? RequiredSkills { get; set; }

        // عدد الشركاء المطلوبين (غير الأونر) — 0 يعني solo
        [Column("partners_count")] public int PartnersCount { get; set; } = 0;

        [Column("created_at")] public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        [Column("updated_at")] public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public StudentProfile Owner { get; set; } = null!;
        public ICollection<StudentProjectMember> Members { get; set; } = new List<StudentProjectMember>();
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
}