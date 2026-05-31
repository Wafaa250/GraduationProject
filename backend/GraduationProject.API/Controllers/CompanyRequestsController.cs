using System.Threading.Tasks;
using GraduationProject.API.DTOs;
using GraduationProject.API.Helpers;
using GraduationProject.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GraduationProject.API.Controllers
{
    /// <summary>
    /// Company project requests (wizard). Replaces legacy talent-search request storage for the web flow.
    /// AI matching endpoints are not part of this controller.
    /// </summary>
    [ApiController]
    [Route("api/company/requests")]
    [Authorize(Roles = "company")]
    public class CompanyRequestsController : ControllerBase
    {
        private readonly ICompanyRequestService _requests;
        private readonly ICompanyWorkspaceService _workspace;

        public CompanyRequestsController(
            ICompanyRequestService requests,
            ICompanyWorkspaceService workspace)
        {
            _requests = requests;
            _workspace = workspace;
        }

        [HttpGet]
        public async Task<IActionResult> List([FromQuery] bool includeDraft = false)
        {
            var context = await RequireWorkspaceAsync();
            if (context == null) return NotFoundProfile();

            var list = await _requests.ListAsync(context.Profile.Id, includeDraft);
            return Ok(list);
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var context = await RequireWorkspaceAsync();
            if (context == null) return NotFoundProfile();

            var detail = await _requests.GetByIdAsync(context.Profile.Id, id);
            return detail == null ? NotFound() : Ok(detail);
        }

        [HttpGet("draft")]
        public async Task<IActionResult> GetDraft()
        {
            var context = await RequireWorkspaceAsync();
            if (context == null) return NotFoundProfile();

            var draft = await _requests.GetDraftAsync(context.Profile.Id);
            return draft == null ? NoContent() : Ok(draft);
        }

        [HttpPut("draft")]
        public async Task<IActionResult> SaveDraft([FromBody] SaveCompanyRequestDraftDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var context = await RequireWorkspaceAsync();
            if (context == null) return NotFoundProfile();

            try
            {
                var userId = AuthorizationHelper.GetUserId(User);
                var saved = await _requests.SaveDraftAsync(context.Profile.Id, dto, userId);
                return Ok(saved);
            }
            catch (System.ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("draft")]
        public async Task<IActionResult> DeleteDraft()
        {
            var context = await RequireWorkspaceAsync();
            if (context == null) return NotFoundProfile();

            await _requests.DeleteDraftAsync(context.Profile.Id);
            return NoContent();
        }

        [HttpPost]
        public async Task<IActionResult> Submit([FromBody] CreateCompanyRequestDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var context = await RequireWorkspaceAsync();
            if (context == null) return NotFoundProfile();

            try
            {
                var userId = AuthorizationHelper.GetUserId(User);
                var created = await _requests.SubmitAsync(context.Profile.Id, dto, userId);
                return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
            }
            catch (System.ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] CreateCompanyRequestDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var context = await RequireWorkspaceAsync();
            if (context == null) return NotFoundProfile();

            try
            {
                var userId = AuthorizationHelper.GetUserId(User);
                var updated = await _requests.UpdateAsync(context.Profile.Id, id, dto, userId);
                return updated == null ? NotFound() : Ok(updated);
            }
            catch (System.ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var context = await RequireWorkspaceAsync();
            if (context == null) return NotFoundProfile();

            var deleted = await _requests.DeleteAsync(context.Profile.Id, id);
            return deleted ? NoContent() : NotFound();
        }

        [HttpPatch("{id:int}/status")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateCompanyRequestStatusDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var context = await RequireWorkspaceAsync();
            if (context == null) return NotFoundProfile();

            var userId = AuthorizationHelper.GetUserId(User);
            var updated = await _requests.UpdateStatusAsync(context.Profile.Id, id, dto.Status, userId);
            return updated == null ? BadRequest(new { message = "Invalid status or request not found." }) : Ok(updated);
        }

        private async Task<CompanyWorkspaceContext?> RequireWorkspaceAsync() =>
            await CompanyWorkspaceHelper.RequireWorkspaceAsync(_workspace, User);

        private IActionResult NotFoundProfile() =>
            NotFound(new { message = "Company profile not found." });
    }
}
