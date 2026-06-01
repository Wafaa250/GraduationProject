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
    [Route("api/company")]
    [Authorize(Roles = "company")]
    public class CompanyRequestInvitationsController : ControllerBase
    {
        private readonly ICompanyRequestInvitationService _invitations;
        private readonly ICompanyWorkspaceService _workspace;

        public CompanyRequestInvitationsController(
            ICompanyRequestInvitationService invitations,
            ICompanyWorkspaceService workspace)
        {
            _invitations = invitations;
            _workspace = workspace;
        }

        [HttpPost("requests/{requestId:int}/invitations")]
        public async Task<IActionResult> Create(int requestId, [FromBody] CreateCompanyRequestInvitationDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var (context, workspaceError) = await RequireWorkspaceAsync();
            if (workspaceError != null) return workspaceError;

            try
            {
                var created = await _invitations.CreateAsync(
                    context.Profile.Id,
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

        [HttpGet("requests/{requestId:int}/invitations")]
        public async Task<IActionResult> ListByRequest(int requestId)
        {
            var (context, workspaceError) = await RequireWorkspaceAsync();
            if (workspaceError != null) return workspaceError;

            try
            {
                var list = await _invitations.ListByRequestAsync(context.Profile.Id, requestId);
                return Ok(list);
            }
            catch (ArgumentException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        [HttpGet("invitations")]
        public async Task<IActionResult> ListCompanyInvitations()
        {
            var (context, workspaceError) = await RequireWorkspaceAsync();
            if (workspaceError != null) return workspaceError;

            var list = await _invitations.ListCompanyInvitationsAsync(context.Profile.Id);
            return Ok(list);
        }

        [HttpPost("requests/{requestId:int}/invitations/{invitationId:int}/cancel")]
        public async Task<IActionResult> Cancel(int requestId, int invitationId)
        {
            var (context, workspaceError) = await RequireWorkspaceAsync();
            if (workspaceError != null) return workspaceError;

            try
            {
                var updated = await _invitations.CancelAsync(context.Profile.Id, requestId, invitationId);
                return updated == null ? NotFound(new { message = "Invitation not found." }) : Ok(updated);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        private Task<(CompanyWorkspaceContext? Context, IActionResult? Error)> RequireWorkspaceAsync() =>
            CompanyWorkspaceHelper.TryResolveAsync(_workspace, User);
    }
}
