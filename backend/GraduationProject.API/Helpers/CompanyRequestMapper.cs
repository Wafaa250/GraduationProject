using System;
using System.Collections.Generic;
using System.Linq;
using GraduationProject.API.DTOs;
using GraduationProject.API.Models;

namespace GraduationProject.API.Helpers
{
    public static class CompanyRequestMapper
    {
        public static string ResolveCategory(string categoryChoice, string categoryOther)
        {
            if (string.Equals(categoryChoice, "Other", StringComparison.OrdinalIgnoreCase))
            {
                var custom = NormalizeEntry(categoryOther);
                return custom ?? string.Empty;
            }
            return categoryChoice?.Trim() ?? string.Empty;
        }

        public static string BuildDurationLabel(bool ongoing, int? value, DurationUnit? unit)
        {
            if (ongoing) return "Ongoing collaboration";
            if (value is < 1 or > 99 || unit == null) return string.Empty;
            var unitName = unit.Value.ToString();
            var label = value == 1 ? SingularizeUnit(unitName) : unitName;
            return $"{value} {label}";
        }

        public static List<RoleDraft> NormalizeRoles(
            string? requestType,
            string? targetRole,
            IReadOnlyList<string>? requiredSkills,
            IReadOnlyList<CompanyRequestRoleInputDto>? roles)
        {
            if (roles != null && roles.Count > 0)
            {
                return roles
                    .Select((r, i) => new RoleDraft
                    {
                        ClientRoleKey = r.ClientRoleKey,
                        SortOrder = r.SortOrder > 0 ? r.SortOrder : i,
                        RoleName = r.RoleName?.Trim() ?? string.Empty,
                        Notes = r.Notes?.Trim(),
                        Skills = DistinctSkills(r.Skills),
                    })
                    .Where(r => !string.IsNullOrWhiteSpace(r.RoleName) || r.Skills.Count > 0)
                    .ToList();
            }

            if (string.Equals(requestType, CompanyRequestType.Individual, StringComparison.OrdinalIgnoreCase)
                && !string.IsNullOrWhiteSpace(targetRole))
            {
                return new List<RoleDraft>
                {
                    new()
                    {
                        SortOrder = 0,
                        RoleName = targetRole.Trim(),
                        Skills = DistinctSkills(requiredSkills ?? Array.Empty<string>()),
                    },
                };
            }

            return new List<RoleDraft>();
        }

        public static void ApplyDraftFields(
            CompanyRequest entity,
            SaveCompanyRequestDraftDto dto)
        {
            entity.WizardStep = dto.WizardStep;
            entity.RequestType = dto.RequestType?.Trim() ?? string.Empty;
            entity.Title = dto.Title?.Trim() ?? string.Empty;
            entity.Description = dto.Description?.Trim() ?? string.Empty;
            entity.CategoryChoice = dto.CategoryChoice?.Trim();
            entity.CategoryOther = dto.CategoryOther?.Trim();
            entity.Category = ResolveCategory(dto.CategoryChoice ?? "", dto.CategoryOther ?? "");
            entity.DurationOngoing = dto.DurationOngoing;
            entity.DurationValue = dto.DurationOngoing ? null : dto.DurationValue;
            entity.DurationUnit = dto.DurationOngoing
                ? null
                : CompanyRequestEnumConverters.TryParseDurationUnit(dto.DurationUnit);
            entity.DurationLabel = BuildDurationLabel(
                dto.DurationOngoing,
                entity.DurationValue,
                entity.DurationUnit);
            entity.CollaborationFormat =
                CompanyRequestEnumConverters.TryParseCollaborationFormat(dto.CollaborationType);
            entity.ScopeNotes = string.IsNullOrWhiteSpace(dto.ScopeNotes) ? null : dto.ScopeNotes.Trim();
            entity.UpdatedAt = DateTime.UtcNow;
        }

        public static void ReplaceRoles(CompanyRequest entity, IEnumerable<RoleDraft> roleDrafts)
        {
            entity.Roles.Clear();
            foreach (var draft in roleDrafts.OrderBy(r => r.SortOrder))
            {
                var role = new CompanyRequestRole
                {
                    ClientRoleKey = draft.ClientRoleKey,
                    SortOrder = draft.SortOrder,
                    RoleName = draft.RoleName,
                    Notes = draft.Notes,
                };
                var skillOrder = 0;
                foreach (var skill in draft.Skills)
                {
                    role.Skills.Add(new CompanyRequestSkill
                    {
                        SortOrder = skillOrder++,
                        SkillName = skill,
                    });
                }
                entity.Roles.Add(role);
            }
        }

