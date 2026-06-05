using System;
using System.Collections.Generic;

namespace GraduationProject.API.DTOs
{
    public class PublicCompanyProfileDetailDto
    {
        public int Id { get; set; }
        public string CompanyName { get; set; } = string.Empty;
        public string? Industry { get; set; }
        public string? Description { get; set; }
        public string? HeadquartersLocation { get; set; }
        public string? Location { get; set; }
        public string? WorkingStyle { get; set; }
        public string? WebsiteUrl { get; set; }
        public string? LinkedInUrl { get; set; }
        public string? ContactEmail { get; set; }
        public string? OptionalContactLink { get; set; }
        public List<string> AreasOfInterest { get; set; } = new();
        public bool IsFollowing { get; set; }
    }

    public class PublicCompanyOpportunitySummaryDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string? CollaborationFormat { get; set; }
        public string? DurationLabel { get; set; }
        public DateTime? PublishedAt { get; set; }
    }

    public class PublicCompanyOpportunityDetailDto
    {
        public int Id { get; set; }
        public int CompanyProfileId { get; set; }
        public string CompanyName { get; set; } = string.Empty;
        public string? Industry { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string RequestType { get; set; } = string.Empty;
        public string? CollaborationFormat { get; set; }
        public string? DurationLabel { get; set; }
        public List<string> Skills { get; set; } = new();
        public int RoleCount { get; set; }
        public DateTime? PublishedAt { get; set; }
        public string? ContactEmail { get; set; }
        public string? WebsiteUrl { get; set; }
        public string? LinkedInUrl { get; set; }
        public string? ScopeNotes { get; set; }
        public List<PublicCompanyOpportunityRoleDto> Roles { get; set; } = new();
    }

    public class PublicCompanyOpportunityRoleDto
    {
        public string RoleName { get; set; } = string.Empty;
        public List<string> Skills { get; set; } = new();
    }

    public class PublicCompanyTalentRequestDetailDto
    {
        public int Id { get; set; }
        public int CompanyProfileId { get; set; }
        public string CompanyName { get; set; } = string.Empty;
        public string? Industry { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string? EngagementType { get; set; }
        public string? Duration { get; set; }
        public string? PreferredMajor { get; set; }
        public List<string> Skills { get; set; } = new();
        public DateTime CreatedAt { get; set; }
    }
}
