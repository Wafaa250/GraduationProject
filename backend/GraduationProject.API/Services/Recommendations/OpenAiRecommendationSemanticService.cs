using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Linq;
using GraduationProject.API.Data;
using GraduationProject.API.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace GraduationProject.API.Services.Recommendations
{
    public class OpenAiRecommendationSemanticService : IRecommendationSemanticService
    {
        private readonly HttpClient _http;
        private readonly ApplicationDbContext _db;
        private readonly IConfiguration _config;
        private readonly ILogger<OpenAiRecommendationSemanticService> _logger;

        public OpenAiRecommendationSemanticService(
            HttpClient http,
            ApplicationDbContext db,
            IConfiguration config,
            ILogger<OpenAiRecommendationSemanticService> logger)
        {
            _http = http;
            _db = db;
            _config = config;
            _logger = logger;
        }

        public async Task<IReadOnlyDictionary<int, double>> ScoreCandidatesAsync(
            RecommendationRequestContext request,
            IReadOnlyList<RecommendationSemanticCandidate> candidates)
        {
            var result = new Dictionary<int, double>();
            if (candidates.Count == 0) return result;

            var apiKey = _config["OpenAI:ApiKey"];
            var model = _config["OpenAI:EmbeddingModel"] ?? "text-embedding-3-small";
            if (string.IsNullOrWhiteSpace(apiKey))
                return result;

            try
            {
                var requestContent = BuildRequestDocument(request);
                var requestEmbedding = await GetOrCreateEmbeddingAsync(
                    "company_request",
                    request.RequestId,
                    requestContent,
                    model,
                    apiKey);
                if (requestEmbedding == null || requestEmbedding.Count == 0)
                    return result;

                var candidateVectors = await GetOrCreateStudentEmbeddingsAsync(candidates, model, apiKey);
                foreach (var pair in candidateVectors)
                {
                    if (pair.Value.Count == requestEmbedding.Count)
                        result[pair.Key] = CosineSimilarity(requestEmbedding, pair.Value);
                }

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Semantic recommendation scoring failed; deterministic fallback continues");
                return result;
            }
        }

        private async Task<Dictionary<int, List<float>>> GetOrCreateStudentEmbeddingsAsync(
            IReadOnlyList<RecommendationSemanticCandidate> candidates,
            string model,
            string apiKey)
        {
            var scopeType = "student_profile";
            var ids = candidates.Select(c => c.StudentProfileId).Distinct().ToList();
            var cacheRows = await _db.RecommendationSemanticEmbeddings
                .Where(e => e.ScopeType == scopeType && ids.Contains(e.ScopeId) && e.EmbeddingModel == model)
                .ToListAsync();
            var cacheMap = cacheRows.ToDictionary(c => c.ScopeId);

            var toGenerate = new List<(int StudentId, string Hash, string Content)>();
            var vectors = new Dictionary<int, List<float>>();

            foreach (var candidate in candidates)
            {
                var hash = HashText(candidate.Content);
                if (cacheMap.TryGetValue(candidate.StudentProfileId, out var row) && row.ContentHash == hash)
                {
                    var cached = DeserializeEmbedding(row.EmbeddingJson);
                    if (cached.Count > 0)
                        vectors[candidate.StudentProfileId] = cached;
                    continue;
                }

                toGenerate.Add((candidate.StudentProfileId, hash, candidate.Content));
            }

            if (toGenerate.Count == 0) return vectors;

            const int batchSize = 64;
            for (var i = 0; i < toGenerate.Count; i += batchSize)
            {
                var batch = toGenerate.Skip(i).Take(batchSize).ToList();
                var embeddings = await GenerateEmbeddingsAsync(batch.Select(b => b.Content).ToList(), model, apiKey);

                for (var j = 0; j < batch.Count && j < embeddings.Count; j++)
                {
                    var entry = batch[j];
                    var vector = embeddings[j];
                    vectors[entry.StudentId] = vector;

                    if (cacheMap.TryGetValue(entry.StudentId, out var existing))
                    {
                        existing.ContentHash = entry.Hash;
                        existing.EmbeddingJson = JsonSerializer.Serialize(vector);
                        existing.UpdatedAt = DateTime.UtcNow;
                    }
                    else
                    {
                        _db.RecommendationSemanticEmbeddings.Add(new RecommendationSemanticEmbedding
                        {
                            ScopeType = scopeType,
                            ScopeId = entry.StudentId,
                            EmbeddingModel = model,
                            ContentHash = entry.Hash,
                            EmbeddingJson = JsonSerializer.Serialize(vector),
                            CreatedAt = DateTime.UtcNow,
                            UpdatedAt = DateTime.UtcNow,
                        });
                    }
                }
            }

            await _db.SaveChangesAsync();
            return vectors;
        }

        private async Task<List<float>?> GetOrCreateEmbeddingAsync(
            string scopeType,
            int scopeId,
            string content,
            string model,
            string apiKey)
        {
            var hash = HashText(content);
            var row = await _db.RecommendationSemanticEmbeddings.FirstOrDefaultAsync(e =>
                e.ScopeType == scopeType &&
                e.ScopeId == scopeId &&
                e.EmbeddingModel == model);

            if (row != null && row.ContentHash == hash)
            {
                var cached = DeserializeEmbedding(row.EmbeddingJson);
                if (cached.Count > 0) return cached;
            }

            var vectors = await GenerateEmbeddingsAsync(new List<string> { content }, model, apiKey);
            var vector = vectors.FirstOrDefault();
            if (vector == null || vector.Count == 0) return null;

            if (row != null)
            {
                row.ContentHash = hash;
                row.EmbeddingJson = JsonSerializer.Serialize(vector);
                row.UpdatedAt = DateTime.UtcNow;
            }
            else
            {
                _db.RecommendationSemanticEmbeddings.Add(new RecommendationSemanticEmbedding
                {
                    ScopeType = scopeType,
                    ScopeId = scopeId,
                    EmbeddingModel = model,
                    ContentHash = hash,
                    EmbeddingJson = JsonSerializer.Serialize(vector),
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                });
            }

            await _db.SaveChangesAsync();
            return vector;
        }

        private async Task<List<List<float>>> GenerateEmbeddingsAsync(
            List<string> inputs,
            string model,
            string apiKey)
        {
            using var req = new HttpRequestMessage(HttpMethod.Post, "https://api.openai.com/v1/embeddings");
            req.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", apiKey);
            req.Content = new StringContent(
                JsonSerializer.Serialize(new { model, input = inputs }),
                Encoding.UTF8,
                "application/json");

            using var res = await _http.SendAsync(req);
            var raw = await res.Content.ReadAsStringAsync();
            if (!res.IsSuccessStatusCode)
            {
                _logger.LogWarning("Embedding generation failed ({Code}): {Body}", (int)res.StatusCode, raw);
                return new List<List<float>>();
            }

            using var doc = JsonDocument.Parse(raw);
            if (!doc.RootElement.TryGetProperty("data", out var data) || data.ValueKind != JsonValueKind.Array)
                return new List<List<float>>();

            var vectors = new List<List<float>>();
            foreach (var item in data.EnumerateArray().OrderBy(x => x.GetProperty("index").GetInt32()))
            {
                if (!item.TryGetProperty("embedding", out var emb) || emb.ValueKind != JsonValueKind.Array)
                    continue;
                vectors.Add(emb.EnumerateArray().Select(v => v.GetSingle()).ToList());
            }
            return vectors;
        }

        private static string BuildRequestDocument(RecommendationRequestContext request)
        {
            return string.Join("\n", new[]
            {
                $"RequestId: {request.RequestId}",
                $"Skills: {string.Join(", ", request.RequestedSkills)}",
                $"Roles: {string.Join(", ", request.RequestedRoles)}",
                $"Tools: {string.Join(", ", request.RequestedTools)}",
                $"Collaboration: {request.Collaboration ?? "unspecified"}",
                $"Context: {string.Join(", ", request.TextSignals)}",
            });
        }

        public static string BuildStudentDocument(
            RecommendationCandidateContext candidate,
            int studentProfileId)
        {
            return string.Join("\n", new[]
            {
                $"StudentProfileId: {studentProfileId}",
                $"Skills: {string.Join(", ", candidate.Skills)}",
                $"Tools: {string.Join(", ", candidate.Tools)}",
                $"Interests: {string.Join(", ", candidate.InterestSignals)}",
                $"DisciplineSignals: {string.Join(", ", candidate.DisciplineSignals)}",
                $"Availability: {candidate.Availability ?? "unspecified"}",
                $"Bio: {candidate.Bio ?? string.Empty}",
            });
        }

        private static string HashText(string text)
        {
            var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(text));
            return Convert.ToHexString(bytes);
        }

        private static List<float> DeserializeEmbedding(string json)
        {
            try { return JsonSerializer.Deserialize<List<float>>(json) ?? new List<float>(); }
            catch { return new List<float>(); }
        }

        private static double CosineSimilarity(List<float> a, List<float> b)
        {
            double dot = 0;
            double normA = 0;
            double normB = 0;
            for (var i = 0; i < a.Count; i++)
            {
                dot += a[i] * b[i];
                normA += a[i] * a[i];
                normB += b[i] * b[i];
            }
            if (normA <= 0 || normB <= 0) return 0;
            return dot / (Math.Sqrt(normA) * Math.Sqrt(normB));
        }
    }
}
