using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace GraduationProject.API.Models
{
    [Table("doctor_posts")]
    public class DoctorPost
    {
        [Column("id")]
        public int Id { get; set; }

        [Column("user_id")]
        public int UserId { get; set; }

        [Column("content")]
        public string Content { get; set; } = string.Empty;

        [Column("attachment_url")]
        public string? AttachmentUrl { get; set; }

        [Column("attachment_type")]
        public string? AttachmentType { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public User User { get; set; } = null!;
    }
}
