using System.Threading.Tasks;
using GraduationProject.API.DTOs;

namespace GraduationProject.API.Services
{
    public interface ICompanyStudentDiscoveryService
    {
        Task<CompanyStudentDiscoveryProfileDto?> GetStudentProfileAsync(
            int companyProfileId,
            int requestId,
            int studentProfileId,
            int? teamRecommendationId = null);
    }
}
