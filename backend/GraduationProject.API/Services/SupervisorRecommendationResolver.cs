using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using GraduationProject.API.Data;
using GraduationProject.API.Helpers;
using GraduationProject.API.Models;

namespace GraduationProject.API.Services
{
    public interface ISupervisorRecommendationResolver
    {
        Task<(List<MatchedDoctorCandidate> Candidates, SupervisorRecommendationAudit Audit)> ResolveAsync(
            StudentProfile student,
            StudentProject project,
            CancellationToken ct = default);
    }

    public sealed class SupervisorRecommendationResolver : ISupervisorRecommendationResolver
    {
        private readonly ApplicationDbContext _db;
        private readonly ILogger<SupervisorRecommendationResolver> _logger;

        public SupervisorRecommendationResolver(
            ApplicationDbContext db,
            ILogger<SupervisorRecommendationResolver> logger)
        {
            _db = db;
            _logger = logger;
        }

        public async Task<(List<MatchedDoctorCandidate> Candidates, SupervisorRecommendationAudit Audit)> ResolveAsync(
            StudentProfile student,
            StudentProject project,
            CancellationToken ct = default)
        {
            var projectSkillNames = SkillHelper.ParseStringList(project.RequiredSkills)
                .Where(s => !string.IsNullOrWhiteSpace(s))
                .Select(s => s.Trim())
                .ToList();

            var allDoctors = await _db.DoctorProfiles
                .Include(d => d.User)
                .AsNoTracking()
                .ToListAsync(ct);

            var (candidates, audit) = SupervisorRecommendationMatcher.Match(
                student,
                project,
                allDoctors,
                projectSkillNames);

            LogAudit(audit);

            return (candidates, audit);
        }

        internal void LogAudit(SupervisorRecommendationAudit audit)
        {
            _logger.LogInformation(
                "SupervisorRecommendationAudit studentId={StudentId} faculty={Faculty} major={Major} " +
                "projectStage={Stage} skills={Skills} technologies={Technologies} " +
                "doctorsInDb={DoctorsInDb} activeDoctors={Active} profilesComplete={Profiles} " +
                "facultyMatch={FacultyMatch} departmentMatch={DepartmentMatch} " +
                "specializationMatch={SpecMatch} relatedFacultyMatch={RelatedFaculty} " +
                "afterProfileFilter={AfterProfile} matchTier={Tier} sampleDepartments={SampleDepts} " +
                "sampleFaculties={SampleFaculties}",
                audit.StudentId,
                audit.StudentFaculty,
                audit.StudentMajor,
                audit.ProjectStage,
                string.Join(", ", audit.ProjectSkills),
                string.Join(", ", audit.ProjectTechnologies),
                audit.TotalDoctorsInDatabase,
                audit.ActiveDoctors,
                audit.DoctorsWithProfiles,
                audit.FacultyMatch,
                audit.DepartmentMatch,
                audit.SpecializationMatch,
                audit.RelatedFacultyMatch,
                audit.AfterProfileCompleteFilter,
                audit.MatchTierUsed,
                string.Join(" | ", audit.SampleDoctorDepartments),
                string.Join(" | ", audit.SampleDoctorFaculties));
        }
    }
}
