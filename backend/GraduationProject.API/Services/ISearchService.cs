using System.Threading.Tasks;
using GraduationProject.API.DTOs;

namespace GraduationProject.API.Services
{
    public interface ISearchService
    {
        Task<GlobalSearchResponseDto> SearchAsync(string? query, int perCategoryLimit = 5);
        Task<SearchSuggestionsResponseDto> GetSuggestionsAsync(int userId, int limit = 5);
    }
}
