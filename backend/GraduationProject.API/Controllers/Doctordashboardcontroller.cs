// Controllers/DoctorDashboardController.cs
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GraduationProject.API.Data;
using GraduationProject.API.Helpers;

namespace GraduationProject.API.Controllers
{
    /// <summary>
    /// Doctor Dashboard — supervised projects view and self-initiated supervision resignation.
    /// </summary>
    [ApiController]
    [Route("api/doctors/me")]
    [Authorize]
    public class DoctorDashboardController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        public DoctorDashboardController(ApplicationDbContext db) => _db = db;

        // =====================================================================
        // GET /api/doctors/me/supervised-projects
        //
        // Returns all projects where the logged-in doctor is the current supervisor.
        // Used by the Doctor Dashboard "My Projects" / "View Projects" section.
        //
        // Response per project:
        //   projectId, name, abstract, requiredSkills,
        //   owner { studentId, name, university, major },
        //   memberCount, partnersCount,
        //   createdAt
        // =====================================================================
        [HttpGet("supervised-projects")]
        public async Task<IActionResult> GetSupervisedProjects()
        {
            // ── 1. Doctor only ────────────────────────────────────────────────
            if (AuthorizationHelper.GetRole(User) != "doctor")
                return StatusCode(403, new { message = "Only doctors can access this endpoint." });

            var doctor = await GetCurrentDoctorProfileAsync();
            if (doctor == null)
                return NotFound(new { message = "Doctor profile not found." });

            // ── 2. Fetch projects supervised by this doctor ───────────────────
            var projects = await _db.StudentProjects
                .Where(p => p.SupervisorId == doctor.Id)
                .Include(p => p.Owner).ThenInclude(o => o.User)
                .Include(p => p.Members)
                .OrderByDescending(p => p.CreatedAt)
                .AsNoTracking()
                .ToListAsync();

            // ── 3. Map to response ────────────────────────────────────────────
            var result = projects.Select(p => new
            {
                projectId = p.Id,
                name = p.Name,
                description = p.Abstract,
                requiredSkills = p.RequiredSkills != null
                    ? JsonSerializer.Deserialize<List<string>>(p.RequiredSkills) ?? new List<string>()
                    : new List<string>(),
                partnersCount = p.PartnersCount,
                memberCount = p.Members.Count,
                isFull = p.Members.Count >= p.PartnersCount,
                owner = new
                {
                    studentId = p.OwnerId,
                    userId = p.Owner?.UserId ?? 0,
                    name = p.Owner?.User?.Name ?? "",
                    university = p.Owner?.University ?? "",
                    major = p.Owner?.Major ?? ""
                },
                createdAt = p.CreatedAt
            });

            return Ok(result);
        }

        // =====================================================================
        // GET /api/doctors/me/dashboard-summary
        //
        // Quick stats used by the top section of the Doctor Dashboard:
        //   - pendingRequestsCount  (supervisor requests waiting for response)
        //   - supervisedCount       (projects currently supervised)
        //   - pendingCancelCount    (pending cancellation requests)
        // =====================================================================
        [HttpGet("dashboard-summary")]
        public async Task<IActionResult> GetDashboardSummary()
        {
            if (AuthorizationHelper.GetRole(User) != "doctor")
                return StatusCode(403, new { message = "Only doctors can access this endpoint." });

            var doctor = await GetCurrentDoctorProfileAsync();
            if (doctor == null)
                return NotFound(new { message = "Doctor profile not found." });

            var pendingRequests = await _db.SupervisorRequests
                .CountAsync(r => r.DoctorId == doctor.Id && r.Status == "pending");

            var supervisedCount = await _db.StudentProjects
                .CountAsync(p => p.SupervisorId == doctor.Id);

            var pendingCancelRequests = await _db.SupervisorCancellationRequests
                .CountAsync(r => r.DoctorId == doctor.Id && r.Status == "pending");

            return Ok(new
            {
                pendingRequestsCount = pendingRequests,
                supervisedCount,
                pendingCancelCount = pendingCancelRequests
            });
        }

        // =====================================================================
        // POST /api/doctors/me/resign-supervision/{projectId}
        //
        // Allows the doctor to directly resign from supervising a project —
        // without requiring a student cancellation request first.
        //
        // Rules:
        //   - Caller must be the assigned supervisor of the project.
        //   - Sets project.SupervisorId = null immediately.
        //   - Cancels any open cancellation requests for this project (already resolved).
        //   - Adds a record to SupervisorCancellationRequests with status "accepted"
        //     so there is a clear audit trail of who resigned and when.
        // =====================================================================
        [HttpPost("resign-supervision/{projectId:int}")]
        public async Task<IActionResult> ResignSupervision(int projectId)
        {
            // ── 1. Doctor only ────────────────────────────────────────────────
            if (AuthorizationHelper.GetRole(User) != "doctor")
                return StatusCode(403, new { message = "Only doctors can access this endpoint." });

            var doctor = await GetCurrentDoctorProfileAsync();
            if (doctor == null)
                return NotFound(new { message = "Doctor profile not found." });

            // ── 2. Project exists ─────────────────────────────────────────────
            var project = await _db.StudentProjects
                .FirstOrDefaultAsync(p => p.Id == projectId);

            if (project == null)
                return NotFound(new { message = "Project not found." });

            // ── 3. This doctor must be the current supervisor ─────────────────
            if (project.SupervisorId != doctor.Id)
                return StatusCode(403, new { message = "You are not the supervisor of this project." });

            // ── 4. Remove supervision ─────────────────────────────────────────
            project.SupervisorId = null;

            // ── 5. Close any open cancellation requests for this project ──────
            //      (they're now moot — supervision already ended)
            var openCancelRequests = await _db.SupervisorCancellationRequests
                .Where(r => r.ProjectId == projectId
                         && r.DoctorId == doctor.Id
                         && r.Status == "pending")
                .ToListAsync();

            foreach (var r in openCancelRequests)
            {
                r.Status = "accepted";
                r.RespondedAt = DateTime.UtcNow;
            }

            // ── 6. Audit trail — only if no existing record covers this ───────
            //      (avoid duplicating if a student-initiated request was just closed above)
            var auditAlreadyExists = openCancelRequests.Any();
            if (!auditAlreadyExists)
            {
                // Find the project leader to fill SenderId (required FK, not nullable)
                var leader = await _db.StudentProjectMembers
                    .FirstOrDefaultAsync(m => m.ProjectId == projectId && m.Role == "leader");

                // Fallback: use owner as sender when no explicit leader row exists
                var senderId = leader?.StudentId ?? project.OwnerId;

                _db.SupervisorCancellationRequests.Add(new Models.SupervisorCancellationRequest
                {
                    ProjectId = projectId,
                    DoctorId = doctor.Id,
                    SenderId = senderId,
                    Status = "accepted",
                    CreatedAt = DateTime.UtcNow,
                    RespondedAt = DateTime.UtcNow
                });
            }

            await _db.SaveChangesAsync();

            return Ok(new { message = "You have successfully resigned from supervising this project." });
        }

        // ── Private Helper ────────────────────────────────────────────────────

        private async Task<Models.DoctorProfile?> GetCurrentDoctorProfileAsync()
        {
            var userId = AuthorizationHelper.GetUserId(User);
            return await _db.DoctorProfiles.FirstOrDefaultAsync(d => d.UserId == userId);
        }
    }
}