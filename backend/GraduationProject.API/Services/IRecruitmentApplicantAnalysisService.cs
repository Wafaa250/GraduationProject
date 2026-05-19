using System.Threading;
using System.Threading.Tasks;
using GraduationProject.API.DTOs;

namespace GraduationProject.API.Services
{
    public interface IRecruitmentApplicantAnalysisService
    {
        /// <summary>Calls OpenAI to rank applicants; returns outcome with errors when parsing or HTTP fails.</summary>
        Task<RecruitmentApplicantAnalysisOutcome> RankApplicantsAsync(
            RecruitmentApplicantAnalysisAiContext context,
            CancellationToken cancellationToken = default);
    }
}
