using GraduationProject.API.DTOs;

namespace GraduationProject.API.Services.Recommendations
{
    public interface IRecommendationScoringEngine
    {
        RecommendationScoreResult Score(RecommendationRequestContext request, RecommendationCandidateContext candidate);
    }

    public class RecommendationRequestContext
    {
        public int RequestId { get; set; }
        public List<string> RequestedSkills { get; set; } = new();
        public List<string> RequestedRoles { get; set; } = new();
        public List<string> RequestedTools { get; set; } = new();
        public List<string> TextSignals { get; set; } = new();
        public string? Collaboration { get; set; }
    }

    public class RecommendationCandidateContext
    {
        public List<string> Skills { get; set; } = new();
        public List<string> Tools { get; set; } = new();
        public List<string> InterestSignals { get; set; } = new();
        public List<string> DisciplineSignals { get; set; } = new();
        public string? Bio { get; set; }
        public string? Availability { get; set; }
        public string? InvitationStatus { get; set; }
    }

    public class RecommendationScoreResult
    {
        public int TotalScore { get; set; }
        public bool PassesThreshold { get; set; }
        public int DisciplineRelevance { get; set; }
        public string ReasonSummary { get; set; } = string.Empty;
        public List<string> Highlights { get; set; } = new();
        public CompanyRequestRecommendationScoreBreakdownDto Breakdown { get; set; } = new();
    }
}
