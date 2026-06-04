using System;
using System.Collections.Generic;
using System.Linq;
using GraduationProject.API.Models;

namespace GraduationProject.API.Helpers
{
    /// <summary>Deterministic profile-to-entity matching (no external AI).</summary>
    public static class StudentRecommendationScorer
    {
        private const int MaxScore = 100;

        private static readonly (string Stem, string[] Keywords)[] MajorExpansion =
        {
            ("computer", new[]
            {
                "software", "programming", "developer", "development", "ai", "artificial intelligence",
                "machine learning", "cyber", "security", "data", "cloud", "web", "mobile", "ieee", "acm",
                "robotics", "embedded", "iot", "information technology", "information systems", "devops",
                "full stack", "backend", "frontend", "database", "network",
            }),
            ("electrical", new[]
            {
                "electronics", "power", "signal", "ieee", "embedded", "hardware", "iot", "energy",
                "telecommunication", "communication", "control systems",
            }),
            ("mechanical", new[] { "manufacturing", "automotive", "robotics", "cad", "thermodynamics", "design" }),
            ("civil", new[] { "construction", "structural", "infrastructure", "transportation", "surveying", "concrete" }),
            ("architect", new[] { "design", "urban", "building", "landscape", "planning" }),
            ("industrial", new[] { "operations", "supply chain", "logistics", "optimization", "manufacturing" }),
            ("biomedical", new[] { "medical", "health", "clinical", "biotech", "pharma" }),
            ("business", new[] { "finance", "marketing", "management", "entrepreneurship", "consulting" }),
        };

        private static readonly string[] TechAssociationSignals =
        {
            "ieee", "acm", "coding", "programming", "software", "robotics", "developer", "tech", "computer",
            "cyber", "data", "hackathon", "innovation", "engineering", "stem",
        };

        private static readonly string[] NonTechAssociationSignals =
        {
            "civil engineering society", "architecture club", "urban planning", "fine arts",
        };

        public static int ScoreCompany(CompanyProfile company, StudentMatchContext ctx)
        {
            var haystack = BuildHaystack(
                company.CompanyName,
                company.Industry,
                company.AreasOfInterest,
                company.Description,
                company.Location,
                company.WorkingStyle);

            var raw = 0;

            raw += ScoreMajorAlignment(haystack, ctx);
            raw += ScoreTokenOverlap(haystack, ctx.SkillTokens, 12, 36);
            raw += ScoreTokenOverlap(haystack, ctx.InterestTokens, 10, 25);
            raw += ScoreFacultyHint(haystack, ctx.Faculty);

            if (!string.IsNullOrWhiteSpace(company.Industry)
                && ctx.MajorTokens.Any(t => company.Industry.Contains(t, StringComparison.OrdinalIgnoreCase)))
                raw += 18;

            return ToMatchPercent(raw, 95);
        }

        public static int ScoreStudentPeer(
            StudentProfile candidate,
            StudentMatchContext viewerCtx,
            IReadOnlyList<string> candidateSkillNames)
        {
            var haystack = BuildHaystack(
                candidate.Major,
                candidate.Faculty,
                candidate.University,
                candidate.AcademicYear,
                candidate.Bio,
                candidate.LookingFor,
                candidate.TechnicalSkills,
                candidate.Roles,
                candidate.Tools,
                string.Join(" ", candidateSkillNames));

            var raw = 0;

            if (!string.IsNullOrWhiteSpace(viewerCtx.Faculty)
                && !string.IsNullOrWhiteSpace(candidate.Faculty)
                && string.Equals(viewerCtx.Faculty.Trim(), candidate.Faculty.Trim(), StringComparison.OrdinalIgnoreCase))
                raw += 30;

            if (!string.IsNullOrWhiteSpace(viewerCtx.Major)
                && !string.IsNullOrWhiteSpace(candidate.Major)
                && string.Equals(viewerCtx.Major.Trim(), candidate.Major.Trim(), StringComparison.OrdinalIgnoreCase))
                raw += 35;

            raw += ScoreMajorAlignment(haystack, viewerCtx);
            raw += ScoreTokenOverlap(haystack, viewerCtx.SkillTokens, 10, 32);
            raw += ScoreTokenOverlap(haystack, viewerCtx.InterestTokens, 8, 18);

            return ToMatchPercent(raw, 92);
        }