        public static CompanyRequestDetailDto ToDetailDto(CompanyRequest entity) =>
            new()
            {
                Id = entity.Id,
                RequestType = entity.RequestType,
                Status = entity.Status,
                RequestStatus = entity.RequestStatus,
                WizardStep = entity.WizardStep,
                Title = entity.Title,
                Description = entity.Description,
                Category = entity.Category,
                CategoryChoice = entity.CategoryChoice,
                CategoryOther = entity.CategoryOther,
                DurationOngoing = entity.DurationOngoing,
                DurationValue = entity.DurationValue,
                DurationUnit = CompanyRequestEnumConverters.ToWireValue(entity.DurationUnit),
                DurationLabel = entity.DurationLabel,
                CollaborationType = CompanyRequestEnumConverters.ToWireValue(entity.CollaborationFormat) ?? string.Empty,
                ScopeNotes = entity.ScopeNotes,
                MatchingStatus = entity.MatchingStatus,
                MatchedAt = entity.MatchedAt,
                Roles = entity.Roles
                    .OrderBy(r => r.SortOrder)
                    .Select(r => new CompanyRequestRoleDto
                    {
                        Id = r.Id,
                        ClientRoleKey = r.ClientRoleKey,
                        SortOrder = r.SortOrder,
                        RoleName = r.RoleName,
                        Notes = r.Notes,
                        Skills = r.Skills
                            .OrderBy(s => s.SortOrder)
                            .Select(s => new CompanyRequestSkillDto
                            {
                                Id = s.Id,
                                SkillName = s.SkillName,
                                SortOrder = s.SortOrder,
                            })
                            .ToList(),
                    })
                    .ToList(),
                CreatedAt = entity.CreatedAt,
                UpdatedAt = entity.UpdatedAt,
                SubmittedAt = entity.SubmittedAt,
            };

        public static CompanyRequestSummaryDto ToSummaryDto(CompanyRequest entity)
        {
            var roles = entity.Roles.OrderBy(r => r.SortOrder).ToList();
            var skillNames = roles
                .SelectMany(r => r.Skills)
                .Select(s => s.SkillName)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            return new CompanyRequestSummaryDto
            {
                Id = entity.Id,
                RequestType = entity.RequestType,
                Status = entity.Status,
                RequestStatus = entity.RequestStatus,
                Title = entity.Title,
                Category = entity.Category,
                DurationLabel = entity.DurationLabel,
                CollaborationType = CompanyRequestEnumConverters.ToWireValue(entity.CollaborationFormat) ?? string.Empty,
                RoleNames = roles.Select(r => r.RoleName).Where(n => !string.IsNullOrWhiteSpace(n)).ToList(),
                SkillNames = skillNames,
                CreatedAt = entity.CreatedAt,
                SubmittedAt = entity.SubmittedAt,
            };
        }

        private static string SingularizeUnit(string unit) =>
            unit.EndsWith('s') && unit.Length > 1 ? unit[..^1] : unit;

        private static string? NormalizeEntry(string raw)
        {
            var t = string.Join(' ', (raw ?? "").Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries));
            if (t.Length == 0 || t.Length > 80) return null;
            return t;
        }

        private static List<string> DistinctSkills(IEnumerable<string>? skills) =>
            (skills ?? Enumerable.Empty<string>())
                .Select(s => s.Trim())
                .Where(s => s.Length > 0)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

        public static string BuildActivitySubject(CompanyRequest entity)
        {
            var role = entity.Roles?
                .OrderBy(r => r.SortOrder)
                .Select(r => r.RoleName?.Trim())
                .FirstOrDefault(n => !string.IsNullOrWhiteSpace(n));

            if (!string.IsNullOrWhiteSpace(role))
                return role!;

            return string.IsNullOrWhiteSpace(entity.Title) ? "Project request" : entity.Title.Trim();
        }

        public sealed class RoleDraft
        {
            public string? ClientRoleKey { get; set; }
            public int SortOrder { get; set; }
            public string RoleName { get; set; } = string.Empty;
            public string? Notes { get; set; }
            public List<string> Skills { get; set; } = new();
        }
    }
}
