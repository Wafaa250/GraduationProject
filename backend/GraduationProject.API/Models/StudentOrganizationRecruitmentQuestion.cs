using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace GraduationProject.API.Models
{
    [Table("student_organization_recruitment_questions")]
    public class StudentOrganizationRecruitmentQuestion
    {
        [Column("id")]
        public int Id { get; set; }

        [Column("campaign_id")]
        public int CampaignId { get; set; }

        /// <summary>When null, field applies to the entire campaign (shared form). Otherwise, position-specific.</summary>
        [Column("position_id")]
        public int? PositionId { get; set; }

        [Column("question_title")]
        public string QuestionTitle { get; set; } = string.Empty;

        [Column("question_type")]
        public string QuestionType { get; set; } = string.Empty;

        [Column("placeholder")]
        public string? Placeholder { get; set; }

        [Column("help_text")]
        public string? HelpText { get; set; }

        [Column("is_required")]
        public bool IsRequired { get; set; }

        /// <summary>JSON array of option strings for choice-based field types; null otherwise.</summary>
        [Column("options")]
        public string? Options { get; set; }

        [Column("display_order")]
        public int DisplayOrder { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public StudentOrganizationRecruitmentCampaign Campaign { get; set; } = null!;
        public StudentOrganizationRecruitmentPosition? Position { get; set; }
    }
}