        public static int ScoreDoctor(DoctorProfile doctor, StudentMatchContext viewerCtx)
        {
            var haystack = BuildHaystack(
                doctor.Specialization,
                doctor.Department,
                doctor.Faculty,
                doctor.University,
                doctor.Bio,
                doctor.TechnicalSkills,
                doctor.ResearchSkills);

            var raw = 0;

            if (!string.IsNullOrWhiteSpace(viewerCtx.Faculty)
                && !string.IsNullOrWhiteSpace(doctor.Faculty)
                && string.Equals(viewerCtx.Faculty.Trim(), doctor.Faculty.Trim(), StringComparison.OrdinalIgnoreCase))
                raw += 32;

            if (!string.IsNullOrWhiteSpace(viewerCtx.Major)
                && haystack.Contains(viewerCtx.Major.Trim(), StringComparison.OrdinalIgnoreCase))
                raw += 22;

            raw += ScoreMajorAlignment(haystack, viewerCtx);
            raw += ScoreTokenOverlap(haystack, viewerCtx.SkillTokens, 10, 30);
            raw += ScoreTokenOverlap(haystack, viewerCtx.InterestTokens, 8, 16);
            raw += ScoreFacultyHint(haystack, viewerCtx.Faculty);

            return ToMatchPercent(raw, 90);
        }

        public static int ScoreAssociation(StudentAssociationProfile org, StudentMatchContext ctx)
        {
            var haystack = BuildHaystack(
                org.AssociationName,
                org.Category,
                org.Faculty,
                org.Description,
                org.Username);

            var raw = 0;

            if (!string.IsNullOrWhiteSpace(ctx.Faculty) && !string.IsNullOrWhiteSpace(org.Faculty)
                && string.Equals(ctx.Faculty.Trim(), org.Faculty.Trim(), StringComparison.OrdinalIgnoreCase))
                raw += 35;

            raw += ScoreMajorAlignment(haystack, ctx);
            raw += ScoreTokenOverlap(haystack, ctx.SkillTokens, 10, 30);
            raw += ScoreTokenOverlap(haystack, ctx.InterestTokens, 8, 20);

            foreach (var signal in TechAssociationSignals)
            {
                if (haystack.Contains(signal, StringComparison.OrdinalIgnoreCase)
                    && ctx.IsStemStudent)
                    raw += 12;
            }

            if (ctx.IsStemStudent)
            {
                foreach (var negative in NonTechAssociationSignals)
                {
                    if (haystack.Contains(negative, StringComparison.OrdinalIgnoreCase))
                        raw -= 25;
                }
            }

            if (!string.IsNullOrWhiteSpace(ctx.Major) && !string.IsNullOrWhiteSpace(org.Category)
                && org.Category.Contains(ctx.Major, StringComparison.OrdinalIgnoreCase))
                raw += 15;

            return ToMatchPercent(raw, 90);
        }

