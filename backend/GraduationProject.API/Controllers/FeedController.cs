using System;
using System.Linq;
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
        private readonly IStudentRecommendationService _recommendations;

        public FeedController(IFeedService feed, IStudentRecommendationService recommendations)
        {
            _feed = feed;
            _recommendations = recommendations;
        }

        [HttpGet]
        public async Task<IActionResult> GetFeed([FromQuery] string? search = null)
        {
            var userId = AuthorizationHelper.GetUserId(User);
            if (userId <= 0) return Unauthorized();

            var role = AuthorizationHelper.GetRole(User) ?? "student";
            var result = await _feed.GetFeedAsync(userId, role, search);
            return Ok(result);
        }

        /// <summary>Profile-based company and association suggestions for the Communication Hub.</summary>
        [HttpGet("recommendations")]
        [Authorize(Roles = "student")]
        public async Task<IActionResult> GetRecommendations()
        {
            var userId = AuthorizationHelper.GetUserId(User);
            if (userId <= 0) return Unauthorized();

            var result = await _recommendations.GetRecommendationsForUserAsync(userId);
            return Ok(result);
        }

        /// <summary>Mixed AI-matched recommendations for the Communication Hub sidebar.</summary>
        [HttpGet("recommended")]
        [Authorize(Roles = "student")]
        public async Task<IActionResult> GetRecommended(
            [FromQuery] int? rotation = null,
            [FromQuery] string? exclude = null)
        {
            var userId = AuthorizationHelper.GetUserId(User);
            if (userId <= 0) return Unauthorized();

            var excludeIds = string.IsNullOrWhiteSpace(exclude)
                ? null
                : exclude.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

            var result = await _recommendations.GetUnifiedRecommendedForUserAsync(userId, rotation, excludeIds);
            return Ok(result);
        }
    }
}
