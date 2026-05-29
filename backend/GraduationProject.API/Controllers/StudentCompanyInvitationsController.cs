using System;
using System.Threading.Tasks;
using GraduationProject.API.Data;
using GraduationProject.API.Helpers;
using GraduationProject.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GraduationProject.API.Controllers
{
    [ApiController]
    [Route("api/student/company-invitations")]
    [Authorize(Roles = "student")]
    public class StudentCompanyInvitationsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ICompanyRequestInvitationService _invitations;

        public StudentCompanyInvitationsController(
            ApplicationDbContext db,
            ICompanyRequestInvitationService invitations)
        {
            _db = db;
            _invitations = invitations;
        }

        /// <summary>GET /api/student/company-invitations</summary>
        [HttpGet]
        public async Task<IActionResult> List()
        {
            var studentProfile = await RequireStudentProfileAsync();
            if (studentProfile == null) return NotFoundProfile();

            var list = await _invitations.ListStudentInvitationsAsync(studentProfile.Id);
            return Ok(list);
        }

        /// <summary>GET /api/student/company-invitations/{id}</summary>
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var studentProfile = await RequireStudentProfileAsync();
            if (studentProfile == null) return NotFoundProfile();

            var invitation = await _invitations.GetStudentInvitationByIdAsync(studentProfile.Id, id);
            return invitation == null ? NotFound(new { message = "Invitation not found." }) : Ok(invitation);
        }

        /// <summary>POST /api/student/company-invitations/{id}/accept</summary>
        [HttpPost("{id:int}/accept")]
        public async Task<IActionResult> Accept(int id)
        {
            var studentProfile = await RequireStudentProfileAsync();
            if (studentProfile == null) return NotFoundProfile();

            try
            {
                var updated = await _invitations.AcceptAsync(studentProfile.Id, id);
                return updated == null ? NotFound(new { message = "Invitation not found." }) : Ok(updated);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>POST /api/student/company-invitations/{id}/reject</summary>
        [HttpPost("{id:int}/reject")]
        public async Task<IActionResult> Reject(int id)
        {
            var studentProfile = await RequireStudentProfileAsync();
            if (studentProfile == null) return NotFoundProfile();

            try
            {
                var updated = await _invitations.RejectAsync(studentProfile.Id, id);
                return updated == null ? NotFound(new { message = "Invitation not found." }) : Ok(updated);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        private async Task<Models.StudentProfile?> RequireStudentProfileAsync()
        {
            var userId = AuthorizationHelper.GetUserId(User);
            return await _db.StudentProfiles
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.UserId == userId);
        }

        private IActionResult NotFoundProfile() =>
            NotFound(new { message = "Student profile not found." });
    }
}
