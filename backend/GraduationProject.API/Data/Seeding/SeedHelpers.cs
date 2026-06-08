using System.Text.Json;
using GraduationProject.API.Helpers;
using GraduationProject.API.Models;
using Microsoft.EntityFrameworkCore;

namespace GraduationProject.API.Data.Seeding
{
    internal static class SeedHelpers
    {
        public static string HashPassword(string password) =>
            BCrypt.Net.BCrypt.HashPassword(password);

        public static string Slugify(string value) =>
            new string(value.ToLowerInvariant()
                .Select(c => char.IsLetterOrDigit(c) ? c : '-')
                .ToArray())
                .Trim('-')
                .Replace("--", "-");

        public static async Task<string?> SkillsToIdsJsonAsync(
            ApplicationDbContext db,
            IEnumerable<string> names,
            string category)
        {
            return await SkillHelper.NamesToIdsJson(db, names.ToList(), category);
        }

        public static string SkillsToNamesJson(IEnumerable<string> names) =>
            SkillHelper.ToJsonOrNull(names) ?? "[]";

        public static string ScoreBreakdownJson(int skillMatch, int experience, int availability) =>
            JsonSerializer.Serialize(new
            {
                skillMatch,
                experience,
                availability,
                portfolio = RngInt(skillMatch - 5, skillMatch + 5),
            });

        public static string HighlightsJson(params string[] items) =>
            JsonSerializer.Serialize(items);

        private static int RngInt(int min, int max) => Random.Shared.Next(min, max + 1);

        public static async Task<bool> IsAlreadySeededAsync(ApplicationDbContext db) =>
            await db.Users.AsNoTracking()
                .AnyAsync(u => u.Email == SeedContext.SeedMarkerEmail);

        public static async Task<bool> IsExpansionAlreadyRunAsync(ApplicationDbContext db) =>
            await db.Users.AsNoTracking()
                .AnyAsync(u => u.Email == ExpansionContext.ExpansionMarkerEmail);

        public static string ToGmailAddress(string localPart) =>
            $"{localPart.Trim().ToLower()}@{NajahSeedConstants.StudentDoctorEmailDomain}";

        public static string StudentGmailLocal(string first, string last, int index) =>
            $"{Slugify(first)}.{Slugify(last)}{index}";

        public static string DoctorGmailLocal(string slug, bool expansion = false) =>
            expansion ? $"dr.exp.{slug}" : $"dr.{slug}";

        public static string ReplaceUniversityReferences(string? text)
        {
            if (string.IsNullOrWhiteSpace(text)) return text ?? string.Empty;
            var result = text;
            foreach (var name in NajahSeedConstants.OtherUniversityNames)
                result = result.Replace(name, NajahSeedConstants.UniversityName, StringComparison.OrdinalIgnoreCase);
            result = result
                .Replace("Birzeit", "An-Najah", StringComparison.OrdinalIgnoreCase)
                .Replace("AAU ", "An-Najah ", StringComparison.OrdinalIgnoreCase)
                .Replace("PPU ", "An-Najah ", StringComparison.OrdinalIgnoreCase)
                .Replace("Al-Quds", "An-Najah", StringComparison.OrdinalIgnoreCase)
                .Replace("Bethlehem University", NajahSeedConstants.UniversityName, StringComparison.OrdinalIgnoreCase)
                .Replace("historic Bethlehem neighborhoods", "historic Nablus neighborhoods", StringComparison.OrdinalIgnoreCase)
                .Replace("inter-university robotics contests", "An-Najah robotics contests", StringComparison.OrdinalIgnoreCase);
            return result;
        }

        public static bool IsLegacyUniversityEmail(string email)
        {
            if (string.IsNullOrWhiteSpace(email)) return false;
            var at = email.LastIndexOf('@');
            if (at < 0) return false;
            var domain = email[(at + 1)..].ToLowerInvariant();
            return NajahSeedConstants.LegacyUniversityDomains.Contains(domain);
        }

        public static string ConvertLegacyEmailToGmail(string email)
        {
            var at = email.LastIndexOf('@');
            return at > 0 ? ToGmailAddress(email[..at]) : email;
        }
    }
}
