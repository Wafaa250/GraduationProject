using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace GraduationProject.API.DTOs
{
    // ── Input (wizard-aligned) ───────────────────────────────────────────────

    public class CompanyRequestRoleInputDto
    {
        /// <summary>Frontend role card id; optional on create.</summary>
        public string? ClientRoleKey { get; set; }

        [Required]
        [MaxLength(120)]
        public string RoleName { get; set; } = string.Empty;

        public List<string> Skills { get; set; } = new();
        [MaxLength(2000)] public string? Notes { get; set; }
        public int SortOrder { get; set; }
    }

    /// <summary>Upsert in-progress wizard state (Review-step Save draft).</summary>
    public class SaveCompanyRequestDraftDto
    {
        [Range(0, 4)]
        public int WizardStep { get; set; }

        /// <summary>individual | ai-built-team</summary>
        public string? RequestType { get; set; }

        [MaxLength(200)] public string Title { get; set; } = string.Empty;
        [MaxLength(8000)] public string Description { get; set; } = string.Empty;

        [MaxLength(120)] public string CategoryChoice { get; set; } = string.Empty;
        [MaxLength(120)] public string CategoryOther { get; set; } = string.Empty;

        /// <summary>Individual flow: single role name (mapped to one role row if Roles empty).</summary>
        [MaxLength(120)] public string? TargetRole { get; set; }

        /// <summary>Individual flow: skills (mapped to single role if Roles empty).</summary>
        public List<string> RequiredSkills { get; set; } = new();

        /// <summary>AI-built team flow: one or more roles with skills.</summary>
        public List<CompanyRequestRoleInputDto> Roles { get; set; } = new();

        public bool DurationOngoing { get; set; }
        [Range(1, 99)] public int? DurationValue { get; set; }
        [MaxLength(20)] public string? DurationUnit { get; set; }

        /// <summary>remote | hybrid | on-site | flexible</summary>
        [MaxLength(32)] public string CollaborationType { get; set; } = string.Empty;
        [MaxLength(4000)] public string? ScopeNotes { get; set; }
    }

    /// <summary>Submit completed request (Create Request on Review). Validation enforced in service.</summary>
    public class CreateCompanyRequestDto : SaveCompanyRequestDraftDto;

    public class UpdateCompanyRequestStatusDto
    {
        [Required]
        public string Status { get; set; } = string.Empty;
    }

    // ── Output ───────────────────────────────────────────────────────────────

    public class CompanyRequestSkillDto
    {
        public int Id { get; set; }
        public string SkillName { get; set; } = string.Empty;
        public int SortOrder { get; set; }
    }

    public class CompanyRequestRoleDto
    {
        public int Id { get; set; }
        public string? ClientRoleKey { get; set; }
        public int SortOrder { get; set; }
        public string RoleName { get; set; } = string.Empty;
        public string? Notes { get; set; }
        public List<CompanyRequestSkillDto> Skills { get; set; } = new();
    }

    public class CompanyRequestSummaryDto
    {
        public int Id { get; set; }
        public string RequestType { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string RequestStatus { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string? DurationLabel { get; set; }
        public string CollaborationType { get; set; } = string.Empty;
        public List<string> RoleNames { get; set; } = new();
        public List<string> SkillNames { get; set; } = new();
        public DateTime CreatedAt { get; set; }
        public DateTime? SubmittedAt { get; set; }
    }

    public class CompanyRequestDetailDto
    {
        public int Id { get; set; }
        public string RequestType { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string RequestStatus { get; set; } = string.Empty;
        public int? WizardStep { get; set; }

        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string? CategoryChoice { get; set; }
        public string? CategoryOther { get; set; }

        public bool DurationOngoing { get; set; }
        public int? DurationValue { get; set; }
        public string? DurationUnit { get; set; }
        public string? DurationLabel { get; set; }
        public string CollaborationType { get; set; } = string.Empty;
        public string? ScopeNotes { get; set; }

        public string? MatchingStatus { get; set; }
        public DateTime? MatchedAt { get; set; }

        public List<CompanyRequestRoleDto> Roles { get; set; } = new();

        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public DateTime? SubmittedAt { get; set; }
    }
}
