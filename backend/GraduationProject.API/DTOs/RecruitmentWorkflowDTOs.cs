using System;
using System.Collections.Generic;

namespace GraduationProject.API.DTOs
{
    public class RecruitmentAiRegenerateRequestDto
    {
        public List<int> ExcludeStudentIds { get; set; } = new();

        public List<string> PreferSkills { get; set; } = new();

        public List<string> PreferMajors { get; set; } = new();

        public int MinMatch { get; set; } = 70;

        /// <summary>When true, rejected applicants are excluded (default behavior).</summary>
        public bool ExcludeRejectedApplicants { get; set; } = true;
    }

    public class RecruitmentApplicationDecisionResponseDto
    {
        public RecruitmentApplicationDetailDto Application { get; set; } = null!;

        public bool AddedToOrganization { get; set; }

        public DateTime? MemberAcceptedAt { get; set; }

        public int? OrganizationMemberId { get; set; }

        public string? MembershipKind { get; set; }

        public int? TeamMemberId { get; set; }

        public bool AddedToLeadershipShowcase { get; set; }
    }
}
