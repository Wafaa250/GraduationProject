using System;
using Microsoft.Extensions.Configuration;

namespace GraduationProject.API.Services.Email
{
    /// <summary>
    /// Resolves public-facing URLs for transactional email content.
    /// Prefers configured app URLs over caller-supplied values that point at localhost.
    /// </summary>
    internal static class EmailUrlHelper
    {
        public static string ResolveLoginUrl(IConfiguration config, string? providedUrl = null)
        {
            var configured = NormalizeUrl(config["App:FrontendLoginUrl"]);
            if (!string.IsNullOrWhiteSpace(configured) && !IsLocalhost(configured))
                return configured!;

            var provided = NormalizeUrl(providedUrl);
            if (!string.IsNullOrWhiteSpace(provided) && !IsLocalhost(provided))
                return provided!;

            return configured ?? provided ?? string.Empty;
        }

        public static string ResolvePasswordResetUrl(IConfiguration config, string resetUrlWithToken)
        {
            if (string.IsNullOrWhiteSpace(resetUrlWithToken))
                return string.Empty;

            if (!Uri.TryCreate(resetUrlWithToken, UriKind.Absolute, out var uri))
                return resetUrlWithToken;

            var token = GetQueryValue(uri, "token");
            var configuredBase = NormalizeUrl(config["PasswordReset:FrontendResetUrl"]);
            if (string.IsNullOrWhiteSpace(configuredBase))
                configuredBase = NormalizeUrl(resetUrlWithToken.Split('?', 2)[0]);

            if (!string.IsNullOrWhiteSpace(configuredBase) && !IsLocalhost(configuredBase))
            {
                if (string.IsNullOrWhiteSpace(token))
                    return configuredBase;
                return $"{configuredBase}?token={Uri.EscapeDataString(token)}";
            }

            if (!IsLocalhost(resetUrlWithToken))
                return resetUrlWithToken;

            return configuredBase ?? resetUrlWithToken;
        }

        private static string? GetQueryValue(Uri uri, string key)
        {
            var query = uri.Query;
            if (string.IsNullOrEmpty(query))
                return null;

            if (query.StartsWith('?'))
                query = query[1..];

            foreach (var segment in query.Split('&', StringSplitOptions.RemoveEmptyEntries))
            {
                var parts = segment.Split('=', 2);
                if (parts.Length == 2 &&
                    string.Equals(parts[0], key, StringComparison.OrdinalIgnoreCase))
                    return Uri.UnescapeDataString(parts[1]);
            }

            return null;
        }

        private static string? NormalizeUrl(string? url)
        {
            if (string.IsNullOrWhiteSpace(url))
                return null;
            return url.Trim().TrimEnd('/');
        }

        private static bool IsLocalhost(string url)
        {
            if (!Uri.TryCreate(url, UriKind.Absolute, out var uri))
                return url.Contains("localhost", StringComparison.OrdinalIgnoreCase)
                    || url.Contains("127.0.0.1", StringComparison.OrdinalIgnoreCase);

            return uri.Host.Equals("localhost", StringComparison.OrdinalIgnoreCase)
                || uri.Host.Equals("127.0.0.1", StringComparison.OrdinalIgnoreCase)
                || uri.Host.EndsWith(".local", StringComparison.OrdinalIgnoreCase);
        }
    }
}
