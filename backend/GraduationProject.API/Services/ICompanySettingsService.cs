using System.Threading.Tasks;
using GraduationProject.API.DTOs;

namespace GraduationProject.API.Services
{
    public interface ICompanySettingsService
    {
        Task<CompanySettingsDto> GetSettingsAsync(int companyProfileId, int userId);
        Task<CompanyNotificationPreferencesDto> UpdateNotificationsAsync(
            int companyProfileId,
            int userId,
            UpdateCompanyNotificationPreferencesDto dto);
    }
}
