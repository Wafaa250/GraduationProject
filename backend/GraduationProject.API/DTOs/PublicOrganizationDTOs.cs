using System;
using System.Collections.Generic;

namespace GraduationProject.API.DTOs
{
    public class PublicStudentOrganizationProfileDto
    {
        public int OrganizationId { get; set; }
        public string OrganizationName { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? Faculty { get; set; }
        public string? Category { get; set; }
        public string? LogoUrl { get; set; }
        public string? InstagramUrl { get; set; }
        public string? FacebookUrl { get; set; }
        public string? LinkedInUrl { get; set; }
        public bool IsVerified { get; set; }
        public DateTime CreatedAt { get; set; }
        public List<PublicOrganizationEventSummaryDto> UpcomingEvents { get; set; } = new();
        public int FollowersCount { get; set; }
        public List<PublicLeadershipTeamMemberDto> LeadershipTeam { get; set; } = new();
    }

    public class PublicLeadershipTeamMemberDto
    {
        public int Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string RoleTitle { get; set; } = string.Empty;
        public string? Major { get; set; }
        public string? ImageUrl { get; set; }
        public string? LinkedInUrl { get; set; }
        public int DisplayOrder { get; set; }
    }

    public class OrganizationFollowStatusDto
    {
        public bool IsFollowing { get; set; }
    }

    public class PublicOrganizationEventSummaryDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string EventType { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string? CoverImageUrl { get; set; }
        public DateTime EventDate { get; set; }
        public string? Location { get; set; }
        public bool IsOnline { get; set; }
    }

    public class PublicOrganizationEventDetailDto
    {
        public int Id { get; set; }
        public int OrganizationId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string EventType { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string? CoverImageUrl { get; set; }
        public DateTime EventDate { get; set; }
        public DateTime? RegistrationDeadline { get; set; }
        public string? Location { get; set; }
        public bool IsOnline { get; set; }
        public string OrganizationName { get; set; } = string.Empty;
        public string? OrganizationLogoUrl { get; set; }
    }

    public class PublicOrganizationListItemDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Category { get; set; }
        public string? Faculty { get; set; }
        public string? LogoUrl { get; set; }
        public bool IsVerified { get; set; }
    }
}
