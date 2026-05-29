using System.Threading.Tasks;

namespace GraduationProject.API.Services
{
    public interface ICompanyActivityService
    {
        Task LogAsync(int companyProfileId, int userId, string activityType, string description);
    }
}
