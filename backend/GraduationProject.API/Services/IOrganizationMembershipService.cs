using System.Threading;
using System.Threading.Tasks;
using GraduationProject.API.DTOs;
using GraduationProject.API.Models;

namespace GraduationProject.API.Services
{
    public interface IOrganizationMembershipService
    {
        Task<RecruitmentMembershipSyncResult> SyncFromRecruitmentAcceptanceAsync(
            StudentOrganizationRecruitmentApplication application,
            CancellationToken cancellationToken = default);
    }

    public class RecruitmentMembershipSyncResult
    {
        public int OrganizationMemberId { get; set; }
        public string MembershipKind { get; set; } = OrganizationMembershipKinds.Member;
        public int? TeamMemberId { get; set; }
        public bool CreatedOrganizationMember { get; set; }
        public bool CreatedLeadershipShowcaseEntry { get; set; }
        public bool UpdatedExisting { get; set; }
    }
}
