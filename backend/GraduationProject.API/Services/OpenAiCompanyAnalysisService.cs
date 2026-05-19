using System;
using System.Linq;
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

            var (websiteHtml, websiteText) = await FetchPageHtmlAndPlainAsync(website);
            var (linkedInHtml, linkedInText) = await FetchPageHtmlAndPlainAsync(linkedIn);
            var locationHint = TryExtractLocationFromHtml(websiteHtml)
                ?? InferLocationFromPlainText(websiteText)
                ?? TryExtractLocationFromHtml(linkedInHtml)
                ?? InferLocationFromPlainText(linkedInText);

            var apiKey = _configuration["OpenAI:ApiKey"];
            if (string.IsNullOrWhiteSpace(apiKey))
            {
                var fallback = BuildFallbackFromUrls(website, linkedIn, websiteText, linkedInText, locationHint);
                fallback.UsedAi = false;
                fallback.Message = "AI is not configured. Please review and complete the company details.";
                return (fallback, null);
            }

            try
            {
                var analyzed = await CallOpenAiAsync(website, linkedIn, websiteText, linkedInText, locationHint);
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

            var manualFallback = BuildFallbackFromUrls(website, linkedIn, websiteText, linkedInText, locationHint);
            manualFallback.UsedAi = false;
            manualFallback.Message = "Could not fully analyze the company automatically. Please review and edit the details.";
            return (manualFallback, null);
        }

        private async Task<CompanyAnalysisResultDto?> CallOpenAiAsync(
            string? website,
            string? linkedIn,
            string? websiteText,
            string? linkedInText,
            string? locationHintFromPage)
        {
            var model = _configuration["OpenAI:Model"] ?? "gpt-4o-mini";

            var contextPayload = new
            {
                websiteUrl = website,
                linkedInUrl = linkedIn,
                websiteContent = Truncate(websiteText, 12000),
                linkedInContent = Truncate(linkedInText, 8000),
                suggestedLocationFromStructuredData = locationHintFromPage,
            };

            var systemMessage =
                "You extract structured company profile data for a university collaboration platform. " +
                "Use the provided website text, LinkedIn text, and URLs. " +
                "If page content is empty (e.g. LinkedIn login wall), infer reasonable public information from URLs and any available snippets. " +
                "Return ONLY valid JSON with this exact shape: " +
                "{\"companyName\":string,\"industry\":string|null,\"description\":string|null,\"location\":string|null}. " +
                "companyName is required. description should be 2-4 sentences about what the company does. " +
                "The location field must be the company's primary city and country or region when inferable " +
                "(e.g. \"Nablus, Palestine\" or \"Berlin, Germany\"). Use suggestedLocationFromStructuredData when it matches the company. " +
                "If only a country or region is known, return that. Use null only when there is truly no geographic signal. " +
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

            var parsed = TryParseCompanyAnalysis(content);
            if (parsed == null) return null;

            if (string.IsNullOrWhiteSpace(parsed.Location) && !string.IsNullOrWhiteSpace(locationHintFromPage))
                parsed.Location = locationHintFromPage.Trim();

            return parsed;
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
            string? linkedInText,
            string? locationHint)
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
                Location = string.IsNullOrWhiteSpace(locationHint) ? null : locationHint.Trim(),
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

        private static CompanyAnalysisResultDto Map(CompanyAnalysisJson json)
        {
            var location = FirstNonEmpty(
                json.Location,
                json.Headquarters,
                json.Hq,
                json.HeadOffice,
                json.OfficeLocation,
                json.Address);

            return new CompanyAnalysisResultDto
            {
                CompanyName = json.CompanyName!.Trim(),
                Industry = string.IsNullOrWhiteSpace(json.Industry) ? null : json.Industry.Trim(),
                Description = string.IsNullOrWhiteSpace(json.Description) ? null : json.Description.Trim(),
                Location = string.IsNullOrWhiteSpace(location) ? null : location.Trim(),
            };
        }

        private static string? FirstNonEmpty(params string?[] values)
        {
            foreach (var v in values)
            {
                if (!string.IsNullOrWhiteSpace(v)) return v;
            }

            return null;
        }

        private static string? TryExtractLocationFromHtml(string? html)
        {
            if (string.IsNullOrWhiteSpace(html)) return null;

            foreach (Match match in Regex.Matches(
                         html,
                         @"<script[^>]*type\s*=\s*[""']application/ld\+json[""'][^>]*>([\s\S]*?)</script>",
                         RegexOptions.IgnoreCase))
            {
                var json = match.Groups[1].Value.Trim();
                var loc = TryParseLocationFromLdJson(json);
                if (!string.IsNullOrWhiteSpace(loc)) return loc;
            }

            var metaCity = Regex.Match(
                html,
                @"property\s*=\s*[""']og:locality[""'][^>]*content\s*=\s*[""']([^""']{2,100})[""']",
                RegexOptions.IgnoreCase);
            var metaCountry = Regex.Match(
                html,
                @"property\s*=\s*[""']og:country-name[""'][^>]*content\s*=\s*[""']([^""']{2,100})[""']",
                RegexOptions.IgnoreCase);
            if (metaCity.Success)
            {
                var city = metaCity.Groups[1].Value.Trim();
                var country = metaCountry.Success ? metaCountry.Groups[1].Value.Trim() : null;
                return string.IsNullOrWhiteSpace(country) ? city : $"{city}, {country}";
            }

            return null;
        }

        private static string? TryParseLocationFromLdJson(string json)
        {
            try
            {
                using var doc = JsonDocument.Parse(json);
                return FindLocationInJsonElement(doc.RootElement, 0);
            }
            catch
            {
                return null;
            }
        }

        private const int MaxJsonLocationDepth = 24;

        private static string? FindLocationInJsonElement(JsonElement el, int depth)
        {
            if (depth > MaxJsonLocationDepth) return null;

            switch (el.ValueKind)
            {
                case JsonValueKind.Array:
                    foreach (var item in el.EnumerateArray())
                    {
                        var r = FindLocationInJsonElement(item, depth + 1);
                        if (!string.IsNullOrWhiteSpace(r)) return r;
                    }

                    return null;
                case JsonValueKind.Object:
                    if (el.TryGetProperty("@graph", out var graph))
                    {
                        var g = FindLocationInJsonElement(graph, depth + 1);
                        if (!string.IsNullOrWhiteSpace(g)) return g;
                    }

                    if (el.TryGetProperty("location", out var locProp))
                    {
                        if (locProp.ValueKind == JsonValueKind.String)
                        {
                            var ls = locProp.GetString();
                            if (!string.IsNullOrWhiteSpace(ls)) return ls.Trim();
                        }
                        else
                        {
                            var lf = FormatAddressFromJson(locProp);
                            if (!string.IsNullOrWhiteSpace(lf)) return lf;
                        }
                    }

                    if (el.TryGetProperty("address", out var addr))
                    {
                        var f = FormatAddressFromJson(addr);
                        if (!string.IsNullOrWhiteSpace(f)) return f;
                    }

                    foreach (var p in el.EnumerateObject())
                    {
                        if (p.Value.ValueKind is JsonValueKind.Object or JsonValueKind.Array)
                        {
                            var inner = FindLocationInJsonElement(p.Value, depth + 1);
                            if (!string.IsNullOrWhiteSpace(inner)) return inner;
                        }
                    }

                    return null;
                default:
                    return null;
            }
        }

        private static string? FormatAddressFromJson(JsonElement addr)
        {
            if (addr.ValueKind == JsonValueKind.String)
            {
                var s = addr.GetString();
                return string.IsNullOrWhiteSpace(s) ? null : s.Trim();
            }

            if (addr.ValueKind != JsonValueKind.Object) return null;

            string? locality = null;
            string? region = null;
            string? country = null;

            foreach (var p in addr.EnumerateObject())
            {
                var n = p.Name;
                if (string.Equals(n, "addressLocality", StringComparison.OrdinalIgnoreCase) ||
                    string.Equals(n, "locality", StringComparison.OrdinalIgnoreCase))
                    locality = ReadJsonString(p.Value);

                if (string.Equals(n, "addressRegion", StringComparison.OrdinalIgnoreCase) ||
                    string.Equals(n, "region", StringComparison.OrdinalIgnoreCase))
                    region = ReadJsonString(p.Value);

                if (string.Equals(n, "addressCountry", StringComparison.OrdinalIgnoreCase) ||
                    string.Equals(n, "country", StringComparison.OrdinalIgnoreCase))
                    country = ReadJsonString(p.Value);
            }

            var parts = new[] { locality, region, country }.Where(s => !string.IsNullOrWhiteSpace(s)).ToList();
            return parts.Count == 0 ? null : string.Join(", ", parts);
        }

        private static string? ReadJsonString(JsonElement el)
        {
            return el.ValueKind == JsonValueKind.String ? el.GetString()?.Trim() : null;
        }

        private static string? InferLocationFromPlainText(string? text)
        {
            if (string.IsNullOrWhiteSpace(text)) return null;

            var m = Regex.Match(
                text,
                @"(?:headquartered|headquarters|based|located)\s+(?:in|at)\s+([^.\n]{3,100})",
                RegexOptions.IgnoreCase);
            if (m.Success) return CleanupLocationFragment(m.Groups[1].Value);

            m = Regex.Match(
                text,
                @"\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?),\s*(Palestine|Jordan|Egypt|UAE|Lebanon|Saudi Arabia|Qatar|Kuwait|Bahrain|Oman|Iraq|Syria|Morocco|Tunisia|Algeria|Turkey|Israel|USA|United States|United Kingdom|Germany|France|Spain|Italy|India|Canada|Australia|Netherlands|Sweden|Norway|Poland)\b");
            if (m.Success) return $"{m.Groups[1].Value.Trim()}, {m.Groups[2].Value.Trim()}";

            return null;
        }

        private static string CleanupLocationFragment(string raw) =>
            Regex.Replace(raw.Trim(), @"\s+", " ").Trim().Trim(',', '·', '|', ' ');

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

            [JsonPropertyName("location")]
            public string? Location { get; set; }

            [JsonPropertyName("headquarters")]
            public string? Headquarters { get; set; }

            [JsonPropertyName("hq")]
            public string? Hq { get; set; }

            [JsonPropertyName("head_office")]
            public string? HeadOffice { get; set; }

            [JsonPropertyName("officeLocation")]
            public string? OfficeLocation { get; set; }

            [JsonPropertyName("address")]
            public string? Address { get; set; }
        }
    }
}
