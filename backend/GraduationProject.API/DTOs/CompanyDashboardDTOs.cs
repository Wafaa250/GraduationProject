using System;
using System.Collections.Generic;

namespace GraduationProject.API.DTOs
{
    public class CompanyDashboardDto
    {
        public string CompanyName { get; set; } = string.Empty;
        public int ActiveRequests { get; set; }
        public int SavedStudents { get; set; }
        public int SavedTeams { get; set; }
        public int WorkspaceMembers { get; set; }
        public List<CompanyDashboardRequestPreviewDto> ActiveRequestsPreview { get; set; } = new();
        public List<CompanyDashboardActivityItemDto> RecentActivity { get; set; } = new();
        public List<CompanyDashboardSavedStudentDto> RecentSavedStudents { get; set; } = new();
        public List<CompanyDashboardSavedTeamDto> RecentSavedTeams { get; set; } = new();
    }

    public class CompanyDashboardRequestPreviewDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string RequestedRole { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public int SavedStudentsCount { get; set; }
        public int SavedTeamsCount { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class CompanyDashboardActivityItemDto
    {
        public int Id { get; set; }
        public string ActivityType { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string ActorName { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }

    public class CompanyDashboardSavedStudentDto
    {
        public int CompanyRequestId { get; set; }
        public int StudentProfileId { get; set; }
        public string StudentName { get; set; } = string.Empty;
        public string? University { get; set; }
        public string? Major { get; set; }
        public int? MatchScore { get; set; }
        public DateTime SavedAt { get; set; }
    }

    public class CompanyDashboardSavedTeamDto
    {
        public int CompanyRequestId { get; set; }
        public int TeamRecommendationId { get; set; }
        public string TeamName { get; set; } = string.Empty;
        public int MatchScore { get; set; }
        public int MemberCount { get; set; }
        public DateTime SavedAt { get; set; }
    }
}
