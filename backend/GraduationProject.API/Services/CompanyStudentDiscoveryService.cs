using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using GraduationProject.API.Data;
using GraduationProject.API.DTOs;
using GraduationProject.API.Helpers;
using GraduationProject.API.Models;
using GraduationProject.API.Services.Recommendations;
using Microsoft.EntityFrameworkCore;

namespace GraduationProject.API.Services
{
    public class CompanyStudentDiscoveryService : ICompanyStudentDiscoveryService
    {
        private readonly ApplicationDbContext _db;

        public CompanyStudentDiscoveryService(ApplicationDbContext db)
        {
            _db = db;
        }

        public async Task<CompanyStudentDiscoveryProfileDto?> GetStudentProfileAsync(
            int companyProfileId,
            int requestId,
            int studentProfileId,
            int? teamRecommendationId = null)
        {
            var request = await _db.CompanyRequests
                .AsNoTracking()
                .Include(r => r.Roles)
                .ThenInclude(role => role.Skills)
                .FirstOrDefaultAsync(r => r.Id == requestId && r.CompanyProfileId == companyProfileId);

            if (request == null) return null;

            var student = await _db.StudentProfiles
                .AsNoTracking()
                .Include(s => s.User)
                .FirstOrDefaultAsync(s => s.Id == studentProfileId);

            if (student == null) return null;

            var roles = await SkillHelper.IdsJsonToNames(_db, student.Roles);
            var technicalSkills = await SkillHelper.IdsJsonToNames(_db, student.TechnicalSkills);
            var tools = await SkillHelper.IdsJsonToNames(_db, student.Tools);
            var contact = StudentDiscoveryContactMapper.Map(student);

            var requestSkillNames = request.Roles
                .SelectMany(r => r.Skills)
                .Select(s => s.SkillName)
                .Where(n => !string.IsNullOrWhiteSpace(n))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            var studentSkillSet = new HashSet<string>(
                roles.Concat(technicalSkills).Concat(tools),
                StringComparer.OrdinalIgnoreCase);

            var relevantSkills = requestSkillNames
                .Where(s => studentSkillSet.Contains(s))
                .ToList();

            var recommendation = await ResolveRecommendationContextAsync(
                requestId,
                companyProfileId,
                studentProfileId,
                teamRecommendationId,
                relevantSkills);

            var projects = await LoadStudentProjectsAsync(studentProfileId);

            return new CompanyStudentDiscoveryProfileDto
            {
                Student = new CompanyStudentDiscoveryStudentDto
                {
                    StudentProfileId = student.Id,
                    UserId = student.UserId,
                    Name = student.User?.Name ?? string.Empty,
                    Email = contact.Email,
                    Bio = student.Bio,
                    University = student.University,
                    Faculty = student.Faculty,
                    Major = student.Major,
                    AcademicYear = student.AcademicYear,
                    Availability = student.Availability,
                    LookingFor = student.LookingFor,
                    Linkedin = contact.Linkedin,
                    Github = contact.Github,
                    Portfolio = contact.Portfolio,
                    Languages = SkillHelper.ParseStringList(student.Languages),
                    Roles = roles,
                    TechnicalSkills = technicalSkills,
                    Tools = tools,
                    ProfilePictureBase64 = student.ProfilePictureBase64,
                },
                Request = new CompanyStudentDiscoveryRequestDto
                {
                    Id = request.Id,
                    Title = request.Title,
                    RoleNames = request.Roles
                        .Select(r => r.RoleName)
                        .Where(n => !string.IsNullOrWhiteSpace(n))
                        .ToList(),
                    RequiredSkills = requestSkillNames,
                },
                Recommendation = recommendation,
                Projects = projects,
            };
        }

        private async Task<CompanyStudentDiscoveryRecommendationDto?> ResolveRecommendationContextAsync(
            int requestId,
            int companyProfileId,
            int studentProfileId,
            int? teamRecommendationId,
            List<string> relevantSkills)
        {
            if (teamRecommendationId.HasValue)
            {
                var teamContext = await ResolveTeamMemberContextAsync(
                    requestId,
                    companyProfileId,
                    studentProfileId,
                    teamRecommendationId.Value,
                    relevantSkills);
                if (teamContext != null) return teamContext;
            }

            var individual = await _db.CompanyRequestRecommendations
                .AsNoTracking()
                .Where(r =>
                    r.CompanyRequestId == requestId &&
                    r.StudentProfileId == studentProfileId)
                .OrderByDescending(r => r.RunId)
                .ThenBy(r => r.Rank)
                .FirstOrDefaultAsync();

            if (individual != null)
            {
                var breakdown = ParseBreakdown(individual.ScoreBreakdownJson);
                var highlights = SkillHelper.ParseStringList(individual.HighlightsJson);
                return new CompanyStudentDiscoveryRecommendationDto
                {
                    Source = "individual",
                    MatchScore = individual.Score,
                    ReasonSummary = individual.ReasonSummary,
                    Highlights = highlights,
                    Strengths = highlights,
                    Gaps = new List<string>(),
                    RelevantSkills = relevantSkills,
                    ScoreBreakdown = breakdown,
                    Rank = individual.Rank,
                };
            }

            return await ResolveTeamMemberContextAsync(
                requestId,
                companyProfileId,
                studentProfileId,
                teamRecommendationId,
                relevantSkills);
        }

