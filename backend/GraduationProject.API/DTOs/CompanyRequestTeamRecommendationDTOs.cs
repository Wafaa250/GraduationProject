using System;
using System.Collections.Generic;

namespace GraduationProject.API.DTOs
{
    public class GenerateCompanyRequestTeamRecommendationsDto
    {
        public int TeamCount { get; set; } = 3;
        public int CandidatePoolPerRole { get; set; } = 20;
        public bool ForceRegenerate { get; set; } = false;
    }

    public class CompanyRequestTeamRecommendationRunDto
    {
        public int RunId { get; set; }
        public int CompanyRequestId { get; set; }
        public string AlgorithmVersion { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime GeneratedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        public int TotalTeams { get; set; }
    }

    public class CompanyRequestTeamRecommendationMemberDto
    {
        public int CompanyRequestRoleId { get; set; }
        public string RoleName { get; set; } = string.Empty;
        public int StudentProfileId { get; set; }
        public int UserId { get; set; }
        public string StudentName { get; set; } = string.Empty;
        public string? Major { get; set; }
        public string? Faculty { get; set; }
        public string? University { get; set; }
        public int RoleScore { get; set; }
        public double SemanticSimilarity { get; set; }
        public string AssignmentReason { get; set; } = string.Empty;
        public List<string> Highlights { get; set; } = new();
        public string? Email { get; set; }
        public string? Linkedin { get; set; }
        public string? Github { get; set; }
        public string? Portfolio { get; set; }
    }

    public class CompanyRequestTeamRecommendationDto
    {
        public int TeamId { get; set; }
        public int TeamRank { get; set; }
        public int TotalScore { get; set; }
        public int RoleCoverageScore { get; set; }
        public int CompatibilityScore { get; set; }
        public string SummaryReason { get; set; } = string.Empty;
        public List<string> Strengths { get; set; } = new();
        public List<string> Risks { get; set; } = new();
        public List<CompanyRequestTeamRecommendationMemberDto> Members { get; set; } = new();
    }

    public class CompanyRequestTeamRecommendationResultDto
    {
        public CompanyRequestTeamRecommendationRunDto Run { get; set; } = new();
        public List<CompanyRequestTeamRecommendationDto> Teams { get; set; } = new();
    }

    public class CompanyRequestTeamRecommendationRunHistoryDto
    {
        public int CompanyRequestId { get; set; }
        public int TotalRuns { get; set; }
        public List<CompanyRequestTeamRecommendationRunDto> Runs { get; set; } = new();
    }
}
