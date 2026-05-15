using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace GraduationProject.API.Models
{
    [Table("organization_follows")]
    public class OrganizationFollow
    {
        [Column("id")] public int Id { get; set; }
        [Column("organization_profile_id")] public int OrganizationProfileId { get; set; }
        [Column("student_profile_id")] public int StudentProfileId { get; set; }
        [Column("followed_at")] public DateTime FollowedAt { get; set; } = DateTime.UtcNow;

        public StudentAssociationProfile OrganizationProfile { get; set; } = null!;
        public StudentProfile StudentProfile { get; set; } = null!;
    }
}
