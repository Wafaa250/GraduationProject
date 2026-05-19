using System;
using System.Linq;
using System.Text.RegularExpressions;

namespace GraduationProject.API.Helpers
{
    public static class OrganizationMembershipHelper
    {
        private static readonly string[] LeadershipKeywords =
        {
            "president", "vice president", "vice-president", " vp ", "chair", "director",
            "head of", "team lead", "lead ", " chief ", "officer", "treasurer", "secretary",
            "coordinator", "captain", "executive", "founder", "co-founder",
        };

        public static string ClassifyMembershipKind(string? roleTitle)
        {
            if (string.IsNullOrWhiteSpace(roleTitle))
                return Models.OrganizationMembershipKinds.Member;

            var normalized = $" {roleTitle.Trim().ToLowerInvariant()} ";
            if (LeadershipKeywords.Any(k => normalized.Contains(k, StringComparison.Ordinal)))
                return Models.OrganizationMembershipKinds.Leadership;

            if (Regex.IsMatch(roleTitle, @"\b(head|lead|chief|director|president|chair)\b", RegexOptions.IgnoreCase))
                return Models.OrganizationMembershipKinds.Leadership;

            return Models.OrganizationMembershipKinds.Member;
        }
    }
}
