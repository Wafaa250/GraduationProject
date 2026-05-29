using GraduationProject.API.DTOs;
using GraduationProject.API.Models;
using System.Text.RegularExpressions;

namespace GraduationProject.API.Services.Recommendations
{
    public class RecommendationScoringEngine : IRecommendationScoringEngine
    {
        private readonly IRecommendationNormalizationService _normalizer;

        public RecommendationScoringEngine(IRecommendationNormalizationService normalizer)
        {
            _normalizer = normalizer;
        }

        public RecommendationScoreResult Score(RecommendationRequestContext request, RecommendationCandidateContext candidate)
        {
            var reqSkills = _normalizer.ExpandWithFamilies(_normalizer.NormalizeMany(request.RequestedSkills));
            var reqRoles = _normalizer.NormalizeMany(request.RequestedRoles);
            var reqTools = _normalizer.NormalizeMany(request.RequestedTools);
            var reqDisciplines = _normalizer.InferDisciplines(
                request.TextSignals.Concat(reqSkills).Concat(reqRoles).Concat(reqTools));

            var candSkills = _normalizer.ExpandWithFamilies(_normalizer.NormalizeMany(candidate.Skills));
            var candTools = _normalizer.NormalizeMany(candidate.Tools);
            var candSignals = _normalizer.NormalizeMany(
                candidate.DisciplineSignals.Concat(candidate.InterestSignals).Concat(_normalizer.Tokenize(candidate.Bio)));
            var candDisciplines = _normalizer.InferDisciplines(candSignals.Concat(candSkills).Concat(candTools));

            var skillOverlap = WeightedOverlap(reqSkills, candSkills);
            var roleFit = Math.Max(
                WeightedOverlap(reqRoles, candSignals.Concat(candSkills)),
                RoleFamilySimilarity(reqRoles, candSignals.Concat(candSkills)));
            var disciplineRelevance = reqDisciplines.Count == 0
                ? 60
                : WeightedOverlap(reqDisciplines, candDisciplines);
            var roleDiscipline = (int)Math.Round(roleFit * 0.40 + disciplineRelevance * 0.60);

            var profileRelevance = BuildProfileRelevance(
                reqSkills, reqRoles, reqTools, request.TextSignals, candSkills, candSignals, candTools);
            var collaborationFit = CollaborationFit(request.Collaboration, candidate.Availability);
            var profileQuality = ProfileQuality(candidate);
            var toolFamiliarity = WeightedOverlap(reqTools, candTools.Concat(candSkills));
            var interestOverlap = WeightedOverlap(
                _normalizer.NormalizeMany(request.TextSignals),
                candidate.InterestSignals.Concat(candSignals));

            var total = (int)Math.Round(
                skillOverlap * 0.30 +
                roleDiscipline * 0.22 +
                disciplineRelevance * 0.16 +
                collaborationFit * 0.08 +
                profileQuality * 0.10 +
                toolFamiliarity * 0.07 +
                interestOverlap * 0.07);

            total = CalibrateScore(total, skillOverlap, roleFit, disciplineRelevance, toolFamiliarity, interestOverlap);

            if (candidate.InvitationStatus is CompanyRequestInvitationStatus.Pending or CompanyRequestInvitationStatus.Accepted)
                total = Math.Max(total - 5, 0);

            var hasStrongCrossDisciplineEvidence = skillOverlap >= 60 || roleFit >= 65 || toolFamiliarity >= 65;
            var passesThreshold = total >= 40 && (
                disciplineRelevance >= 35 ||
                (disciplineRelevance >= 20 && hasStrongCrossDisciplineEvidence));

            var highlights = BuildHighlights(
                reqSkills,
                reqRoles,
                reqTools,
                candSkills,
                candTools,
                roleFit,
                disciplineRelevance,
                collaborationFit,
                toolFamiliarity,
                interestOverlap);
            var reason = BuildReason(
                skillOverlap,
                roleFit,
                disciplineRelevance,
                collaborationFit,
                toolFamiliarity,
                interestOverlap,
                highlights,
                candSkills,
                candTools);

            return new RecommendationScoreResult
            {
                TotalScore = Math.Clamp(total, 0, 100),
                PassesThreshold = passesThreshold,
                DisciplineRelevance = disciplineRelevance,
                ReasonSummary = reason,
                Highlights = highlights,
                Breakdown = new CompanyRequestRecommendationScoreBreakdownDto
                {
                    SkillOverlap = skillOverlap,
                    RoleDisciplineAlignment = roleDiscipline,
                    ProfileRelevance = (int)Math.Round(profileRelevance * 0.6 + interestOverlap * 0.2 + toolFamiliarity * 0.2),
                    CollaborationFit = collaborationFit,
                    ProfileQuality = profileQuality,
                },
            };
        }

