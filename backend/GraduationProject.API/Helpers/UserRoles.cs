using System;
using System.Linq;

namespace GraduationProject.API.Helpers
{
    /// <summary>
    /// JWT / users.role values. Workspace membership roles (owner/member) live on company_members.
    /// </summary>
    public static class UserRoles
    {
        public const string Student = "student";
        public const string Doctor = "doctor";
        public const string Company = "company";
        public const string CompanyMember = "companymember";
        public const string StudentAssociation = "studentassociation";
        public const string Association = "association";
        public const string Admin = "admin";

        public const string UsersRoleCheckConstraintName = "chk_users_role";

        /// <summary>Allowed values for users.role (PostgreSQL chk_users_role).</summary>
        public static readonly string[] AllAccountRoles =
        {
            Student,
            Doctor,
            Company,
            CompanyMember,
            StudentAssociation,
            Association,
            Admin,
        };

        /// <summary>SQL predicate for users.role CHECK constraint.</summary>
        public static string UsersRoleCheckSql =>
            $"role IN ({string.Join(", ", AllAccountRoles.Select(r => $"'{r}'"))})";

        /// <summary>ASP.NET [Authorize(Roles = ...)] for shared company workspace APIs.</summary>
        public const string CompanyWorkspace = "company,companymember";

        public static bool IsCompanyWorkspaceAccount(string? role)
        {
            var normalized = (role ?? string.Empty).Trim().ToLowerInvariant();
            return normalized is Company or CompanyMember;
        }

        public static bool IsCompanyOwnerAccount(string? role) =>
            string.Equals(role, Company, StringComparison.OrdinalIgnoreCase);

        /// <summary>Account roles eligible for Communication Hub “Recommended For You”.</summary>
        public static bool IsRecommendedDiscoverableAccountRole(string? role)
        {
            var normalized = (role ?? string.Empty).Trim().ToLowerInvariant();
            return normalized is Student or Doctor or Company or StudentAssociation or Association;
        }

        /// <summary>Internal/workspace roles that must never appear in recommendations.</summary>
        public static bool IsExcludedFromRecommendations(string? role)
        {
            var normalized = (role ?? string.Empty).Trim().ToLowerInvariant();
            return normalized is CompanyMember or Admin;
        }
    }
}
