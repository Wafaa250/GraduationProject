using System.Threading.Tasks;
using GraduationProject.API.DTOs;

namespace GraduationProject.API.Services
{
    public interface ICompanyAnalysisService
    {
        Task<(CompanyAnalysisResultDto? result, string? error)> AnalyzeAsync(AnalyzeCompanyDto dto);
    }
}
