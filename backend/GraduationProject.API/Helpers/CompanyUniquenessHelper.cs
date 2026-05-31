using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;

namespace GraduationProject.API.Helpers
{
    public static class CompanyUniquenessHelper
    {
        private static readonly HashSet<string> PublicEmailDomains = new(StringComparer.OrdinalIgnoreCase)
        {
            "gmail.com",
            "googlemail.com",
            "outlook.com",
            "hotmail.com",
            "live.com",
            "msn.com",
            "yahoo.com",
            "ymail.com",
            "icloud.com",
            "me.com",
            "mac.com",
            "proton.me",
            "protonmail.com",
            "aol.com",
            "mail.com",
            "zoho.com",
            "gmx.com",
            "yandex.com",
            "mail.ru",
        };

        public static string NormalizeCompanyName(string companyName)
        {
            var trimmed = (companyName ?? string.Empty).Trim().ToLowerInvariant();
            return Regex.Replace(trimmed, @"\s+", " ");
        }

        public static string? ExtractEmailDomain(string email)
        {
            if (string.IsNullOrWhiteSpace(email))
                return null;

            var at = email.LastIndexOf('@');
            if (at < 0 || at == email.Length - 1)
                return null;

            var domain = email[(at + 1)..].Trim().ToLowerInvariant();
            return string.IsNullOrWhiteSpace(domain) ? null : domain;
        }

        public static string? ExtractWebsiteDomain(string? websiteUrl)
        {
            if (string.IsNullOrWhiteSpace(websiteUrl))
                return null;

            var trimmed = websiteUrl.Trim();
            if (!trimmed.StartsWith("http://", StringComparison.OrdinalIgnoreCase) &&
                !trimmed.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
            {
                trimmed = "https://" + trimmed;
            }

            if (!Uri.TryCreate(trimmed, UriKind.Absolute, out var uri))
                return null;

            var host = uri.Host.Trim().ToLowerInvariant();
            if (host.StartsWith("www.", StringComparison.Ordinal))
                host = host[4..];

            return string.IsNullOrWhiteSpace(host) ? null : host;
        }

        public static bool IsPublicEmailDomain(string? domain) =>
            !string.IsNullOrWhiteSpace(domain) && PublicEmailDomains.Contains(domain.Trim().ToLowerInvariant());

        public static string? ResolvePrimaryEmailDomain(string email)
        {
            var domain = ExtractEmailDomain(email);
            if (domain == null || IsPublicEmailDomain(domain))
                return null;

            return domain;
        }
    }
}
