using System;
using System.Collections.Generic;
using System.Linq;
using GraduationProject.API.Models;

namespace GraduationProject.API.Helpers
{
    public static class LeadershipRoleSortHelper
    {
        public static int GetRolePriority(string? roleTitle)
        {
            var normalized = (roleTitle ?? string.Empty).Trim().ToLowerInvariant();
            if (string.IsNullOrEmpty(normalized))
                return 100;

            if (ContainsWholeWord(normalized, "president") && !ContainsVicePresident(normalized))
                return 0;

            if (ContainsVicePresident(normalized) || ContainsWholeWord(normalized, "vp"))
                return 1;

            if (ContainsWholeWord(normalized, "secretary"))
                return 2;

            if (ContainsWholeWord(normalized, "treasurer"))
                return 3;

            if (normalized.Contains("coordinator", StringComparison.Ordinal))
                return 4;

            return 100;
        }

        public static IEnumerable<StudentOrganizationTeamMember> SortTeamMembers(
            IEnumerable<StudentOrganizationTeamMember> members) =>
            members
                .OrderBy(m => GetRolePriority(m.RoleTitle))
                .ThenBy(m => m.RoleTitle, StringComparer.OrdinalIgnoreCase)
                .ThenBy(m => m.CreatedAt)
                .ThenBy(m => m.Id);

        public static IEnumerable<StudentOrganizationRecruitmentPosition> SortPositions(
            IEnumerable<StudentOrganizationRecruitmentPosition> positions) =>
            positions
                .OrderBy(p => GetRolePriority(p.RoleTitle))
                .ThenBy(p => p.RoleTitle, StringComparer.OrdinalIgnoreCase)
                .ThenBy(p => p.Id);

        private static bool ContainsVicePresident(string normalized) =>
            normalized.Contains("vice president", StringComparison.Ordinal) ||
            normalized.Contains("vice-president", StringComparison.Ordinal) ||
            normalized.Contains("vicepresident", StringComparison.Ordinal);

        private static bool ContainsWholeWord(string normalized, string word)
        {
            var index = 0;
            while ((index = normalized.IndexOf(word, index, StringComparison.Ordinal)) >= 0)
            {
                var beforeOk = index == 0 || !char.IsLetterOrDigit(normalized[index - 1]);
                var afterIndex = index + word.Length;
                var afterOk = afterIndex >= normalized.Length || !char.IsLetterOrDigit(normalized[afterIndex]);
                if (beforeOk && afterOk)
                    return true;
                index += word.Length;
            }

            return false;
        }
    }
}
