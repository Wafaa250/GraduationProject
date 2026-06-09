using System;
using System.Collections.Generic;
using System.Linq;
using GraduationProject.API.Models;

namespace GraduationProject.API.Helpers
{
    public enum SupervisorMatchTier
    {
        None = 0,
        SameDepartment = 1,
        SameMajor = 2,
        SameFaculty = 3,
        RelatedFaculty = 4,
    }

    public sealed class SupervisorRecommendationAudit
    {
        public int StudentId { get; init; }
        public string StudentFaculty { get; init; } = string.Empty;
        public string StudentDepartment { get; init; } = string.Empty;
        public string StudentMajor { get; init; } = string.Empty;
        public string ProjectStage { get; init; } = string.Empty;
        public IReadOnlyList<string> ProjectSkills { get; init; } = Array.Empty<string>();
        public IReadOnlyList<string> ProjectTechnologies { get; init; } = Array.Empty<string>();

        public int TotalDoctorsInDatabase { get; init; }
        public int ActiveDoctors { get; init; }
        public int DoctorsWithProfiles { get; init; }
        public int FacultyMatch { get; init; }
        public int DepartmentMatch { get; init; }
        public int SpecializationMatch { get; init; }
        public int RelatedFacultyMatch { get; init; }
        public int AfterProfileCompleteFilter { get; set; }
        public int AfterAiScoring { get; set; }
        public int TotalReturned { get; set; }
        public SupervisorMatchTier MatchTierUsed { get; init; }
        public IReadOnlyList<string> SampleDoctorDepartments { get; init; } = Array.Empty<string>();
        public IReadOnlyList<string> SampleDoctorFaculties { get; init; } = Array.Empty<string>();
    }

    public sealed class MatchedDoctorCandidate
    {
        public DoctorProfile Doctor { get; init; } = null!;
        public SupervisorMatchTier Tier { get; init; }
        public string DisplaySpecialization { get; init; } = string.Empty;
    }

    /// <summary>
    /// Resolves real doctor supervisor candidates for a student graduation project using
    /// department → major → faculty → related faculty fallbacks (never placeholders).
    /// </summary>
    public static class SupervisorRecommendationMatcher
    {
        private static readonly Dictionary<string, string[]> RelatedMajors = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Computer Engineering"] = new[]
            {
                "Computer Engineering", "Electrical Engineering", "Computer Science",
                "Software Engineering", "Information Technology", "Artificial Intelligence",
                "Data Science", "Cyber Security", "Network Systems", "Mechatronics Engineering",
            },
            ["Electrical Engineering"] = new[]
            {
                "Electrical Engineering", "Computer Engineering", "Communication Engineering",
                "Mechatronics Engineering", "Energy and Renewable Energy Engineering",
            },
            ["Computer Science"] = new[]
            {
                "Computer Science", "Software Engineering", "Information Technology",
                "Artificial Intelligence", "Data Science", "Cyber Security", "Network Systems",
                "Computer Engineering",
            },
            ["Software Engineering"] = new[]
            {
                "Software Engineering", "Computer Science", "Information Technology",
                "Artificial Intelligence", "Computer Engineering",
            },
            ["Information Technology"] = new[]
            {
                "Information Technology", "Computer Science", "Software Engineering",
                "Artificial Intelligence", "Data Science", "Cyber Security",
            },
            ["Artificial Intelligence"] = new[]
            {
                "Artificial Intelligence", "Computer Science", "Data Science",
                "Computer Engineering", "Software Engineering",
            },
            ["Data Science"] = new[]
            {
                "Data Science", "Artificial Intelligence", "Computer Science",
                "Statistics", "Information Technology",
            },
            ["Cyber Security"] = new[]
            {
                "Cyber Security", "Computer Science", "Information Technology",
                "Computer Engineering", "Network Systems",
            },
        };

        private static readonly HashSet<string> RelatedFacultyKeys = new(StringComparer.OrdinalIgnoreCase)
        {
            "engineering and information technology",
            "information technology",
            "faculty of engineering and information technology",
        };

        public static string NormalizeAcademicLabel(string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
                return string.Empty;

            var trimmed = value.Trim();
            if (trimmed.StartsWith("Faculty of ", StringComparison.OrdinalIgnoreCase))
                trimmed = trimmed["Faculty of ".Length..];

            return trimmed.ToLowerInvariant();
        }

