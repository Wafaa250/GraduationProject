using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading;
using System.Threading.Tasks;
using GraduationProject.API.DTOs;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace GraduationProject.API.Services
{
    public class OpenAiRecruitmentApplicantAnalysisService : IRecruitmentApplicantAnalysisService
    {
        private const int LogPromptMaxChars = 12_000;
        private const int LogRawResponseMaxChars = 16_000;

        private static readonly JsonSerializerOptions WebSerializeOptions = new(JsonSerializerDefaults.Web)
        {
            WriteIndented = false,
        };

        private static readonly JsonSerializerOptions RankingParseOptions = new(JsonSerializerDefaults.Web)
        {
            PropertyNameCaseInsensitive = true,
        };

        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        private readonly ILogger<OpenAiRecruitmentApplicantAnalysisService> _logger;

        public OpenAiRecruitmentApplicantAnalysisService(
            HttpClient httpClient,
            IConfiguration configuration,
            ILogger<OpenAiRecruitmentApplicantAnalysisService> logger)
        {
            _httpClient = httpClient;
            _configuration = configuration;
            _logger = logger;
        }

        public async Task<RecruitmentApplicantAnalysisOutcome> RankApplicantsAsync(
            RecruitmentApplicantAnalysisAiContext context,
            CancellationToken cancellationToken = default)
        {
            var apiKey = _configuration["OpenAI:ApiKey"];
            var model = _configuration["OpenAI:Model"] ?? "gpt-4o-mini";

            if (string.IsNullOrWhiteSpace(apiKey))
            {
                _logger.LogWarning("RecruitmentAI: OpenAI:ApiKey is missing.");
                return Fail("AI ranking is not configured (missing OpenAI API key).", "Missing OpenAI:ApiKey");
            }

            if (string.IsNullOrWhiteSpace(context.CompactPayloadJson))
            {
                _logger.LogWarning("RecruitmentAI: empty compact payload.");
                return Fail("Nothing to analyze.", "CompactPayloadJson was empty");
            }

            if (context.TopK < 1)
            {
                return Fail("Invalid top-K for ranking.", $"TopK={context.TopK}");
            }

            var systemMessage =
                "You are SkillSwap's recruitment analyst. Use ONLY the JSON user payload (fields K, need, Q, A). " +
                "Rank applicants by fit to the role and organization. " +
                "You MUST reply with a single valid JSON object and nothing else: no markdown, no code fences, no commentary, no prose before or after JSON. " +
                "The JSON object MUST have exactly one property \"ranked\" whose value is a JSON array of at most " + context.TopK + " objects, " +
                "sorted by matchScore descending (best first). " +
                "Each array element MUST be an object with exactly these keys: " +
                "\"studentId\" (integer, student profile id p), \"applicationId\" (integer i), \"matchScore\" (integer 0-100), " +
                "\"strengths\" (array of strings, may be empty), \"concerns\" (array of strings, may be empty), \"reason\" (string). " +
                "Do not wrap the response in markdown. Do not use ```json. Output raw JSON only.";

            var userMessage =
                "Return ONLY a JSON object of the form {\"ranked\":[...]} where ranked has at most " + context.TopK + " items. " +
                "Field K in the payload is the maximum number of applicants to return. Payload:\n" +
                context.CompactPayloadJson;

            _logger.LogInformation(
                "RecruitmentAI: begin rank TopK={TopK} model={Model} applicationCount={Count}",
                context.TopK,
                model,
                context.ApplicationIndex.Count);

            _logger.LogInformation(
                "RecruitmentAI: system prompt length={Len}\n{Snippet}",
                systemMessage.Length,
                TruncateForLog(systemMessage, LogPromptMaxChars));

            _logger.LogInformation(
                "RecruitmentAI: user message length={Len}\n{Snippet}",
                userMessage.Length,
                TruncateForLog(userMessage, LogPromptMaxChars));

            // 1) Structured JSON schema (strict) — primary path
            var (raw1, http1) = await PostResponsesAsync(
                model,
                systemMessage,
                userMessage,
                useStructuredRankingSchema: true,
                context.TopK,
                apiKey,
                cancellationToken);

            _logger.LogInformation(
                "RecruitmentAI: structured call HTTP {Code}, raw length={Len}",
                (int)http1,
                raw1?.Length ?? 0);

            if (!string.IsNullOrEmpty(raw1))
                _logger.LogInformation("RecruitmentAI: structured raw (truncated)\n{Raw}", TruncateForLog(raw1, LogRawResponseMaxChars));

            if (http1 != HttpStatusCode.OK)
            {
                _logger.LogWarning(
                    "RecruitmentAI: structured HTTP {Code} body (truncated): {Body}",
                    (int)http1,
                    TruncateForLog(raw1 ?? string.Empty, 4000));
            }

            if (http1 == HttpStatusCode.OK && !string.IsNullOrEmpty(raw1))
            {
                var outcome1 = TryExtractParseAndBuild(raw1, "structured", context);
                if (outcome1?.Success == true)
                    return outcome1;
                if (outcome1 != null)
                    return outcome1;
            }

            // 2) Fallback without schema: HTTP 400/422, empty body on success, or OK but JSON pipeline failed
            var fallbackHttp =
                http1 == HttpStatusCode.BadRequest ||
                http1 == HttpStatusCode.UnprocessableEntity ||
                http1 == HttpStatusCode.OK;

            if (!fallbackHttp)
            {
                return Fail(
                    "AI service returned an error. Try again later.",
                    $"OpenAI HTTP {(int)http1} on structured request.");
            }

            _logger.LogWarning(
                "RecruitmentAI: running unstructured fallback (primary HTTP {Code}).",
                (int)http1);

            var (raw2, http2) = await PostResponsesAsync(
                model,
                systemMessage,
                userMessage,
                useStructuredRankingSchema: false,
                context.TopK,
                apiKey,
                cancellationToken);

            _logger.LogInformation(
                "RecruitmentAI: fallback call HTTP {Code}, raw length={Len}",
                (int)http2,
                raw2?.Length ?? 0);

            if (!string.IsNullOrEmpty(raw2))
                _logger.LogInformation("RecruitmentAI: fallback raw (truncated)\n{Raw}", TruncateForLog(raw2, LogRawResponseMaxChars));

            if (http2 != HttpStatusCode.OK || string.IsNullOrEmpty(raw2))
            {
                return Fail(
                    "AI service returned an error. Try again later.",
                    $"Fallback HTTP {(int)http2}; bodyLen={raw2?.Length ?? 0}");
            }

            var outcome2 = TryExtractParseAndBuild(raw2, "fallback", context);
            if (outcome2?.Success == true)
                return outcome2;
            if (outcome2 != null)
                return outcome2;

            return Fail(
                "The AI response could not be read as valid ranking JSON. Check server logs.",
                "Fallback pipeline produced no usable rankings.");
        }

        /// <summary>
        /// Returns null if extraction/parsing failed (caller may retry another response).
        /// Returns failure outcome if AI rows did not match applications.
        /// Returns success outcome if rankings are ready.
        /// </summary>
        private RecruitmentApplicantAnalysisOutcome? TryExtractParseAndBuild(
            string raw,
            string phase,
            RecruitmentApplicantAnalysisAiContext context)
        {
            var extracted = ExtractModelTextFromResponsesPayload(raw, out var extractDiag);
            _logger.LogInformation(
                "RecruitmentAI: [{Phase}] extracted length={Len}. Extraction diagnostic: {Diag}",
                phase,
                extracted?.Length ?? 0,
                extractDiag ?? "(none)");

            if (!string.IsNullOrWhiteSpace(extracted))
                _logger.LogDebug("RecruitmentAI: [{Phase}] extracted (truncated)\n{Txt}", phase, TruncateForLog(extracted, LogRawResponseMaxChars));

            if (string.IsNullOrWhiteSpace(extracted))
            {
                _logger.LogWarning("RecruitmentAI: [{Phase}] empty extracted model text.", phase);
                return null;
            }

            var parsed = TryParseRankingJson(extracted, out var parseDiag);
            if (parsed == null || parsed.Count == 0)
            {
                _logger.LogWarning("RecruitmentAI: [{Phase}] JSON parse failed. Diagnostic: {Diag}", phase, parseDiag ?? "(null)");
                return null;
            }

            var built = BuildValidatedResults(parsed, context, out var buildDiag);
            if (built.Count > 0)
            {
                _logger.LogInformation("RecruitmentAI: [{Phase}] success with {Count} ranked applicants.", phase, built.Count);
                return new RecruitmentApplicantAnalysisOutcome { Success = true, Results = built };
            }

            _logger.LogError(
                "RecruitmentAI: [{Phase}] parsed {Count} AI rows but none matched applications. {BuildDiag}",
                phase,
                parsed.Count,
                buildDiag);

            return Fail(
                "AI returned rankings that did not match any submitted applications.",
                $"{phase}: rows={parsed.Count}; buildDiag={buildDiag}; parseDiag={parseDiag}; extractDiag={extractDiag}");
        }

        private static RecruitmentApplicantAnalysisOutcome Fail(string message, string diagnostic) =>
            new()
            {
                Success = false,
                ErrorMessage = message,
                Diagnostic = diagnostic,
            };

        private async Task<(string? Raw, HttpStatusCode Code)> PostResponsesAsync(
            string model,
            string systemMessage,
            string userMessage,
            bool useStructuredRankingSchema,
            int topK,
            string apiKey,
            CancellationToken cancellationToken)
        {
            var body = new Dictionary<string, object>
            {
                ["model"] = model,
                ["input"] = new[]
                {
                    new Dictionary<string, string>
                    {
                        ["role"] = "system",
                        ["content"] = systemMessage,
                    },
                    new Dictionary<string, string>
                    {
                        ["role"] = "user",
                        ["content"] = userMessage,
                    },
                },
            };

            if (useStructuredRankingSchema)
            {
                body["text"] = new Dictionary<string, object>
                {
                    ["format"] = BuildStrictRankingFormat(topK),
                };
            }

            var json = JsonSerializer.Serialize(body, WebSerializeOptions);

            using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.openai.com/v1/responses");
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
            request.Content = new StringContent(json, Encoding.UTF8, "application/json");

            using var response = await _httpClient.SendAsync(request, cancellationToken);
            var raw = await response.Content.ReadAsStringAsync(cancellationToken);
            return (raw, response.StatusCode);
        }

        private static Dictionary<string, object> BuildStrictRankingFormat(int topK)
        {
            // OpenAI Responses API: text.format with json_schema (flat keys: type, name, strict, schema)
            var itemSchema = new Dictionary<string, object>
            {
                ["type"] = "object",
                ["additionalProperties"] = false,
                ["properties"] = new Dictionary<string, object>
                {
                    ["studentId"] = new Dictionary<string, object> { ["type"] = "integer" },
                    ["applicationId"] = new Dictionary<string, object> { ["type"] = "integer" },
                    ["matchScore"] = new Dictionary<string, object>
                    {
                        ["type"] = "integer",
                        ["minimum"] = 0,
                        ["maximum"] = 100,
                    },
                    ["strengths"] = new Dictionary<string, object>
                    {
                        ["type"] = "array",
                        ["items"] = new Dictionary<string, object> { ["type"] = "string" },
                    },
                    ["concerns"] = new Dictionary<string, object>
                    {
                        ["type"] = "array",
                        ["items"] = new Dictionary<string, object> { ["type"] = "string" },
                    },
                    ["reason"] = new Dictionary<string, object> { ["type"] = "string" },
                },
                ["required"] = new[]
                {
                    "studentId",
                    "applicationId",
                    "matchScore",
                    "strengths",
                    "concerns",
                    "reason",
                },
            };

            var rankedSchema = new Dictionary<string, object>
            {
                ["type"] = "array",
                ["minItems"] = 1,
                ["maxItems"] = topK,
                ["items"] = itemSchema,
            };

            var rootSchema = new Dictionary<string, object>
            {
                ["type"] = "object",
                ["additionalProperties"] = false,
                ["properties"] = new Dictionary<string, object> { ["ranked"] = rankedSchema },
                ["required"] = new[] { "ranked" },
            };

            return new Dictionary<string, object>
            {
                ["type"] = "json_schema",
                ["name"] = "recruitment_applicant_ranking",
                ["strict"] = true,
                ["schema"] = rootSchema,
            };
        }

        /// <summary>Pull assistant-visible text from /v1/responses JSON (handles output_text and text).</summary>
        private static string ExtractModelTextFromResponsesPayload(string raw, out string? diagnostic)
        {
            diagnostic = null;
            if (string.IsNullOrWhiteSpace(raw))
            {
                diagnostic = "Raw response empty.";
                return string.Empty;
            }

            try
            {
                using var doc = JsonDocument.Parse(raw);
                var root = doc.RootElement;

                if (root.TryGetProperty("error", out var err) && err.ValueKind == JsonValueKind.Object)
                {
                    var msg = err.TryGetProperty("message", out var m) && m.ValueKind == JsonValueKind.String
                        ? m.GetString()
                        : err.GetRawText();
                    diagnostic = "API error object: " + TruncateForLog(msg ?? string.Empty, 500);
                }

                if (!root.TryGetProperty("output", out var outputElement) || outputElement.ValueKind != JsonValueKind.Array)
                {
                    diagnostic = (diagnostic ?? string.Empty) + " Missing or non-array 'output'.";
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
                        // Structured outputs often attach the JSON here instead of (or in addition to) output_text.text
                        if (contentItem.TryGetProperty("parsed", out var parsedField) &&
                            (parsedField.ValueKind == JsonValueKind.Object ||
                             parsedField.ValueKind == JsonValueKind.Array))
                        {
                            return parsedField.GetRawText();
                        }

                        if (!contentItem.TryGetProperty("type", out var typeElement) ||
                            typeElement.ValueKind != JsonValueKind.String)
                        {
                            continue;
                        }

                        var typeValue = typeElement.GetString() ?? string.Empty;
                        if (!typeValue.Equals("output_text", StringComparison.OrdinalIgnoreCase) &&
                            !typeValue.Equals("text", StringComparison.OrdinalIgnoreCase))
                        {
                            continue;
                        }

                        if (!contentItem.TryGetProperty("text", out var textElement))
                            continue;

                        var text = ReadTextProperty(textElement);
                        if (!string.IsNullOrWhiteSpace(text))
                            chunks.Add(text);
                    }
                }

                if (chunks.Count == 0)
                {
                    diagnostic = (diagnostic ?? string.Empty) + " No output_text/text chunks found.";
                    return string.Empty;
                }

                // Prefer single chunk; joining multiple can break JSON if model streamed prose + JSON
                if (chunks.Count == 1)
                    return chunks[0]!;

                // Try joined (some SDKs concatenate); if invalid, try last non-empty chunk (often final JSON)
                var joined = string.Join("\n", chunks);
                if (LooksLikeJsonObjectOrArray(joined))
                    return joined;

                for (var i = chunks.Count - 1; i >= 0; i--)
                {
                    if (LooksLikeJsonObjectOrArray(chunks[i]))
                        return chunks[i]!;
                }

                return joined;
            }
            catch (Exception ex)
            {
                diagnostic = "Extract exception: " + ex.Message;
                return string.Empty;
            }
        }

        private static string? ReadTextProperty(JsonElement textElement)
        {
            if (textElement.ValueKind == JsonValueKind.String)
                return textElement.GetString();

            if (textElement.ValueKind == JsonValueKind.Object &&
                textElement.TryGetProperty("value", out var v) &&
                v.ValueKind == JsonValueKind.String)
            {
                return v.GetString();
            }

            return null;
        }

        private static bool LooksLikeJsonObjectOrArray(string s)
        {
            var t = s.TrimStart();
            return t.StartsWith('{') || t.StartsWith('[');
        }

        private static List<AiApplicantMatchRow>? TryParseRankingJson(string content, out string? diagnostic, int unwrapDepth = 0)
        {
            diagnostic = null;
            if (unwrapDepth > 4)
            {
                diagnostic = "Too many JSON string unwrap attempts.";
                return null;
            }

            var normalized = NormalizeModelJsonText(content);
            if (string.IsNullOrWhiteSpace(normalized))
            {
                diagnostic = "Normalized model text was empty.";
                return null;
            }

            // 1) Envelope { "ranked": [ ... ] }
            try
            {
                var env = JsonSerializer.Deserialize<RankingEnvelope>(normalized, RankingParseOptions);
                if (env?.Ranked != null && env.Ranked.Count > 0)
                    return env.Ranked;
            }
            catch (Exception ex)
            {
                diagnostic = "Envelope deserialize: " + ex.Message;
            }

            // 2) Top-level array
            try
            {
                var direct = JsonSerializer.Deserialize<List<AiApplicantMatchRow>>(normalized, RankingParseOptions);
                if (direct != null && direct.Count > 0)
                    return direct;
            }
            catch (Exception ex)
            {
                diagnostic = (diagnostic ?? string.Empty) + " | Array deserialize: " + ex.Message;
            }

            // 3) JSON string that contains JSON
            try
            {
                var inner = JsonSerializer.Deserialize<string>(normalized, RankingParseOptions);
                if (!string.IsNullOrWhiteSpace(inner) && !string.Equals(inner, normalized, StringComparison.Ordinal))
                    return TryParseRankingJson(inner, out diagnostic, unwrapDepth + 1);
            }
            catch
            {
                // ignore
            }

            // 4) Generic object: first array property named ranked|results|matches|data|applicants|items
            try
            {
                using var doc = JsonDocument.Parse(normalized);
                if (doc.RootElement.ValueKind == JsonValueKind.Object)
                {
                    foreach (var name in new[] { "ranked", "results", "matches", "data", "applicants", "items" })
                    {
                        if (!doc.RootElement.TryGetProperty(name, out var arr) || arr.ValueKind != JsonValueKind.Array)
                            continue;

                        var list = JsonSerializer.Deserialize<List<AiApplicantMatchRow>>(arr.GetRawText(), RankingParseOptions);
                        if (list != null && list.Count > 0)
                            return list;
                    }
                }
            }
            catch (Exception ex)
            {
                diagnostic = (diagnostic ?? string.Empty) + " | Object walk: " + ex.Message;
            }

            diagnostic ??= "All parse strategies failed.";
            return null;
        }

        private static string NormalizeModelJsonText(string content)
        {
            if (string.IsNullOrWhiteSpace(content))
                return string.Empty;

            var s = content.Trim();

            // Strip ```json ... ``` or ``` ... ```
            if (s.StartsWith("```", StringComparison.Ordinal))
            {
                var firstNl = s.IndexOf('\n');
                var lastFence = s.LastIndexOf("```", StringComparison.Ordinal);
                if (firstNl >= 0 && lastFence > firstNl)
                    s = s.Substring(firstNl + 1, lastFence - firstNl - 1).Trim();
            }

            // Remove UTF-8 BOM / zero-width chars
            s = s.Trim('\uFEFF', '\u200B', '\u200C', '\u200D');

            // Sometimes models prefix with "Here is JSON:" — find first { or [
            var obj = s.IndexOf('{');
            var arr = s.IndexOf('[');
            if (obj < 0 && arr < 0)
                return s;

            int start;
            if (obj >= 0 && (arr < 0 || obj < arr))
                start = obj;
            else
                start = arr;

            if (start > 0)
                s = s.Substring(start).Trim();

            return s.Trim();
        }

        private List<RecruitmentApplicantAnalysisResultDto> BuildValidatedResults(
            List<AiApplicantMatchRow> rows,
            RecruitmentApplicantAnalysisAiContext context,
            out string diagnostic)
        {
            diagnostic = string.Empty;
            var results = new List<RecruitmentApplicantAnalysisResultDto>();
            var seenApps = new HashSet<int>();

            foreach (var row in rows.OrderByDescending(r => r.MatchScore))
            {
                if (results.Count >= context.TopK)
                    break;

                if (!context.ApplicationIndex.TryGetValue(row.ApplicationId, out var ids))
                {
                    _logger.LogWarning(
                        "RecruitmentAI: skipping unknown applicationId={AppId} (studentId={Sid})",
                        row.ApplicationId,
                        row.StudentId);
                    continue;
                }

                if (row.StudentId != ids.StudentProfileId)
                {
                    _logger.LogWarning(
                        "RecruitmentAI: studentId mismatch for applicationId={AppId}: AI={AiSid} expected={ExSid} — trusting applicationId.",
                        row.ApplicationId,
                        row.StudentId,
                        ids.StudentProfileId);
                }

                if (!seenApps.Add(row.ApplicationId))
                    continue;

                var score = Math.Clamp(row.MatchScore, 0, 100);
                context.StudentDisplayByProfileId.TryGetValue(ids.StudentProfileId, out var disp);

                results.Add(new RecruitmentApplicantAnalysisResultDto
                {
                    StudentProfileId = ids.StudentProfileId,
                    StudentUserId = ids.StudentUserId,
                    ApplicationId = row.ApplicationId,
                    MatchScore = score,
                    Strengths = row.Strengths ?? new List<string>(),
                    Concerns = row.Concerns ?? new List<string>(),
                    Reason = row.Reason?.Trim() ?? string.Empty,
                    StudentName = disp?.Name ?? "Student",
                    Faculty = disp?.Faculty,
                    Major = disp?.Major,
                });
            }

            if (results.Count == 0)
                diagnostic = "No rows matched known application ids after validation.";

            return results;
        }

        private static string TruncateForLog(string? text, int maxChars)
        {
            if (string.IsNullOrEmpty(text)) return string.Empty;
            if (text.Length <= maxChars) return text;
            return text[..maxChars] + "…(truncated)";
        }

        private class RankingEnvelope
        {
            [JsonPropertyName("ranked")]
            public List<AiApplicantMatchRow>? Ranked { get; set; }
        }

        private class AiApplicantMatchRow
        {
            [JsonPropertyName("studentId")]
            public int StudentId { get; set; }

            [JsonPropertyName("applicationId")]
            public int ApplicationId { get; set; }

            [JsonPropertyName("matchScore")]
            public int MatchScore { get; set; }

            [JsonPropertyName("strengths")]
            public List<string>? Strengths { get; set; }

            [JsonPropertyName("concerns")]
            public List<string>? Concerns { get; set; }

            [JsonPropertyName("reason")]
            public string? Reason { get; set; }
        }
    }
}
