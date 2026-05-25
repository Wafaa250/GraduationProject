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
    /// <summary>
    /// Company project requests (wizard). Replaces legacy talent-search request storage for the web flow.
    /// AI matching endpoints are not part of this controller.
    /// </summary>
    [ApiController]
    [Route("api/company/requests")]
    [Authorize(Roles = "company")]
    public class CompanyRequestsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ICompanyRequestService _requests;

        public CompanyRequestsController(ApplicationDbContext db, ICompanyRequestService requests)
        {
            _db = db;
            _requests = requests;
        }

        /// <summary>GET /api/company/requests — submitted requests (excludes draft by default).</summary>
        [HttpGet]
        public async Task<IActionResult> List([FromQuery] bool includeDraft = false)
        {
            var profile = await RequireCompanyProfileAsync();
            if (profile == null) return NotFoundProfile();

            var list = await _requests.ListAsync(profile.Id, includeDraft);
            return Ok(list);
        }

        /// <summary>GET /api/company/requests/{id}</summary>
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var profile = await RequireCompanyProfileAsync();
            if (profile == null) return NotFoundProfile();

            var detail = await _requests.GetByIdAsync(profile.Id, id);
            return detail == null ? NotFound() : Ok(detail);
        }

        /// <summary>GET /api/company/requests/draft — current wizard draft for this company.</summary>
        [HttpGet("draft")]
        public async Task<IActionResult> GetDraft()
        {
            var profile = await RequireCompanyProfileAsync();
            if (profile == null) return NotFoundProfile();

            var draft = await _requests.GetDraftAsync(profile.Id);
            return draft == null ? NoContent() : Ok(draft);
        }

        /// <summary>PUT /api/company/requests/draft — upsert wizard draft (Save draft).</summary>
        [HttpPut("draft")]
        public async Task<IActionResult> SaveDraft([FromBody] SaveCompanyRequestDraftDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var profile = await RequireCompanyProfileAsync();
            if (profile == null) return NotFoundProfile();

            try
            {
                var saved = await _requests.SaveDraftAsync(profile.Id, dto);
                return Ok(saved);
            }
            catch (System.ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>DELETE /api/company/requests/draft</summary>
        [HttpDelete("draft")]
        public async Task<IActionResult> DeleteDraft()
        {
            var profile = await RequireCompanyProfileAsync();
            if (profile == null) return NotFoundProfile();

            await _requests.DeleteDraftAsync(profile.Id);
            return NoContent();
        }

        /// <summary>POST /api/company/requests — submit completed request (Create Request).</summary>
        [HttpPost]
        public async Task<IActionResult> Submit([FromBody] CreateCompanyRequestDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var profile = await RequireCompanyProfileAsync();
            if (profile == null) return NotFoundProfile();

            try
            {
                var created = await _requests.SubmitAsync(profile.Id, dto);
                return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
            }
            catch (System.ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>PUT /api/company/requests/{id} — update a submitted request.</summary>
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] CreateCompanyRequestDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var profile = await RequireCompanyProfileAsync();
            if (profile == null) return NotFoundProfile();

            try
            {
                var updated = await _requests.UpdateAsync(profile.Id, id, dto);
                return updated == null ? NotFound() : Ok(updated);
            }
            catch (System.ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>DELETE /api/company/requests/{id} — permanently delete a submitted request.</summary>
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var profile = await RequireCompanyProfileAsync();
            if (profile == null) return NotFoundProfile();

            var deleted = await _requests.DeleteAsync(profile.Id, id);
            return deleted ? NoContent() : NotFound();
        }

        /// <summary>PATCH /api/company/requests/{id}/status — lifecycle (archive, restore, future matching).</summary>
        [HttpPatch("{id:int}/status")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateCompanyRequestStatusDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var profile = await RequireCompanyProfileAsync();
            if (profile == null) return NotFoundProfile();

            var updated = await _requests.UpdateStatusAsync(profile.Id, id, dto.Status);
            return updated == null ? BadRequest(new { message = "Invalid status or request not found." }) : Ok(updated);
        }

        private async Task<Models.CompanyProfile?> RequireCompanyProfileAsync()
        {
            var userId = AuthorizationHelper.GetUserId(User);
            return await _db.CompanyProfiles
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.UserId == userId);
        }

        private IActionResult NotFoundProfile() =>
            NotFound(new { message = "Company profile not found." });
    }
}
