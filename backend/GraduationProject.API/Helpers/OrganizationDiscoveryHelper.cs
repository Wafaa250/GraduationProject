using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using GraduationProject.API.Data;
using GraduationProject.API.DTOs;
using GraduationProject.API.Models;
using Microsoft.EntityFrameworkCore;

namespace GraduationProject.API.Helpers
{
    public static class OrganizationDiscoveryHelper
    {
        public static async Task<Dictionary<int, int>> GetFollowerCountsAsync(
            ApplicationDbContext db,
            IReadOnlyList<int> organizationIds)
        {
            if (organizationIds.Count == 0)
                return new Dictionary<int, int>();

            try
            {
                return await db.OrganizationFollows
                    .AsNoTracking()
                    .Where(f => organizationIds.Contains(f.OrganizationProfileId))
                    .GroupBy(f => f.OrganizationProfileId)
                    .Select(g => new { OrganizationId = g.Key, Count = g.Count() })
                    .ToDictionaryAsync(x => x.OrganizationId, x => x.Count);
            }
            catch
            {
                return new Dictionary<int, int>();
            }
        }

        public static async Task<HashSet<int>> GetFollowingOrganizationIdsAsync(
            ApplicationDbContext db,
            int studentProfileId)
        {
            try
            {
                var ids = await db.OrganizationFollows
                    .AsNoTracking()
                    .Where(f => f.StudentProfileId == studentProfileId)
                    .Select(f => f.OrganizationProfileId)
                    .ToListAsync();
                return ids.ToHashSet();
            }
            catch
            {
                return new HashSet<int>();
            }
        }

        public static PublicOrganizationDiscoveryDto MapProfile(
            StudentAssociationProfile profile,
            int followersCount,
            bool isFollowing) => new()
        {
            Id = profile.Id,
            OrganizationName = string.IsNullOrWhiteSpace(profile.AssociationName)
                ? "Organization"
                : profile.AssociationName.Trim(),
            Username = string.IsNullOrWhiteSpace(profile.Username)
                ? $"org-{profile.Id}"
                : profile.Username.Trim(),
            LogoUrl = profile.LogoUrl,
            CoverUrl = null,
            ShortDescription = TruncateDescription(profile.Description),
            Category = string.IsNullOrWhiteSpace(profile.Category) ? null : profile.Category.Trim(),
            FollowersCount = Math.Max(0, followersCount),
            IsFollowing = isFollowing,
        };

        public static string? TruncateDescription(string? description)
        {
            if (string.IsNullOrWhiteSpace(description)) return null;
            const int maxLen = 160;
            var trimmed = description.Trim();
            return trimmed.Length <= maxLen ? trimmed : trimmed[..maxLen].TrimEnd() + "…";
        }

        public static int GetFollowerCount(IReadOnlyDictionary<int, int> counts, int organizationId) =>
            counts.TryGetValue(organizationId, out var count) ? count : 0;
    }
}
