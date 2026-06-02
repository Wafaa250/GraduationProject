using System.Threading.Tasks;
using GraduationProject.API.Helpers;
using GraduationProject.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GraduationProject.API.Controllers
{
    [ApiController]
    [Route("api/search")]
    [Authorize]
    public class SearchController : ControllerBase
    {
        private readonly ISearchService _search;

        public SearchController(ISearchService search) => _search = search;

        /// <summary>Global search across students, doctors, companies, associations, projects, and more.</summary>
        [HttpGet]
        public async Task<IActionResult> Search(
            [FromQuery] string? q,
            [FromQuery] string? query,
            [FromQuery] int limit = 5)
        {
            var term = !string.IsNullOrWhiteSpace(q) ? q : query;
            var result = await _search.SearchAsync(term, limit);
            return Ok(result);
        }

        /// <summary>Personalized suggestions when the search box is focused and empty.</summary>
        [HttpGet("suggestions")]
        public async Task<IActionResult> Suggestions([FromQuery] int limit = 5)
        {
            var userId = AuthorizationHelper.GetUserId(User);
            if (userId <= 0) return Unauthorized();
            var result = await _search.GetSuggestionsAsync(userId, limit);
            return Ok(result);
        }
    }
}
