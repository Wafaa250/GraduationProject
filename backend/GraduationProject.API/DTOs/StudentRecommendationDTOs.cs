using System.Collections.Generic;

namespace GraduationProject.API.DTOs
{
    public class FeedRecommendationsResponseDto
    {
        public List<StudentRecommendedStudentDto> Students { get; set; } = new();
        public List<StudentRecommendedDoctorDto> Doctors { get; set; } = new();
        public List<StudentRecommendedCompanyDto> Companies { get; set; } = new();
        public List<StudentRecommendedAssociationDto> Associations { get; set; } = new();
    }

    public class StudentRecommendedDoctorDto
    {
        public int UserId { get; set; }
        public int ProfileId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Subtitle { get; set; }
        public string? AvatarBase64 { get; set; }
        public int MatchScore { get; set; }
    }

    public class StudentRecommendedStudentDto
    {
        public int UserId { get; set; }
        public int ProfileId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Subtitle { get; set; }
        public string? AvatarBase64 { get; set; }
        public int MatchScore { get; set; }
    }

    public class StudentRecommendedCompanyDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? LogoUrl { get; set; }
        public string? Category { get; set; }
        public int MatchScore { get; set; }
        public bool IsFollowing { get; set; }
    }

    public class StudentRecommendedAssociationDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? LogoUrl { get; set; }
        public string? Category { get; set; }
        public int MatchScore { get; set; }
        public bool IsFollowing { get; set; }
    }

    /// <summary>Unified Communication Hub recommendations (all roles, sorted by match).</summary>
    public class FeedRecommendedResponseDto
    {
        public List<FeedRecommendedItemDto> Items { get; set; } = new();
        public FeedRecommendedPoolStatsDto PoolStats { get; set; } = new();
    }

    /// <summary>Candidate counts for debugging recommendation balance (Communication Hub).</summary>
    public class FeedRecommendedPoolStatsDto
    {
        public int StudentsInPool { get; set; }
        public int DoctorsInPool { get; set; }
        public int CompaniesInPool { get; set; }
        public int AssociationsInPool { get; set; }
        public int CompaniesInDatabase { get; set; }
        public int AssociationsInDatabase { get; set; }
        public int RotationSeed { get; set; }
        public int ExcludedCount { get; set; }
        public string ReturnedTypes { get; set; } = string.Empty;
    }

    public class FeedRecommendedItemDto
    {
        public string Id { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public int EntityId { get; set; }
        public int? UserId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Subtitle { get; set; }
        public string? AvatarUrl { get; set; }
        public string? AvatarBase64 { get; set; }
        public int MatchScore { get; set; }
        public bool IsFollowing { get; set; }
        public bool IsFollowed { get; set; }
        public string? ProfileUrl { get; set; }
        public bool CanMessage { get; set; }
        public bool CanFollow { get; set; }
    }

    /// <summary>Compact AI match widget for the student sidebar.</summary>
    public class StudentAiMatchStatusDto
    {
        public int MatchScorePercent { get; set; }
        public string Headline { get; set; } = string.Empty;
        public string Insight { get; set; } = string.Empty;
        public string AvailabilityStatus { get; set; } = string.Empty;
        public int StudentMatchCount { get; set; }
        public int DoctorMatchCount { get; set; }
        public int CompanyMatchCount { get; set; }
        public int AssociationMatchCount { get; set; }
        public int ProfileStrengthScore { get; set; }
        public bool HasMatchInsights { get; set; }
        public bool ShowEmptyState { get; set; }
    }
}
