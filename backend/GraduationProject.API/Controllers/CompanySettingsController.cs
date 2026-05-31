using System.Threading.Tasks;
using GraduationProject.API.DTOs;
using GraduationProject.API.Helpers;
using GraduationProject.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GraduationProject.API.Controllers
{
    [ApiController]
    [Route("api/company/settings")]
    [Authorize(Roles = "company")]
    public class CompanySettingsController : ControllerBase
    {
        private readonly ICompanySettingsService _settings;
        private readonly ICompanyWorkspaceService _workspace;

        public CompanySettingsController(
            ICompanySettingsService settings,
            ICompanyWorkspaceService workspace)
        {
            _settings = settings;
            _workspace = workspace;
        }

        [HttpGet]
        public async Task<IActionResult> GetSettings()
        {
            var context = await CompanyWorkspaceHelper.RequireWorkspaceAsync(_workspace, User);
            if (context == null)
                return NotFound(new { message = "Company workspace not found." });

            var userId = AuthorizationHelper.GetUserId(User);
            var data = await _settings.GetSettingsAsync(context.Profile.Id, userId);
            return Ok(data);
        }

        [HttpPut("notifications")]
        public async Task<IActionResult> UpdateNotifications(
            [FromBody] UpdateCompanyNotificationPreferencesDto dto)
        {
            var context = await CompanyWorkspaceHelper.RequireWorkspaceAsync(_workspace, User);
            if (context == null)
                return NotFound(new { message = "Company workspace not found." });

            var userId = AuthorizationHelper.GetUserId(User);
            var updated = await _settings.UpdateNotificationsAsync(
                context.Profile.Id,
                userId,
                dto);
            return Ok(updated);
        }
    }
}
