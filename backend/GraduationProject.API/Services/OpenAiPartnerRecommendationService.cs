// Services/OpenAiPartnerRecommendationService.cs
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace GraduationProject.API.Services
{
    /// <summary>
    /// Calls the OpenAI Responses API to rank partner candidates for a student.
    ///
    /// Mirrors the pattern used by <see cref="OpenAiStudentRecommendationService"/>:
    ///   - Same API endpoint  (https://api.openai.com/v1/responses)
    ///   - Same response-extraction helper  (ExtractOutputText)
    ///   - Same multi-strategy JSON parsing
    ///   - Same fallback behaviour  (returns null → caller uses simple scoring)
    /// </summary>
    public class OpenAiPartnerRecommendationService : IAiPartnerRecommendationService
    {
        private readonly HttpClient    _httpClient;
        private readonly IConfiguration _configuration;
        private readonly ILogger<OpenAiPartnerRecommendationService> _logger;

        public OpenAiPartnerRecommendationService(
            HttpClient     httpClient,
            IConfiguration configuration,
            ILogger<OpenAiPartnerRecommendationService> logger)
        {
            _httpClient    = httpClient;
            _configuration = configuration;
            _logger        = logger;
        }

        // =====================================================================
        // Public API
        // =====================================================================

        public async Task<List<AiRankedPartnerResult>?> RankPartnersAsync(
            AiPartnerCurrentStudent           currentStudent,
            IReadOnlyList<AiPartnerCandidate> candidates,
            string                            mode)
        {
            try
            {
                var apiKey = _configuration["OpenAI:ApiKey"];
                var model  = _configuration["OpenAI:Model"] ?? "gpt-4o-mini";

                if (string.IsNullOrWhiteSpace(apiKey) || candidates.Count == 0)
                    return null;

                // ── Build prompt ──────────────────────────────────────────────
                var (systemMsg, userMsg) = BuildPrompt(currentStudent, candidates, mode);

                var requestBody = new
                {
                    model,
                    input = new object[]
                    {
                        new { role = "system", content = systemMsg },
                        new { role = "user",   content = userMsg   }
                    }
                };

                // ── Call OpenAI ───────────────────────────────────────────────
                using var httpRequest = new HttpRequestMessage(
                    HttpMethod.Post, "https://api.openai.com/v1/responses");

                httpRequest.Headers.Authorization =
                    new AuthenticationHeaderValue("Bearer", apiKey);

                httpRequest.Content = new StringContent(
                    JsonSerializer.Serialize(requestBody),
                    Encoding.UTF8,
                    "application/json");

                using var httpResponse = await _httpClient.SendAsync(httpRequest);

                _logger.LogInformation(
                    "[PartnerRec] OpenAI status: {Code}", (int)httpResponse.StatusCode);

                var raw = await httpResponse.Content.ReadAsStringAsync();

                if (!httpResponse.IsSuccessStatusCode)
                {
                    _logger.LogWarning("[PartnerRec] OpenAI error body: {Body}", raw);
                    return null;
                }

                _logger.LogInformation("[PartnerRec] OpenAI raw response: {Raw}", raw);

                // ── Parse response ────────────────────────────────────────────
                var text = ExtractOutputText(raw);
                if (string.IsNullOrWhiteSpace(text)) return null;

                var parsed = TryParseRankedPartners(text);
                if (parsed == null || parsed.Count == 0) return null;

                // Sanitize scores
                foreach (var r in parsed)
                {
                    r.MatchScore = Math.Clamp(r.MatchScore, 0, 100);
                    r.Reason     = r.Reason?.Trim() ?? string.Empty;
                }

                return parsed;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[PartnerRec] Unexpected error calling OpenAI.");
                return null;
            }
        }

        // =====================================================================
        // Prompt construction
        // =====================================================================

        /// <summary>
        /// Builds the (systemMessage, userMessage) tuple that instructs the model.
        ///
        /// THE PROMPT (readable version):
        ///
        ///   System:
        ///     You are an AI assistant that recommends the best teammates for a student.
        ///     [mode-specific rules]
        ///     Return ONLY valid JSON: {"rankedPartners":[{"studentId":N,"matchScore":0-100,"reason":"..."}]}
        ///
        ///   User:
        ///     Current student — skills: [x, y, z], major: ..., bio: ...
        ///     Candidates — list with their skills/major/bio
        ///     Mode: complementary | similar
        ///     Return ONLY the JSON described above.
        /// </summary>
        private static (string system, string user) BuildPrompt(
            AiPartnerCurrentStudent           current,
            IReadOnlyList<AiPartnerCandidate> candidates,
            string                            mode)
        {
            var modeNormalized = (mode ?? "complementary").Trim().ToLowerInvariant();

            // ── System message ────────────────────────────────────────────────
            var modeRules = modeNormalized == "similar"
                ? "SIMILAR mode: Prioritise students whose skills and interests OVERLAP " +
                  "with the current student. Higher intersection of skills → higher score."
                : "COMPLEMENTARY mode (default): Prioritise students whose skills " +
                  "FILL THE GAPS in the current student's skill set. " +
                  "Different but compatible skill sets → higher score. " +
                  "A student who only duplicates existing skills scores lower.";
            var systemMessage =
                "You are an AI assistant that recommends the best teammates for a student. " +

                modeRules + " " +

                "If a student has no skills, give them a very low matchScore (0-20). " +

                "Always score between 0 and 100. " +

                "Return ONLY valid JSON in this exact structure: " +
                "{\"rankedPartners\":[{\"studentId\":number,\"matchScore\":number,\"reason\":string}]} " +
                "Do not return any text, explanation, or markdown. Only JSON.";

            // ── User message ──────────────────────────────────────────────────
            var currentSkillsStr = current.Skills.Count > 0
                ? string.Join(", ", current.Skills)
                : "(none listed)";

            var sb = new StringBuilder();
            sb.AppendLine("=== CURRENT STUDENT ===");
            sb.AppendLine($"Name:   {current.Name}");
            sb.AppendLine($"Major:  {current.Major}");
            sb.AppendLine($"Skills: {currentSkillsStr}");
            if (!string.IsNullOrWhiteSpace(current.Bio))
                sb.AppendLine($"Bio:    {current.Bio}");

            sb.AppendLine();
            sb.AppendLine($"=== MODE: {modeNormalized.ToUpperInvariant()} ===");
            sb.AppendLine();
            sb.AppendLine("=== CANDIDATES ===");

            foreach (var c in candidates)
            {
                var skills = c.Skills.Count > 0
                    ? string.Join(", ", c.Skills)
                    : "(none listed)";

                sb.AppendLine($"StudentId={c.StudentId} | Name={c.Name} | Major={c.Major} | Skills={skills}" +
                              (string.IsNullOrWhiteSpace(c.Bio) ? string.Empty : $" | Bio={c.Bio}"));
            }

            sb.AppendLine();
            sb.AppendLine("Rank ALL candidates based on the selected mode. " +
               "Prefer complementary skills when in complementary mode, " +
               "and similar skills when in similar mode. " +
               "Return ONLY valid JSON: " +
               "{\"rankedPartners\":[{\"studentId\":number,\"matchScore\":number,\"reason\":string}]}");

            return (systemMessage, sb.ToString());
        }

        // =====================================================================
        // Response parsing — three strategies (same pattern as existing service)
        // =====================================================================

        private List<AiRankedPartnerResult>? TryParseRankedPartners(string content)
        {
            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };

            // Strategy 1: proper wrapped object {"rankedPartners":[...]}
            try
            {
                var wrapped = JsonSerializer.Deserialize<PartnerRankingResponse>(
                    content.Trim(), options);
                if (wrapped?.RankedPartners?.Count > 0)
                    return wrapped.RankedPartners;
            }
            catch { /* fall through */ }

            // Strategy 2: JSON-encoded string (model occasionally double-encodes)
            try
            {
                var inner = JsonSerializer.Deserialize<string>(content, options);
                if (!string.IsNullOrWhiteSpace(inner))
                {
                    var wrapped = JsonSerializer.Deserialize<PartnerRankingResponse>(inner, options);
                    if (wrapped?.RankedPartners?.Count > 0)
                        return wrapped.RankedPartners;
                }
            }
            catch { /* fall through */ }

            // Strategy 3: strip markdown code fences (```json … ```)
            try
            {
                var stripped = content.Trim();
                if (stripped.StartsWith("```"))
                {
                    var firstNl   = stripped.IndexOf('\n');
                    var lastFence = stripped.LastIndexOf("```");
                    if (firstNl >= 0 && lastFence > firstNl)
                        stripped = stripped.Substring(firstNl, lastFence - firstNl).Trim();
                }

                var wrapped = JsonSerializer.Deserialize<PartnerRankingResponse>(stripped, options);
                if (wrapped?.RankedPartners?.Count > 0)
                    return wrapped.RankedPartners;
            }
            catch { /* fall through */ }

            _logger.LogWarning("[PartnerRec] Could not parse AI response: {Content}", content);
            return null;
        }

        // =====================================================================
        // OpenAI Responses API text extractor
        // (identical logic to OpenAiStudentRecommendationService.ExtractOutputText)
        // =====================================================================

        private static string ExtractOutputText(string raw)
        {
            try
            {
                using var doc = JsonDocument.Parse(raw);

                if (!doc.RootElement.TryGetProperty("output", out var outputEl) ||
                    outputEl.ValueKind != JsonValueKind.Array)
                    return string.Empty;

                var chunks = new List<string>();

                foreach (var outputItem in outputEl.EnumerateArray())
                {
                    if (!outputItem.TryGetProperty("content", out var contentEl) ||
                        contentEl.ValueKind != JsonValueKind.Array)
                        continue;

                    foreach (var contentItem in contentEl.EnumerateArray())
                    {
                        if (!contentItem.TryGetProperty("type", out var typeEl) ||
                            typeEl.GetString() != "output_text")
                            continue;

                        if (contentItem.TryGetProperty("text", out var textEl))
                        {
                            var t = textEl.GetString();
                            if (!string.IsNullOrWhiteSpace(t))
                                chunks.Add(t);
                        }
                    }
                }

                return string.Join("\n", chunks);
            }
            catch
            {
                return string.Empty;
            }
        }

        // ── Private response-shape helpers ────────────────────────────────────

        private class PartnerRankingResponse
        {
            [JsonPropertyName("rankedPartners")]
            public List<AiRankedPartnerResult>? RankedPartners { get; set; }
        }
    }
}
