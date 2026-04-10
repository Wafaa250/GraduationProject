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
    public class OpenAiStudentRecommendationService : IAiStudentRecommendationService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        private readonly ILogger<OpenAiStudentRecommendationService> _logger;

        public OpenAiStudentRecommendationService(
            HttpClient httpClient,
            IConfiguration configuration,
            ILogger<OpenAiStudentRecommendationService> logger)
        {
            _httpClient = httpClient;
            _configuration = configuration;
            _logger = logger;
        }

        public async Task<List<AiRankedStudentResult>?> RankStudentsAsync(
            AiProjectInput project,
            IReadOnlyList<AiStudentInput> students)
        {
            try
            {
                var apiKey = _configuration["OpenAI:ApiKey"];
                var model = _configuration["OpenAI:Model"] ?? "gpt-4o-mini";

                if (string.IsNullOrWhiteSpace(apiKey) || students.Count == 0)
                    return null;

                var requestPayload = new
                {
                    project = new
                    {
                        title = project.Title,
                        abstract_ = project.Abstract,
                        requiredSkills = project.RequiredSkills
                    },
                    students = students.Select(s => new
                    {
                        studentId = s.StudentId,
                        name = s.Name,
                        skills = s.Skills,
                        major = s.Major,
                        bio = s.Bio
                    }).ToList()
                };

                var systemMessage =
                    "You are an AI assistant that ranks students for graduation projects. " +
                    "Analyze the project title, abstract, and required skills together to understand " +
                    "the project domain and goals. Then rank each student by how well their skills, " +
                    "major, and bio align with the project needs. " +
                    "Return ONLY valid JSON in this exact structure: " +
                    "{\"rankedStudents\":[{\"studentId\":number,\"matchScore\":number,\"reason\":string}]}. " +
                    "Do not return text, explanation, or markdown. Only JSON.";

                var userMessage =
                    "Rank the following students from best to worst fit for this graduation project. " +
                    "Use the project abstract (if provided) together with the required skills to understand " +
                    "what the project needs, then score each student 0-100 accordingly. " +
                    "Return ONLY valid JSON in this exact structure: " +
                    "{\"rankedStudents\":[{\"studentId\":number,\"matchScore\":number,\"reason\":string}]}. " +
                    "Do not include markdown or extra text.\n\n" +
                    JsonSerializer.Serialize(requestPayload);

                var requestBody = new
                {
                    model,
                    input = new object[]
                    {
                        new { role = "system", content = systemMessage },
                        new { role = "user", content = userMessage }
                    }
                };

                using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.openai.com/v1/responses");
                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
                request.Content = new StringContent(
                    JsonSerializer.Serialize(requestBody),
                    Encoding.UTF8,
                    "application/json");

                using var response = await _httpClient.SendAsync(request);
                _logger.LogInformation("OpenAI responses status code: {StatusCode}", (int)response.StatusCode);

                var raw = await response.Content.ReadAsStringAsync();
                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("OpenAI responses failed. Body: {Body}", raw);
                    return null;
                }

                _logger.LogInformation("OpenAI raw response: {Raw}", raw);

                var content = ExtractOutputText(raw);
                if (string.IsNullOrWhiteSpace(content)) return null;

                var parsed = TryParseRankedStudents(content);
                if (parsed == null || parsed.Count == 0) return null;

                foreach (var row in parsed)
                {
                    if (row.MatchScore < 0) row.MatchScore = 0;
                    if (row.MatchScore > 100) row.MatchScore = 100;
                    row.Reason = row.Reason?.Trim() ?? string.Empty;
                }

                return parsed;
            }
            catch
            {
                return null;
            }
        }

        public async Task<List<AiRankedDoctorResult>?> RankSupervisorsAsync(
            AiProjectInput project,
            IReadOnlyList<AiDoctorInput> doctors)
        {
            try
            {
                var apiKey = _configuration["OpenAI:ApiKey"];
                var model = _configuration["OpenAI:Model"] ?? "gpt-4o-mini";

                if (string.IsNullOrWhiteSpace(apiKey) || doctors.Count == 0)
                    return null;

                var requestPayload = new
                {
                    project = new
                    {
                        title = project.Title,
                        abstract_ = project.Abstract,
                        requiredSkills = project.RequiredSkills
                    },
                    doctors = doctors.Select(d => new
                    {
                        doctorId = d.DoctorId,
                        name = d.Name,
                        specialization = d.Specialization,
                        bio = d.Bio
                    }).ToList()
                };

                var systemMessage =
                    "You are an AI assistant that ranks academic supervisors for graduation projects. " +
                    "Analyze the project title, abstract, and required skills together to understand " +
                    "the project domain and research area. Then rank each supervisor by how well their " +
                    "specialization and bio align with the project. " +
                    "You are an AI that ranks supervisors based on how well they match a project.";

                var userMessage =
                    "Rank the following supervisors from best to worst fit for this graduation project. " +
                    "Use the project abstract (if provided) together with the required skills to understand " +
                    "the project domain, then evaluate each supervisor's specialization and bio accordingly. " +
                    "Response format must be exactly: {\"rankedSupervisors\":[{\"doctorId\":number,\"matchScore\":0-100,\"reason\":\"short sentence\"}]}. " +
                    "Do not include markdown or extra text.\n\n" +
                    JsonSerializer.Serialize(requestPayload);

                var requestBody = new
                {
                    model,
                    input = new object[]
                    {
                        new { role = "system", content = systemMessage },
                        new { role = "user", content = userMessage }
                    }
                };

                using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.openai.com/v1/responses");
                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
                request.Content = new StringContent(
                    JsonSerializer.Serialize(requestBody),
                    Encoding.UTF8,
                    "application/json");

                using var response = await _httpClient.SendAsync(request);
                _logger.LogInformation("OpenAI supervisor responses status code: {StatusCode}", (int)response.StatusCode);

                var raw = await response.Content.ReadAsStringAsync();
                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("OpenAI supervisor responses failed. Body: {Body}", raw);
                    return null;
                }

                _logger.LogInformation("OpenAI supervisor raw response: {Raw}", raw);

                var content = ExtractOutputText(raw);
                if (string.IsNullOrWhiteSpace(content)) return null;

                var parsed = TryParseRankedSupervisors(content);
                if (parsed == null || parsed.Count == 0) return null;

                foreach (var row in parsed)
                {
                    if (row.MatchScore < 0) row.MatchScore = 0;
                    if (row.MatchScore > 100) row.MatchScore = 100;
                    row.Reason = row.Reason?.Trim() ?? string.Empty;
                }

                return parsed;
            }
            catch
            {
                return null;
            }
        }

        private static List<AiRankedStudentResult>? TryParseRankedStudents(string content)
        {
            if (string.IsNullOrWhiteSpace(content))
                return null;

            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };

            // Strategy 1: proper JSON object {"rankedStudents":[...]}
            try
            {
                var wrapped = JsonSerializer.Deserialize<StudentRankingResponse>(content.Trim(), options);
                if (wrapped?.RankedStudents != null && wrapped.RankedStudents.Count > 0)
                    return wrapped.RankedStudents;
            }
            catch { }

            // Strategy 2: JSON-encoded string (double parse)
            try
            {
                var inner = JsonSerializer.Deserialize<string>(content, options);
                if (!string.IsNullOrWhiteSpace(inner))
                {
                    var wrapped = JsonSerializer.Deserialize<StudentRankingResponse>(inner, options);
                    if (wrapped?.RankedStudents != null && wrapped.RankedStudents.Count > 0)
                        return wrapped.RankedStudents;
                }
            }
            catch { }

            // Strategy 3: strip markdown code fences
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
                var wrapped = JsonSerializer.Deserialize<StudentRankingResponse>(stripped, options);
                if (wrapped?.RankedStudents != null && wrapped.RankedStudents.Count > 0)
                    return wrapped.RankedStudents;
            }
            catch { }

            return null;
        }

        private static List<AiRankedDoctorResult>? TryParseRankedSupervisors(string content)
        {
            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };

            // Strategy 1: content is already a proper JSON object {"rankedSupervisors":[...]}
            try
            {
                var wrapped = JsonSerializer.Deserialize<AiSupervisorsWrappedResponse>(content, options);
                if (wrapped?.RankedSupervisors != null && wrapped.RankedSupervisors.Count > 0)
                    return wrapped.RankedSupervisors;
            }
            catch { }

            // Strategy 2: content is a JSON-encoded string — OpenAI sometimes returns
            // the JSON wrapped in an extra string layer: "\"{ \\\"rankedSupervisors\\\": [...] }\""
            // We deserialize once to get the inner string, then parse that.
            try
            {
                var inner = JsonSerializer.Deserialize<string>(content, options);
                if (!string.IsNullOrWhiteSpace(inner))
                {
                    var wrapped = JsonSerializer.Deserialize<AiSupervisorsWrappedResponse>(inner, options);
                    if (wrapped?.RankedSupervisors != null && wrapped.RankedSupervisors.Count > 0)
                        return wrapped.RankedSupervisors;
                }
            }
            catch { }

            // Strategy 3: content is a plain JSON array [...] 
            try
            {
                var directArray = JsonSerializer.Deserialize<List<AiRankedDoctorResult>>(content, options);
                if (directArray != null && directArray.Count > 0)
                    return directArray;
            }
            catch { }

            // Strategy 4: strip markdown code fences if model wrapped response in ```json ... ```
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
                var wrapped = JsonSerializer.Deserialize<AiSupervisorsWrappedResponse>(stripped, options);
                if (wrapped?.RankedSupervisors != null && wrapped.RankedSupervisors.Count > 0)
                    return wrapped.RankedSupervisors;
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

                        var typeValue = typeElement.GetString();
                        if (!string.Equals(typeValue, "output_text", StringComparison.Ordinal))
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

        private class StudentRankingResponse
        {
            [JsonPropertyName("rankedStudents")]
            public List<AiRankedStudentResult>? RankedStudents { get; set; }
        }

        private class AiSupervisorsWrappedResponse
        {
            [JsonPropertyName("rankedSupervisors")]
            public List<AiRankedDoctorResult>? RankedSupervisors { get; set; }
        }
    }
}