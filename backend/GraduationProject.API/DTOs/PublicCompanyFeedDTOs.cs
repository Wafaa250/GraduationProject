using System;
using System.Collections.Generic;

namespace GraduationProject.API.DTOs
{
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
