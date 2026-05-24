using System;
using System.Collections.Generic;
using System.Linq;
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
            string? requiredSkillsJson,
            string? technologiesJson = null)
        {
            var skills = SkillHelper
                .GetProjectMatchingSkillNames(requiredSkillsJson, technologiesJson)
                .Select(s => s.ToLowerInvariant())
                .ToList();
            var total = skills.Count;
            var results = new List<RecommendedSupervisorDto>();

            foreach (var d in doctors)
            {
                var spec = (d.Specialization ?? string.Empty).Trim().ToLowerInvariant();
                var matched = 0;
                if (total > 0 && spec.Length > 0)
                {
                    foreach (var skill in skills)
                    {
                        if (spec.Contains(skill))
                            matched++;
                    }
                }

                var matchScore = total == 0 ? 0 : (int)Math.Round((double)matched / total * 100);

                results.Add(new RecommendedSupervisorDto
                {
                    DoctorId = d.Id,
                    UserId = d.UserId,
                    Name = d.Name ?? string.Empty,
                    Specialization = d.Specialization?.Trim() ?? string.Empty,
                    MatchScore = matchScore
                });
            }

            return results
                .OrderByDescending(x => x.MatchScore)
                .ThenBy(x => x.Name, StringComparer.OrdinalIgnoreCase)
                .ToList();
        }
    }
}
