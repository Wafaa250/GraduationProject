using System.Text.RegularExpressions;
using GraduationProject.API.Helpers;

namespace GraduationProject.API.Services.Recommendations
{
    public class RecommendationNormalizationService : IRecommendationNormalizationService
    {
        public string NormalizeTerm(string? term)
        {
            var cleaned = Regex.Replace((term ?? string.Empty).Trim().ToLowerInvariant(), @"\s+", " ");
            if (string.IsNullOrWhiteSpace(cleaned)) return string.Empty;
            return RecommendationTaxonomy.SkillAliases.TryGetValue(cleaned, out var canonical)
                ? canonical
                : cleaned;
        }

        public List<string> NormalizeMany(IEnumerable<string> terms)
        {
            return SkillHelper.NormalizeUniqueStrings(
                terms.Select(NormalizeTerm).Where(t => !string.IsNullOrWhiteSpace(t)));
        }

        public List<string> Tokenize(string? text)
        {
            if (string.IsNullOrWhiteSpace(text)) return new List<string>();
            var cleaned = Regex.Replace(text.ToLowerInvariant(), @"[^a-z0-9\+\#\./\s-]", " ");
            return SkillHelper.NormalizeUniqueStrings(
                cleaned.Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries));
        }

        public HashSet<string> InferDisciplines(IEnumerable<string> signals)
        {
            var normalizedSignals = string.Join(" ", NormalizeMany(signals));
            var disciplines = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            foreach (var pair in RecommendationTaxonomy.DisciplineKeywords)
            {
                if (pair.Value.Any(k => normalizedSignals.Contains(k, StringComparison.OrdinalIgnoreCase)))
                    disciplines.Add(pair.Key);
            }
            return disciplines;
        }

        public List<string> ExpandWithFamilies(IEnumerable<string> normalizedSkills)
        {
            var expanded = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            foreach (var skill in normalizedSkills)
            {
                expanded.Add(skill);
                if (RecommendationTaxonomy.SkillFamilies.TryGetValue(skill, out var family))
                    expanded.Add(family);
            }
            return expanded.ToList();
        }
    }
}
