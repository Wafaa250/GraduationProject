using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace GraduationProject.API.Models
{
    /// <summary>Student accepted into an organization via recruitment (distinct from public leadership team roster).</summary>
    [Table("student_organization_members")]
    public class StudentOrganizationMember
    {
        [Column("id")]
        public int Id { get; set; }

        [Column("organization_profile_id")]
        public int OrganizationProfileId { get; set; }

        [Column("student_profile_id")]
        public int StudentProfileId { get; set; }

        [Column("source_application_id")]
        public int? SourceApplicationId { get; set; }

        [Column("role_title")]
        public string? RoleTitle { get; set; }

        /// <summary>Leadership = public leadership roster; Member = general organization member.</summary>
        [Column("membership_kind")]
        public string MembershipKind { get; set; } = OrganizationMembershipKinds.Member;

        [Column("team_member_id")]
        public int? TeamMemberId { get; set; }

        [Column("accepted_at")]
        public DateTime AcceptedAt { get; set; } = DateTime.UtcNow;

        public StudentAssociationProfile OrganizationProfile { get; set; } = null!;
        public StudentProfile StudentProfile { get; set; } = null!;
        public StudentOrganizationRecruitmentApplication? SourceApplication { get; set; }
        public StudentOrganizationTeamMember? TeamMember { get; set; }
    }
}
