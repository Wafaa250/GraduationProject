using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace GraduationProject.API.Models
{
    [Table("company_request_recommendations")]
    public class CompanyRequestRecommendation
    {
        [Column("id")] public int Id { get; set; }
        [Column("run_id")] public int RunId { get; set; }
        [Column("company_request_id")] public int CompanyRequestId { get; set; }
        [Column("student_profile_id")] public int StudentProfileId { get; set; }
        [Column("rank")] public int Rank { get; set; }
        [Column("score")] public int Score { get; set; }
        [Column("score_breakdown_json")] public string? ScoreBreakdownJson { get; set; }
        [Column("reason_summary")] public string ReasonSummary { get; set; } = string.Empty;
        [Column("highlights_json")] public string? HighlightsJson { get; set; }
        [Column("source")] public string Source { get; set; } = "deterministic";
        [Column("created_at")] public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public CompanyRequestRecommendationRun Run { get; set; } = null!;
        public CompanyRequest CompanyRequest { get; set; } = null!;
        public StudentProfile StudentProfile { get; set; } = null!;
    }
}
