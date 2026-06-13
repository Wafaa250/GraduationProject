using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace GraduationProject.API.Services
{
    public class OpenAiEventRegistrationRecommendationService : IEventRegistrationRecommendationService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        private readonly ILogger<OpenAiEventRegistrationRecommendationService> _logger;

        public OpenAiEventRegistrationRecommendationService(
            HttpClient httpClient,
            IConfiguration configuration,
            ILogger<OpenAiEventRegistrationRecommendationService> logger)
        {
            _httpClient = httpClient;
            _configuration = configuration;
            _logger = logger;
        }

        public async Task<EventRegistrationRecommendationOutcome> RankRegistrantsAsync(
            EventRegistrationRecommendationContext context,
            CancellationToken cancellationToken = default)
        {
            if (context.Participants.Count == 0)
            {
                return EventRegistrationRecommendationOutcome.Ok(new List<EventRegistrationRankedParticipant>(), false);
            }

            var apiKey = _configuration["OpenAI:ApiKey"];
            var model = _configuration["OpenAI:Model"] ?? "gpt-4o-mini";

            if (string.IsNullOrWhiteSpace(apiKey))
            {
                _logger.LogWarning("EventRegistrationAI: OpenAI:ApiKey is missing.");
                return EventRegistrationRecommendationOutcome.Fail(
                    "AI recommendations are not configured (missing OpenAI API key).");
            }

            var payload = new
            {
                eventInfo = new
                {
                    eventId = context.Event.EventId,
                    title = context.Event.Title,
                    description = context.Event.Description,
                    eventType = context.Event.EventType,
                    category = context.Event.Category,
                },
                registrants = context.Participants.Select(p => new
                {
                    registrationId = p.RegistrationId,
                    studentId = p.StudentProfileId,
                    name = p.StudentName,
                    major = p.Major,
                    faculty = p.Faculty,
                    skills = p.Skills,
                    interests = p.Interests,
                    formAnswers = p.FormAnswers.Select(a => new
                    {
                        field = a.FieldLabel,
                        answer = a.AnswerValue,
                    }).ToList(),
                }).ToList(),
            };

            var systemMessage =
                "You are SkillSwap's event registration analyst. Rank every registrant by fit for the event. " +
                "Use ONLY: registrant skills, interests, major, faculty, and registration form answers, " +
                "compared against the event title, description, type, and category. " +
                "Return ONLY valid JSON with this exact shape: " +
                "{\"ranked\":[{\"registrationId\":number,\"studentId\":number,\"matchScore\":number,\"reason\":string}]}. " +
                "Include every registrant exactly once. Sort by matchScore descending in the array. " +
                "matchScore must be an integer 0-100. reason must be exactly one concise sentence.";

            var userMessage =
                "Rank all registrants below from best to worst fit for this event. " +
                "Return ONLY JSON, no markdown.\n\n" +
                JsonSerializer.Serialize(payload);

            try
            {
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
                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
                request.Content = new StringContent(
                    JsonSerializer.Serialize(requestBody),
                    Encoding.UTF8,
                    "application/json");

                using var response = await _httpClient.SendAsync(request, cancellationToken);
                var raw = await response.Content.ReadAsStringAsync(cancellationToken);

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning(
                        "EventRegistrationAI: OpenAI HTTP {Status}. Body: {Body}",
                        (int)response.StatusCode,
                        raw);

                    var fallback = BuildRuleBasedRankings(context);
                    return EventRegistrationRecommendationOutcome.Ok(fallback, usedAi: false);
                }

                var content = ExtractOutputText(raw);
                var parsed = TryParseRanked(content);

                if (parsed == null || parsed.Count == 0)
                {
                    _logger.LogWarning("EventRegistrationAI: could not parse AI response.");
                    var fallback = BuildRuleBasedRankings(context);
                    return EventRegistrationRecommendationOutcome.Ok(fallback, usedAi: false);
                }

                var merged = MergeRankings(context, parsed);
                return EventRegistrationRecommendationOutcome.Ok(merged, usedAi: true);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "EventRegistrationAI: unexpected error.");
                var fallback = BuildRuleBasedRankings(context);
                return EventRegistrationRecommendationOutcome.Ok(fallback, usedAi: false);
            }
        }

        private static List<EventRegistrationRankedParticipant> MergeRankings(
            EventRegistrationRecommendationContext context,
            List<ParsedRankingRow> parsed)
        {
            var participantByRegistrationId = context.Participants.ToDictionary(p => p.RegistrationId);
            var seen = new HashSet<int>();
            var results = new List<EventRegistrationRankedParticipant>();

            foreach (var row in parsed.OrderByDescending(r => r.MatchScore))
            {
                if (!participantByRegistrationId.TryGetValue(row.RegistrationId, out var participant))
                    continue;
                if (!seen.Add(row.RegistrationId))
                    continue;

                results.Add(new EventRegistrationRankedParticipant
                {
                    RegistrationId = participant.RegistrationId,
                    StudentProfileId = participant.StudentProfileId,
                    StudentName = participant.StudentName,
                    StudentMajor = string.IsNullOrWhiteSpace(participant.Major) ? null : participant.Major,
                    MatchScore = Math.Clamp(row.MatchScore, 0, 100),
                    Reason = string.IsNullOrWhiteSpace(row.Reason)
                        ? "Registered for this event with relevant profile signals."
                        : row.Reason.Trim(),
                });
            }

            foreach (var participant in context.Participants)
            {
                if (seen.Contains(participant.RegistrationId))
                    continue;

                results.Add(new EventRegistrationRankedParticipant
                {
                    RegistrationId = participant.RegistrationId,
                    StudentProfileId = participant.StudentProfileId,
                    StudentName = participant.StudentName,
                    StudentMajor = string.IsNullOrWhiteSpace(participant.Major) ? null : participant.Major,
                    MatchScore = 1,
                    Reason = "Registered for this event.",
                });
            }

            return results.OrderByDescending(r => r.MatchScore).ToList();
        }

        private static List<EventRegistrationRankedParticipant> BuildRuleBasedRankings(
            EventRegistrationRecommendationContext context)
        {
            var eventTokens = Tokenize(
                context.Event.Title,
                context.Event.Description,
                context.Event.EventType,
                context.Event.Category);

            var rows = context.Participants.Select(p =>
            {
                var profileTokens = Tokenize(
                    p.Major,
                    p.Faculty,
                    string.Join(' ', p.Skills),
                    string.Join(' ', p.Interests));

                var answerTokens = Tokenize(
                    string.Join(' ', p.FormAnswers.Select(a => $"{a.FieldLabel} {a.AnswerValue}")));

                var profileOverlap = OverlapScore(eventTokens, profileTokens);
                var answerOverlap = OverlapScore(eventTokens, answerTokens);
                var score = (int)Math.Round(profileOverlap * 0.55 + answerOverlap * 0.45);
                score = Math.Clamp(score, 1, 100);

                var reason = score >= 60
                    ? "Profile skills, interests, and registration answers align well with this event."
                    : score >= 35
                        ? "Shows moderate alignment with the event based on profile and registration answers."
                        : "Registered for this event with limited direct alignment signals in the available data.";

                return new EventRegistrationRankedParticipant
                {
                    RegistrationId = p.RegistrationId,
                    StudentProfileId = p.StudentProfileId,
                    StudentName = p.StudentName,
                    StudentMajor = string.IsNullOrWhiteSpace(p.Major) ? null : p.Major,
                    MatchScore = score,
                    Reason = reason,
                };
            }).ToList();

            return rows.OrderByDescending(r => r.MatchScore).ToList();
        }

        private static int OverlapScore(IReadOnlyCollection<string> left, IReadOnlyCollection<string> right)
        {
            if (left.Count == 0 || right.Count == 0)
                return 20;

            var matches = left.Count(token =>
                right.Any(r => r.Equals(token, StringComparison.OrdinalIgnoreCase) ||
                               r.Contains(token, StringComparison.OrdinalIgnoreCase) ||
                               token.Contains(r, StringComparison.OrdinalIgnoreCase)));

            return (int)Math.Round((double)matches / left.Count * 100);
        }

        private static HashSet<string> Tokenize(params string?[] parts)
        {
            var tokens = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            foreach (var part in parts)
            {
                if (string.IsNullOrWhiteSpace(part))
                    continue;

                foreach (var raw in part.Split(new[] { ' ', ',', ';', '|', '/', '\\', '\n', '\r', '\t' }, StringSplitOptions.RemoveEmptyEntries))
                {
                    var token = raw.Trim().Trim('.', ':', '-', '_');
                    if (token.Length >= 2)
                        tokens.Add(token);
                }
            }

            return tokens;
        }

        private static List<ParsedRankingRow>? TryParseRanked(string content)
        {
            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };

            try
            {
                var wrapped = JsonSerializer.Deserialize<RankingWrappedResponse>(content, options);
                if (wrapped?.Ranked != null && wrapped.Ranked.Count > 0)
                    return wrapped.Ranked;
            }
            catch { }

            try
            {
                var inner = JsonSerializer.Deserialize<string>(content, options);
                if (!string.IsNullOrWhiteSpace(inner))
                {
                    var wrapped = JsonSerializer.Deserialize<RankingWrappedResponse>(inner, options);
                    if (wrapped?.Ranked != null && wrapped.Ranked.Count > 0)
                        return wrapped.Ranked;
                }
            }
            catch { }

            try
            {
                var stripped = content.Trim();
                if (stripped.StartsWith("```"))
                {
                    var firstNewline = stripped.IndexOf('\n');
                    var lastFence = stripped.LastIndexOf("```");
                    if (firstNewline >= 0 && lastFence > firstNewline)
                        stripped = stripped.Substring(firstNewline, lastFence - firstNewline).Trim();
                }

                var wrapped = JsonSerializer.Deserialize<RankingWrappedResponse>(stripped, options);
                if (wrapped?.Ranked != null && wrapped.Ranked.Count > 0)
                    return wrapped.Ranked;
            }
            catch { }

            return null;
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

                var chunks = new List<string>();

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
                            typeElement.ValueKind != JsonValueKind.String)
                        {
                            continue;
                        }

                        if (!string.Equals(typeElement.GetString(), "output_text", StringComparison.Ordinal))
                            continue;

                        if (!contentItem.TryGetProperty("text", out var textElement) ||
                            textElement.ValueKind != JsonValueKind.String)
                        {
                            continue;
                        }

                        var text = textElement.GetString();
                        if (!string.IsNullOrWhiteSpace(text))
                            chunks.Add(text);
                    }
                }

                return string.Join("\n", chunks);
            }
            catch
            {
                return string.Empty;
            }
        }

        private class RankingWrappedResponse
        {
            [JsonPropertyName("ranked")]
            public List<ParsedRankingRow>? Ranked { get; set; }
        }

        private class ParsedRankingRow
        {
            [JsonPropertyName("registrationId")]
            public int RegistrationId { get; set; }

            [JsonPropertyName("studentId")]
            public int StudentId { get; set; }

            [JsonPropertyName("matchScore")]
            public int MatchScore { get; set; }

            [JsonPropertyName("reason")]
            public string Reason { get; set; } = string.Empty;
        }
    }
}
