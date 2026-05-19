using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace GraduationProject.API.Models
{
    [Table("student_organization_recruitment_applicant_analyses")]
    public class StudentOrganizationRecruitmentApplicantAnalysis
    {
        [Column("id")]
        public int Id { get; set; }

        [Column("organization_profile_id")]
        public int OrganizationProfileId { get; set; }

        [Column("campaign_id")]
        public int CampaignId { get; set; }

        [Column("position_id")]
        public int PositionId { get; set; }

        [Column("top_k")]
        public int TopK { get; set; }

        [Column("results_json")]
        public string ResultsJson { get; set; } = string.Empty;

        [Column("created_at")]
        public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

        public StudentOrganizationRecruitmentPosition Position { get; set; } = null!;
    }
}
