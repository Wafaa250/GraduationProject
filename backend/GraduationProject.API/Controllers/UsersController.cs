using System.Linq;
using System.Threading.Tasks;
using GraduationProject.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GraduationProject.API.Controllers
{
    /// <summary>Compatibility alias for legacy frontend calls to /api/users/search.</summary>
    [ApiController]
    [Route("api/users")]
    [Authorize]
    public class UsersController : ControllerBase
    {
        private readonly ISearchService _search;

        public UsersController(ISearchService search) => _search = search;

        [HttpGet("search")]
        public async Task<IActionResult> Search([FromQuery] string? q, [FromQuery] int limit = 10)
        {
            if (string.IsNullOrWhiteSpace(q))
                return Ok(System.Array.Empty<object>());

            var result = await _search.SearchAsync(q, limit);
            var people = result.Students.Select(s => new
                {
                    userId = s.UserId ?? s.Id,
                    name = s.Title,
                    role = "student",
                    subtitle = s.Subtitle,
                })
                .Concat(result.Doctors.Select(d => new
                {
                    userId = d.UserId ?? d.Id,
                    name = d.Title,
                    role = "doctor",
                    subtitle = d.Subtitle,
                }))
                .Take(limit)
                .ToList();

            return Ok(people);
        }
    }
}
