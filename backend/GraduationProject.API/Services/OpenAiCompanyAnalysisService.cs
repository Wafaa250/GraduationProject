using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using GraduationProject.API.DTOs;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace GraduationProject.API.Services
{
    public class OpenAiCompanyAnalysisService : ICompanyAnalysisService
    {
        private readonly HttpClient _openAiClient;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _configuration;
        private readonly ILogger<OpenAiCompanyAnalysisService> _logger;

        public OpenAiCompanyAnalysisService(
            HttpClient openAiClient,
            IHttpClientFactory httpClientFactory,
            IConfiguration configuration,
            ILogger<OpenAiCompanyAnalysisService> logger)
        {
            _openAiClient = openAiClient;
            _httpClientFactory = httpClientFactory;
            _configuration = configuration;
            _logger = logger;
        }

        public async Task<(CompanyAnalysisResultDto? result, string? error)> AnalyzeAsync(AnalyzeCompanyDto dto)
        {
            var website = NormalizeUrl(dto.WebsiteUrl);
            var linkedIn = NormalizeUrl(dto.LinkedInUrl);

            if (string.IsNullOrWhiteSpace(website) && string.IsNullOrWhiteSpace(linkedIn))
                return (null, "Provide at least a company website URL or a LinkedIn URL.");

            var (_, websiteText) = await FetchPageHtmlAndPlainAsync(website);
            var (_, linkedInText) = await FetchPageHtmlAndPlainAsync(linkedIn);

            var apiKey = _configuration["OpenAI:ApiKey"];
            if (string.IsNullOrWhiteSpace(apiKey))
            {
                var fallback = BuildFallbackFromUrls(website, linkedIn, websiteText, linkedInText);
                fallback.UsedAi = false;
                fallback.Message = "AI is not configured. Please review and complete the company details.";
                return (fallback, null);
            }

            try
            {
                var analyzed = await CallOpenAiAsync(website, linkedIn, websiteText, linkedInText);
                if (analyzed != null)
                {
                    analyzed.UsedAi = true;
                    return (analyzed, null);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "OpenAI company analysis failed");
            }

            var manualFallback = BuildFallbackFromUrls(website, linkedIn, websiteText, linkedInText);
            manualFallback.UsedAi = false;
            manualFallback.Message = "Could not fully analyze the company automatically. Please review and edit the details.";
            return (manualFallback, null);
        }

        private async Task<CompanyAnalysisResultDto?> CallOpenAiAsync(
            string? website,
            string? linkedIn,
            string? websiteText,
            string? linkedInText)
        {
            var model = _configuration["OpenAI:Model"] ?? "gpt-4o-mini";

            var contextPayload = new
            {
                websiteUrl = website,
                linkedInUrl = linkedIn,
                websiteContent = Truncate(websiteText, 12000),
                linkedInContent = Truncate(linkedInText, 8000),
            };

            var systemMessage =
                "You extract structured company profile data for a university collaboration platform. " +
                "Use the provided website text, LinkedIn text, and URLs. " +
                "If page content is empty (e.g. LinkedIn login wall), infer reasonable public information from URLs and any available snippets. " +
                "Return ONLY valid JSON with this exact shape: " +
                "{\"companyName\":string,\"industry\":string|null,\"description\":string|null}. " +
                "companyName is required. description should be 2-4 sentences about what the company does. " +
                "Do not include markdown or extra text.";

            var userMessage =
                "Extract company profile fields from these sources:\n\n" +
                JsonSerializer.Serialize(contextPayload);

            var requestBody = new
            {
                model,
                input = new object[]
                {
                    new { role = "system", content = systemMessage },
                    new { role = "user", content = userMessage },
                },
            };

            using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.openai.com/v1/responses");
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _configuration["OpenAI:ApiKey"]);
            request.Content = new StringContent(
                JsonSerializer.Serialize(requestBody),
                Encoding.UTF8,
                "application/json");

            using var response = await _openAiClient.SendAsync(request);
            var raw = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("OpenAI company analysis failed ({Code}): {Body}", (int)response.StatusCode, raw);
                return null;
            }

            var content = ExtractOutputText(raw);
            if (string.IsNullOrWhiteSpace(content)) return null;

            return TryParseCompanyAnalysis(content);
        }

        private async Task<(string? html, string plainText)> FetchPageHtmlAndPlainAsync(string? url)
        {
            if (string.IsNullOrWhiteSpace(url)) return (null, string.Empty);

            try
            {
                var client = _httpClientFactory.CreateClient("CompanyWebFetch");
                using var response = await client.GetAsync(url);
                if (!response.IsSuccessStatusCode) return (null, string.Empty);

                var html = await response.Content.ReadAsStringAsync();
                return (html, HtmlToPlainText(html));
            }
            catch (Exception ex)
            {
                _logger.LogDebug(ex, "Failed to fetch page content from {Url}", url);
                return (null, string.Empty);
            }
        }

        private static CompanyAnalysisResultDto BuildFallbackFromUrls(
            string? website,
            string? linkedIn,
            string? websiteText,
            string? linkedInText)
        {
            var name = GuessCompanyName(website, linkedIn, websiteText, linkedInText);
            var description = !string.IsNullOrWhiteSpace(websiteText)
                ? Truncate(websiteText, 400)
                : !string.IsNullOrWhiteSpace(linkedInText)
                    ? Truncate(linkedInText, 400)
                    : null;

            return new CompanyAnalysisResultDto
            {
                CompanyName = name,
                Description = description,
                Industry = null,
            };
        }

        private static string GuessCompanyName(
            string? website,
            string? linkedIn,
            string? websiteText,
            string? linkedInText)
        {
            if (!string.IsNullOrWhiteSpace(websiteText))
            {
                var titleMatch = Regex.Match(websiteText, @"(?:^|\n)([A-Z][^\n]{2,80})", RegexOptions.Multiline);
                if (titleMatch.Success)
                    return titleMatch.Groups[1].Value.Trim();
            }

            if (!string.IsNullOrWhiteSpace(linkedIn))
            {
                var slug = ExtractLinkedInSlug(linkedIn);
                if (!string.IsNullOrWhiteSpace(slug))
                    return HumanizeSlug(slug);
            }

            if (!string.IsNullOrWhiteSpace(website))
            {
                try
                {
                    var host = new Uri(website).Host.Replace("www.", "");
                    var part = host.Split('.')[0];
                    if (!string.IsNullOrWhiteSpace(part))
                        return HumanizeSlug(part);
                }
                catch { /* ignore */ }
            }

            return "Company";
        }

        private static string? ExtractLinkedInSlug(string url)
        {
            var match = Regex.Match(url, @"linkedin\.com/company/([^/?#]+)", RegexOptions.IgnoreCase);
            return match.Success ? match.Groups[1].Value : null;
        }

        private static string HumanizeSlug(string slug) =>
            string.Join(' ', slug.Replace('-', ' ').Replace('_', ' ').Split(' ', StringSplitOptions.RemoveEmptyEntries))
                .Trim();

        private static CompanyAnalysisResultDto? TryParseCompanyAnalysis(string content)
        {
            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };

            try
            {
                var parsed = JsonSerializer.Deserialize<CompanyAnalysisJson>(content, options);
                if (parsed != null && !string.IsNullOrWhiteSpace(parsed.CompanyName))
                    return Map(parsed);
            }
            catch { /* try next */ }

            try
            {
                var stripped = StripMarkdownFence(content);
                var parsed = JsonSerializer.Deserialize<CompanyAnalysisJson>(stripped, options);
                if (parsed != null && !string.IsNullOrWhiteSpace(parsed.CompanyName))
                    return Map(parsed);
            }
            catch { /* ignore */ }

            return null;
        }

        private static CompanyAnalysisResultDto Map(CompanyAnalysisJson json) =>
            new()
            {
                CompanyName = json.CompanyName!.Trim(),
                Industry = string.IsNullOrWhiteSpace(json.Industry) ? null : json.Industry.Trim(),
                Description = string.IsNullOrWhiteSpace(json.Description) ? null : json.Description.Trim(),
            };

        private static string StripMarkdownFence(string content)
        {
            var stripped = content.Trim();
            if (!stripped.StartsWith("```")) return stripped;

            var firstNewline = stripped.IndexOf('\n');
            var lastFence = stripped.LastIndexOf("```");
            if (firstNewline >= 0 && lastFence > firstNewline)
                return stripped.Substring(firstNewline + 1, lastFence - firstNewline - 1).Trim();

            return stripped;
        }

        private static string HtmlToPlainText(string html)
        {
            if (string.IsNullOrWhiteSpace(html)) return string.Empty;

            var withoutScripts = Regex.Replace(html, @"<script[\s\S]*?</script>", " ", RegexOptions.IgnoreCase);
            withoutScripts = Regex.Replace(withoutScripts, @"<style[\s\S]*?</style>", " ", RegexOptions.IgnoreCase);
            var text = Regex.Replace(withoutScripts, "<[^>]+>", " ");
            text = Regex.Replace(text, @"\s+", " ").Trim();
            return WebUtilityHtmlDecode(text);
        }

        private static string WebUtilityHtmlDecode(string text) =>
            System.Net.WebUtility.HtmlDecode(text);

        private static string? NormalizeUrl(string? url)
        {
            if (string.IsNullOrWhiteSpace(url)) return null;
            var trimmed = url.Trim();
            if (!trimmed.StartsWith("http://", StringComparison.OrdinalIgnoreCase) &&
                !trimmed.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
            {
                trimmed = "https://" + trimmed;
            }

            return Uri.TryCreate(trimmed, UriKind.Absolute, out _) ? trimmed : null;
        }

        private static string Truncate(string? value, int max)
        {
            if (string.IsNullOrWhiteSpace(value)) return string.Empty;
            return value.Length <= max ? value : value[..max];
        }

        private static string ExtractOutputText(string raw)
        {
            try
            {
                using var doc = JsonDocument.Parse(raw);
                if (!doc.RootElement.TryGetProperty("output", out var outputElement) ||
                    outputElement.ValueKind != JsonValueKind.Array)
                {
                    return string.Empty;
                }

                var chunks = new StringBuilder();

                foreach (var outputItem in outputElement.EnumerateArray())
                {
                    if (!outputItem.TryGetProperty("content", out var contentElement) ||
                        contentElement.ValueKind != JsonValueKind.Array)
                    {
                        continue;
                    }

                    foreach (var contentItem in contentElement.EnumerateArray())
                    {
                        if (!contentItem.TryGetProperty("type", out var typeElement) ||
                            typeElement.ValueKind != JsonValueKind.String ||
                            !string.Equals(typeElement.GetString(), "output_text", StringComparison.Ordinal))
                        {
                            continue;
                        }

                        if (contentItem.TryGetProperty("text", out var textElement) &&
                            textElement.ValueKind == JsonValueKind.String)
                        {
                            var text = textElement.GetString();
                            if (!string.IsNullOrWhiteSpace(text))
                                chunks.AppendLine(text);
                        }
                    }
                }

                return chunks.ToString().Trim();
            }
            catch
            {
                return string.Empty;
            }
        }

        private class CompanyAnalysisJson
        {
            [JsonPropertyName("companyName")]
            public string? CompanyName { get; set; }

            [JsonPropertyName("industry")]
            public string? Industry { get; set; }

            [JsonPropertyName("description")]
            public string? Description { get; set; }
        }
    }
}
