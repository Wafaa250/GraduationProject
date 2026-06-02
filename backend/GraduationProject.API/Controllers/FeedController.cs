using System.Threading.Tasks;
using GraduationProject.API.DTOs;
using GraduationProject.API.Helpers;
using GraduationProject.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GraduationProject.API.Controllers
{
    [ApiController]
    [Route("api/feed")]
    [Authorize]
    public class FeedController : ControllerBase
    {
        private readonly IFeedService _feed;

        public FeedController(IFeedService feed) => _feed = feed;

        [HttpGet]
        public async Task<IActionResult> GetFeed([FromQuery] string? search = null)
        {
            var userId = AuthorizationHelper.GetUserId(User);
            if (userId <= 0) return Unauthorized();

            var role = AuthorizationHelper.GetRole(User) ?? "student";
            var result = await _feed.GetFeedAsync(userId, role, search);
            return Ok(result);
        }
    }
}
