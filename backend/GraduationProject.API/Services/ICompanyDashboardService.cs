using System.Threading.Tasks;
using GraduationProject.API.DTOs;

namespace GraduationProject.API.Services
{
    public interface ICompanyDashboardService
    {
        Task<CompanyDashboardDto> GetDashboardAsync(int companyProfileId);
    }
}
