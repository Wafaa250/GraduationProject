using System;

namespace GraduationProject.API.Models
{
    /// <summary>Matches frontend DurationUnit (companyRequestCatalog).</summary>
    public enum DurationUnit
    {
        Days,
        Weeks,
        Months,
        Semesters,
        Years,
    }

    /// <summary>Matches frontend collaboration format values.</summary>
    public enum CollaborationFormat
    {
        Remote,
        Hybrid,
        OnSite,
        Flexible,
    }

    public static class CompanyRequestEnumConverters
    {
        public static DurationUnit? TryParseDurationUnit(string? value)
        {
            if (string.IsNullOrWhiteSpace(value)) return null;
            return Enum.TryParse<DurationUnit>(value.Trim(), ignoreCase: false, out var parsed)
                ? parsed
                : null;
        }

        public static string? ToWireValue(DurationUnit? unit) =>
            unit.HasValue ? unit.Value.ToString() : null;

        public static CollaborationFormat? TryParseCollaborationFormat(string? value)
        {
            if (string.IsNullOrWhiteSpace(value)) return null;
            var v = value.Trim().ToLowerInvariant();
            return v switch
            {
                "remote" => CollaborationFormat.Remote,
                "hybrid" => CollaborationFormat.Hybrid,
                "on-site" => CollaborationFormat.OnSite,
                "flexible" => CollaborationFormat.Flexible,
                _ => null,
            };
        }

        public static string ToWireValue(CollaborationFormat format) =>
            format switch
            {
                CollaborationFormat.Remote => "remote",
                CollaborationFormat.Hybrid => "hybrid",
                CollaborationFormat.OnSite => "on-site",
                CollaborationFormat.Flexible => "flexible",
                _ => throw new ArgumentOutOfRangeException(nameof(format), format, null),
            };

        public static string? ToWireValue(CollaborationFormat? format) =>
            format.HasValue ? ToWireValue(format.Value) : null;
    }
}