        public static StudentMatchContext BuildContext(StudentProfile student, IReadOnlyList<string> skillNames)
        {
            var major = student.Major?.Trim() ?? "";
            var faculty = student.Faculty?.Trim() ?? "";

            var skillTokens = SkillHelper.NormalizeUniqueStrings(
                skillNames.Concat(SkillHelper.ParseStringList(student.Tools)));

            var interestTokens = SkillHelper.NormalizeUniqueStrings(
                new[]
                {
                    student.LookingFor,
                    student.Bio,
                    student.AcademicYear,
                }.SelectMany(s => Tokenize(s)));

            var majorTokens = Tokenize(major).ToList();
            foreach (var stem in MajorExpansion)
            {
                if (major.Contains(stem.Stem, StringComparison.OrdinalIgnoreCase))
                    majorTokens.AddRange(stem.Keywords);
            }

            var isStem = major.Contains("engineer", StringComparison.OrdinalIgnoreCase)
                || major.Contains("computer", StringComparison.OrdinalIgnoreCase)
                || major.Contains("software", StringComparison.OrdinalIgnoreCase)
                || major.Contains("electrical", StringComparison.OrdinalIgnoreCase)
                || major.Contains("information", StringComparison.OrdinalIgnoreCase)
                || faculty.Contains("engineering", StringComparison.OrdinalIgnoreCase)
                || faculty.Contains("information", StringComparison.OrdinalIgnoreCase);

            return new StudentMatchContext(
                major,
                faculty,
                majorTokens.Distinct(StringComparer.OrdinalIgnoreCase).ToList(),
                skillTokens,
                interestTokens,
                isStem);
        }

        private static int ScoreMajorAlignment(string haystack, StudentMatchContext ctx)
        {
            var score = 0;
            foreach (var token in ctx.MajorTokens)
            {
                if (token.Length < 3) continue;
                if (haystack.Contains(token, StringComparison.OrdinalIgnoreCase))
                    score += token.Length >= 8 ? 18 : 12;
            }

            if (!string.IsNullOrWhiteSpace(ctx.Major)
                && haystack.Contains(ctx.Major, StringComparison.OrdinalIgnoreCase))
                score += 22;

            return Math.Min(score, 55);
        }

        private static int ScoreFacultyHint(string haystack, string? faculty)
        {
            if (string.IsNullOrWhiteSpace(faculty)) return 0;
            return haystack.Contains(faculty, StringComparison.OrdinalIgnoreCase) ? 8 : 0;
        }

        private static int ScoreTokenOverlap(
            string haystack,
            IReadOnlyList<string> tokens,
            int perHit,
            int cap)
        {
            var score = 0;
            foreach (var token in tokens)
            {
                if (token.Length < 3) continue;
                if (haystack.Contains(token, StringComparison.OrdinalIgnoreCase))
                    score += perHit;
            }

            return Math.Min(score, cap);
        }

        private static string BuildHaystack(params string?[] parts) =>
            string.Join(" ", parts.Where(p => !string.IsNullOrWhiteSpace(p))).ToLowerInvariant();

        private static IEnumerable<string> Tokenize(string? text)
        {
            if (string.IsNullOrWhiteSpace(text)) yield break;
            foreach (var part in text.Split(new[] { ' ', ',', ';', '|', '/', '\n', '\r', '\t' },
                         StringSplitOptions.RemoveEmptyEntries))
            {
                var t = part.Trim().ToLowerInvariant();
                if (t.Length >= 2) yield return t;
            }
        }

        private static int ToMatchPercent(int raw, int maxRaw)
        {
            if (raw <= 0) return 0;
            var scaled = (int)Math.Round(raw * (double)MaxScore / maxRaw);
            return Math.Clamp(scaled, 35, MaxScore);
        }
    }

    public sealed class StudentMatchContext
    {
        public StudentMatchContext(
            string major,
            string faculty,
            IReadOnlyList<string> majorTokens,
            IReadOnlyList<string> skillTokens,
            IReadOnlyList<string> interestTokens,
            bool isStemStudent)
        {
            Major = major;
            Faculty = faculty;
            MajorTokens = majorTokens;
            SkillTokens = skillTokens;
            InterestTokens = interestTokens;
            IsStemStudent = isStemStudent;
        }

        public string Major { get; }
        public string Faculty { get; }
        public IReadOnlyList<string> MajorTokens { get; }
        public IReadOnlyList<string> SkillTokens { get; }
        public IReadOnlyList<string> InterestTokens { get; }
        public bool IsStemStudent { get; }
    }
}
