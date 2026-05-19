using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace GraduationProject.API.DTOs
{
    public class CompanyProfileDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string CompanyName { get; set; } = string.Empty;
        public string? Industry { get; set; }
        public string? Description { get; set; }
        public string? Location { get; set; }
        public string? WebsiteUrl { get; set; }
        public string? LinkedInUrl { get; set; }
        public string Email { get; set; } = string.Empty;
    }

    public class CompanyTalentSearchDto
    {
        [Required(ErrorMessage = "Title is required")]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        [Required(ErrorMessage = "Describe what you are looking for")]
        [MinLength(20, ErrorMessage = "Please provide more detail (at least 20 characters)")]
        public string Description { get; set; } = string.Empty;

        [MinLength(1, ErrorMessage = "Add at least one required skill")]
        public List<string> RequiredSkills { get; set; } = new();

        public string? PreferredMajor { get; set; }
        public string? EngagementType { get; set; }
        public string? Duration { get; set; }

        /// <summary>When true, stores the request in history for the company dashboard.</summary>
        public bool SaveRequest { get; set; } = true;
    }

    public class CompanyTalentCandidateDto
    {
        public int StudentProfileId { get; set; }
        public int UserId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Major { get; set; } = string.Empty;
        public string University { get; set; } = string.Empty;
        public string? AcademicYear { get; set; }
        public string? Bio { get; set; }
        public List<string> Skills { get; set; } = new();
        public int MatchScore { get; set; }
        public string Reason { get; set; } = string.Empty;
        public List<string> Highlights { get; set; } = new();
    }

    public class CompanyTalentSearchResultDto
    {
        public int? RequestId { get; set; }
        public string Title { get; set; } = string.Empty;
        public bool UsedAi { get; set; }
        public List<CompanyTalentCandidateDto> Candidates { get; set; } = new();
    }

    public class CompanyTalentRequestSummaryDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? EngagementType { get; set; }
        public List<string> RequiredSkills { get; set; } = new();
        public DateTime CreatedAt { get; set; }
    }

    public class AnalyzeCompanyDto
    {
        public string? WebsiteUrl { get; set; }
        public string? LinkedInUrl { get; set; }
    }

    public class CompanyAnalysisResultDto
    {
        public string CompanyName { get; set; } = string.Empty;
        public string? Industry { get; set; }
        public string? Description { get; set; }
        public string? Location { get; set; }
        public bool UsedAi { get; set; }
        public string? Message { get; set; }
    }
}
