using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace GraduationProject.API.Models
{
    [Table("company_follows")]
    public class CompanyFollow
    {
        [Column("id")] public int Id { get; set; }
        [Column("company_profile_id")] public int CompanyProfileId { get; set; }
        [Column("student_profile_id")] public int StudentProfileId { get; set; }
        [Column("followed_at")] public DateTime FollowedAt { get; set; } = DateTime.UtcNow;

        public CompanyProfile CompanyProfile { get; set; } = null!;
        public StudentProfile StudentProfile { get; set; } = null!;
    }
}
