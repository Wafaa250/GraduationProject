using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace GraduationProject.API.Models
{
    [Table("users")]
    public class User
    {
        [Column("id")] public int Id { get; set; }
        [Column("name")] public string Name { get; set; } = string.Empty;
        [Column("email")] public string Email { get; set; } = string.Empty;
        [Column("password")] public string Password { get; set; } = string.Empty;
        [Column("role")] public string Role { get; set; } = string.Empty;
        [Column("created_at")] public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public StudentProfile? StudentProfile { get; set; }
        public DoctorProfile? DoctorProfile { get; set; }
        public CompanyProfile? CompanyProfile { get; set; }
        public AssociationProfile? AssociationProfile { get; set; }
    }
}
