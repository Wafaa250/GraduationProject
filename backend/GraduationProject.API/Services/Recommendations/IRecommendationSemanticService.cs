namespace GraduationProject.API.Services.Recommendations
{
    public interface IRecommendationSemanticService
    {
        Task<IReadOnlyDictionary<int, double>> ScoreCandidatesAsync(
            RecommendationRequestContext request,
            IReadOnlyList<RecommendationSemanticCandidate> candidates);
    }

    public class RecommendationSemanticCandidate
    {
        public int StudentProfileId { get; set; }
        public string Content { get; set; } = string.Empty;
    }
}
