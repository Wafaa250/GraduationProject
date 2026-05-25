using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using GraduationProject.API.DTOs;
using GraduationProject.API.Models;

namespace GraduationProject.API.Helpers
{
    public static class DoctorSupervisorRequestMapper
    {
        public static List<string> DeserializeStringList(string? json)
        {
            if (string.IsNullOrWhiteSpace(json))
                return new List<string>();
            try
            {
                return JsonSerializer.Deserialize<List<string>>(json) ?? new List<string>();
            }
            catch
            {
                return new List<string>();
            }
        }

        public static string BuildRequestCode(int requestId) => $"REQ-{requestId:D5}";

        public static string MapProjectStage(string? projectType)
        {
            return (projectType ?? "GP").Trim().ToUpperInvariant() switch
            {
                "GP1" => "GP1",
                "GP2" => "GP2",
                _ => "Graduation Project",
            };
        }

        public static string InitialsFromName(string? name)
        {
            if (string.IsNullOrWhiteSpace(name))
                return "?";
            var parts = name.Split(' ', StringSplitOptions.RemoveEmptyEntries);
            return string.Concat(parts.Take(2).Select(p => char.ToUpperInvariant(p[0])));
        }

        public static DoctorSupervisorAiCompatibilityDto ComputeAiCompatibility(
            string? doctorSpecialization,
            string? requiredSkillsJson,
            string? technologiesJson)
        {
            var skills = SkillHelper.GetProjectMatchingSkillNames(requiredSkillsJson, technologiesJson);
            var spec = (doctorSpecialization ?? string.Empty).Trim().ToLowerInvariant();
            var matches = new List<string>();

            if (skills.Count > 0 && spec.Length > 0)
            {
                foreach (var skill in skills)
                {
                    var normalized = skill.ToLowerInvariant();
                    if (spec.Contains(normalized))
                        matches.Add(skill);
                }
            }

            var total = skills.Count;
            var score = total == 0 ? 0 : (int)Math.Round((double)matches.Count / total * 100);

            return new DoctorSupervisorAiCompatibilityDto
            {
                Score = score,
                Matches = matches,
            };
        }

        public static List<DoctorSupervisorRequestHistoryItemDto> BuildHistory(
            string status,
            DateTime createdAt,
            DateTime? respondedAt)
        {
            var history = new List<DoctorSupervisorRequestHistoryItemDto>
            {
                new()
                {
                    Event = "Supervision request submitted",
                    At = createdAt,
                },
            };

            if (respondedAt.HasValue)
            {
                var label = status switch
                {
                    "accepted" => "Supervision accepted",
                    "rejected" => "Request rejected",
                    _ => "Request updated",
                };
                history.Add(new DoctorSupervisorRequestHistoryItemDto
                {
                    Event = label,
                    At = respondedAt.Value,
                });
            }

            return history;
        }

        public static DoctorSupervisorRequestListItemDto MapListItem(
            SupervisorRequest request,
            DoctorProfile doctor)
        {
            var project = request.Project;
            var skills = DeserializeStringList(project?.RequiredSkills);
            var technologies = DeserializeStringList(project?.Technologies);
            var preferredRoles = DeserializeStringList(project?.PreferredRoles);
            var sender = request.Sender;
            var owner = project?.Owner;

            var members = (project?.Members ?? Enumerable.Empty<StudentProjectMember>())
                .OrderBy(m => m.Role == "leader" ? 0 : 1)
                .ThenBy(m => m.Student?.User?.Name ?? "")
                .Select(m => new DoctorSupervisorRequestMemberDto
                {
                    StudentId = m.StudentId,
                    Name = m.Student?.User?.Name ?? "",
                    Role = m.Role,
                    Major = m.Student?.Major ?? "",
                    AcademicYear = m.Student?.AcademicYear ?? "",
                    Initials = InitialsFromName(m.Student?.User?.Name),
                })
                .ToList();

            var faculty = sender?.Faculty?.Trim();
            if (string.IsNullOrEmpty(faculty))
                faculty = owner?.Faculty?.Trim();

            return new DoctorSupervisorRequestListItemDto
            {
                RequestId = request.Id,
                RequestCode = BuildRequestCode(request.Id),
                Project = new DoctorSupervisorRequestProjectDto
                {
                    ProjectId = request.ProjectId,
                    Name = project?.Name ?? "",
                    Description = project?.Abstract,
                    RequiredSkills = skills,
                    Technologies = technologies,
                    PreferredRoles = preferredRoles,
                    ProjectType = project?.ProjectType ?? "GP",
                    Stage = MapProjectStage(project?.ProjectType),
                    PartnersCount = project?.PartnersCount ?? 0,
                    MemberCount = project?.Members?.Count ?? 0,
                    Faculty = string.IsNullOrWhiteSpace(faculty) ? null : faculty,
                    Department = string.IsNullOrWhiteSpace(sender?.Major) ? null : sender!.Major!.Trim(),
                    Members = members,
                },
                Sender = new DoctorSupervisorRequestSenderDto
                {
                    StudentId = request.SenderId,
                    UserId = sender?.UserId ?? 0,
                    Name = sender?.User?.Name ?? "",
                    Major = sender?.Major ?? "",
                    University = sender?.University ?? "",
                    Faculty = sender?.Faculty ?? "",
                    AcademicYear = sender?.AcademicYear ?? "",
                    Gpa = sender?.Gpa,
                    Initials = InitialsFromName(sender?.User?.Name),
                },
                Status = request.Status,
                CreatedAt = request.CreatedAt,
                RespondedAt = request.RespondedAt,
                DoctorResponseNote = request.DoctorResponseNote,
                AiCompatibility = ComputeAiCompatibility(
                    doctor.Specialization,
                    project?.RequiredSkills,
                    project?.Technologies),
                History = BuildHistory(request.Status, request.CreatedAt, request.RespondedAt),
            };
        }
    }
}
