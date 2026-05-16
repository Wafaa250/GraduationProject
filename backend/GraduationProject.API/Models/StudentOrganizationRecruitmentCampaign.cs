using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace GraduationProject.API.Models
{
    [Table("student_organization_recruitment_campaigns")]
    public class StudentOrganizationRecruitmentCampaign
    {
        [Column("id")]
        public int Id { get; set; }

        [Column("organization_profile_id")]
        public int OrganizationProfileId { get; set; }

        [Column("title")]
        public string Title { get; set; } = string.Empty;

        [Column("description")]
        public string Description { get; set; } = string.Empty;

        [Column("application_deadline")]
        public DateTime ApplicationDeadline { get; set; }

        [Column("cover_image_url")]
        public string? CoverImageUrl { get; set; }

        [Column("is_published")]
        public bool IsPublished { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updated_at")]
        public DateTime? UpdatedAt { get; set; }

        public StudentAssociationProfile OrganizationProfile { get; set; } = null!;
        public ICollection<StudentOrganizationRecruitmentPosition> Positions { get; set; } =
            new List<StudentOrganizationRecruitmentPosition>();
        public ICollection<StudentOrganizationRecruitmentQuestion> Questions { get; set; } =
            new List<StudentOrganizationRecruitmentQuestion>();
    }
}
