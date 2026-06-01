using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using GraduationProject.API.Data;
using GraduationProject.API.Helpers;
using GraduationProject.API.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace GraduationProject.API.Services
{
    public class OrganizationMembershipService : IOrganizationMembershipService
    {
        private readonly ApplicationDbContext _db;
        private readonly ILogger<OrganizationMembershipService> _logger;

        public OrganizationMembershipService(
            ApplicationDbContext db,
            ILogger<OrganizationMembershipService> logger)
        {
            _db = db;
            _logger = logger;
        }

        public async Task<RecruitmentMembershipSyncResult> SyncFromRecruitmentAcceptanceAsync(
            StudentOrganizationRecruitmentApplication application,
            CancellationToken cancellationToken = default)
        {
            if (application.StudentProfile == null)
            {
                _logger.LogError(
                    "Recruitment accept -> membership skipped: StudentProfile not loaded for application {ApplicationId}",
                    application.Id);
                throw new InvalidOperationException("Student profile must be loaded to create organization membership.");
            }

            if (application.Position == null)
            {
                _logger.LogError(
                    "Recruitment accept -> membership skipped: Position not loaded for application {ApplicationId}",
                    application.Id);
                throw new InvalidOperationException("Recruitment position must be loaded to create organization membership.");
            }

            var orgId = application.OrganizationProfileId;
            var student = application.StudentProfile;
            var roleTitle = application.Position.RoleTitle.Trim();
            var membershipKind = OrganizationMembershipHelper.ClassifyMembershipKind(roleTitle);
            var now = DateTime.UtcNow;
            var result = new RecruitmentMembershipSyncResult { MembershipKind = membershipKind };

            _logger.LogInformation(
                "Recruitment accept -> syncing membership applicationId={ApplicationId} orgId={OrgId} studentProfileId={StudentId} role={Role} kind={Kind}",
                application.Id,
                orgId,
                application.StudentProfileId,
                roleTitle,
                membershipKind);

            var orgMember = await _db.StudentOrganizationMembers
                .FirstOrDefaultAsync(m =>
                    m.OrganizationProfileId == orgId &&
                    m.StudentProfileId == application.StudentProfileId,
                    cancellationToken);

            if (orgMember == null)
            {
                orgMember = new StudentOrganizationMember
                {
                    OrganizationProfileId = orgId,
                    StudentProfileId = application.StudentProfileId,
                    SourceApplicationId = application.Id,
                    RoleTitle = roleTitle,
                    MembershipKind = membershipKind,
                    AcceptedAt = application.AcceptedAt ?? now,
                };
                _db.StudentOrganizationMembers.Add(orgMember);
                result.CreatedOrganizationMember = true;
            }
            else
            {
                orgMember.SourceApplicationId ??= application.Id;
                orgMember.RoleTitle = roleTitle;
                orgMember.MembershipKind = membershipKind;
                if (application.AcceptedAt.HasValue)
                    orgMember.AcceptedAt = application.AcceptedAt.Value;
                result.UpdatedExisting = true;
            }

            StudentOrganizationTeamMember? teamMember = null;
            if (membershipKind == OrganizationMembershipKinds.Leadership)
            {
                var upsert = await UpsertLeadershipShowcaseAsync(
                    orgId,
                    application,
                    student,
                    roleTitle,
                    cancellationToken);
                teamMember = upsert.TeamMember;
                orgMember.TeamMember = teamMember;
                result.CreatedLeadershipShowcaseEntry = upsert.Created;
            }
            else
            {
                orgMember.TeamMember = null;
                orgMember.TeamMemberId = null;
            }

            await _db.SaveChangesAsync(cancellationToken);

            result.OrganizationMemberId = orgMember.Id;
            result.TeamMemberId = teamMember?.Id;

            _logger.LogInformation(
                "Recruitment accept -> membership created organizationMemberId={MemberId} teamMemberId={TeamId} createdMember={Created} createdShowcase={Showcase}",
                result.OrganizationMemberId,
                result.TeamMemberId,
                result.CreatedOrganizationMember,
                result.CreatedLeadershipShowcaseEntry);

            return result;
        }

        private async Task<(StudentOrganizationTeamMember TeamMember, bool Created)> UpsertLeadershipShowcaseAsync(
            int organizationProfileId,
            StudentOrganizationRecruitmentApplication application,
            StudentProfile student,
            string roleTitle,
            CancellationToken cancellationToken)
        {
            var fullName = student.User?.Name?.Trim();
            if (string.IsNullOrWhiteSpace(fullName))
                fullName = "Student";

            var existing = await _db.StudentOrganizationTeamMembers
                .FirstOrDefaultAsync(m =>
                    m.OrganizationProfileId == organizationProfileId &&
                    m.StudentProfileId == application.StudentProfileId,
                    cancellationToken);

            if (existing != null)
            {
                existing.FullName = fullName;
                existing.RoleTitle = roleTitle;
                existing.Major = string.IsNullOrWhiteSpace(student.Major) ? existing.Major : student.Major.Trim();
                existing.SourceApplicationId = application.Id;
                existing.StudentProfileId = application.StudentProfileId;
                existing.UpdatedAt = DateTime.UtcNow;
                return (existing, false);
            }

            var created = new StudentOrganizationTeamMember
            {
                OrganizationProfileId = organizationProfileId,
                StudentProfileId = application.StudentProfileId,
                SourceApplicationId = application.Id,
                FullName = fullName,
                RoleTitle = roleTitle,
                Major = string.IsNullOrWhiteSpace(student.Major) ? null : student.Major.Trim(),
                ImageUrl = null,
                LinkedInUrl = null,
                CreatedAt = DateTime.UtcNow,
            };
            _db.StudentOrganizationTeamMembers.Add(created);
            return (created, true);
        }
    }
}
