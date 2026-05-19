using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace GraduationProject.API.Models
{
    [Table("password_reset_tokens")]
    public class PasswordResetToken
    {
        [Column("id")]
        public int Id { get; set; }

        [Column("user_id")]
        public int UserId { get; set; }

        /// <summary>SHA-256 hash (hex) of the raw reset token — never store the plain token.</summary>
        [Column("token_hash")]
        public string TokenHash { get; set; } = string.Empty;

        [Column("expires_at")]
        public DateTime ExpiresAt { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("used_at")]
        public DateTime? UsedAt { get; set; }

        public User User { get; set; } = null!;

        public bool IsUsed => UsedAt.HasValue;

        public bool IsExpired(DateTime utcNow) => utcNow >= ExpiresAt;
    }
}
