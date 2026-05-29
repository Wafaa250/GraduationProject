using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace GraduationProject.API.Models
{
    public static class CompanyMemberRoles
    {
        public const string Owner = "owner";
        public const string Member = "member";

        public static readonly string[] All = { Owner, Member };
    }

    [Table("company_members")]
    public class CompanyMember
    {
        [Column("id")] public int Id { get; set; }
        [Column("user_id")] public int UserId { get; set; }
        [Column("company_profile_id")] public int CompanyProfileId { get; set; }
        [Column("role")] public string Role { get; set; } = CompanyMemberRoles.Member;
        [Column("created_at")] public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public User User { get; set; } = null!;
        public CompanyProfile CompanyProfile { get; set; } = null!;
    }
}
