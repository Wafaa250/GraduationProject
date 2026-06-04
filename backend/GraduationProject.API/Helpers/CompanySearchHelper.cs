using System;
using System.Linq;
using System.Linq.Expressions;
using GraduationProject.API.DTOs;
using GraduationProject.API.Models;
using Microsoft.EntityFrameworkCore;

namespace GraduationProject.API.Helpers
{
    public static class CompanySearchHelper
    {
        public static Expression<Func<CompanyProfile, bool>> MatchesPattern(string pattern) =>
            c =>
                EF.Functions.ILike(c.CompanyName, pattern)
                || EF.Functions.ILike(c.User.Name, pattern)
                || EF.Functions.ILike(c.User.Email, pattern)
                || (c.Industry != null && EF.Functions.ILike(c.Industry, pattern))
                || (c.Description != null && EF.Functions.ILike(c.Description, pattern))
                || (c.AreasOfInterest != null && EF.Functions.ILike(c.AreasOfInterest, pattern));

        public static string DisplayName(CompanyProfile profile)
        {
            if (!string.IsNullOrWhiteSpace(profile.CompanyName))
                return profile.CompanyName.Trim();
            return profile.User?.Name?.Trim() ?? "Company";
        }

        public static SearchHitDto MapProfileHit(CompanyProfile profile) => new()
        {
            Id = profile.Id,
            Title = DisplayName(profile),
            Subtitle = FormatCompanySubtitle(profile.Industry, profile.Description),
            Email = profile.User?.Email,
            RoleType = "company",
            Url = "/browse-projects",
            Followable = true,
        };

        public static SearchHitDto MapOrphanUserHit(User user) => new()
        {
            Id = 0,
            UserId = user.Id,
            Title = string.IsNullOrWhiteSpace(user.Name) ? user.Email : user.Name.Trim(),
            Subtitle = "Company account",
            Email = user.Email,
            RoleType = "company",
            Url = "/browse-projects",
            Followable = false,
        };

        public static string? FormatCompanySubtitle(string? industry, string? description)
        {
            if (!string.IsNullOrWhiteSpace(industry)) return industry.Trim();
            var text = description?.Trim();
            if (string.IsNullOrWhiteSpace(text)) return "Company";
            return text.Length <= 72 ? text : text[..72].TrimEnd() + "…";
        }
    }
}
