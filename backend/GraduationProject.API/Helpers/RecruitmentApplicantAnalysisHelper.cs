using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using GraduationProject.API.Data;
using GraduationProject.API.Models;

namespace GraduationProject.API.Helpers
{
    public static class RecruitmentApplicantAnalysisHelper
    {
        public static string Truncate(string? text, int maxChars)
        {
            if (string.IsNullOrEmpty(text)) return string.Empty;
            var t = text.Trim();
            if (t.Length <= maxChars) return t;
            return t[..(maxChars - 1)] + "…";
        }

        public static List<string> ParseCommaSkills(string? requiredSkills)
        {
            if (string.IsNullOrWhiteSpace(requiredSkills)) return new List<string>();
            return requiredSkills
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Where(s => s.Length > 0)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .Take(24)
                .ToList();
        }

        /// <summary>Compact student profile line for AI (no images, no long blobs).</summary>
        public static async Task<string> BuildProfilePrAsync(ApplicationDbContext db, StudentProfile s)
        {
            var roles = await SkillHelper.IdsJsonToNames(db, s.Roles);
            var technical = await SkillHelper.IdsJsonToNames(db, s.TechnicalSkills);
            var tools = await SkillHelper.IdsJsonToNames(db, s.Tools);
            var explicitNames = s.StudentSkills
                .Select(ss => ss.Skill.Name)
                .Where(n => !string.IsNullOrWhiteSpace(n))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            var skillBag = roles
                .Concat(technical)
                .Concat(tools)
                .Concat(explicitNames)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .Take(30)
                .ToList();

            var parts = new List<string>();
            if (!string.IsNullOrWhiteSpace(s.Faculty)) parts.Add($"faculty:{Truncate(s.Faculty, 80)}");
            if (!string.IsNullOrWhiteSpace(s.Major)) parts.Add($"major:{Truncate(s.Major, 80)}");
            if (!string.IsNullOrWhiteSpace(s.AcademicYear)) parts.Add($"year:{Truncate(s.AcademicYear, 40)}");
            if (skillBag.Count > 0) parts.Add($"skills:{string.Join(",", skillBag.Select(x => Truncate(x, 40)))}");
            if (!string.IsNullOrWhiteSpace(s.Bio)) parts.Add($"bio:{Truncate(s.Bio, 280)}");
            if (!string.IsNullOrWhiteSpace(s.Availability)) parts.Add($"avail:{Truncate(s.Availability, 120)}");
            if (!string.IsNullOrWhiteSpace(s.LookingFor)) parts.Add($"interest:{Truncate(s.LookingFor, 180)}");

            var langs = SkillHelper.ParseStringList(s.Languages);
            if (langs.Count > 0)
                parts.Add($"lang:{string.Join(",", langs.Take(6).Select(x => Truncate(x, 24)))}");

            foreach (var (tag, url) in new[] { ("gh", s.Github), ("li", s.Linkedin), ("pf", s.Portfolio) })
            {
                if (string.IsNullOrWhiteSpace(url)) continue;
                parts.Add($"{tag}:{Truncate(url!.Trim(), 72)}");
            }

            return string.Join("|", parts);
        }

        /// <summary>Follows org + other recruitment applications to this org (excluding this position).</summary>
        public static async Task<(HashSet<int> FollowerStudentProfileIds, Dictionary<int, int> PriorAppsByStudent)>
            LoadOrgEngagementAsync(
                ApplicationDbContext db,
                int organizationProfileId,
                int campaignId,
                int positionId,
                IReadOnlyCollection<int> studentProfileIds,
                CancellationToken cancellationToken = default)
        {
            if (studentProfileIds == null || studentProfileIds.Count == 0)
                return (new HashSet<int>(), new Dictionary<int, int>());

            var idList = studentProfileIds.Distinct().ToList();

            var followers = await db.OrganizationFollows
                .AsNoTracking()
                .Where(f => f.OrganizationProfileId == organizationProfileId && idList.Contains(f.StudentProfileId))
                .Select(f => f.StudentProfileId)
                .ToListAsync(cancellationToken);

            var prior = await db.StudentOrganizationRecruitmentApplications
                .AsNoTracking()
                .Where(a =>
                    a.OrganizationProfileId == organizationProfileId &&
                    idList.Contains(a.StudentProfileId) &&
                    !(a.CampaignId == campaignId && a.PositionId == positionId))
                .GroupBy(a => a.StudentProfileId)
                .Select(g => new { Sid = g.Key, C = g.Count() })
                .ToDictionaryAsync(x => x.Sid, x => x.C, cancellationToken);

            return (followers.ToHashSet(), prior);
        }

        public static string AnswerTextForAi(StudentOrganizationRecruitmentApplicationAnswer a)
        {
            var dto = RecruitmentApplicationHelper.MapAnswerResponse(a);
            return Truncate(dto.AnswerValue, 480);
        }
    }
}
