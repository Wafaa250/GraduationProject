// Services/IAiPartnerRecommendationService.cs
using System.Collections.Generic;
using System.Threading.Tasks;

namespace GraduationProject.API.Services
{
    // ── Input / Output models ─────────────────────────────────────────────────

    /// <summary>
    /// Everything the AI needs to know about the current student
    /// in order to find complementary or similar teammates.
    /// </summary>
    public class AiPartnerCurrentStudent
    {
        public int    StudentId { get; set; }
        public string Name      { get; set; } = string.Empty;
        public List<string> Skills { get; set; } = new();
        public string Major    { get; set; } = string.Empty;
        public string Bio      { get; set; } = string.Empty;
    }

    /// <summary>
    /// A single candidate student passed to the AI for ranking.
    /// </summary>
    public class AiPartnerCandidate
    {
        public int    StudentId { get; set; }
        public string Name      { get; set; } = string.Empty;
        public List<string> Skills { get; set; } = new();
        public string Major    { get; set; } = string.Empty;
        public string Bio      { get; set; } = string.Empty;
    }

    /// <summary>
    /// One ranked result returned by the AI.
    /// </summary>
    public class AiRankedPartnerResult
    {
        public int    StudentId  { get; set; }
        public int    MatchScore { get; set; }   // 0-100
        public string Reason     { get; set; } = string.Empty;
    }

    // ── Service contract ──────────────────────────────────────────────────────

    public interface IAiPartnerRecommendationService
    {
        /// <summary>
        /// Ranks <paramref name="candidates"/> against <paramref name="currentStudent"/>.
        ///
        /// <paramref name="mode"/> is either "complementary" (default) or "similar".
        ///
        /// Returns null on complete AI failure — callers must fallback to simple scoring.
        /// </summary>
        Task<List<AiRankedPartnerResult>?> RankPartnersAsync(
            AiPartnerCurrentStudent         currentStudent,
            IReadOnlyList<AiPartnerCandidate> candidates,
            string                           mode);
    }
}
