using System;
using System.Threading.Tasks;
using GraduationProject.API.Data;
using GraduationProject.API.DTOs;
using GraduationProject.API.Helpers;
using GraduationProject.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GraduationProject.API.Controllers
{
    [ApiController]
    [Route("api/company/requests/{requestId:int}/recommendations")]
    [Authorize(Roles = "company")]
    public class CompanyRequestRecommendationsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ICompanyRequestRecommendationService _recommendations;

        public CompanyRequestRecommendationsController(
            ApplicationDbContext db,
            ICompanyRequestRecommendationService recommendations)
        {
            _db = db;
            _recommendations = recommendations;
        }

        /// <summary>POST /api/company/requests/{requestId}/recommendations/generate</summary>
        [HttpPost("generate")]
        public async Task<IActionResult> Generate(
            int requestId,
            [FromBody] CompanyRequestRecommendationGenerateDto? dto = null)
        {
            var profile = await RequireCompanyProfileAsync();
            if (profile == null) return NotFound(new { message = "Company profile not found." });

            try
            {
                var result = await _recommendations.GenerateAsync(
                    profile.Id,
                    requestId,
                    dto ?? new CompanyRequestRecommendationGenerateDto());
                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>POST /api/company/requests/{requestId}/recommendations/regenerate</summary>
        [HttpPost("regenerate")]
        public async Task<IActionResult> Regenerate(
            int requestId,
            [FromBody] CompanyRequestRecommendationGenerateDto? dto = null)
        {
            var profile = await RequireCompanyProfileAsync();
            if (profile == null) return NotFound(new { message = "Company profile not found." });

            try
            {
                var result = await _recommendations.RegenerateAsync(
                    profile.Id,
                    requestId,
                    dto ?? new CompanyRequestRecommendationGenerateDto { ForceRegenerate = true });
                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>GET /api/company/requests/{requestId}/recommendations</summary>
        [HttpGet]
        public async Task<IActionResult> GetLatest(int requestId)
        {
            var profile = await RequireCompanyProfileAsync();
            if (profile == null) return NotFound(new { message = "Company profile not found." });

            var result = await _recommendations.GetLatestAsync(profile.Id, requestId);
            return result == null ? NotFound(new { message = "No recommendations generated yet." }) : Ok(result);
        }

        /// <summary>GET /api/company/requests/{requestId}/recommendations/history</summary>
        [HttpGet("history")]
        public async Task<IActionResult> History(int requestId)
        {
            var profile = await RequireCompanyProfileAsync();
            if (profile == null) return NotFound(new { message = "Company profile not found." });

            var result = await _recommendations.ListRunsAsync(profile.Id, requestId);
            return result == null ? NotFound(new { message = "No recommendation history found." }) : Ok(result);
        }

        private async Task<Models.CompanyProfile?> RequireCompanyProfileAsync()
        {
            var userId = AuthorizationHelper.GetUserId(User);
            return await _db.CompanyProfiles
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.UserId == userId);
        }
    }
}
