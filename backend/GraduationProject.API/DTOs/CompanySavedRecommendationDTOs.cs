using System;
using System.Collections.Generic;

namespace GraduationProject.API.DTOs
{
    public class CompanySavedRecommendationIdsDto
    {
        public List<int> StudentProfileIds { get; set; } = new();
        public List<int> TeamRecommendationIds { get; set; } = new();
    }

    public class CompanySavedStudentRecommendationDto
    {
        public int Id { get; set; }
        public int CompanyRequestId { get; set; }
        public string RequestTitle { get; set; } = string.Empty;
        public int StudentProfileId { get; set; }
        public string StudentName { get; set; } = string.Empty;
        public string? Major { get; set; }
        public string? University { get; set; }
        public string? AcademicYear { get; set; }
        public int? MatchScore { get; set; }
        public string? ReasonSummary { get; set; }
        public List<string> Highlights { get; set; } = new();
        public string? Email { get; set; }
        public string? Linkedin { get; set; }
        public string? Github { get; set; }
        public string? Portfolio { get; set; }
        public string SavedByName { get; set; } = string.Empty;
        public DateTime SavedAt { get; set; }
        public string? Note { get; set; }
    }

    public class CompanySavedTeamRecommendationDto
    {
        public int Id { get; set; }
        public int CompanyRequestId { get; set; }
        public string RequestTitle { get; set; } = string.Empty;
        public int TeamRecommendationId { get; set; }
        public int TeamRank { get; set; }
        public int TotalScore { get; set; }
        public int RoleCoverageScore { get; set; }
        public int CompatibilityScore { get; set; }
        public int MemberCount { get; set; }
        public string SummaryReason { get; set; } = string.Empty;
        public List<string> MemberNames { get; set; } = new();
        public string SavedByName { get; set; } = string.Empty;
        public DateTime SavedAt { get; set; }
        public string? Note { get; set; }
    }

    public class CompanySavedRecommendationsPageDto
    {
        public List<CompanySavedStudentRecommendationDto> Students { get; set; } = new();
        public List<CompanySavedTeamRecommendationDto> Teams { get; set; } = new();
    }

    public class UpdateSavedRecommendationNoteDto
    {
        public string? Note { get; set; }
    }
}
