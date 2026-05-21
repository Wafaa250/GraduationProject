using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using GraduationProject.API.Data;
using GraduationProject.API.Models;

namespace GraduationProject.API.Helpers
{
    public static class SkillHelper
    {
        // ─────────────────────────────────────────────────────────────────────
        // أسماء → IDs  (مع إنشاء الـ skill تلقائياً لو مش موجودة)
        // ─────────────────────────────────────────────────────────────────────
        public static async Task<string?> NamesToIdsJson(
            ApplicationDbContext db,
            List<string> names,
            string category)
        {
            if (names == null || names.Count == 0) return null;

            var ids = new List<int>();

            foreach (var name in names)
            {
                var trimmed = name.Trim();
                if (string.IsNullOrEmpty(trimmed)) continue;

                // شوف إذا موجودة
                var skill = await db.Skills
                    .FirstOrDefaultAsync(s => s.Name == trimmed);

                // إذا مش موجودة — أضفها
                if (skill == null)
                {
                    skill = new Skill { Name = trimmed, Category = category };
                    db.Skills.Add(skill);
                    await db.SaveChangesAsync();
                }

                ids.Add(skill.Id);
            }

            return ids.Count > 0 ? JsonSerializer.Serialize(ids) : null;
        }

        // ─────────────────────────────────────────────────────────────────────
        // IDs JSON → أسماء  (للـ GET responses)
        // ─────────────────────────────────────────────────────────────────────
        public static async Task<List<string>> IdsJsonToNames(
            ApplicationDbContext db,
            string? idsJson)
        {
            var ids = ParseIntList(idsJson);
            if (ids.Count == 0) return new();

            return await db.Skills
                .Where(s => ids.Contains(s.Id))
                .Select(s => s.Name)
                .ToListAsync();
        }

        // ─────────────────────────────────────────────────────────────────────
        // Helpers
        // ─────────────────────────────────────────────────────────────────────
        public static List<int> ParseIntList(string? json)
        {
            if (string.IsNullOrEmpty(json)) return new();
            try { return JsonSerializer.Deserialize<List<int>>(json) ?? new(); }
            catch { return new(); }
        }

        public static List<string> ParseStringList(string? json)
        {
            if (string.IsNullOrEmpty(json)) return new();
            try { return JsonSerializer.Deserialize<List<string>>(json) ?? new(); }
            catch { return new(); }
        }

        /// <summary>
        /// Skill overlap score (0–100) used on browse / teammate lists.
        /// If there is no skill overlap but majors match, returns at least 25 so
        /// students without listed skills still show a discovery hint.
        /// </summary>
        public static int ComputeBrowseMatchScore(
            IReadOnlyList<int> viewerSkillIds,
            IReadOnlyList<int> candidateSkillIds,
            string? viewerMajor,
            string? candidateMajor)
        {
            var common = viewerSkillIds.Intersect(candidateSkillIds).Count();
            var complementary = candidateSkillIds.Except(viewerSkillIds).Count();
            var matchScore = (int)(
                (common * 0.6 / Math.Max(viewerSkillIds.Count, 1) * 100) +
                (complementary * 0.4 / Math.Max(candidateSkillIds.Count, 1) * 100));
            matchScore = Math.Min(matchScore, 100);

            if (matchScore < 25
                && !string.IsNullOrWhiteSpace(viewerMajor)
                && !string.IsNullOrWhiteSpace(candidateMajor)
                && string.Equals(
                    viewerMajor.Trim(),
                    candidateMajor.Trim(),
                    StringComparison.OrdinalIgnoreCase))
            {
                matchScore = Math.Max(matchScore, 25);
            }

            return matchScore;
        }
    }
}
