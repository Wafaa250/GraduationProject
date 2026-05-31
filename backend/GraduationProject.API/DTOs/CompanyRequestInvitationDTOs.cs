using System;
using System.ComponentModel.DataAnnotations;

namespace GraduationProject.API.DTOs
{
    public class CreateCompanyRequestInvitationDto
    {
        [Range(1, int.MaxValue)]
        public int StudentProfileId { get; set; }

        public int? CompanyRequestRoleId { get; set; }

        [MaxLength(2000)]
        public string? Message { get; set; }

        [Range(0, 100)]
        public decimal? MatchScore { get; set; }

        [MaxLength(100)]
        public string? Source { get; set; }
    }

    public class CompanyRequestInvitationSummaryDto
    {
        public int Id { get; set; }
        public int CompanyRequestId { get; set; }
        public int CompanyProfileId { get; set; }
        public int StudentProfileId { get; set; }
        public int InvitedByUserId { get; set; }
        public int? CompanyRequestRoleId { get; set; }
        public string? CompanyRequestRoleName { get; set; }
        public string? Message { get; set; }
        public string Status { get; set; } = string.Empty;
        public decimal? MatchScore { get; set; }
        public string? Source { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? RespondedAt { get; set; }
        public DateTime? CancelledAt { get; set; }
    }

    public class CompanyRequestInvitationDetailDto : CompanyRequestInvitationSummaryDto
    {
        public string CompanyName { get; set; } = string.Empty;
        public string RequestTitle { get; set; } = string.Empty;
        public string StudentName { get; set; } = string.Empty;
        public string StudentEmail { get; set; } = string.Empty;
        public string? StudentMajor { get; set; }
        public string? StudentUniversity { get; set; }
        public string? StudentFaculty { get; set; }
    }
}
