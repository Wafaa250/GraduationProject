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
    }
}
