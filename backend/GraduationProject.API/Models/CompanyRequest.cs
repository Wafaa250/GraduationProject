using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace GraduationProject.API.Models
{
    public static class CompanyRequestLifecycleStatus
    {
        public const string Active = "active";
        public const string Paused = "paused";
        public const string Closed = "closed";

        public static bool IsValid(string? value) =>
            value is Active or Paused or Closed;

        public static bool IsModificationBlocked(string? value) =>
            string.Equals(value, Paused, StringComparison.OrdinalIgnoreCase)
            || string.Equals(value, Closed, StringComparison.OrdinalIgnoreCase);
    }

    /// <summary>Lifecycle for company project requests. Matching states reserved for future AI integration.</summary>
    public static class CompanyRequestStatus
    {
        public const string Draft = "draft";
        public const string Submitted = "submitted";
        public const string Archived = "archived";
        /// <summary>Future: AI matching in progress.</summary>
        public const string Matching = "matching";
        /// <summary>Future: AI matching completed.</summary>
        public const string Matched = "matched";
    }

    /// <summary>Matches frontend CompanyRequestType.</summary>
    public static class CompanyRequestType
    {
        public const string Individual = "individual";
        public const string AiBuiltTeam = "ai-built-team";
    }

    [Table("company_requests")]
    public class CompanyRequest
    {
        [Column("id")] public int Id { get; set; }

        [Column("company_profile_id")] public int CompanyProfileId { get; set; }

        /// <summary>individual | ai-built-team</summary>
        [Column("request_type")] public string RequestType { get; set; } = string.Empty;

        [Column("status")] public string Status { get; set; } = CompanyRequestStatus.Draft;

        /// <summary>Workspace lifecycle: active | paused | closed</summary>
        [Column("request_status")] public string RequestStatus { get; set; } = CompanyRequestLifecycleStatus.Active;

        /// <summary>Wizard step index (0–4) while status is draft; null after submit.</summary>
        [Column("wizard_step")] public int? WizardStep { get; set; }

        [Column("title")] public string Title { get; set; } = string.Empty;
        [Column("description")] public string Description { get; set; } = string.Empty;

        /// <summary>Resolved category shown in UI (includes custom Other text).</summary>
        [Column("category")] public string Category { get; set; } = string.Empty;
        [Column("category_choice")] public string? CategoryChoice { get; set; }
        [Column("category_other")] public string? CategoryOther { get; set; }

        [Column("duration_ongoing")] public bool DurationOngoing { get; set; }
        [Column("duration_value")] public int? DurationValue { get; set; }
        [Column("duration_unit")] public DurationUnit? DurationUnit { get; set; }
        [Column("duration_label")] public string? DurationLabel { get; set; }

        [Column("collaboration_format")] public CollaborationFormat? CollaborationFormat { get; set; }
        [Column("scope_notes")] public string? ScopeNotes { get; set; }

        // ── Future AI matching (not used in v1) ─────────────────────────────
        [Column("matching_status")] public string? MatchingStatus { get; set; }
        [Column("matched_at")] public DateTime? MatchedAt { get; set; }

        [Column("created_at")] public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        [Column("updated_at")] public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        [Column("submitted_at")] public DateTime? SubmittedAt { get; set; }
        [Column("created_by_user_id")] public int? CreatedByUserId { get; set; }
        [Column("updated_by_user_id")] public int? UpdatedByUserId { get; set; }

        public CompanyProfile CompanyProfile { get; set; } = null!;
        public ICollection<CompanyRequestRole> Roles { get; set; } = new List<CompanyRequestRole>();
        public ICollection<CompanyRequestInvitation> Invitations { get; set; } = new List<CompanyRequestInvitation>();
        public ICollection<CompanyRequestRecommendationRun> RecommendationRuns { get; set; } =
            new List<CompanyRequestRecommendationRun>();
        public ICollection<CompanyRequestRecommendation> Recommendations { get; set; } =
            new List<CompanyRequestRecommendation>();
        public ICollection<CompanyRequestTeamRecommendationRun> TeamRecommendationRuns { get; set; } =
            new List<CompanyRequestTeamRecommendationRun>();
        public ICollection<CompanyRequestTeamRecommendation> TeamRecommendations { get; set; } =
            new List<CompanyRequestTeamRecommendation>();
    }
}
