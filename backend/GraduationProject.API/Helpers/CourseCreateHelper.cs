using System.Text.RegularExpressions;
using GraduationProject.API.DTOs;

namespace GraduationProject.API.Helpers
{
    public static class CourseCreateHelper
    {
        private static readonly Regex AcademicYearPattern = new(
            @"^(\d{4})\s/\s(\d{4})$",
            RegexOptions.Compiled);

        public static string NormalizeTeamFormationStrategy(string? value) =>
            string.Equals(value?.Trim(), "student", StringComparison.OrdinalIgnoreCase)
                ? "student"
                : "doctor";

        public static bool TryParseAcademicYear(string? value, out int startYear)
        {
            startYear = 0;
            if (string.IsNullOrWhiteSpace(value))
                return false;

            var match = AcademicYearPattern.Match(value.Trim());
            if (!match.Success)
                return false;

            if (!int.TryParse(match.Groups[1].Value, out startYear))
                return false;

            if (!int.TryParse(match.Groups[2].Value, out var endYear))
                return false;

            return endYear == startYear + 1;
        }

        public static string? ValidateCreateDto(CreateCourseDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name))
                return "Course name is required.";
            if (string.IsNullOrWhiteSpace(dto.Code))
                return "Course code is required.";
            if (string.IsNullOrWhiteSpace(dto.Semester))
                return "Semester is required.";
            if (string.IsNullOrWhiteSpace(dto.AcademicYear))
                return "Academic year is required.";

            if (!TryParseAcademicYear(dto.AcademicYear, out _))
                return "Academic year must be in the format YYYY / YYYY (e.g. 2025 / 2026).";

            var strategy = NormalizeTeamFormationStrategy(dto.DefaultTeamFormationStrategy);
            if (strategy == "doctor" && !dto.AllowAiTeamSuggestions)
                return "Enable AI team suggestions when the default strategy is AI generated teams.";

            if (strategy == "doctor" && !dto.AllowTeamFormation)
                return "Enable team formation when the default strategy is AI generated teams.";

            if (dto.AllowAiTeamSuggestions && !dto.AllowTeamFormation)
                return "Team formation must be enabled when AI team suggestions are enabled.";

            return null;
        }
    }
}
