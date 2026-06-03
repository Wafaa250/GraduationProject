using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace GraduationProject.API.Models
{
    [Table("password_reset_codes")]
    public class PasswordResetCode
    {
        [Column("id")] public int Id { get; set; }
        [Column("user_id")] public int UserId { get; set; }
        [Column("email")] public string Email { get; set; } = string.Empty;
        [Column("code_hash")] public string CodeHash { get; set; } = string.Empty;
        [Column("created_at")] public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        [Column("expires_at")] public DateTime ExpiresAt { get; set; }
        [Column("used_at")] public DateTime? UsedAt { get; set; }
        [Column("is_used")] public bool IsUsed { get; set; }

        public User User { get; set; } = null!;
    }
}
