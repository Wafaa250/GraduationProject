using System;
using System.Collections.Generic;
using System.Linq;

namespace GraduationProject.API.Helpers
{
    /// <summary>
    /// Faculty/major-aware graduation project types (GP1, GP2, GP) and display labels.
    /// </summary>
    public static class GraduationProjectTypeHelper
    {
        public const string GP1 = "GP1";
        public const string GP2 = "GP2";
        public const string GP = "GP";

        public enum GraduationTrack
        {
            General,
            Engineering,
            ComputerEngineering,
        }

        public static GraduationTrack ResolveTrack(string? faculty, string? major)
        {
            if (!IsEngineeringFaculty(faculty))
                return GraduationTrack.General;

            if (IsComputerEngineeringMajor(major))
                return GraduationTrack.ComputerEngineering;

            return GraduationTrack.Engineering;
        }

        /// <summary>
        /// Any faculty whose name includes "Engineering" (e.g. Civil Engineering, Engineering &amp; IT).
        /// Standalone "Information Technology" is excluded because it does not contain Engineering.
        /// </summary>
        public static bool IsEngineeringFaculty(string? faculty)
        {
            if (string.IsNullOrWhiteSpace(faculty))
                return false;

            return faculty.Trim().Contains("Engineering", StringComparison.OrdinalIgnoreCase);
        }

        public static bool IsComputerEngineeringMajor(string? majorOrDepartment)
        {
            if (string.IsNullOrWhiteSpace(majorOrDepartment))
                return false;

            var value = majorOrDepartment.Trim();
            return string.Equals(value, "Computer Engineering", StringComparison.OrdinalIgnoreCase)
                || value.Contains("Computer Engineering", StringComparison.OrdinalIgnoreCase);
        }

        public static string NormalizeProjectType(string? projectType)
        {
            var t = (projectType ?? GP).Trim().ToUpperInvariant();
            return t is GP1 or GP2 ? t : GP;
        }

        public static IReadOnlyList<string> GetAllowedProjectTypes(string? faculty, string? major)
        {
            return ResolveTrack(faculty, major) == GraduationTrack.General
                ? new[] { GP }
                : new[] { GP1, GP2 };
        }

        public static bool TryResolveProjectType(
            string? faculty,
            string? major,
            string? requestedType,
            out string resolved,
            out string? error)
        {
            resolved = GP;
            error = null;

            var track = ResolveTrack(faculty, major);
            if (track == GraduationTrack.General)
            {
                resolved = GP;
                return true;
            }

            var requested = NormalizeProjectType(requestedType);
            if (requested is GP1 or GP2)
            {
                resolved = requested;
                return true;
            }

            error = "Invalid project type. Engineering students must choose Graduation Project 1 or Graduation Project 2.";
            return false;
        }

        public static bool IsProjectVisibleToStudent(
            string? projectType,
            string? ownerFaculty,
            string? ownerMajor,
            string? viewerFaculty,
            string? viewerMajor)
        {
            var type = NormalizeProjectType(projectType);
            var ownerTrack = ResolveTrack(ownerFaculty, ownerMajor);
            var viewerTrack = ResolveTrack(viewerFaculty, viewerMajor);

            if (viewerTrack == GraduationTrack.General)
                return type == GP && ownerTrack == GraduationTrack.General;

            return (type is GP1 or GP2) && ownerTrack != GraduationTrack.General;
        }

        /// <summary>
        /// Canonical resolver: faculty + major + course type (GP1/GP2/GP) → display label.
        /// </summary>
        public static string ResolveGraduationProjectLabel(
            string? faculty,
            string? major,
            string? courseType) =>
            GetDisplayLabel(courseType, faculty, major);

        public static string GetDisplayLabel(string? projectType, string? faculty, string? major)
        {
            var type = NormalizeProjectType(projectType);
            return ResolveTrack(faculty, major) switch
            {
                GraduationTrack.ComputerEngineering => type switch
                {
                    GP1 => "Graduation Project 1 (Software)",
                    GP2 => "Graduation Project 2 (Hardware)",
                    _ => "Graduation Project",
                },
                GraduationTrack.Engineering => type switch
                {
                    GP1 => "Graduation Project 1",
                    GP2 => "Graduation Project 2",
                    _ => "Graduation Project",
                },
                _ => "Graduation Project",
            };
        }

        public static string GetShortLabel(string? projectType, string? faculty, string? major)
        {
            var type = NormalizeProjectType(projectType);
            return ResolveTrack(faculty, major) switch
            {
                GraduationTrack.ComputerEngineering => type switch
                {
                    GP1 => "GP1 Software",
                    GP2 => "GP2 Hardware",
                    _ => "Graduation Project",
                },
                GraduationTrack.Engineering => type switch
                {
                    GP1 => "Graduation Project 1",
                    GP2 => "Graduation Project 2",
                    _ => "Graduation Project",
                },
                _ => "Graduation Project",
            };
        }

        public static string MapProjectStage(string? projectType, string? faculty, string? major) =>
            GetShortLabel(projectType, faculty, major);

        public static IEnumerable<(string Type, string Label, string Description)> GetTypeOptions(
            string? faculty,
            string? major)
        {
            var track = ResolveTrack(faculty, major);
            if (track == GraduationTrack.General)
            {
                yield return (
                    GP,
                    GetDisplayLabel(GP, faculty, major),
                    "Single graduation project track for your faculty.");
                yield break;
            }

            yield return (
                GP1,
                GetDisplayLabel(GP1, faculty, major),
                track == GraduationTrack.ComputerEngineering
                    ? "Software-focused graduation project — design, development, and implementation."
                    : "Foundational stage — research, scoping, and proposal.");

            yield return (
                GP2,
                GetDisplayLabel(GP2, faculty, major),
                track == GraduationTrack.ComputerEngineering
                    ? "Hardware-focused graduation project — systems, embedded, and physical design."
                    : "Implementation stage — building and delivering the project.");
        }
    }
}
