using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace GraduationProject.API.Models
{
    [Table("student_organization_team_members")]
    public class StudentOrganizationTeamMember
    {
        [Column("id")]
        public int Id { get; set; }

        [Column("organization_profile_id")]
        public int OrganizationProfileId { get; set; }

        /// <summary>When set, this showcase row is linked to a real student account (e.g. recruitment accept).</summary>
        [Column("student_profile_id")]
        public int? StudentProfileId { get; set; }

        [Column("source_application_id")]
        public int? SourceApplicationId { get; set; }

        [Column("full_name")]
        public string FullName { get; set; } = string.Empty;

        [Column("role_title")]
        public string RoleTitle { get; set; } = string.Empty;

        [Column("major")]
        public string? Major { get; set; }

        [Column("image_url")]
        public string? ImageUrl { get; set; }

        [Column("linkedin_url")]
        public string? LinkedInUrl { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updated_at")]
        public DateTime? UpdatedAt { get; set; }

        public StudentAssociationProfile OrganizationProfile { get; set; } = null!;
        public StudentProfile? StudentProfile { get; set; }
        public StudentOrganizationRecruitmentApplication? SourceApplication { get; set; }
    }
}
