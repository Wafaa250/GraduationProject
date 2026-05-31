using System;
using System.Threading.Tasks;
using GraduationProject.API.DTOs;
using GraduationProject.API.Helpers;
using GraduationProject.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GraduationProject.API.Controllers
{
    [ApiController]
    [Route("api/company/requests/{requestId:int}/recommendations")]
    [Authorize(Roles = "company")]
    public class CompanyRequestRecommendationsController : ControllerBase
    {
        private readonly ICompanyRequestRecommendationService _recommendations;
        private readonly ICompanyWorkspaceService _workspace;

        public CompanyRequestRecommendationsController(
            ICompanyRequestRecommendationService recommendations,
            ICompanyWorkspaceService workspace)
        {
            _recommendations = recommendations;
            _workspace = workspace;
        }

        [HttpPost("generate")]
        public async Task<IActionResult> Generate(
            int requestId,
            [FromBody] CompanyRequestRecommendationGenerateDto? dto = null)
        {
            var context = await RequireWorkspaceAsync();
            if (context == null) return NotFound(new { message = "Company profile not found." });

            try
            {
                var result = await _recommendations.GenerateAsync(
                    context.Profile.Id,
                    requestId,
                    dto ?? new CompanyRequestRecommendationGenerateDto());
                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("regenerate")]
        public async Task<IActionResult> Regenerate(
            int requestId,
            [FromBody] CompanyRequestRecommendationGenerateDto? dto = null)
        {
            var context = await RequireWorkspaceAsync();
            if (context == null) return NotFound(new { message = "Company profile not found." });

            try
            {
                var result = await _recommendations.RegenerateAsync(
                    context.Profile.Id,
                    requestId,
                    dto ?? new CompanyRequestRecommendationGenerateDto { ForceRegenerate = true });
                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetLatest(int requestId)
        {
            var context = await RequireWorkspaceAsync();
            if (context == null) return NotFound(new { message = "Company profile not found." });

            var result = await _recommendations.GetLatestAsync(context.Profile.Id, requestId);
            return result == null ? NotFound(new { message = "No recommendations generated yet." }) : Ok(result);
        }

        [HttpGet("history")]
        public async Task<IActionResult> History(int requestId)
        {
            var context = await RequireWorkspaceAsync();
            if (context == null) return NotFound(new { message = "Company profile not found." });

            var result = await _recommendations.ListRunsAsync(context.Profile.Id, requestId);
            return result == null ? NotFound(new { message = "No recommendation history found." }) : Ok(result);
        }

        private async Task<CompanyWorkspaceContext?> RequireWorkspaceAsync() =>
            await CompanyWorkspaceHelper.RequireWorkspaceAsync(_workspace, User);
    }
}
