using System;
using System.Collections.Generic;
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
        /// Trims values, drops empties, and deduplicates case-insensitively (first casing wins).
        /// </summary>
        public static List<string> NormalizeUniqueStrings(IEnumerable<string>? items)
        {
            if (items == null) return new();

            var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            var result = new List<string>();

            foreach (var item in items)
            {
                if (string.IsNullOrWhiteSpace(item)) continue;
                var trimmed = item.Trim();
                if (!seen.Add(trimmed)) continue;
                result.Add(trimmed);
            }

            return result;
        }

        public static string? ToJsonOrNull(IEnumerable<string>? items)
        {
            var normalized = NormalizeUniqueStrings(items);
            return normalized.Count > 0 ? JsonSerializer.Serialize(normalized) : null;
        }

        /// <summary>
        /// Merges required skills and technologies for matching/scoring (does not mutate stored columns).
        /// </summary>
        public static List<string> GetProjectMatchingSkillNames(
            string? requiredSkillsJson,
            string? technologiesJson = null) =>
            NormalizeUniqueStrings(
                ParseStringList(requiredSkillsJson).Concat(ParseStringList(technologiesJson)));
    }
}
