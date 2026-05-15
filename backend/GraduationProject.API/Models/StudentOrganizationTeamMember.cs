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

        [Column("display_order")]
        public int DisplayOrder { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updated_at")]
        public DateTime? UpdatedAt { get; set; }

        public StudentAssociationProfile OrganizationProfile { get; set; } = null!;
    }
}
