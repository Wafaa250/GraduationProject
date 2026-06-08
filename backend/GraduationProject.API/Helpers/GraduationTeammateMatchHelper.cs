using System;
using System.Collections.Generic;
using System.Linq;

namespace GraduationProject.API.Helpers
{
    /// <summary>
    /// Rule-based teammate scoring for graduation project recommendations.
    /// Balances overlap with required skills and complementary skills the student brings.
    /// </summary>
    public static class GraduationTeammateMatchHelper
    {
        /// <summary>
        /// Resolves skill names to IDs using case-insensitive exact name matching.
        /// </summary>
        public static List<int> ResolveSkillIds(
            IEnumerable<(int Id, string Name)> allSkills,
            IEnumerable<string> skillNames)
        {
            var nameMap = allSkills
                .GroupBy(s => s.Name.Trim(), StringComparer.OrdinalIgnoreCase)
                .ToDictionary(g => g.Key, g => g.First().Id, StringComparer.OrdinalIgnoreCase);

            var ids = new List<int>();
            foreach (var raw in skillNames)
            {
                var name = raw?.Trim();
                if (string.IsNullOrEmpty(name)) continue;
                if (nameMap.TryGetValue(name, out var id))
                    ids.Add(id);
            }

            return ids.Distinct().ToList();
        }

        /// <summary>
        /// Computes a 1–100 match score between a student's skill IDs and the project's required skill IDs.
        /// Does not require direct overlap — complementary skills contribute to the score.
        /// </summary>
        public static int ComputeMatchScore(
            IReadOnlyList<int> studentSkillIds,
            IReadOnlyList<int> requiredSkillIds)
        {
            if (requiredSkillIds.Count == 0)
                return studentSkillIds.Count > 0 ? 50 : 35;

            if (studentSkillIds.Count == 0)
                return 20;

            var requiredSet = requiredSkillIds.ToHashSet();
            var studentSet = studentSkillIds.ToHashSet();

            var common = studentSet.Count(requiredSet.Contains);
            var complementary = studentSet.Count(id => !requiredSet.Contains(id));

            var overlapPct = (double)common / requiredSkillIds.Count * 100;
            var diversityPct = (double)complementary / Math.Max(studentSkillIds.Count, 1) * 100;

            var score = (int)Math.Round(overlapPct * 0.65 + diversityPct * 0.35);
            return Math.Clamp(score, 1, 100);
        }
    }
}