        private static int WeightedOverlap(IEnumerable<string> left, IEnumerable<string> right)
        {
            var leftSet = new HashSet<string>(left.Where(x => !string.IsNullOrWhiteSpace(x)), StringComparer.OrdinalIgnoreCase);
            var rightSet = new HashSet<string>(right.Where(x => !string.IsNullOrWhiteSpace(x)), StringComparer.OrdinalIgnoreCase);
            if (leftSet.Count == 0 || rightSet.Count == 0) return 0;

            var cumulative = 0.0;
            foreach (var leftTerm in leftSet)
            {
                var best = rightSet
                    .Select(r => Similarity(leftTerm, r))
                    .DefaultIfEmpty(0)
                    .Max();
                cumulative += best;
            }

            return (int)Math.Round((cumulative / leftSet.Count) * 100);
        }

        private static int BuildProfileRelevance(
            IEnumerable<string> reqSkills,
            IEnumerable<string> reqRoles,
            IEnumerable<string> reqTools,
            IEnumerable<string> reqText,
            IEnumerable<string> candSkills,
            IEnumerable<string> candSignals,
            IEnumerable<string> candTools)
        {
            var skillSignal = WeightedOverlap(reqSkills, candSignals.Concat(candSkills));
            var roleSignal = WeightedOverlap(reqRoles, candSignals);
            var toolSignal = WeightedOverlap(reqTools, candTools.Concat(candSkills));
            var textSignal = WeightedOverlap(reqText, candSignals.Concat(candSkills).Concat(candTools));
            return (int)Math.Round(skillSignal * 0.40 + roleSignal * 0.25 + toolSignal * 0.15 + textSignal * 0.20);
        }

        private static int CollaborationFit(string? requestCollaboration, string? availability)
        {
            var collab = (requestCollaboration ?? string.Empty).ToLowerInvariant();
            var avail = (availability ?? string.Empty).ToLowerInvariant();
            if (string.IsNullOrWhiteSpace(collab)) return 60;
            if (avail.Contains("available")) return 95;
            if (avail.Contains("limited")) return collab.Contains("flex") ? 72 : 58;
            if (avail.Contains("busy")) return 28;
            if (avail.Contains("part")) return 68;
            return 55;
        }

        private static int ProfileQuality(RecommendationCandidateContext candidate)
        {
            var points = 0;
            if (candidate.Skills.Count >= 3) points += 30;
            else if (candidate.Skills.Count > 0) points += 15;
            if (candidate.Tools.Count >= 2) points += 20;
            if (candidate.InterestSignals.Count >= 2) points += 15;
            if (!string.IsNullOrWhiteSpace(candidate.Bio)) points += 25;
            if (candidate.DisciplineSignals.Count >= 2) points += 20;
            return Math.Clamp(points, 0, 100);
        }

        private static List<string> BuildHighlights(
            List<string> reqSkills,
            List<string> reqRoles,
            List<string> reqTools,
            List<string> candSkills,
            List<string> candTools,
            int roleFit,
            int disciplineRelevance,
            int collaborationFit,
            int toolFamiliarity,
            int interestOverlap)
        {
            var highlights = new List<string>();
            var matchedSkills = candSkills.Where(s => reqSkills.Contains(s, StringComparer.OrdinalIgnoreCase)).Take(3).ToList();
            if (matchedSkills.Count > 0)
                highlights.Add($"Strong overlap in {string.Join(", ", matchedSkills)}");

            var matchedTools = candTools.Where(t => reqTools.Contains(t, StringComparer.OrdinalIgnoreCase)).Take(2).ToList();
            if (matchedTools.Count > 0)
                highlights.Add($"Tool familiarity with {string.Join(", ", matchedTools)}");
            else if (toolFamiliarity >= 55)
                highlights.Add("Tool stack alignment inferred from related skill families");

            if (disciplineRelevance >= 55)
                highlights.Add("High discipline relevance to the request domain");
            else if (roleFit >= 55)
                highlights.Add("Good role alignment with requested contribution");
            else if (disciplineRelevance >= 30 && roleFit >= 45)
                highlights.Add("Cross-discipline fit justified by strong role-signal overlap");

            if (collaborationFit >= 70)
                highlights.Add("Matches collaboration availability expectations");
            if (interestOverlap >= 55)
                highlights.Add("Project context aligns with profile interests and focus areas");

            if (highlights.Count == 0 && reqRoles.Count > 0)
                highlights.Add($"General alignment to {string.Join(", ", reqRoles.Take(2))}");

            return highlights.Take(4).ToList();
        }

