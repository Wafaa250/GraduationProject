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
    [Route("api/company")]
    [Authorize(Roles = "company")]
    public class CompanyRequestInvitationsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ICompanyRequestInvitationService _invitations;

        public CompanyRequestInvitationsController(
            ApplicationDbContext db,
            ICompanyRequestInvitationService invitations)
        {
            _db = db;
            _invitations = invitations;
        }

        /// <summary>POST /api/company/requests/{requestId}/invitations</summary>
        [HttpPost("requests/{requestId:int}/invitations")]
        public async Task<IActionResult> Create(int requestId, [FromBody] CreateCompanyRequestInvitationDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var companyProfile = await RequireCompanyProfileAsync();
            if (companyProfile == null) return NotFoundProfile();

            try
            {
                var created = await _invitations.CreateAsync(
                    companyProfile.Id,
                    AuthorizationHelper.GetUserId(User),
                    requestId,
                    dto);
                return Ok(created);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>GET /api/company/requests/{requestId}/invitations</summary>
        [HttpGet("requests/{requestId:int}/invitations")]
        public async Task<IActionResult> ListByRequest(int requestId)
        {
            var companyProfile = await RequireCompanyProfileAsync();
            if (companyProfile == null) return NotFoundProfile();

            try
            {
                var list = await _invitations.ListByRequestAsync(companyProfile.Id, requestId);
                return Ok(list);
            }
            catch (ArgumentException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        /// <summary>GET /api/company/invitations</summary>
        [HttpGet("invitations")]
        public async Task<IActionResult> ListCompanyInvitations()
        {
            var companyProfile = await RequireCompanyProfileAsync();
            if (companyProfile == null) return NotFoundProfile();

            var list = await _invitations.ListCompanyInvitationsAsync(companyProfile.Id);
            return Ok(list);
        }

        /// <summary>POST /api/company/requests/{requestId}/invitations/{invitationId}/cancel</summary>
        [HttpPost("requests/{requestId:int}/invitations/{invitationId:int}/cancel")]
        public async Task<IActionResult> Cancel(int requestId, int invitationId)
        {
            var companyProfile = await RequireCompanyProfileAsync();
            if (companyProfile == null) return NotFoundProfile();

            try
            {
                var updated = await _invitations.CancelAsync(companyProfile.Id, requestId, invitationId);
                return updated == null ? NotFound(new { message = "Invitation not found." }) : Ok(updated);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
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
