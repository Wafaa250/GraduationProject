using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace GraduationProject.API.Models
{
    /// <summary>
    /// A custom role slot within a recruitment campaign. Students will apply to a specific position later.
    /// </summary>
    [Table("student_organization_recruitment_positions")]
    public class StudentOrganizationRecruitmentPosition
    {
        [Column("id")]
        public int Id { get; set; }

        [Column("campaign_id")]
        public int CampaignId { get; set; }

        [Column("role_title")]
        public string RoleTitle { get; set; } = string.Empty;

        [Column("needed_count")]
        public int NeededCount { get; set; }

        [Column("description")]
        public string? Description { get; set; }

        [Column("requirements")]
        public string? Requirements { get; set; }

        /// <summary>Comma-separated skill labels (e.g. "Canva, Photoshop, Creativity").</summary>
        [Column("required_skills")]
        public string? RequiredSkills { get; set; }

        [Column("display_order")]
        public int DisplayOrder { get; set; }

        public StudentOrganizationRecruitmentCampaign Campaign { get; set; } = null!;
        public ICollection<StudentOrganizationRecruitmentQuestion> Questions { get; set; } =
            new List<StudentOrganizationRecruitmentQuestion>();
    }
}
