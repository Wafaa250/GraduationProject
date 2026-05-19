using System.Threading;
using System.Threading.Tasks;
using GraduationProject.API.DTOs;
using GraduationProject.API.Models;

namespace GraduationProject.API.Services
{
    public interface IRecruitmentApplicationWorkflowService
    {
        Task<RecruitmentApplicantAnalysisResponseDto?> RunAiRankingAsync(
            StudentAssociationProfile organization,
            StudentOrganizationRecruitmentCampaign campaign,
            StudentOrganizationRecruitmentPosition position,
            RecruitmentAiRegenerateRequestDto? preferences,
            bool isRegenerate,
            CancellationToken cancellationToken = default);

        Task<RecruitmentApplicationDecisionResponseDto?> AcceptAsync(
            int applicationId,
            int organizationProfileId,
            CancellationToken cancellationToken = default);

        Task<RecruitmentApplicationDecisionResponseDto?> RejectAsync(
            int applicationId,
            int organizationProfileId,
            CancellationToken cancellationToken = default);
    }
}
