using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace GraduationProject.API.Models
{
    [Table("company_request_team_recommendation_members")]
    public class CompanyRequestTeamRecommendationMember
    {
        [Column("id")] public int Id { get; set; }
        [Column("team_recommendation_id")] public int TeamRecommendationId { get; set; }
        [Column("company_request_role_id")] public int CompanyRequestRoleId { get; set; }
        [Column("student_profile_id")] public int StudentProfileId { get; set; }
        [Column("role_score")] public int RoleScore { get; set; }
        [Column("semantic_similarity")] public double SemanticSimilarity { get; set; }
        [Column("assignment_reason")] public string AssignmentReason { get; set; } = string.Empty;
        [Column("highlights_json")] public string? HighlightsJson { get; set; }
        [Column("created_at")] public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public CompanyRequestTeamRecommendation TeamRecommendation { get; set; } = null!;
        public CompanyRequestRole CompanyRequestRole { get; set; } = null!;
        public StudentProfile StudentProfile { get; set; } = null!;
    }
}
