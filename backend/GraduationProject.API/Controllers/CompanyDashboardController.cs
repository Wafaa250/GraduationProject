using System.Threading.Tasks;
using GraduationProject.API.Helpers;
using GraduationProject.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GraduationProject.API.Controllers
{
    [ApiController]
    [Route("api/company/dashboard")]
    [Authorize(Roles = UserRoles.CompanyWorkspace)]
    public class CompanyDashboardController : ControllerBase
    {
        private readonly ICompanyDashboardService _dashboard;
        private readonly ICompanyWorkspaceService _workspace;

        public CompanyDashboardController(
            ICompanyDashboardService dashboard,
            ICompanyWorkspaceService workspace)
        {
            _dashboard = dashboard;
            _workspace = workspace;
        }

        [HttpGet]
        public async Task<IActionResult> GetDashboard()
        {
            var (context, error) = await CompanyWorkspaceHelper.TryResolveAsync(_workspace, User, HttpContext);
            if (error != null)
                return error;

            var data = await _dashboard.GetDashboardAsync(context!.Profile.Id);
            return Ok(data);
        }
    }
}
