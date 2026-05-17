using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace GraduationProject.API.Models
{
    [Table("company_talent_requests")]
    public class CompanyTalentRequest
    {
        [Column("id")] public int Id { get; set; }
        [Column("company_profile_id")] public int CompanyProfileId { get; set; }
        [Column("title")] public string Title { get; set; } = string.Empty;
        [Column("description")] public string Description { get; set; } = string.Empty;
        [Column("required_skills")] public string? RequiredSkills { get; set; }
        [Column("preferred_major")] public string? PreferredMajor { get; set; }
        [Column("engagement_type")] public string? EngagementType { get; set; }
        [Column("duration")] public string? Duration { get; set; }
        [Column("created_at")] public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public CompanyProfile CompanyProfile { get; set; } = null!;
    }
}
