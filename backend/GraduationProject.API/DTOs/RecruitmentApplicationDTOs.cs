using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace GraduationProject.API.DTOs
{
    public class RecruitmentApplicationAnswerInputDto
    {
        [Required]
        public int QuestionId { get; set; }

        /// <summary>Single-value answers (text, choice, file URL, etc.).</summary>
        public string? Value { get; set; }

        /// <summary>Checkbox-list selections.</summary>
        public List<string>? Values { get; set; }
    }

    public class SubmitRecruitmentApplicationDto
    {
        [Required]
        [MinLength(1, ErrorMessage = "At least one answer is required.")]
        public List<RecruitmentApplicationAnswerInputDto> Answers { get; set; } = new();
    }

    public class UpdateRecruitmentApplicationStatusDto
    {
        [Required]
        [MaxLength(32)]
        public string Status { get; set; } = string.Empty;
    }

    public class StudentRecruitmentApplicationStatusDto
    {
        public bool HasSubmitted { get; set; }
        public int? ApplicationId { get; set; }
        public string? Status { get; set; }
        public DateTime? SubmittedAt { get; set; }
        public DateTime? AcceptedAt { get; set; }
        public int OrganizationId { get; set; }
        public string OrganizationName { get; set; } = string.Empty;
        public int CampaignId { get; set; }
        public string CampaignTitle { get; set; } = string.Empty;
        public int PositionId { get; set; }
        public string PositionRoleTitle { get; set; } = string.Empty;
        public string? MembershipKind { get; set; }
        public bool IsOrganizationMember { get; set; }
    }

    public class RecruitmentApplicationAnswerResponseDto
    {
        public int QuestionId { get; set; }
        public string QuestionTitle { get; set; } = string.Empty;
        public string QuestionType { get; set; } = string.Empty;
        public string AnswerValue { get; set; } = string.Empty;
        public List<string>? SelectedValues { get; set; }
    }

    public class RecruitmentApplicationListItemDto
    {
        public int Id { get; set; }
        public int StudentProfileId { get; set; }
        public string StudentName { get; set; } = string.Empty;
        public string? StudentEmail { get; set; }
        public string? StudentMajor { get; set; }
        public int PositionId { get; set; }
        public string PositionRoleTitle { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime SubmittedAt { get; set; }
        public string PreviewAnswer { get; set; } = string.Empty;
    }

    public class RecruitmentApplicationDetailDto
    {
        public int Id { get; set; }
        public int OrganizationId { get; set; }
        public int CampaignId { get; set; }
        public string CampaignTitle { get; set; } = string.Empty;
        public int PositionId { get; set; }
        public string PositionRoleTitle { get; set; } = string.Empty;
        public int StudentProfileId { get; set; }
        public string StudentName { get; set; } = string.Empty;
        public string? StudentEmail { get; set; }
        public string? StudentMajor { get; set; }
        public string? StudentAcademicYear { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime SubmittedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        public DateTime? AcceptedAt { get; set; }

        public List<RecruitmentApplicationAnswerResponseDto> Answers { get; set; } = new();
    }

    public class RecruitmentApplicationSubmitResponseDto
    {
        public int ApplicationId { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime SubmittedAt { get; set; }
        public string Message { get; set; } = string.Empty;
    }

    public class RecruitmentApplicationFileUploadResponseDto
    {
        public string FileUrl { get; set; } = string.Empty;
    }
}
