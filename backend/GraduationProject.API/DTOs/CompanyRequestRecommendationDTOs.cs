using System;
using System.Collections.Generic;

namespace GraduationProject.API.DTOs
{
    public class CompanyRequestRecommendationGenerateDto
    {
        public int Limit { get; set; } = 20;
        public bool ForceRegenerate { get; set; } = false;
    }

    public class CompanyRequestRecommendationRunDto
    {
        public int RunId { get; set; }
        public int CompanyRequestId { get; set; }
        public string AlgorithmVersion { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string GenerationSource { get; set; } = "manual";
        public DateTime GeneratedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        public int TotalCandidates { get; set; }
        public bool IsLatest { get; set; }
        public bool IsStale { get; set; }
        public string? StaleReason { get; set; }
    }

    public class CompanyRequestRecommendationScoreBreakdownDto
    {
        public int SkillOverlap { get; set; }
        public int RoleDisciplineAlignment { get; set; }
        public int ProfileRelevance { get; set; }
        public int CollaborationFit { get; set; }
        public int ProfileQuality { get; set; }
    }

    public class CompanyRequestRecommendationStudentDto
    {
        public int StudentProfileId { get; set; }
        public int UserId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? AcademicYear { get; set; }
        public string? Bio { get; set; }
        public string? Major { get; set; }
        public string? Faculty { get; set; }
        public string? University { get; set; }
        public List<string> Skills { get; set; } = new();
    }

    public class CompanyRequestRecommendationItemDto
    {
        public int Id { get; set; }
        public int Rank { get; set; }
        public int Score { get; set; }
        public string ReasonSummary { get; set; } = string.Empty;
        public List<string> Highlights { get; set; } = new();
        public string Source { get; set; } = "deterministic";
        public CompanyRequestRecommendationScoreBreakdownDto ScoreBreakdown { get; set; } = new();
        public bool InvitationAlreadySent { get; set; }
        public string? InvitationStatus { get; set; }
        public CompanyRequestRecommendationStudentDto Student { get; set; } = new();
    }

    public class CompanyRequestRecommendationResultDto
    {
        public CompanyRequestRecommendationRunDto Run { get; set; } = new();
        public List<CompanyRequestRecommendationItemDto> Items { get; set; } = new();
    }

    public class CompanyRequestRecommendationRunHistoryDto
    {
        public int CompanyRequestId { get; set; }
        public int TotalRuns { get; set; }
        public List<CompanyRequestRecommendationRunDto> Runs { get; set; } = new();
    }
}
