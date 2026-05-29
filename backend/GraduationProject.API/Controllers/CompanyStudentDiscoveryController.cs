using System.Threading.Tasks;
using GraduationProject.API.Helpers;
using GraduationProject.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GraduationProject.API.Controllers
{
    [ApiController]
    [Route("api/company/requests/{requestId:int}/students")]
    [Authorize(Roles = "company")]
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
            var context = await RequireWorkspaceAsync();
            if (context == null) return NotFound(new { message = "Company profile not found." });

            var result = await _discovery.GetStudentProfileAsync(
                context.Profile.Id,
                requestId,
                studentProfileId,
                teamId);

            return result == null
                ? NotFound(new { message = "Student profile not found for this request." })
                : Ok(result);
        }

        private async Task<CompanyWorkspaceContext?> RequireWorkspaceAsync() =>
            await CompanyWorkspaceHelper.RequireWorkspaceAsync(_workspace, User);
    }
}