        public static IReadOnlyList<string> ExpandMajorLabels(string? major)
        {
            var normalizedMajor = NormalizeAcademicLabel(major);
            if (string.IsNullOrEmpty(normalizedMajor))
                return Array.Empty<string>();

            foreach (var pair in RelatedMajors)
            {
                if (NormalizeAcademicLabel(pair.Key) == normalizedMajor)
                    return pair.Value.Select(NormalizeAcademicLabel).Distinct().ToList();
            }

            return new[] { normalizedMajor };
        }

        public static IEnumerable<string> TokenizeDepartments(string? departmentField)
        {
            if (string.IsNullOrWhiteSpace(departmentField))
                yield break;

            foreach (var part in departmentField.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
            {
                var normalized = NormalizeAcademicLabel(part);
                if (!string.IsNullOrEmpty(normalized))
                    yield return normalized;
            }
        }

        public static bool DoctorHasCompleteProfile(DoctorProfile doctor)
        {
            if (!RecommendedSupervisorHelper.IsValidDoctorIdentity(
                    doctor.Id,
                    doctor.UserId,
                    doctor.User?.Name))
                return false;

            var hasDepartment = !string.IsNullOrWhiteSpace(doctor.Department);
            var hasSpecialization = !string.IsNullOrWhiteSpace(doctor.Specialization);
            var hasFaculty = !string.IsNullOrWhiteSpace(doctor.Faculty);

            return hasDepartment || hasSpecialization || hasFaculty;
        }

        public static string ResolveDisplaySpecialization(DoctorProfile doctor)
        {
            var specialization = doctor.Specialization?.Trim();
            if (!string.IsNullOrWhiteSpace(specialization))
                return specialization;

            var department = doctor.Department?.Trim();
            if (!string.IsNullOrWhiteSpace(department))
                return department.Split(',')[0].Trim();

            return doctor.Faculty?.Trim() ?? string.Empty;
        }

        public static SupervisorMatchTier ClassifyDoctor(
            DoctorProfile doctor,
            string studentMajor,
            string studentFaculty,
            IReadOnlyList<string> expandedMajors)
        {
            var doctorDepartments = TokenizeDepartments(doctor.Department).ToList();
            var doctorSpecialization = NormalizeAcademicLabel(doctor.Specialization);
            var doctorFaculty = NormalizeAcademicLabel(doctor.Faculty);
            var studentMajorNorm = NormalizeAcademicLabel(studentMajor);
            var studentFacultyNorm = NormalizeAcademicLabel(studentFaculty);

            if (!string.IsNullOrEmpty(studentMajorNorm))
            {
                if (doctorDepartments.Any(d => d == studentMajorNorm || d.Contains(studentMajorNorm) || studentMajorNorm.Contains(d)))
                    return SupervisorMatchTier.SameDepartment;

                if (!string.IsNullOrEmpty(doctorSpecialization) &&
                    (doctorSpecialization == studentMajorNorm ||
                     doctorSpecialization.Contains(studentMajorNorm) ||
                     studentMajorNorm.Contains(doctorSpecialization)))
                    return SupervisorMatchTier.SameDepartment;
            }

            if (expandedMajors.Count > 0)
            {
                var relatedDepartmentHit = doctorDepartments.Any(d =>
                    expandedMajors.Any(m => d == m || d.Contains(m) || m.Contains(d)));
                var relatedSpecHit = !string.IsNullOrEmpty(doctorSpecialization) &&
                    expandedMajors.Any(m =>
                        doctorSpecialization == m ||
                        doctorSpecialization.Contains(m) ||
                        m.Contains(doctorSpecialization));

                if (relatedDepartmentHit || relatedSpecHit)
                    return SupervisorMatchTier.SameMajor;
            }

            if (!string.IsNullOrEmpty(studentFacultyNorm) && !string.IsNullOrEmpty(doctorFaculty))
            {
                if (doctorFaculty == studentFacultyNorm ||
                    doctorFaculty.Contains(studentFacultyNorm) ||
                    studentFacultyNorm.Contains(doctorFaculty))
                    return SupervisorMatchTier.SameFaculty;
            }

            if (!string.IsNullOrEmpty(studentFacultyNorm) &&
                RelatedFacultyKeys.Contains(studentFacultyNorm) &&
                RelatedFacultyKeys.Contains(doctorFaculty))
                return SupervisorMatchTier.RelatedFaculty;

            return SupervisorMatchTier.None;
        }

        public static (List<MatchedDoctorCandidate> Candidates, SupervisorRecommendationAudit Audit) Match(
            StudentProfile student,
            StudentProject project,
            IReadOnlyList<DoctorProfile> allDoctors,
            IReadOnlyList<string> projectSkillNames)
        {
            var studentMajor = student.Major?.Trim() ?? string.Empty;
            var studentFaculty = student.Faculty?.Trim() ?? string.Empty;
            var expandedMajors = ExpandMajorLabels(studentMajor);

            var activeDoctors = allDoctors.Where(d => d.AvailableForSupervision).ToList();
            var profileComplete = allDoctors.Where(DoctorHasCompleteProfile).ToList();
            var availableComplete = profileComplete.Where(d => d.AvailableForSupervision).ToList();
            var candidatePool = availableComplete.Count > 0 ? availableComplete : profileComplete;

            var facultyMatches = profileComplete
                .Where(d => !string.IsNullOrEmpty(NormalizeAcademicLabel(d.Faculty)) &&
                            !string.IsNullOrEmpty(NormalizeAcademicLabel(studentFaculty)) &&
                            (NormalizeAcademicLabel(d.Faculty!).Contains(NormalizeAcademicLabel(studentFaculty)) ||
                             NormalizeAcademicLabel(studentFaculty).Contains(NormalizeAcademicLabel(d.Faculty!))))
                .ToList();

            var departmentMatches = profileComplete
                .Where(d => ClassifyDoctor(d, studentMajor, studentFaculty, expandedMajors) == SupervisorMatchTier.SameDepartment)
                .ToList();

            var specializationMatches = profileComplete
                .Where(d => ClassifyDoctor(d, studentMajor, studentFaculty, expandedMajors) == SupervisorMatchTier.SameMajor)
                .ToList();

            var relatedFacultyMatches = profileComplete
                .Where(d =>
                {
                    var tier = ClassifyDoctor(d, studentMajor, studentFaculty, expandedMajors);
                    return tier == SupervisorMatchTier.RelatedFaculty || tier == SupervisorMatchTier.SameFaculty;
                })
                .ToList();

            var tierOrder = new[]
            {
                SupervisorMatchTier.SameDepartment,
                SupervisorMatchTier.SameMajor,
                SupervisorMatchTier.SameFaculty,
                SupervisorMatchTier.RelatedFaculty,
            };

            SupervisorMatchTier tierUsed = SupervisorMatchTier.None;
            List<MatchedDoctorCandidate> selected = new();

            foreach (var tier in tierOrder)
            {
                selected = candidatePool
                    .Select(d => new { Doctor = d, Tier = ClassifyDoctor(d, studentMajor, studentFaculty, expandedMajors) })
                    .Where(x => x.Tier == tier)
                    .Select(x => new MatchedDoctorCandidate
                    {
                        Doctor = x.Doctor,
                        Tier = x.Tier,
                        DisplaySpecialization = ResolveDisplaySpecialization(x.Doctor),
                    })
                    .ToList();

                if (selected.Count > 0)
                {
                    tierUsed = tier;
                    break;
                }
            }

            var audit = new SupervisorRecommendationAudit
            {
                StudentId = student.Id,
                StudentFaculty = studentFaculty,
                StudentDepartment = studentMajor,
                StudentMajor = studentMajor,
                ProjectStage = project.ProjectType ?? string.Empty,
                ProjectSkills = projectSkillNames,
                ProjectTechnologies = projectSkillNames,
                TotalDoctorsInDatabase = allDoctors.Count,
                ActiveDoctors = activeDoctors.Count,
                DoctorsWithProfiles = profileComplete.Count,
                FacultyMatch = facultyMatches.Count,
                DepartmentMatch = departmentMatches.Count,
                SpecializationMatch = specializationMatches.Count,
                RelatedFacultyMatch = relatedFacultyMatches.Count,
                AfterProfileCompleteFilter = selected.Count,
                AfterAiScoring = 0,
                TotalReturned = 0,
                MatchTierUsed = tierUsed,
                SampleDoctorDepartments = allDoctors
                    .Select(d => d.Department?.Trim() ?? "")
                    .Where(d => !string.IsNullOrEmpty(d))
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .Take(12)
                    .ToList(),
                SampleDoctorFaculties = allDoctors
                    .Select(d => d.Faculty?.Trim() ?? "")
                    .Where(d => !string.IsNullOrEmpty(d))
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .Take(8)
                    .ToList(),
            };

            return (selected, audit);
        }
    }
}
