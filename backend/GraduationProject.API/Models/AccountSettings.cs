using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace GraduationProject.API.Models
{
    [Table("student_account_settings")]
    public class StudentAccountSettings
    {
        [Column("user_id")]
        public int UserId { get; set; }

        [Column("notification_preferences")]
        public string? NotificationPreferences { get; set; }

        [Column("ai_project_interests")]
        public string? AiProjectInterests { get; set; }

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public User User { get; set; } = null!;
    }

    [Table("graduation_project_drafts")]
    public class GraduationProjectDraft
    {
        [Column("user_id")]
        public int UserId { get; set; }

        [Column("payload_json")]
        public string PayloadJson { get; set; } = "{}";

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public User User { get; set; } = null!;
    }
}
