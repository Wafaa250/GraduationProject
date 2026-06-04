using System.Threading.Tasks;
using GraduationProject.API.DTOs;
using GraduationProject.API.Helpers;
using GraduationProject.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GraduationProject.API.Controllers
{
    [ApiController]
    [Route("api/company/members")]
    [Authorize(Roles = UserRoles.Company)]
    public class CompanyMembersController : ControllerBase
    {
        private readonly ICompanyMemberService _members;
        private readonly ICompanyWorkspaceService _workspace;

        public CompanyMembersController(
            ICompanyMemberService members,
            ICompanyWorkspaceService workspace)
        {
            _members = members;
            _workspace = workspace;
        }

        [HttpGet]
        public async Task<IActionResult> List()
        {
            var (workspace, error) = await CompanyWorkspaceHelper.TryResolveAsync(_workspace, User);
            if (error != null)
                return error;

            var userId = AuthorizationHelper.GetUserId(User);
            var list = await _members.ListAsync(userId);
            return Ok(list);
        }

        [HttpPost]
        public async Task<IActionResult> Add([FromBody] AddCompanyMemberDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userId = AuthorizationHelper.GetUserId(User);
            var (result, error, credentialsEmailSent) = await _members.AddAsync(userId, dto);
            if (error != null)
            {
                if (error.Contains("owners", System.StringComparison.OrdinalIgnoreCase))
                    return Forbid();

                return BadRequest(new { message = error });
            }

            return Ok(new AddCompanyMemberResponseDto
            {
                Member = result!,
                CredentialsEmailSent = credentialsEmailSent,
            });
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Remove(int id)
        {
            var userId = AuthorizationHelper.GetUserId(User);
            var (success, error) = await _members.RemoveAsync(userId, id);
            if (!success)
            {
                if (error != null && error.Contains("owners", System.StringComparison.OrdinalIgnoreCase))
                    return Forbid();

                return BadRequest(new { message = error });
            }

            return NoContent();
        }
    }
}
