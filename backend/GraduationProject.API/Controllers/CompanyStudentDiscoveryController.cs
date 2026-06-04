using System.Threading.Tasks;
using GraduationProject.API.Helpers;
using GraduationProject.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GraduationProject.API.Controllers
{
    [ApiController]
    [Route("api/company/requests/{requestId:int}/students")]
    [Authorize(Roles = UserRoles.CompanyWorkspace)]
    public class CompanyStudentDiscoveryController : ControllerBase
    {
        private readonly ICompanyStudentDiscoveryService _discovery;
        private readonly ICompanyWorkspaceService _workspace;

        public CompanyStudentDiscoveryController(
            ICompanyStudentDiscoveryService discovery,
            ICompanyWorkspaceService workspace)
        {
            _discovery = discovery;
            _workspace = workspace;
        }

        [HttpGet("{studentProfileId:int}")]
        public async Task<IActionResult> GetStudentProfile(
            int requestId,
            int studentProfileId,
            [FromQuery] int? teamId = null)
        {
            var (context, workspaceError) = await RequireWorkspaceAsync();
            if (workspaceError != null) return workspaceError;

            var result = await _discovery.GetStudentProfileAsync(
                context.Profile.Id,
                requestId,
                studentProfileId,
                teamId);

            return result == null
                ? NotFound(new { message = "Student profile not found for this request." })
                : Ok(result);
        }

        private Task<(CompanyWorkspaceContext? Context, IActionResult? Error)> RequireWorkspaceAsync() =>
            CompanyWorkspaceHelper.TryResolveAsync(_workspace, User);
    }
}
