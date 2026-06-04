using System.Collections.Generic;

namespace GraduationProject.API.DTOs
{
    public class SearchHitDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Subtitle { get; set; }
        public string? Email { get; set; }
        public string? Username { get; set; }
        public string? AvatarUrl { get; set; }
        public string? AvatarBase64 { get; set; }
        /// <summary>student | doctor | company | association | project | projectRequest | recruitment | event | opportunity</summary>
        public string RoleType { get; set; } = string.Empty;
        /// <summary>Frontend route path (relative).</summary>
        public string Url { get; set; } = string.Empty;
        /// <summary>Parent organization id when relevant (events, recruitment).</summary>
        public int? OrganizationId { get; set; }
        /// <summary>False for legacy company users without a company_profiles row.</summary>
        public bool Followable { get; set; } = true;
        /// <summary>users.id when Id is 0 (orphan company account).</summary>
        public int? UserId { get; set; }
    }

    public class SearchSuggestionsResponseDto
    {
        public List<SearchHitDto> Students { get; set; } = new();
        public List<SearchHitDto> Companies { get; set; } = new();
        public List<SearchHitDto> Associations { get; set; } = new();
    }

    public class GlobalSearchResponseDto
    {
        public List<SearchHitDto> Students { get; set; } = new();
        public List<SearchHitDto> Doctors { get; set; } = new();
        public List<SearchHitDto> Companies { get; set; } = new();
        public List<SearchHitDto> Associations { get; set; } = new();
        public List<SearchHitDto> Projects { get; set; } = new();
        public List<SearchHitDto> ProjectRequests { get; set; } = new();
        public List<SearchHitDto> RecruitmentCampaigns { get; set; } = new();
        public List<SearchHitDto> Events { get; set; } = new();
        public List<SearchHitDto> Opportunities { get; set; } = new();
    }
}
