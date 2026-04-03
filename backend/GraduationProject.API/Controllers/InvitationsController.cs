// Controllers/InvitationsController.cs
using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GraduationProject.API.Data;
using GraduationProject.API.Helpers;
using GraduationProject.API.Models;

namespace GraduationProject.API.Controllers
{
    [ApiController]
    [Route("api/invitations")]
    [Authorize]
    public class InvitationsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        public InvitationsController(ApplicationDbContext db) => _db = db;

        // =====================================================================
        // GET /api/invitations/received
        // Returns all invitations received by the current student.
        // =====================================================================
        [HttpGet("received")]
        public async Task<IActionResult> GetReceivedInvitations()
        {
            var student = await GetStudentProfileAsync();
            if (student == null) return Forbid();

            var invitations = await _db.ProjectInvitations
                .Include(i => i.Project)
                .Include(i => i.Sender).ThenInclude(s => s.User)
                .Where(i => i.ReceiverId == student.Id)
                .OrderByDescending(i => i.CreatedAt)
                .Select(i => new
                {
                    invitationId = i.Id,
                    projectId = i.ProjectId,
                    projectName = i.Project.Name,
                    senderName = i.Sender.User.Name,
                    status = i.Status,
                    createdAt = i.CreatedAt
                })
                .ToListAsync();

            return Ok(invitations);
        }

        // =====================================================================
        // GET /api/invitations/sent/{projectId}
        // Returns all invitations sent for a specific project.
        // Only the project owner can access.
        // =====================================================================
        [HttpGet("sent/{projectId:int}")]
        public async Task<IActionResult> GetSentInvitations(int projectId)
        {
            var student = await GetStudentProfileAsync();
            if (student == null) return Forbid();

            // ── 1. Project exists ─────────────────────────────────────────────
            var project = await _db.StudentProjects
                .FirstOrDefaultAsync(p => p.Id == projectId);

            if (project == null)
                return NotFound(new { message = "Project not found." });

            // ── 2. Current user is the owner ──────────────────────────────────
            if (project.OwnerId != student.Id)
                return StatusCode(403, new { message = "Not authorized." });

            // ── 3. Fetch and return invitations ───────────────────────────────
            var invitations = await _db.ProjectInvitations
                .Include(i => i.Receiver).ThenInclude(r => r.User)
                .Where(i => i.ProjectId == projectId)
                .OrderByDescending(i => i.CreatedAt)
                .Select(i => new
                {
                    invitationId = i.Id,
                    receiverId = i.ReceiverId,
                    receiverName = i.Receiver.User.Name,
                    status = i.Status,
                    createdAt = i.CreatedAt
                })
                .ToListAsync();

            return Ok(invitations);
        }

