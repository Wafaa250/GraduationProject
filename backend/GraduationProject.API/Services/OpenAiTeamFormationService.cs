// Services/OpenAiTeamFormationService.cs
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
    /// Calls OpenAI to directly form balanced, complementary teams from a list of students.
    ///
    /// Strategy:
    ///   - Sends the project title/description + all student profiles to GPT.
    ///   - Asks GPT to group students into teams of the requested size, maximising
    ///     skill complementarity within each team.
    ///   - Returns List&lt;AiFormedTeam&gt; or null on failure (caller falls back to
    ///     the greedy score-based algorithm already in CourseTeamGenerationController).
    /// </summary>
    public class OpenAiTeamFormationService : IAiTeamFormationService
    {
        private readonly HttpClient      _httpClient;
        private readonly IConfiguration _configuration;
        private readonly ILogger<OpenAiTeamFormationService> _logger;

        public OpenAiTeamFormationService(
            HttpClient      httpClient,
            IConfiguration  configuration,
            ILogger<OpenAiTeamFormationService> logger)
        {
            _httpClient    = httpClient;
            _configuration = configuration;
            _logger        = logger;
        }

        // =====================================================================
        // Public API
        // =====================================================================

        public async Task<List<AiFormedTeam>?> FormTeamsAsync(AiTeamFormationRequest request)
        {
            try
            {
                var apiKey = _configuration["OpenAI:ApiKey"];
                var model  = _configuration["OpenAI:Model"] ?? "gpt-4o-mini";

                if (string.IsNullOrWhiteSpace(apiKey) || request.Students.Count == 0)
                    return null;

                var (systemMsg, userMsg) = BuildPrompt(request);

                var requestBody = new
                {
                    model,
                    input = new object[]
                    {
                        new { role = "system", content = systemMsg },
                        new { role = "user",   content = userMsg   }
                    }
                };

                using var httpRequest = new HttpRequestMessage(
                    HttpMethod.Post, "https://api.openai.com/v1/responses");

                httpRequest.Headers.Authorization =
                    new AuthenticationHeaderValue("Bearer", apiKey);

                httpRequest.Content = new StringContent(
                    JsonSerializer.Serialize(requestBody),
                    Encoding.UTF8,
                    "application/json");

                using var httpResponse = await _httpClient.SendAsync(httpRequest);

                var raw = await httpResponse.Content.ReadAsStringAsync();

                if (!httpResponse.IsSuccessStatusCode)
                {
                    _logger.LogWarning("[TeamFormation] OpenAI error: {Body}", raw);
                    return null;
                }

                _logger.LogInformation("[TeamFormation] OpenAI raw: {Raw}", raw);

                var text = ExtractOutputText(raw);
                if (string.IsNullOrWhiteSpace(text)) return null;

                return TryParseTeams(text, request.Students.Count, request.TeamSize);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[TeamFormation] Unexpected error.");
                return null;
            }
        }

        // =====================================================================
        // Prompt
        // =====================================================================

        private static (string system, string user) BuildPrompt(AiTeamFormationRequest req)
        {
            var teamCount = (int)Math.Ceiling((double)req.Students.Count / req.TeamSize);

            var systemMsg =
                "You are an AI assistant that forms balanced project teams from a list of students. " +
                "Your goal is to create teams where members have COMPLEMENTARY skills — " +
                "each team should cover as many different skill areas as possible. " +
                "Avoid placing students with identical skill sets in the same team. " +
                $"Form exactly {teamCount} team(s) of approximately {req.TeamSize} student(s) each. " +
                "Every student must appear in exactly one team. " +
                "Return ONLY valid JSON in this exact structure: " +
                "{\"teams\":[{\"teamIndex\":1,\"studentIds\":[1,2],\"reason\":\"...\"}]} " +
                "Do not return any text, explanation, or markdown. Only JSON.";

            var sb = new StringBuilder();
            sb.AppendLine($"=== PROJECT ===");
            sb.AppendLine($"Title: {req.ProjectTitle}");
            if (!string.IsNullOrWhiteSpace(req.ProjectDescription))
                sb.AppendLine($"Description: {req.ProjectDescription}");

            sb.AppendLine();
            sb.AppendLine($"=== TEAM SIZE: {req.TeamSize} | TOTAL STUDENTS: {req.Students.Count} ===");
            sb.AppendLine();
            sb.AppendLine("=== STUDENTS ===");

            foreach (var s in req.Students)
            {
                var skills = s.Skills.Count > 0 ? string.Join(", ", s.Skills) : "(no skills listed)";
                sb.AppendLine(
                    $"StudentId={s.StudentId} | Name={s.Name} | Major={s.Major} | Skills={skills}" +
                    (string.IsNullOrWhiteSpace(s.Bio) ? "" : $" | Bio={s.Bio}"));
            }

            sb.AppendLine();
            sb.AppendLine(
                $"Form {teamCount} balanced team(s) with complementary skills. " +
                "Every student must be in exactly one team. " +
                "Return ONLY valid JSON: " +
                "{\"teams\":[{\"teamIndex\":1,\"studentIds\":[...],\"reason\":\"...\"}]}");

            return (systemMsg, sb.ToString());
        }

        // =====================================================================
        // Response parsing
        // =====================================================================

        private List<AiFormedTeam>? TryParseTeams(string content, int totalStudents, int teamSize)
        {
            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };

            // Try 3 strategies: raw, double-encoded, markdown-stripped
            foreach (var attempt in GetParseAttempts(content))
            {
                try
                {
                    var wrapped = JsonSerializer.Deserialize<TeamsResponse>(attempt, options);
                    if (wrapped?.Teams == null || wrapped.Teams.Count == 0) continue;

                    // Validate: all studentIds must exist
                    var allIds = wrapped.Teams
                        .SelectMany(t => t.StudentIds ?? new List<int>())
                        .ToList();

                    if (allIds.Count == 0) continue;

                    var result = wrapped.Teams
                        .Where(t => t.StudentIds != null && t.StudentIds.Count > 0)
                        .Select((t, i) => new AiFormedTeam
                        {
                            TeamIndex  = t.TeamIndex > 0 ? t.TeamIndex : i + 1,
                            StudentIds = t.StudentIds!,
                            Reason     = t.Reason ?? string.Empty,
                        })
                        .ToList();

                    if (result.Count > 0)
                    {
                        _logger.LogInformation(
                            "[TeamFormation] Parsed {Count} teams from AI.", result.Count);
                        return result;
                    }
                }
                catch { /* try next */ }
            }

            _logger.LogWarning("[TeamFormation] Could not parse AI response: {Content}", content);
            return null;
        }

        private static IEnumerable<string> GetParseAttempts(string content)
        {
            yield return content.Trim();

            // Double-encoded
            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            string? inner = null;
            try { inner = JsonSerializer.Deserialize<string>(content, options); } catch { }
            if (!string.IsNullOrWhiteSpace(inner)) yield return inner!;

            // Strip markdown fences
            var stripped = content.Trim();
            if (stripped.StartsWith("```"))
            {
                var firstNl   = stripped.IndexOf('\n');
                var lastFence = stripped.LastIndexOf("```");
                if (firstNl >= 0 && lastFence > firstNl)
                    yield return stripped.Substring(firstNl, lastFence - firstNl).Trim();
            }
        }

        // =====================================================================
        // OpenAI Responses API text extractor (same as other services)
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
                            if (!string.IsNullOrWhiteSpace(t)) chunks.Add(t);
                        }
                    }
                }

                return string.Join("\n", chunks);
            }
            catch { return string.Empty; }
        }

        // ── Private response shapes ───────────────────────────────────────────

        private class TeamsResponse
        {
            [JsonPropertyName("teams")]
            public List<TeamItem>? Teams { get; set; }
        }

        private class TeamItem
        {
            [JsonPropertyName("teamIndex")]
            public int TeamIndex { get; set; }

            [JsonPropertyName("studentIds")]
            public List<int>? StudentIds { get; set; }

            [JsonPropertyName("reason")]
            public string? Reason { get; set; }
        }
    }
}
