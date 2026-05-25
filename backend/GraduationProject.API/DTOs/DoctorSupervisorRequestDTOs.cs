using System;
using System.Collections.Generic;

namespace GraduationProject.API.DTOs
{
    public class DoctorSupervisorRequestsSummaryDto
    {
        public int PendingCount { get; set; }
        public int AcceptedCount { get; set; }
        public int RejectedCount { get; set; }
        public int TotalCount { get; set; }
    }

    public class DoctorSupervisorAiCompatibilityDto
    {
        public int Score { get; set; }
        public List<string> Matches { get; set; } = new();
    }

    public class DoctorSupervisorRequestHistoryItemDto
    {
        public string Event { get; set; } = string.Empty;
        public DateTime At { get; set; }
    }

    public class DoctorSupervisorRequestMemberDto
    {
        public int StudentId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public string Major { get; set; } = string.Empty;
        public string AcademicYear { get; set; } = string.Empty;
        public string Initials { get; set; } = string.Empty;
    }

    public class DoctorSupervisorRequestProjectDto
    {
        public int ProjectId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public List<string> RequiredSkills { get; set; } = new();
        public List<string> Technologies { get; set; } = new();
        public List<string> PreferredRoles { get; set; } = new();
        public string ProjectType { get; set; } = "GP";
        public string Stage { get; set; } = string.Empty;
        public int PartnersCount { get; set; }
        public int MemberCount { get; set; }
        public string? Faculty { get; set; }
        public string? Department { get; set; }
        public List<DoctorSupervisorRequestMemberDto> Members { get; set; } = new();
    }

    public class DoctorSupervisorRequestSenderDto
    {
        public int StudentId { get; set; }
        public int UserId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Major { get; set; } = string.Empty;
        public string University { get; set; } = string.Empty;
        public string Faculty { get; set; } = string.Empty;
        public string AcademicYear { get; set; } = string.Empty;
        public decimal? Gpa { get; set; }
        public string Initials { get; set; } = string.Empty;
    }

    public class DoctorSupervisorRequestListItemDto
    {
        public int RequestId { get; set; }
        public string RequestCode { get; set; } = string.Empty;
        public DoctorSupervisorRequestProjectDto Project { get; set; } = new();
        public DoctorSupervisorRequestSenderDto Sender { get; set; } = new();
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime? RespondedAt { get; set; }
        public string? DoctorResponseNote { get; set; }
        public DoctorSupervisorAiCompatibilityDto AiCompatibility { get; set; } = new();
        public List<DoctorSupervisorRequestHistoryItemDto> History { get; set; } = new();
    }

    public class SupervisorRequestDecisionDto
    {
        public string? Feedback { get; set; }
    }
}
