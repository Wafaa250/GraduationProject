using System.Collections.Generic;

namespace GraduationProject.API.DTOs
{
    // ===========================
    // SUGGESTED TEAMMATE
    // ===========================
    public class SuggestedTeammateDto
    {
        public int UserId { get; set; }
        public int ProfileId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Major { get; set; } = string.Empty;
        public string University { get; set; } = string.Empty;
        public string AcademicYear { get; set; } = string.Empty;
        public string? ProfilePicture { get; set; }
        public List<string> Skills { get; set; } = new();
        public int MatchScore { get; set; }
    }

    // ===========================
    // PROFILE STRENGTH
    // ===========================
    public class ProfileStrengthDto
    {
        public int Score { get; set; }
        public bool HasProfilePicture { get; set; }
        public bool HasGeneralSkills { get; set; }
        public bool HasMajorSkills { get; set; }
        public bool HasBio { get; set; }
        public bool HasGpa { get; set; }
    }

    // ===========================
    // DASHBOARD PROJECT
    // ===========================
    public class DashboardProjectDto
    {
        public int ProjectId { get; set; }
        public string ProjectName { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty; // "owner" | "member"
        public int MemberCount { get; set; }
        public int MaxTeamSize { get; set; }
        public bool IsFull { get; set; }
    }

    // ===========================
    // DASHBOARD SUMMARY
    // ===========================
    public class DashboardSummaryDto
    {
        public string Name { get; set; } = string.Empty;
        public string Major { get; set; } = string.Empty;
        public string University { get; set; } = string.Empty;
        public string AcademicYear { get; set; } = string.Empty;
        public int TotalSkills { get; set; }
        public ProfileStrengthDto ProfileStrength { get; set; } = new();
        public List<SuggestedTeammateDto> SuggestedTeammates { get; set; } = new();
        public DashboardProjectDto? MyProject { get; set; } // ✅ كان ناقص
    }
}