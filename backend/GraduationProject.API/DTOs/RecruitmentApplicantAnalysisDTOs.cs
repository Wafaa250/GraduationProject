using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace GraduationProject.API.DTOs
{
    public class RecruitmentApplicantAnalysisResultDto
    {
        public string Status { get; set; } = "AiSuggested";

        /// <summary>Student profile id (matches AI payload field studentId).</summary>
        [JsonPropertyName("studentId")]
        public int StudentProfileId { get; set; }

        [JsonPropertyName("studentUserId")]
        public int StudentUserId { get; set; }

        public int ApplicationId { get; set; }

        [JsonPropertyName("matchScore")]
        public int MatchScore { get; set; }

        public List<string> Strengths { get; set; } = new();

        public List<string> Concerns { get; set; } = new();

        public string Reason { get; set; } = string.Empty;

        public string StudentName { get; set; } = string.Empty;

        public string? Faculty { get; set; }

        public string? Major { get; set; }
    }

    public class RecruitmentApplicantAnalysisResponseDto
    {
        public List<RecruitmentApplicantAnalysisResultDto> Results { get; set; } = new();

        public DateTimeOffset AnalyzedAt { get; set; }
    }
}
