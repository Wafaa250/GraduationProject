using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace GraduationProject.API.Models
{
    [Table("user_notifications")]
    public class UserNotification
    {
        [Column("id")] public int Id { get; set; }

        [Column("user_id")] public int UserId { get; set; }

        /// <summary>Domain grouping, e.g. graduation_project.</summary>
        [Column("category")] public string Category { get; set; } = "graduation_project";

        /// <summary>Stable event code for clients, e.g. project_updated.</summary>
        [Column("event_type")] public string EventType { get; set; } = string.Empty;

        [Column("project_id")] public int? ProjectId { get; set; }

        [Column("title")] public string Title { get; set; } = string.Empty;

        [Column("body")] public string Body { get; set; } = string.Empty;

        [Column("dedup_key")] public string? DedupKey { get; set; }

        [Column("created_at")] public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("read_at")] public DateTime? ReadAt { get; set; }

        public User User { get; set; } = null!;
    }
}
