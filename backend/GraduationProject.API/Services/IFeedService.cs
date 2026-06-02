using System.Threading.Tasks;
using GraduationProject.API.DTOs;

namespace GraduationProject.API.Services
{
    public interface IFeedService
    {
        Task<FeedResponseDto> GetFeedAsync(int userId, string role, string? search = null);
    }
}
