using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace GraduationProject.API.Models
{
    public static class CompanyRequestRecommendationRunStatus
    {
        public const string Completed = "completed";
        public const string Failed = "failed";
    }

    [Table("company_request_recommendation_runs")]
    public class CompanyRequestRecommendationRun
    {
        [Column("id")] public int Id { get; set; }
        [Column("company_request_id")] public int CompanyRequestId { get; set; }
        [Column("company_profile_id")] public int CompanyProfileId { get; set; }
        [Column("algorithm_version")] public string AlgorithmVersion { get; set; } = "v1-deterministic";
        [Column("status")] public string Status { get; set; } = CompanyRequestRecommendationRunStatus.Completed;
        [Column("generated_at")] public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
        [Column("completed_at")] public DateTime? CompletedAt { get; set; }
        [Column("error_message")] public string? ErrorMessage { get; set; }

        public CompanyRequest CompanyRequest { get; set; } = null!;
        public CompanyProfile CompanyProfile { get; set; } = null!;
        public ICollection<CompanyRequestRecommendation> Recommendations { get; set; } =
            new List<CompanyRequestRecommendation>();
    }
}
