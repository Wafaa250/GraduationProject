using System.Threading.Tasks;
using GraduationProject.API.DTOs;
using GraduationProject.API.Helpers;
using GraduationProject.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GraduationProject.API.Controllers
{
    [ApiController]
    [Route("api/company/saved-recommendations")]
    [Authorize(Roles = UserRoles.CompanyWorkspace)]
    public class CompanySavedRecommendationsController : ControllerBase
    {
        private readonly ICompanySavedRecommendationService _saved;

        private readonly ICompanyWorkspaceService _workspace;

        public CompanySavedRecommendationsController(
            ICompanySavedRecommendationService saved,
            ICompanyWorkspaceService workspace)
        {
            _saved = saved;
            _workspace = workspace;
        }

        [HttpGet]
        public async Task<IActionResult> ListAll()
        {
            var (context, workspaceError) = await RequireWorkspaceAsync();
            if (workspaceError != null)
                return workspaceError;

            var page = await _saved.ListAllAsync(context.Profile.Id);
            return Ok(page);
        }

        [HttpGet("requests/{requestId:int}/ids")]
        public async Task<IActionResult> GetIdsForRequest(int requestId)
        {
            var (context, workspaceError) = await RequireWorkspaceAsync();
            if (workspaceError != null)
                return workspaceError;

            var ids = await _saved.GetSavedIdsForRequestAsync(context.Profile.Id, requestId);
            return Ok(ids);
        }

        [HttpPut("requests/{requestId:int}/students/{studentProfileId:int}")]
        public async Task<IActionResult> SaveStudent(int requestId, int studentProfileId)
        {
            var (context, workspaceError) = await RequireWorkspaceAsync();
            if (workspaceError != null)
                return workspaceError;

            var userId = AuthorizationHelper.GetUserId(User);
            var (saved, error) = await _saved.SaveStudentAsync(
                context.Profile.Id,
                requestId,
                studentProfileId,
                userId);

            if (error != null)
                return BadRequest(new { message = error });

            return Ok(new { saved });
        }

        [HttpDelete("requests/{requestId:int}/students/{studentProfileId:int}")]
        public async Task<IActionResult> UnsaveStudent(int requestId, int studentProfileId)
        {
            var (context, workspaceError) = await RequireWorkspaceAsync();
            if (workspaceError != null)
                return workspaceError;

            var (removed, error) = await _saved.UnsaveStudentAsync(
                context.Profile.Id,
                requestId,
                studentProfileId);

            if (!removed)
                return NotFound(new { message = error ?? "Saved recommendation not found." });

            return NoContent();
        }

        [HttpPut("requests/{requestId:int}/teams/{teamRecommendationId:int}")]
        public async Task<IActionResult> SaveTeam(int requestId, int teamRecommendationId)
        {
            var (context, workspaceError) = await RequireWorkspaceAsync();
            if (workspaceError != null)
                return workspaceError;

            var userId = AuthorizationHelper.GetUserId(User);
            var (saved, error) = await _saved.SaveTeamAsync(
                context.Profile.Id,
                requestId,
                teamRecommendationId,
                userId);

            if (error != null)
                return BadRequest(new { message = error });

            return Ok(new { saved });
        }

        [HttpDelete("requests/{requestId:int}/teams/{teamRecommendationId:int}")]
        public async Task<IActionResult> UnsaveTeam(int requestId, int teamRecommendationId)
        {
            var (context, workspaceError) = await RequireWorkspaceAsync();
            if (workspaceError != null)
                return workspaceError;

            var (removed, error) = await _saved.UnsaveTeamAsync(
                context.Profile.Id,
                requestId,
                teamRecommendationId);

            if (!removed)
                return NotFound(new { message = error ?? "Saved team not found." });

            return NoContent();
        }

        [HttpPatch("requests/{requestId:int}/students/{studentProfileId:int}/note")]
        public async Task<IActionResult> UpdateStudentNote(
            int requestId,
            int studentProfileId,
            [FromBody] UpdateSavedRecommendationNoteDto body)
        {
            var (context, workspaceError) = await RequireWorkspaceAsync();
            if (workspaceError != null)
                return workspaceError;

            var (updated, error) = await _saved.UpdateStudentNoteAsync(
                context.Profile.Id,
                requestId,
                studentProfileId,
                body?.Note,
                AuthorizationHelper.GetUserId(User));

            if (!updated)
                return NotFound(new { message = error ?? "Saved recommendation not found." });

            return NoContent();
        }

        [HttpPatch("requests/{requestId:int}/teams/{teamRecommendationId:int}/note")]
        public async Task<IActionResult> UpdateTeamNote(
            int requestId,
            int teamRecommendationId,
            [FromBody] UpdateSavedRecommendationNoteDto body)
        {
            var (context, workspaceError) = await RequireWorkspaceAsync();
            if (workspaceError != null)
                return workspaceError;

            var (updated, error) = await _saved.UpdateTeamNoteAsync(
                context.Profile.Id,
                requestId,
                teamRecommendationId,
                body?.Note,
                AuthorizationHelper.GetUserId(User));

            if (!updated)
                return NotFound(new { message = error ?? "Saved team not found." });

            return NoContent();
        }

        private Task<(CompanyWorkspaceContext? Context, IActionResult? Error)> RequireWorkspaceAsync() =>
            CompanyWorkspaceHelper.TryResolveAsync(_workspace, User);
    }
}
