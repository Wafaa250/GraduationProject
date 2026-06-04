using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using GraduationProject.API.DTOs;
using GraduationProject.API.Models;

namespace GraduationProject.API.Helpers
{
    public static class FeedMappingHelper
    {
        public static FeedItemDto MapToFeedItem(FeedPostDto post)
        {
            var orgId = post.AuthorType == FeedAuthorTypes.Association ? post.AuthorId : (int?)null;
            var companyId = post.AuthorType == FeedAuthorTypes.Company ? post.AuthorId : (int?)null;

            return new FeedItemDto
            {
                Id = post.PostKey,
                SourceType = post.AuthorType,
                SourceName = post.AuthorName,
                SourceAvatarUrl = post.AuthorAvatarUrl,
                SourceImageBase64 = post.AuthorImageBase64,
                SourceSubtitle = post.SourceSubtitle,
                Title = post.Title,
                Description = post.Content,
                RelatedEntityType = post.SourceType,
                RelatedEntityId = post.EntityId,
                FollowEntityId = post.AuthorType is FeedAuthorTypes.Company or FeedAuthorTypes.Association
                    ? post.AuthorId
                    : 0,
                OrganizationProfileId = post.OrganizationProfileId ?? orgId,
                CompanyProfileId = post.CompanyProfileId ?? companyId,
                EventId = post.EventId,
                RecruitmentCampaignId = post.RecruitmentCampaignId,
                PositionId = post.PositionId,
                CompanyRequestId = post.CompanyRequestId,
                CreatedAt = post.PublishedAt,
                ActionText = post.ActionLabel,
                ActionUrl = post.ActionPath,
                ImageUrl = post.ImageUrl,
                Metadata = post.Metadata ?? new List<FeedItemMetadataDto>(),
            };
        }

        public static void AddMetadata(
            ICollection<FeedItemMetadataDto> list,
            string label,
            string? value)
        {
            if (string.IsNullOrWhiteSpace(value)) return;
            list.Add(new FeedItemMetadataDto { Label = label, Value = value.Trim() });
        }

        public static string FormatCompanyDuration(CompanyRequest request)
        {
            if (request.DurationOngoing)
                return "Ongoing";
            if (!string.IsNullOrWhiteSpace(request.DurationLabel))
                return request.DurationLabel.Trim();
            if (request.DurationValue.HasValue && request.DurationUnit.HasValue)
                return $"{request.DurationValue} {request.DurationUnit}";
            return string.Empty;
        }

        public static string FormatCollaboration(CollaborationFormat? format)
        {
            if (!format.HasValue) return string.Empty;
            return format.Value switch
            {
                CollaborationFormat.Remote => "Remote",
                CollaborationFormat.Hybrid => "Hybrid",
                CollaborationFormat.OnSite => "On-site",
                CollaborationFormat.Flexible => "Flexible",
                _ => format.Value.ToString(),
            };
        }

        public static string FormatDate(DateTime? value)
        {
            if (!value.HasValue) return string.Empty;
            return value.Value.ToString("MMM d, yyyy", CultureInfo.InvariantCulture);
        }

        public static string CollectCompanySkills(CompanyRequest request)
        {
            var skills = request.Roles?
                .SelectMany(r => r.Skills ?? Enumerable.Empty<CompanyRequestSkill>())
                .Select(s => s.SkillName)
                .Where(s => !string.IsNullOrWhiteSpace(s))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .Take(8)
                .ToList() ?? new List<string>();
            return skills.Count == 0 ? string.Empty : string.Join(", ", skills);
        }

        public static string CompanyRequestTypeLabel(string requestType) =>
            string.Equals(requestType, CompanyRequestType.AiBuiltTeam, StringComparison.OrdinalIgnoreCase)
                ? "Team request"
                : "Individual request";

        public static string CompanyOpportunityActionLabel(CompanyRequest request)
        {
            var category = (request.Category ?? string.Empty).Trim();
            var haystack = $"{category} {request.Title} {request.Description}".ToLowerInvariant();
            if (haystack.Contains("intern"))
                return "View Internship";
            if (haystack.Contains("recruit") || haystack.Contains("hire"))
                return "View Recruitment";
            return "View Opportunity";
        }

        public static string Truncate(string? value, int max)
        {
            var text = value?.Trim() ?? string.Empty;
            if (text.Length <= max) return text;
            return text[..max].TrimEnd() + "…";
        }
    }
}
