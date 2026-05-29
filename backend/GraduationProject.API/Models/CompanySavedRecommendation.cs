using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace GraduationProject.API.Models
{
    [Table("company_saved_student_recommendations")]
    public class CompanySavedStudentRecommendation
    {
        [Column("id")] public int Id { get; set; }
        [Column("company_profile_id")] public int CompanyProfileId { get; set; }
        [Column("company_request_id")] public int CompanyRequestId { get; set; }
        [Column("student_profile_id")] public int StudentProfileId { get; set; }
        [Column("saved_by_user_id")] public int SavedByUserId { get; set; }
        [Column("note")] public string? Note { get; set; }
        [Column("created_at")] public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public CompanyProfile CompanyProfile { get; set; } = null!;
        public CompanyRequest CompanyRequest { get; set; } = null!;
        public StudentProfile StudentProfile { get; set; } = null!;
        public User SavedByUser { get; set; } = null!;
    }

    [Table("company_saved_team_recommendations")]
    public class CompanySavedTeamRecommendation
    {
        [Column("id")] public int Id { get; set; }
        [Column("company_profile_id")] public int CompanyProfileId { get; set; }
        [Column("company_request_id")] public int CompanyRequestId { get; set; }
        [Column("team_recommendation_id")] public int TeamRecommendationId { get; set; }
        [Column("saved_by_user_id")] public int SavedByUserId { get; set; }
        [Column("note")] public string? Note { get; set; }
        [Column("created_at")] public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public CompanyProfile CompanyProfile { get; set; } = null!;
        public CompanyRequest CompanyRequest { get; set; } = null!;
        public CompanyRequestTeamRecommendation TeamRecommendation { get; set; } = null!;
        public User SavedByUser { get; set; } = null!;
    }
}
