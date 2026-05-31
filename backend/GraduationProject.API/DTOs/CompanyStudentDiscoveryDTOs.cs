using System;
using System.Collections.Generic;

namespace GraduationProject.API.DTOs
{
    public class CompanyStudentDiscoveryProfileDto
    {
        public CompanyStudentDiscoveryStudentDto Student { get; set; } = new();
        public CompanyStudentDiscoveryRequestDto Request { get; set; } = new();
        public CompanyStudentDiscoveryRecommendationDto? Recommendation { get; set; }
        public List<CompanyStudentDiscoveryProjectDto> Projects { get; set; } = new();
    }

    public class CompanyStudentDiscoveryStudentDto
    {
        public int StudentProfileId { get; set; }
        public int UserId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string? Bio { get; set; }
        public string? University { get; set; }
        public string? Faculty { get; set; }
        public string? Major { get; set; }
        public string? AcademicYear { get; set; }
        public string? Availability { get; set; }
        public string? LookingFor { get; set; }
        public string? Linkedin { get; set; }
        public string? Github { get; set; }
        public string? Portfolio { get; set; }
        public List<string> Languages { get; set; } = new();
        public List<string> Roles { get; set; } = new();
        public List<string> TechnicalSkills { get; set; } = new();
        public List<string> Tools { get; set; } = new();
        public string? ProfilePictureBase64 { get; set; }
    }

    public class CompanyStudentDiscoveryRequestDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public List<string> RoleNames { get; set; } = new();
        public List<string> RequiredSkills { get; set; } = new();
    }

    public class CompanyStudentDiscoveryRecommendationDto
    {
        public string Source { get; set; } = "individual";
        public int MatchScore { get; set; }
        public string ReasonSummary { get; set; } = string.Empty;
        public List<string> Highlights { get; set; } = new();
        public List<string> Strengths { get; set; } = new();
        public List<string> Gaps { get; set; } = new();
        public string? AlignedRoleName { get; set; }
        public List<string> RelevantSkills { get; set; } = new();
        public CompanyRequestRecommendationScoreBreakdownDto? ScoreBreakdown { get; set; }
        public int? TeamRecommendationId { get; set; }
        public int? Rank { get; set; }
    }

    public class CompanyStudentDiscoveryProjectDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public List<string> Technologies { get; set; } = new();
        public string TeamRole { get; set; } = string.Empty;
        public string? ProjectType { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
