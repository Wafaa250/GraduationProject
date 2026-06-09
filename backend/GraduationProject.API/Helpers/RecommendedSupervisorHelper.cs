using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using GraduationProject.API.DTOs;

namespace GraduationProject.API.Helpers
{
    public static class RecommendedSupervisorHelper
    {
        /// <summary>
        /// Scores doctors by how many normalized project skills are contained in doctor.Specialization.
        /// matchScore = round((matched / totalSkills) * 100); 0 when there are no usable skills.
        /// </summary>
        public static List<RecommendedSupervisorDto> Build(
            IEnumerable<(int Id, int UserId, string Name, string? Specialization)> doctors,
            string? requiredSkillsJson)
        {
            var skills = ParseNormalizedProjectSkills(requiredSkillsJson);
            var total = skills.Count;
            var results = new List<RecommendedSupervisorDto>();

            foreach (var d in doctors)
            {
                if (!IsValidDoctorIdentity(d.Id, d.UserId, d.Name))
                    continue;

                var spec = (d.Specialization ?? string.Empty).Trim();
                var specLower = spec.ToLowerInvariant();
                var matched = 0;
                if (total > 0 && specLower.Length > 0)
                {
                    foreach (var skill in skills)
                    {
                        if (specLower.Contains(skill))
                            matched++;
                    }
                }

                var matchScore = total == 0 ? 0 : (int)Math.Round((double)matched / total * 100);

                results.Add(new RecommendedSupervisorDto
                {
                    DoctorId = d.Id,
                    UserId = d.UserId,
                    Name = d.Name.Trim(),
                    Specialization = spec,
                    MatchScore = matchScore,
                    Reason = BuildSkillMatchReason(matched, total, d.Name.Trim()),
                });
            }

            return results
                .Where(IsPublishable)
                .OrderByDescending(x => x.MatchScore)
                .ThenBy(x => x.Name, StringComparer.OrdinalIgnoreCase)
                .ToList();
        }

        public static bool IsValidDoctorIdentity(int doctorId, int userId, string? name)
        {
            if (doctorId <= 0 || userId <= 0)
                return false;

            var trimmed = name?.Trim() ?? string.Empty;
            if (string.IsNullOrWhiteSpace(trimmed))
                return false;

            if (trimmed.StartsWith("Doctor #", StringComparison.OrdinalIgnoreCase))
                return false;

            if (string.Equals(trimmed, "Unknown Doctor", StringComparison.OrdinalIgnoreCase))
                return false;

            return true;
        }

        public static bool IsPublishable(RecommendedSupervisorDto dto) =>
            dto.DoctorId > 0
            && dto.UserId > 0
            && IsValidDoctorIdentity(dto.DoctorId, dto.UserId, dto.Name)
            && !string.IsNullOrWhiteSpace(dto.Reason);

        public static RecommendedSupervisorDto MapMatchedDoctor(
            MatchedDoctorCandidate candidate,
            string? requiredSkillsJson)
        {
            var doctor = candidate.Doctor;
            var name = doctor.User!.Name.Trim();
            var specialization = candidate.DisplaySpecialization;
            var skills = ParseNormalizedProjectSkills(requiredSkillsJson);
            var total = skills.Count;
            var specLower = specialization.ToLowerInvariant();
            var matched = 0;

            if (total > 0 && specLower.Length > 0)
            {
                foreach (var skill in skills)
                {
                    if (specLower.Contains(skill))
                        matched++;
                }

                if (matched == 0 && !string.IsNullOrWhiteSpace(doctor.TechnicalSkills))
                {
                    var techLower = doctor.TechnicalSkills.ToLowerInvariant();
                    matched = skills.Count(skill => techLower.Contains(skill));
                }
            }

            var matchScore = total == 0 ? 50 : (int)Math.Round((double)matched / total * 100);

            return new RecommendedSupervisorDto
            {
                DoctorId = doctor.Id,
                UserId = doctor.UserId,
                Name = name,
                Specialization = specialization,
                MatchScore = matchScore,
                Reason = BuildSkillMatchReason(matched, total, name),
            };
        }

        public static string BuildSkillMatchReason(int matchedSkills, int totalSkills, string doctorName)
        {
            if (totalSkills <= 0)
            {
                return $"{doctorName} is available in your department for graduation project supervision.";
            }

            if (matchedSkills <= 0)
            {
                return $"{doctorName}'s specialization is in your department; review alignment with your project's required skills.";
            }

            if (matchedSkills >= totalSkills)
            {
                return $"{doctorName}'s specialization covers all {totalSkills} required project skill(s).";
            }

            return $"{doctorName}'s specialization aligns with {matchedSkills} of {totalSkills} required project skill(s).";
        }

        private static List<string> ParseNormalizedProjectSkills(string? json)
        {
            if (string.IsNullOrWhiteSpace(json))
                return new List<string>();

            List<string>? list;
            try
            {
                list = JsonSerializer.Deserialize<List<string>>(json);
            }
            catch
            {
                return new List<string>();
            }

            if (list == null)
                return new List<string>();

            return list
                .Where(s => !string.IsNullOrWhiteSpace(s))
                .Select(s => s.Trim().ToLowerInvariant())
                .ToList();
        }
    }
}
