using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace GraduationProject.API.DTOs
{
    public class RecruitmentPositionInputDto
    {
        /// <summary>Set when updating an existing position so applications can keep the same position id.</summary>
        public int? Id { get; set; }

        [Required(ErrorMessage = "Role title is required.")]
        [MaxLength(120)]
        public string RoleTitle { get; set; } = string.Empty;

        [Range(1, 500, ErrorMessage = "Needed count must be at least 1.")]
        public int NeededCount { get; set; } = 1;

        [MaxLength(2000)]
        public string? Description { get; set; }

        [MaxLength(2000)]
        public string? Requirements { get; set; }

        /// <summary>Comma-separated labels, e.g. "Canva, Photoshop, Creativity".</summary>
        [MaxLength(1000)]
        public string? RequiredSkills { get; set; }

        public int DisplayOrder { get; set; }
    }

    public class CreateRecruitmentCampaignDto
    {
        [Required(ErrorMessage = "Title is required.")]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        [Required(ErrorMessage = "Description is required.")]
        [MaxLength(8000)]
        public string Description { get; set; } = string.Empty;

        [Required(ErrorMessage = "Application deadline is required.")]
        public DateTime ApplicationDeadline { get; set; }

        [MaxLength(2048)]
        public string? CoverImageUrl { get; set; }

        public bool IsPublished { get; set; } = true;

        [MinLength(1, ErrorMessage = "Add at least one required position.")]
        public List<RecruitmentPositionInputDto> Positions { get; set; } = new();
    }

    public class UpdateRecruitmentCampaignDto
    {
        [MaxLength(200)]
        public string? Title { get; set; }

        [MaxLength(8000)]
        public string? Description { get; set; }

        public DateTime? ApplicationDeadline { get; set; }

        [MaxLength(2048)]
        public string? CoverImageUrl { get; set; }

        public bool? IsPublished { get; set; }

        [MinLength(1, ErrorMessage = "Add at least one required position.")]
        public List<RecruitmentPositionInputDto>? Positions { get; set; }
    }

    public class RecruitmentPositionResponseDto
    {
        public int Id { get; set; }
        public int CampaignId { get; set; }
        public string RoleTitle { get; set; } = string.Empty;
        public int NeededCount { get; set; }
        public string? Description { get; set; }
        public string? Requirements { get; set; }
        public string? RequiredSkills { get; set; }
        public int DisplayOrder { get; set; }
    }

    public class RecruitmentCampaignResponseDto
    {
        public int Id { get; set; }
        public int OrganizationProfileId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime ApplicationDeadline { get; set; }
        public string? CoverImageUrl { get; set; }
        public bool IsPublished { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public string? OrganizationName { get; set; }
        public string? OrganizationLogoUrl { get; set; }
        public List<RecruitmentPositionResponseDto> Positions { get; set; } = new();
    }

    public class PublicRecruitmentCampaignSummaryDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? CoverImageUrl { get; set; }
        public DateTime ApplicationDeadline { get; set; }
        public int OpenPositionsCount { get; set; }
    }

    public class PublicRecruitmentCampaignDetailDto
    {
        public int Id { get; set; }
        public int OrganizationId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime ApplicationDeadline { get; set; }
        public string? CoverImageUrl { get; set; }
        public string OrganizationName { get; set; } = string.Empty;
        public string? OrganizationLogoUrl { get; set; }
        public List<RecruitmentPositionResponseDto> Positions { get; set; } = new();
        public List<RecruitmentQuestionResponseDto> Questions { get; set; } = new();
    }

    public class RecruitmentCoverUploadResponseDto
    {
        public string CoverImageUrl { get; set; } = string.Empty;
    }
}
