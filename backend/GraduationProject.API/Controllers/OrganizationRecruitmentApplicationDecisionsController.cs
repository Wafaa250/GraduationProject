using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using GraduationProject.API.Data;
using GraduationProject.API.Helpers;
using GraduationProject.API.Models;
using GraduationProject.API.Services;

namespace GraduationProject.API.Controllers
{
    [ApiController]
    [Route("api/organization/recruitment-applications")]
    [Authorize(Roles = "studentassociation,association")]
    public class OrganizationRecruitmentApplicationDecisionsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly IRecruitmentApplicationWorkflowService _workflow;
        private readonly ILogger<OrganizationRecruitmentApplicationDecisionsController> _logger;

        public OrganizationRecruitmentApplicationDecisionsController(
            ApplicationDbContext db,
            IRecruitmentApplicationWorkflowService workflow,
            ILogger<OrganizationRecruitmentApplicationDecisionsController> logger)
        {
            _db = db;
            _workflow = workflow;
            _logger = logger;
        }

        [HttpPost("{applicationId:int}/accept")]
        public async Task<IActionResult> Accept(int applicationId)
        {
            var profile = await GetCurrentProfileAsync();
            if (profile == null)
                return NotFound(new { message = "Organization profile not found." });

            _logger.LogInformation(
                "POST recruitment accept applicationId={ApplicationId} orgProfileId={OrgId}",
                applicationId,
                profile.Id);

            var result = await _workflow.AcceptAsync(applicationId, profile.Id, HttpContext.RequestAborted);
            if (result == null)
                return NotFound(new { message = "Application not found." });

            return Ok(result);
        }

        [HttpPost("{applicationId:int}/reject")]
        public async Task<IActionResult> Reject(int applicationId)
        {
            var profile = await GetCurrentProfileAsync();
            if (profile == null)
                return NotFound(new { message = "Organization profile not found." });

            var result = await _workflow.RejectAsync(applicationId, profile.Id, HttpContext.RequestAborted);
            if (result == null)
                return NotFound(new { message = "Application not found." });

            return Ok(result);
        }

        private async Task<StudentAssociationProfile?> GetCurrentProfileAsync()
        {
            var userId = AuthorizationHelper.GetUserId(User);
            return await _db.StudentAssociationProfiles
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.UserId == userId);
        }
    }
}
