using System;
using System.Collections.Generic;

namespace GraduationProject.API.DTOs
{
    public class FeedResponseDto
    {
        public List<FeedItemDto> Items { get; set; } = new();
        public FeedSidebarSummaryDto Sidebar { get; set; } = new();
        public FeedSuggestionsDto Suggestions { get; set; } = new();
        /// <summary>Members matching the search query (students, doctors, companies, associations).</summary>
        public List<FeedDiscoverMemberDto> SearchResults { get; set; } = new();
    }

    public class FeedItemDto
    {
        public string Id { get; set; } = string.Empty;
        /// <summary>Publisher role: company | association | doctor | student</summary>
        public string SourceType { get; set; } = string.Empty;
        public string SourceName { get; set; } = string.Empty;
        public string? SourceAvatarUrl { get; set; }
        public string? SourceImageBase64 { get; set; }
        public string? SourceSubtitle { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        /// <summary>Underlying activity type (e.g. company_opportunity, association_event).</summary>
        public string RelatedEntityType { get; set; } = string.Empty;
        public int RelatedEntityId { get; set; }
        /// <summary>Company profile id or association org id — used for Follow on feed cards.</summary>
        public int FollowEntityId { get; set; }
        public int? EventId { get; set; }
        public int? RecruitmentCampaignId { get; set; }
        public int? PositionId { get; set; }
        public int? CompanyRequestId { get; set; }
        public int? CompanyProfileId { get; set; }
        public int? OrganizationProfileId { get; set; }
        public DateTime CreatedAt { get; set; }
        public string ActionText { get; set; } = "View details";
        public string? ActionUrl { get; set; }
        public string? ImageUrl { get; set; }
        public List<FeedItemMetadataDto> Metadata { get; set; } = new();
    }

    public class FeedItemMetadataDto
    {
        public string Label { get; set; } = string.Empty;
        public string Value { get; set; } = string.Empty;
    }

    public class FeedPostDto
    {
        public string PostKey { get; set; } = string.Empty;
        public string SourceType { get; set; } = string.Empty;
        public int EntityId { get; set; }
        public string AuthorType { get; set; } = string.Empty;
        public int AuthorId { get; set; }
        public string AuthorName { get; set; } = string.Empty;
        public string? AuthorAvatarUrl { get; set; }
        public string? AuthorImageBase64 { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public string? ImageUrl { get; set; }
        public string? PostKind { get; set; }
        public DateTime PublishedAt { get; set; }
        public string? SourceSubtitle { get; set; }
        public List<FeedItemMetadataDto> Metadata { get; set; } = new();
        public string ActionLabel { get; set; } = "View details";
        public string? ActionPath { get; set; }
        public int? EventId { get; set; }
        public int? RecruitmentCampaignId { get; set; }
        public int? PositionId { get; set; }
        public int? CompanyRequestId { get; set; }
        public int? CompanyProfileId { get; set; }
        public int? OrganizationProfileId { get; set; }
    }

    public class FeedSidebarSummaryDto
    {
        public string Role { get; set; } = "student";
        public StudentFeedSidebarDto? Student { get; set; }
        public DoctorFeedSidebarDto? Doctor { get; set; }
        public CompanyFeedSidebarDto? Company { get; set; }
        public AssociationFeedSidebarDto? Association { get; set; }
    }

    public class StudentFeedSidebarDto
    {
        public string Name { get; set; } = string.Empty;
        public string? ProfilePictureBase64 { get; set; }
        public string? Major { get; set; }
        public string? University { get; set; }
        public string? AcademicYear { get; set; }
        public int SkillsCount { get; set; }
        public int JoinedTeamsCount { get; set; }
        public int CompletedProjectsCount { get; set; }
        public List<string> RoleBadges { get; set; } = new();
        public int ProfileCompletionPercent { get; set; }
    }

    public class DoctorFeedSidebarDto
    {
        public string Name { get; set; } = string.Empty;
        public string? ProfilePictureBase64 { get; set; }
        public string? Specialization { get; set; }
        public int CoursesCount { get; set; }
        public int SupervisedProjectsCount { get; set; }
    }

    public class CompanyFeedSidebarDto
    {
        public string CompanyName { get; set; } = string.Empty;
        public string? Industry { get; set; }
        public int ActiveOpportunitiesCount { get; set; }
    }

    public class AssociationFeedSidebarDto
    {
        public string AssociationName { get; set; } = string.Empty;
        public string? LogoUrl { get; set; }
        public string? Category { get; set; }
        public int ActiveAnnouncementsCount { get; set; }
    }

    public class FeedSuggestionsDto
    {
        public List<FeedSuggestedCompanyDto> SuggestedCompanies { get; set; } = new();
        public List<FeedSuggestedAssociationDto> SuggestedAssociations { get; set; } = new();
        public List<FeedDiscoverMemberDto> DiscoverMembers { get; set; } = new();
        public FeedRecommendedForYouDto RecommendedForYou { get; set; } = new();
    }

    public class FeedRecommendedForYouDto
    {
        public List<FeedRecommendedStudentDto> Students { get; set; } = new();
        public List<FeedRecommendedDoctorDto> Doctors { get; set; } = new();
        public List<FeedSuggestedCompanyDto> Companies { get; set; } = new();
        public List<FeedSuggestedAssociationDto> Associations { get; set; } = new();
    }

    public class FeedRecommendedDoctorDto
    {
        public int UserId { get; set; }
        public int ProfileId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Subtitle { get; set; }
        public string? AvatarBase64 { get; set; }
        public int MatchScore { get; set; }
    }

    public class FeedRecommendedStudentDto
    {
        public int UserId { get; set; }
        public int ProfileId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Subtitle { get; set; }
        public string? AvatarBase64 { get; set; }
        public int MatchScore { get; set; }
    }

    public class FeedDiscoverMemberDto
    {
        public string EntityType { get; set; } = string.Empty; // student | doctor | company | association
        public int EntityId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Subtitle { get; set; }
        public string? AvatarUrl { get; set; }
        public string? AvatarBase64 { get; set; }
    }

    public class FeedSuggestedCompanyDto
    {
        public int CompanyProfileId { get; set; }
        public string CompanyName { get; set; } = string.Empty;
        public string? Industry { get; set; }
        public string? LogoUrl { get; set; }
        public string? Category { get; set; }
        public int MatchScore { get; set; }
        public bool IsFollowing { get; set; }
    }

    public class FeedSuggestedAssociationDto
    {
        public int OrganizationId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Category { get; set; }
        public string? Faculty { get; set; }
        public string? LogoUrl { get; set; }
        public int MatchScore { get; set; }
        public bool IsFollowing { get; set; }
    }

    public class FeedPostCommentDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string AuthorName { get; set; } = string.Empty;
        public string? AuthorAvatarBase64 { get; set; }
        public string Content { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }

    public class CreateFeedCommentDto
    {
        public string Content { get; set; } = string.Empty;
    }

    public class FeedEngagementDto
    {
        public int LikeCount { get; set; }
        public int CommentCount { get; set; }
        public bool LikedByMe { get; set; }
        public bool SavedByMe { get; set; }
    }
}
