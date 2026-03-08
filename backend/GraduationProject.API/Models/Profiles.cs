using System.ComponentModel.DataAnnotations.Schema;

namespace GraduationProject.API.Models
{
    // ===========================
    // STUDENT PROFILE
    // ===========================
    [Table("student_profiles")]
    public class StudentProfile
    {
        [Column("id")] public int Id { get; set; }
        [Column("user_id")] public int UserId { get; set; }
        [Column("major")] public string? Major { get; set; }
        [Column("year")] public int? Year { get; set; }
        [Column("bio")] public string? Bio { get; set; }

        public User User { get; set; } = null!;
    }

    // ===========================
    // DOCTOR PROFILE
    // ===========================
    [Table("doctor_profiles")]
    public class DoctorProfile
    {
        [Column("id")] public int Id { get; set; }
        [Column("user_id")] public int UserId { get; set; }
        [Column("specialization")] public string? Specialization { get; set; }
        [Column("supervision_capacity")] public int SupervisionCapacity { get; set; } = 0;
        [Column("bio")] public string? Bio { get; set; }

        public User User { get; set; } = null!;
    }

    // ===========================
    // COMPANY PROFILE
    // ===========================
    [Table("company_profiles")]
    public class CompanyProfile
    {
        [Column("id")] public int Id { get; set; }
        [Column("user_id")] public int UserId { get; set; }
        [Column("company_name")] public string CompanyName { get; set; } = string.Empty;
        [Column("industry")] public string? Industry { get; set; }
        [Column("description")] public string? Description { get; set; }

        public User User { get; set; } = null!;
    }

    // ===========================
    // ASSOCIATION PROFILE
    // ===========================
    [Table("association_profiles")]
    public class AssociationProfile
    {
        [Column("id")] public int Id { get; set; }
        [Column("user_id")] public int UserId { get; set; }
        [Column("association_name")] public string AssociationName { get; set; } = string.Empty;
        [Column("description")] public string? Description { get; set; }

        public User User { get; set; } = null!;
    }
}
