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

        /// <summary>Hero stat: count of suggested teammate rows (same cap as SuggestedTeammates list).</summary>
        public int SuggestedTeammatesCount { get; set; }

        /// <summary>Hero stat: graduation projects the student can join with skill overlap (or open listings with no required skills).</summary>
        public int MatchedGraduationProjectsCount { get; set; }

        /// <summary>Hero stat: highest teammate match percent, or null when none.</summary>
        public int? BestTeammateMatchPercent { get; set; }

        /// <summary>Hero stat: pending graduation ProjectInvitations + course team invites (notification dedup), matching dashboard merge rules.</summary>
        public int PendingTeamInvitationsCount { get; set; }
    }
}