        // =====================================================================
        // POST /api/invitations/{id}/accept
        // Accept a pending invitation — receiver only.
        // =====================================================================
        [HttpPost("{id:int}/accept")]
        public async Task<IActionResult> AcceptInvitation(int id)
        {
            var student = await GetStudentProfileAsync();
            if (student == null) return Forbid();

            // ── 1. Invitation exists ──────────────────────────────────────────
            var invitation = await _db.ProjectInvitations
                .FirstOrDefaultAsync(i => i.Id == id);

            if (invitation == null)
                return NotFound(new { message = "Invitation not found." });

            // ── 2. Current user is the receiver ──────────────────────────────
            if (invitation.ReceiverId != student.Id)
                return StatusCode(403, new { message = "Not authorized." });

            // ── 3. Invitation is still pending ───────────────────────────────
            if (invitation.Status != "pending")
                return BadRequest(new { message = "Invitation already processed." });

            // ── 4. Load project with members ─────────────────────────────────
            var project = await _db.StudentProjects
                .Include(p => p.Members)
                .FirstOrDefaultAsync(p => p.Id == invitation.ProjectId);

            if (project == null)
                return NotFound(new { message = "Project not found." });

            // ── 5. Project is not full ────────────────────────────────────────
            // TotalCapacity = PartnersCount + 1 (leader slot included)
            if (project.Members.Count >= project.PartnersCount + 1)
                return BadRequest(new { message = "Project is full." });

            // ── 6. Student is not already a member ───────────────────────────
            var alreadyMember = project.Members.Any(m => m.StudentId == student.Id);
            if (alreadyMember)
                return BadRequest(new { message = "Already a member." });

            // ── 7. Transaction: add member + update invitation + expire others ─
            await using var transaction = await _db.Database.BeginTransactionAsync();
            try
            {
                _db.StudentProjectMembers.Add(new StudentProjectMember
                {
                    ProjectId = project.Id,
                    StudentId = student.Id,
                    Role = "member",
                    JoinedAt = DateTime.UtcNow,
                });

                invitation.Status = "accepted";
                invitation.RespondedAt = DateTime.UtcNow;

                // Expire all other pending invitations for this project.
                // Prevents a race condition where multiple students accept
                // simultaneously and overfill the team.
                var otherPending = await _db.ProjectInvitations
                    .Where(i =>
                        i.ProjectId == project.Id &&
                        i.Status == "pending" &&
                        i.Id != invitation.Id)
                    .ToListAsync();

                foreach (var other in otherPending)
                {
                    other.Status = "expired";
                    other.RespondedAt = DateTime.UtcNow;
                }

                await _db.SaveChangesAsync();
                await transaction.CommitAsync();
            }
            catch
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new { message = "Something went wrong. Please try again." });
            }

            return Ok(new { message = "Invitation accepted. You have joined the project." });
        }

        // =====================================================================
        // POST /api/invitations/{id}/reject
        // Reject a pending invitation — receiver only.
        // =====================================================================
        [HttpPost("{id:int}/reject")]
        public async Task<IActionResult> RejectInvitation(int id)
        {
            var student = await GetStudentProfileAsync();
            if (student == null) return Forbid();

            // ── 1. Invitation exists ──────────────────────────────────────────
            var invitation = await _db.ProjectInvitations
                .FirstOrDefaultAsync(i => i.Id == id);

            if (invitation == null)
                return NotFound(new { message = "Invitation not found." });

            // ── 2. Current user is the receiver ──────────────────────────────
            if (invitation.ReceiverId != student.Id)
                return StatusCode(403, new { message = "Not authorized." });

            // ── 3. Invitation is still pending ───────────────────────────────
            if (invitation.Status != "pending")
                return BadRequest(new { message = "Invitation already processed." });

            // ── 4. Update status ─────────────────────────────────────────────
            invitation.Status = "rejected";
            invitation.RespondedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();

            return Ok(new { message = "Invitation rejected." });
        }

        // =====================================================================
        // POST /api/invitations/{id}/cancel
        // Cancel a pending invitation — sender (project owner) only.
        // =====================================================================
        [HttpPost("{id:int}/cancel")]
        public async Task<IActionResult> CancelInvitation(int id)
        {
            var student = await GetStudentProfileAsync();
            if (student == null) return Forbid();

            // ── 1. Invitation exists ──────────────────────────────────────────
            var invitation = await _db.ProjectInvitations
                .FirstOrDefaultAsync(i => i.Id == id);

            if (invitation == null)
                return NotFound(new { message = "Invitation not found." });

            // ── 2. Current user is the sender ─────────────────────────────────
            if (invitation.SenderId != student.Id)
                return StatusCode(403, new { message = "Not authorized." });

            // ── 3. Invitation is still pending ───────────────────────────────
            if (invitation.Status != "pending")
                return BadRequest(new { message = "Invitation already processed." });

            // ── 4. Update status ─────────────────────────────────────────────
            invitation.Status = "cancelled";
            invitation.RespondedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();

            return Ok(new { message = "Invitation cancelled." });
        }

        // ── Private Helpers ───────────────────────────────────────────────────

        private async Task<StudentProfile?> GetStudentProfileAsync()
        {
            if (AuthorizationHelper.GetRole(User) != "student") return null;
            var userId = AuthorizationHelper.GetUserId(User);
            return await _db.StudentProfiles.FirstOrDefaultAsync(s => s.UserId == userId);
        }
    }
}