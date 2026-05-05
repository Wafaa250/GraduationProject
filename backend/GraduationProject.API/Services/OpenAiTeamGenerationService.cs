using System.Linq;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace GraduationProject.API.Services
{
    public class OpenAiTeamGenerationService : ITeamGenerationService
    {
        private readonly HttpClient _http;
        private readonly IConfiguration _config;
        private readonly ILogger<OpenAiTeamGenerationService> _logger;

        public OpenAiTeamGenerationService(
            HttpClient http,
            IConfiguration config,
            ILogger<OpenAiTeamGenerationService> logger)
        {
            _http   = http;
            _config = config;
            _logger = logger;
        }

        public async Task<GenerateTeamsResult> GenerateTeamsAsync(
            int courseId,
            int projectId,
            string projectTitle,
            string? projectDescription,
            int teamSize,
            List<StudentForTeam> students)
        {
            var workStudents = students
                .OrderBy(s => s.StudentProfileId)
                .ToList();

            // ── 1. Score students via OpenAI (fallback to equal scores if unavailable) ──
            var scored = await ScoreStudentsAsync(courseId, projectId, projectTitle, projectDescription, workStudents);

            var scoreMap = scored.ToDictionary(x => x.StudentProfileId, x => x.Score);

            // ── 2. Complementary skill teams (deterministic; ties use project + student mix key) ──
            var teams = ComplementaryTeamBuilder.BuildComplementaryTeams(workStudents, scoreMap, teamSize, projectId);

            // ── 3. Map to response ────────────────────────────────────────────────────
            var resultTeams = teams.Select((team, idx) => new GeneratedTeam(
                TeamIndex:   idx,
                MemberCount: team.Count,
                Members: team.Select(s => new GeneratedTeamMember(
                    StudentId:  s.StudentProfileId,
                    UserId:     s.UserId,
                    Name:       s.Name,
                    MatchScore: Math.Round(scoreMap.GetValueOrDefault(s.StudentProfileId, 50.0), 1),
                    Skills:     s.Skills
                )).ToList()
            )).ToList();

            return new GenerateTeamsResult(
                ProjectId:    projectId,
                ProjectTitle: projectTitle,
                TeamSize:     teamSize,
                TeamCount:    resultTeams.Count,
                Teams:        resultTeams
            );
        }

        // ── AI Scoring ────────────────────────────────────────────────────────────────

        private async Task<List<ScoredStudent>> ScoreStudentsAsync(
            int courseId,
            int projectId,
            string projectTitle,
            string? projectDescription,
            List<StudentForTeam> students)
        {
            var apiKey = _config["OpenAI:ApiKey"];
            var model  = _config["OpenAI:Model"] ?? "gpt-4o-mini";

            if (string.IsNullOrWhiteSpace(apiKey) || students.Count == 0)
                return students.Select(s => new ScoredStudent(s.StudentProfileId, 50.0)).ToList();

            try
            {
                var payload = new
                {
                    courseId,
                    projectId,
                    project = new
                    {
                        title       = projectTitle,
                        description = projectDescription ?? "",
                    },
                    students = students.Select(s => new
                    {
                        studentId = s.StudentProfileId,
                        name      = s.Name,
                        skills    = s.Skills,
                        major     = s.Major ?? "",
                        bio       = s.Bio   ?? "",
                    }).ToList(),
                };

                var systemMsg =
                    "You are an AI that scores students for team formation on a course project. " +
                    "Score each student 0-100 based on how well their skills, major, and bio " +
                    "complement the project needs. Diverse skill sets within a team are preferred. " +
                    "Return ONLY valid JSON: {\"scores\":[{\"studentId\":number,\"score\":number}]}. " +
                    "No markdown, no extra text.";

                var userMsg =
                    "Score each student for the following project. " +
                    "Return ONLY: {\"scores\":[{\"studentId\":number,\"score\":number}]}.\n\n" +
                    JsonSerializer.Serialize(payload);

                var body = new
                {
                    model,
                    input = new object[]
                    {
                        new { role = "system", content = systemMsg },
                        new { role = "user",   content = userMsg   },
                    },
                };

                using var req = new HttpRequestMessage(HttpMethod.Post, "https://api.openai.com/v1/responses");
                req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
                req.Content = new StringContent(JsonSerializer.Serialize(body), Encoding.UTF8, "application/json");

                using var res = await _http.SendAsync(req);
                var raw = await res.Content.ReadAsStringAsync();

                if (!res.IsSuccessStatusCode)
                {
                    _logger.LogWarning("OpenAI team scoring failed ({Code}): {Body}", (int)res.StatusCode, raw);
                    return FallbackScores(students);
                }

                var text = ExtractOutputText(raw);
                var parsed = ParseScores(text);

                if (parsed == null || parsed.Count == 0)
                    return FallbackScores(students);

                // Fill in any students OpenAI missed
                var scoreMap = parsed.ToDictionary(x => x.StudentProfileId, x => x.Score);
                return students.Select(s =>
                    new ScoredStudent(s.StudentProfileId, scoreMap.GetValueOrDefault(s.StudentProfileId, 50.0))
                ).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "OpenAI team scoring threw an exception");
                return FallbackScores(students);
            }
        }

        // ── Helpers ───────────────────────────────────────────────────────────────────

        private static List<ScoredStudent> FallbackScores(List<StudentForTeam> students) =>
            students.Select((s, i) => new ScoredStudent(s.StudentProfileId, 50.0 - i * 0.01)).ToList();

        private static string ExtractOutputText(string raw)
        {
            try
            {
                using var doc = JsonDocument.Parse(raw);
                if (!doc.RootElement.TryGetProperty("output", out var output)) return string.Empty;
                foreach (var item in output.EnumerateArray())
                {
                    if (!item.TryGetProperty("content", out var contents)) continue;
                    foreach (var c in contents.EnumerateArray())
                    {
                        if (c.TryGetProperty("type", out var t) && t.GetString() == "output_text" &&
                            c.TryGetProperty("text", out var txt))
                            return txt.GetString() ?? string.Empty;
                    }
                }
            }
            catch { }
            return string.Empty;
        }

        private static List<ScoredStudent>? ParseScores(string text)
        {
            if (string.IsNullOrWhiteSpace(text)) return null;
            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };

            // Try direct parse
            try
            {
                var r = JsonSerializer.Deserialize<ScoresResponse>(text.Trim(), options);
                if (r?.Scores?.Count > 0)
                    return r.Scores.Select(x => new ScoredStudent(x.StudentId, Math.Clamp(x.Score, 0, 100))).ToList();
            }
            catch { }

            // Strip markdown fences
            try
            {
                var s = text.Trim();
                if (s.StartsWith("```"))
                {
                    var nl   = s.IndexOf('\n');
                    var last = s.LastIndexOf("```");
                    if (nl >= 0 && last > nl) s = s.Substring(nl, last - nl).Trim();
                }
                var r = JsonSerializer.Deserialize<ScoresResponse>(s, options);
                if (r?.Scores?.Count > 0)
                    return r.Scores.Select(x => new ScoredStudent(x.StudentId, Math.Clamp(x.Score, 0, 100))).ToList();
            }
            catch { }

            return null;
        }

        // ── Private types ─────────────────────────────────────────────────────────────

        private record ScoredStudent(int StudentProfileId, double Score);

        private class ScoresResponse
        {
            [JsonPropertyName("scores")]
            public List<ScoreItem>? Scores { get; set; }
        }

        private class ScoreItem
        {
            [JsonPropertyName("studentId")] public int    StudentId { get; set; }
            [JsonPropertyName("score")]     public double Score     { get; set; }
        }
    }
}
