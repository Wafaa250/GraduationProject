using System;

namespace GraduationProject.API.DTOs
{
    public class OrganizationMemberListItemDto
    {
        public int Id { get; set; }
        public int StudentProfileId { get; set; }
        public int StudentUserId { get; set; }
        public string StudentName { get; set; } = string.Empty;
        public string? StudentEmail { get; set; }
        public string? Major { get; set; }
        public string RoleTitle { get; set; } = string.Empty;
        public string MembershipKind { get; set; } = string.Empty;
        public int? SourceApplicationId { get; set; }
        public int? TeamMemberId { get; set; }
        public DateTime AcceptedAt { get; set; }
        public bool JoinedViaRecruitment { get; set; }
    }

    public class StudentOrganizationMembershipDto
    {
        public int OrganizationMemberId { get; set; }
        public int OrganizationId { get; set; }
        public string OrganizationName { get; set; } = string.Empty;
        public string? OrganizationLogoUrl { get; set; }
        public string RoleTitle { get; set; } = string.Empty;
        public string MembershipKind { get; set; } = string.Empty;
        public DateTime JoinedAt { get; set; }
        public int? SourceApplicationId { get; set; }
        public int? CampaignId { get; set; }
        public string? CampaignTitle { get; set; }
        public bool JoinedViaRecruitment { get; set; }
    }

    public class PublicOrganizationMemberDto
    {
        public int StudentUserId { get; set; }
        public string StudentName { get; set; } = string.Empty;
        public string RoleTitle { get; set; } = string.Empty;
        public string? Major { get; set; }
    }
}