        private async Task<CompanyStudentDiscoveryRecommendationDto?> ResolveTeamMemberContextAsync(
            int requestId,
            int companyProfileId,
            int studentProfileId,
            int? teamRecommendationId,
            List<string> relevantSkills)
        {
            var teamQuery = _db.CompanyRequestTeamRecommendationMembers
                .AsNoTracking()
                .Where(m =>
                    m.StudentProfileId == studentProfileId &&
                    m.TeamRecommendation!.CompanyRequestId == requestId &&
                    m.TeamRecommendation!.Run!.CompanyProfileId == companyProfileId);

            if (teamRecommendationId.HasValue)
            {
                teamQuery = teamQuery.Where(m => m.TeamRecommendationId == teamRecommendationId.Value);
            }

            var member = await teamQuery
                .Include(m => m.TeamRecommendation)
                .Include(m => m.CompanyRequestRole)
                .OrderByDescending(m => m.TeamRecommendation!.RunId)
                .ThenBy(m => m.TeamRecommendation!.TeamRank)
                .FirstOrDefaultAsync();

            if (member?.TeamRecommendation == null) return null;

            var team = member.TeamRecommendation;
            var highlights = SkillHelper.ParseStringList(member.HighlightsJson);
            var strengths = SkillHelper.ParseStringList(team.StrengthsJson);
            var gaps = SkillHelper.ParseStringList(team.RisksJson);

            return new CompanyStudentDiscoveryRecommendationDto
            {
                Source = "team",
                MatchScore = member.RoleScore,
                ReasonSummary = string.IsNullOrWhiteSpace(member.AssignmentReason)
                    ? team.SummaryReason
                    : member.AssignmentReason,
                Highlights = highlights,
                Strengths = strengths.Count > 0 ? strengths : highlights,
                Gaps = gaps,
                AlignedRoleName = member.CompanyRequestRole?.RoleName,
                RelevantSkills = relevantSkills,
                TeamRecommendationId = team.Id,
                Rank = team.TeamRank,
            };
        }

        private async Task<List<CompanyStudentDiscoveryProjectDto>> LoadStudentProjectsAsync(int studentProfileId)
        {
            var owned = await _db.StudentProjects
                .AsNoTracking()
                .Where(p => p.OwnerId == studentProfileId)
                .ToListAsync();

            var memberProjectIds = await _db.StudentProjectMembers
                .AsNoTracking()
                .Where(m => m.StudentId == studentProfileId)
                .Select(m => m.ProjectId)
                .ToListAsync();

            var memberProjects = memberProjectIds.Count == 0
                ? new List<StudentProject>()
                : await _db.StudentProjects
                    .AsNoTracking()
                    .Where(p => memberProjectIds.Contains(p.Id) && p.OwnerId != studentProfileId)
                    .ToListAsync();

            var all = owned
                .Select(p => MapProject(p, p.OwnerId == studentProfileId ? "Project lead" : "Member"))
                .Concat(memberProjects.Select(p => MapProject(p, "Team member")))
                .OrderByDescending(p => p.UpdatedAt)
                .ToList();

            return all;
        }

        private static CompanyStudentDiscoveryProjectDto MapProject(StudentProject project, string teamRole)
        {
            return new CompanyStudentDiscoveryProjectDto
            {
                Id = project.Id,
                Title = project.Name,
                Description = project.Abstract,
                Technologies = SkillHelper.ParseStringList(project.RequiredSkills),
                TeamRole = teamRole,
                ProjectType = project.ProjectType,
                CreatedAt = project.CreatedAt,
                UpdatedAt = project.UpdatedAt,
            };
        }

        private static CompanyRequestRecommendationScoreBreakdownDto? ParseBreakdown(string? json)
        {
            if (string.IsNullOrWhiteSpace(json)) return null;
            try
            {
                return JsonSerializer.Deserialize<CompanyRequestRecommendationScoreBreakdownDto>(
                    json,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            }
            catch
            {
                return null;
            }
        }
    }
}
