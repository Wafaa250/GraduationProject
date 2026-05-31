using GraduationProject.API.DTOs;
using GraduationProject.API.Helpers;
using GraduationProject.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace GraduationProject.API.Controllers
{
    [ApiController]
    [Route("api/company/requests/{requestId:int}/team-recommendations")]
    [Authorize(Roles = "company")]
    public class CompanyRequestTeamRecommendationsController : ControllerBase
    {
        private readonly ICompanyRequestTeamRecommendationService _teams;
        private readonly ICompanyWorkspaceService _workspace;
        private readonly ILogger<CompanyRequestTeamRecommendationsController> _logger;

        public CompanyRequestTeamRecommendationsController(
            ICompanyRequestTeamRecommendationService teams,
            ICompanyWorkspaceService workspace,
            ILogger<CompanyRequestTeamRecommendationsController> logger)
        {
            _teams = teams;
            _workspace = workspace;
            _logger = logger;
        }

        [HttpPost("generate")]
        public async Task<IActionResult> Generate(
            int requestId,
            [FromBody] GenerateCompanyRequestTeamRecommendationsDto? dto = null)
        {
            var context = await RequireWorkspaceAsync();
            if (context == null) return NotFound(new { message = "Company profile not found." });
            try
            {
                var result = await _teams.GenerateAsync(
                    context.Profile.Id,
                    requestId,
                    dto ?? new GenerateCompanyRequestTeamRecommendationsDto());
                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Team recommendation generation failed for request {RequestId}", requestId);
                return StatusCode(500, new { message = "Team recommendation generation failed. Please try again." });
            }
        }

        [HttpPost("regenerate")]
        public async Task<IActionResult> Regenerate(
            int requestId,
            [FromBody] GenerateCompanyRequestTeamRecommendationsDto? dto = null)
        {
            var context = await RequireWorkspaceAsync();
            if (context == null) return NotFound(new { message = "Company profile not found." });
            try
            {
                var result = await _teams.RegenerateAsync(
                    context.Profile.Id,
                    requestId,
                    dto ?? new GenerateCompanyRequestTeamRecommendationsDto { ForceRegenerate = true });
                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Team recommendation regeneration failed for request {RequestId}", requestId);
                return StatusCode(500, new { message = "Team recommendation regeneration failed. Please try again." });
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetLatest(int requestId)
        {
            var context = await RequireWorkspaceAsync();
            if (context == null) return NotFound(new { message = "Company profile not found." });
            var result = await _teams.GetLatestAsync(context.Profile.Id, requestId);
            return result == null ? NotFound(new { message = "No team recommendations generated yet." }) : Ok(result);
        }

        [HttpGet("history")]
        public async Task<IActionResult> History(int requestId)
        {
            var context = await RequireWorkspaceAsync();
            if (context == null) return NotFound(new { message = "Company profile not found." });
            var result = await _teams.ListRunsAsync(context.Profile.Id, requestId);
            return result == null ? NotFound(new { message = "No team recommendation history found." }) : Ok(result);
        }

        private async Task<CompanyWorkspaceContext?> RequireWorkspaceAsync() =>
            await CompanyWorkspaceHelper.RequireWorkspaceAsync(_workspace, User);
    }
}
