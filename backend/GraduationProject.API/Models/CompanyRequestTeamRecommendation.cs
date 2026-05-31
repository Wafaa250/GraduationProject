using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace GraduationProject.API.Models
{
    [Table("company_request_team_recommendations")]
    public class CompanyRequestTeamRecommendation
    {
        [Column("id")] public int Id { get; set; }
        [Column("run_id")] public int RunId { get; set; }
        [Column("company_request_id")] public int CompanyRequestId { get; set; }
        [Column("team_rank")] public int TeamRank { get; set; }
        [Column("total_score")] public int TotalScore { get; set; }
        [Column("role_coverage_score")] public int RoleCoverageScore { get; set; }
        [Column("compatibility_score")] public int CompatibilityScore { get; set; }
        [Column("summary_reason")] public string SummaryReason { get; set; } = string.Empty;
        [Column("strengths_json")] public string? StrengthsJson { get; set; }
        [Column("risks_json")] public string? RisksJson { get; set; }
        [Column("created_at")] public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public CompanyRequestTeamRecommendationRun Run { get; set; } = null!;
        public CompanyRequest CompanyRequest { get; set; } = null!;
        public ICollection<CompanyRequestTeamRecommendationMember> Members { get; set; } =
            new List<CompanyRequestTeamRecommendationMember>();
    }
}