        private static string BuildReason(
            int skillOverlap,
            int roleFit,
            int disciplineRelevance,
            int collaborationFit,
            int toolFamiliarity,
            int interestOverlap,
            List<string> highlights,
            List<string> candSkills,
            List<string> candTools)
        {
            var leadHighlight = highlights.FirstOrDefault();
            if (skillOverlap >= 75 && roleFit >= 65)
                return leadHighlight is null
                    ? "High-confidence match with strong overlap across required skills and closely related role families."
                    : $"High-confidence match. {leadHighlight}.";
            if (disciplineRelevance >= 65 && roleFit >= 58)
                return leadHighlight is null
                    ? "Strong discipline-aligned profile with relevant role-family signals for this request scope."
                    : $"Strong discipline-aligned fit. {leadHighlight}.";
            if (skillOverlap >= 62 && toolFamiliarity >= 55)
                return leadHighlight is null
                    ? "Solid technical/domain fit supported by both skill overlap and compatible tool familiarity."
                    : $"Solid technical/domain fit. {leadHighlight}.";
            if (interestOverlap >= 60 && collaborationFit >= 70)
                return leadHighlight is null
                    ? "Good contextual fit based on project-interest alignment and collaboration readiness."
                    : $"Good contextual fit. {leadHighlight}.";
            if (disciplineRelevance < 25 && skillOverlap < 60 && roleFit < 60)
                return "Moderate cross-discipline candidate with selective overlap in request-relevant signals.";
            if (candTools.Count > 0 || candSkills.Count > 0)
                return leadHighlight is null
                    ? "Relevant profile signals identified across skills/tools with moderate but meaningful request alignment."
                    : $"Moderate but meaningful alignment. {leadHighlight}.";
            return "Potential fit identified from available profile data.";
        }

        private static int CalibrateScore(
            int baseScore,
            int skillOverlap,
            int roleFit,
            int disciplineRelevance,
            int toolFamiliarity,
            int interestOverlap)
        {
            var score = baseScore;

            // Boost clearly strong matches into realistic top range.
            if (skillOverlap >= 70 && roleFit >= 60) score += 14;
            else if (skillOverlap >= 60 && roleFit >= 50) score += 9;
            else if (skillOverlap >= 50 || roleFit >= 55) score += 5;
            else if (skillOverlap >= 45 && roleFit >= 45) score += 3;

            if (disciplineRelevance >= 65) score += 6;
            else if (disciplineRelevance < 20) score -= 8;

            if (toolFamiliarity >= 60) score += 3;
            if (interestOverlap >= 60) score += 3;
            if (skillOverlap >= 55 && interestOverlap >= 45) score += 2;

            return Math.Clamp(score, 0, 100);
        }

        private static int RoleFamilySimilarity(IEnumerable<string> reqRoles, IEnumerable<string> candidateSignals)
        {
            var req = reqRoles.Where(x => !string.IsNullOrWhiteSpace(x)).ToList();
            var cand = candidateSignals.Where(x => !string.IsNullOrWhiteSpace(x)).ToList();
            if (req.Count == 0 || cand.Count == 0) return 0;

            var cumulative = 0.0;
            foreach (var role in req)
            {
                var best = cand.Select(c => Similarity(role, c)).DefaultIfEmpty(0).Max();
                cumulative += best;
            }

            return (int)Math.Round(cumulative / req.Count * 100);
        }

        private static double Similarity(string a, string b)
        {
            if (string.Equals(a, b, StringComparison.OrdinalIgnoreCase)) return 1.0;

            var an = NormalizeForSimilarity(a);
            var bn = NormalizeForSimilarity(b);
            if (an == bn) return 1.0;
            if (an.Contains(bn, StringComparison.OrdinalIgnoreCase) || bn.Contains(an, StringComparison.OrdinalIgnoreCase))
                return 0.82;

            var aTokens = TokenizeForSimilarity(an);
            var bTokens = TokenizeForSimilarity(bn);
            if (aTokens.Count == 0 || bTokens.Count == 0) return 0;

            var intersection = aTokens.Intersect(bTokens, StringComparer.OrdinalIgnoreCase).Count();
            var union = aTokens.Union(bTokens, StringComparer.OrdinalIgnoreCase).Count();
            if (union == 0) return 0;

            var jaccard = (double)intersection / union;
            return Math.Min(1.0, jaccard * 1.15);
        }

        private static string NormalizeForSimilarity(string text) =>
            Regex.Replace(text.Trim().ToLowerInvariant(), @"\s+", " ");

        private static HashSet<string> TokenizeForSimilarity(string text) =>
            new(
                Regex.Replace(text, @"[^a-z0-9\+\#\./\s-]", " ")
                    .Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries),
                StringComparer.OrdinalIgnoreCase);
    }
}
