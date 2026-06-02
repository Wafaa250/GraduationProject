using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace GraduationProject.API.Models
{
    [Table("feed_post_comments")]
    public class FeedPostComment
    {
        [Column("id")] public int Id { get; set; }
        [Column("user_id")] public int UserId { get; set; }
        [Column("post_key")] public string PostKey { get; set; } = string.Empty;
        [Column("content")] public string Content { get; set; } = string.Empty;
        [Column("created_at")] public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public User User { get; set; } = null!;
    }
}
