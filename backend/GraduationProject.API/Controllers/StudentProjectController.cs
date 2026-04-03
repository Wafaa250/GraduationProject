// Controllers/StudentProjectController.cs
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GraduationProject.API.Data;
using GraduationProject.API.DTOs;
using GraduationProject.API.Helpers;
using GraduationProject.API.Models;

namespace GraduationProject.API.Controllers
{
    /// <summary>
    /// Core Project Engine of the platform.
    /// Handles project creation, discovery, team formation, and membership.
    ///
    /// Future integrations planned:
    ///   - AI-based project recommendations
    ///   - AI-assisted team matching
    ///   - Invitation system
    /// </summary>
    [ApiController]
    [Route("api/graduation-projects")]
    [Authorize]
    public class StudentProjectController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        public StudentProjectController(ApplicationDbContext db) => _db = db;

        // =====================================================================
        // GET /api/graduation-projects
        // Project Discovery — returns all projects for browsing and search.
        //
        // [AI HOOK] Future: inject AI-ranked recommendations based on
        //           the current student's skills and profile before returning.
        // =====================================================================
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var callerProfileId = await GetCurrentStudentProfileIdAsync();

            var projects = await _db.StudentProjects
                .Include(p => p.Owner).ThenInclude(o => o.User)
                .Include(p => p.Members).ThenInclude(m => m.Student).ThenInclude(s => s.User)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();

            // [AI HOOK] Replace or augment the ordered list here with
            //           AI-ranked results once the matching service is ready.

            return Ok(projects.Select(p => MapToDto(p, callerProfileId)));
        }

        // =====================================================================
        // GET /api/graduation-projects/my
        // Returns the current student's project — either as owner or team member.
        // =====================================================================
        [HttpGet("my")]
        public async Task<IActionResult> GetMy()
        {
            var student = await GetStudentProfileAsync();
            if (student == null) return Forbid();

            // Check if the student owns a project
            var ownedProject = await _db.StudentProjects
                .Include(p => p.Owner).ThenInclude(o => o.User)
                .Include(p => p.Members).ThenInclude(m => m.Student).ThenInclude(s => s.User)
                .FirstOrDefaultAsync(p => p.OwnerId == student.Id);

            if (ownedProject != null)
                return Ok(new { role = "owner", project = MapToDto(ownedProject, student.Id) });

            // Check if the student is a team member in another project
            var membership = await _db.StudentProjectMembers
                .Include(m => m.Project)
                    .ThenInclude(p => p.Owner).ThenInclude(o => o.User)
                .Include(m => m.Project)
                    .ThenInclude(p => p.Members).ThenInclude(mem => mem.Student).ThenInclude(s => s.User)
                .FirstOrDefaultAsync(m => m.StudentId == student.Id);

            if (membership != null)
                return Ok(new { role = "member", project = MapToDto(membership.Project, student.Id) });

            // Student has no project affiliation
            return Ok(new { role = (string?)null, project = (object?)null });
        }

        // =====================================================================
        // GET /api/graduation-projects/{id}
        // Project Workspace — returns full details for a single project.
        //
        // [AI HOOK] Future: attach AI-generated suggestions here, such as
        //           recommended team members or similar projects.
        // =====================================================================
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var callerProfileId = await GetCurrentStudentProfileIdAsync();

            var project = await _db.StudentProjects
                .Include(p => p.Owner).ThenInclude(o => o.User)
                .Include(p => p.Members).ThenInclude(m => m.Student).ThenInclude(s => s.User)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (project == null)
                return NotFound(new { message = "Project not found." });

            // [AI HOOK] Attach AI insights to the response here (e.g., team
            //           compatibility score, suggested collaborators) when ready.

            return Ok(MapToDto(project, callerProfileId));
        }

        // =====================================================================
        // GET /api/graduation-projects/{id}/members
        // Returns the member list for a single project.
        // Useful for frontend components that only need the team, not full details.
        // =====================================================================
        [HttpGet("{id:int}/members")]
        public async Task<IActionResult> GetMembers(int id)
        {
            var project = await _db.StudentProjects
                .Include(p => p.Members).ThenInclude(m => m.Student).ThenInclude(s => s.User)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (project == null)
                return NotFound(new { message = "Project not found." });

            var members = (project.Members ?? new List<StudentProjectMember>())
                .Select(m => new StudentProjectMemberDto
                {
                    StudentId = m.StudentId,
                    UserId = m.Student?.UserId ?? 0,
                    Name = m.Student?.User?.Name ?? "",
                    Email = m.Student?.User?.Email ?? "",
                    University = m.Student?.University ?? "",
                    Major = m.Student?.Major ?? "",
                    ProfilePicture = m.Student?.ProfilePictureBase64,
                    Role = m.Role,
                    JoinedAt = m.JoinedAt,
                })
                .ToList();

            return Ok(new
            {
                projectId = project.Id,
                currentMembers = members.Count,
                totalCapacity = project.PartnersCount + 1,
                remainingSeats = Math.Max(0, project.PartnersCount + 1 - members.Count),
                members
            });
        }

        // =====================================================================
        // POST /api/graduation-projects
        // Create a new project — students only.
        // Each student may own exactly one project at a time.
        //
        // After the project is saved, the owner is automatically inserted as
        // the first member with Role = "leader".  This keeps the Members list
        // consistent: every project always has its owner inside the team.
        // =====================================================================
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateStudentProjectDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var student = await GetStudentProfileAsync();
            if (student == null) return Forbid();

            var conflict = await CheckProjectConflict(student.Id);
            if (conflict != null) return conflict;

            var project = new StudentProject
            {
                OwnerId = student.Id,
                Name = dto.Name.Trim(),
                Description = dto.Description?.Trim(),
                RequiredSkills = dto.RequiredSkills.Count > 0
                                    ? JsonSerializer.Serialize(dto.RequiredSkills)
                                    : null,
                PartnersCount = dto.PartnersCount,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            };

            _db.StudentProjects.Add(project);
            await _db.SaveChangesAsync();  // project.Id is now available

            // ── Auto-insert owner as leader ───────────────────────────────────
            // Guard: skip if the record already exists (idempotency safety).
            var leaderExists = await _db.StudentProjectMembers
                .AnyAsync(m => m.ProjectId == project.Id && m.StudentId == project.OwnerId);

            if (!leaderExists)
            {
                _db.StudentProjectMembers.Add(new StudentProjectMember
                {
                    ProjectId = project.Id,
                    StudentId = project.OwnerId,
                    Role = "leader",
                    JoinedAt = DateTime.UtcNow,
                });
                await _db.SaveChangesAsync();
            }

            // Reload full navigation properties for response mapping
            await _db.Entry(project).Reference(p => p.Owner).LoadAsync();
            await _db.Entry(project.Owner).Reference(o => o.User).LoadAsync();
            await _db.Entry(project).Collection(p => p.Members).Query()
                .Include(m => m.Student).ThenInclude(s => s.User)
                .LoadAsync();

            return StatusCode(201, MapToDto(project, student.Id));
        }

        // =====================================================================
        // PUT /api/graduation-projects/{id}
        // Update project details — project owner only.
        // =====================================================================
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateStudentProjectDto dto)
        {
            var student = await GetStudentProfileAsync();
            if (student == null) return Forbid();

            var project = await _db.StudentProjects
                .Include(p => p.Owner).ThenInclude(o => o.User)
                .Include(p => p.Members).ThenInclude(m => m.Student).ThenInclude(s => s.User)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (project == null)
                return NotFound(new { message = "Project not found." });

            if (project.OwnerId != student.Id)
                return Forbid();

            if (dto.Name != null) project.Name = dto.Name.Trim();
            if (dto.Description != null) project.Description = dto.Description.Trim();
            if (dto.PartnersCount != null) project.PartnersCount = dto.PartnersCount.Value;
            if (dto.RequiredSkills != null)
                project.RequiredSkills = dto.RequiredSkills.Count > 0
                    ? JsonSerializer.Serialize(dto.RequiredSkills)
                    : null;

            project.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();
            return Ok(MapToDto(project, student.Id));
        }

        // =====================================================================
        // DELETE /api/graduation-projects/{id}
        // Delete a project and its entire team — project owner only.
        // (Cascade delete on graduation_project_members handles member cleanup.)
        // =====================================================================
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var student = await GetStudentProfileAsync();
            if (student == null) return Forbid();

            var project = await _db.StudentProjects
                .FirstOrDefaultAsync(p => p.Id == id);

            if (project == null)
                return NotFound(new { message = "Project not found." });

            if (project.OwnerId != student.Id)
                return Forbid();

            _db.StudentProjects.Remove(project);
            await _db.SaveChangesAsync();

            return Ok(new { message = "Project deleted successfully." });
        }

        // =====================================================================
        // POST /api/graduation-projects/{id}/join
        // Join a project as a team member.
        //
        // Validation order (each returns a distinct error):
        //   1. Caller must be a student
        //   2. Project must exist
        //   3. Owner cannot join their own project
        //   4. Student must not already be a member of THIS project
        //   5. Student must not own or be a member of ANY other project
        //   6. Project must not be full (capacity = PartnersCount + 1)
        //
        // On success: returns the updated CurrentMembers count.
        //
        // [AI HOOK] Future: validate AI-based team compatibility before allowing
        //           the join, or surface a compatibility score to the student.
        // =====================================================================
        [HttpPost("{id:int}/join")]
        public async Task<IActionResult> Join(int id)
        {
            var student = await GetStudentProfileAsync();
            if (student == null) return Forbid();

            var project = await _db.StudentProjects
                .Include(p => p.Members)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (project == null)
                return NotFound(new { message = "Project not found." });

            // 1. Owner cannot join their own project
            if (project.OwnerId == student.Id)
                return BadRequest(new { message = "You cannot join your own project as a member." });

            // 2. Already a member of THIS specific project
            var alreadyInThisProject = project.Members.Any(m => m.StudentId == student.Id);
            if (alreadyInThisProject)
                return BadRequest(new { message = "You are already a member of this project." });

            // 3. Owns or is a member of any other project
            var conflict = await CheckProjectConflict(student.Id);
            if (conflict != null) return conflict;

            // 4. Project is full — capacity = PartnersCount + 1 (leader slot included)
            if (project.Members.Count >= project.PartnersCount + 1)
                return BadRequest(new { message = "This project's team is already full." });

            _db.StudentProjectMembers.Add(new StudentProjectMember
            {
                ProjectId = project.Id,
                StudentId = student.Id,
                Role = "member",
                JoinedAt = DateTime.UtcNow,
            });

            await _db.SaveChangesAsync();

            var updatedCount = project.Members.Count + 1; // +1 for the just-added member
            return Ok(new
            {
                message = "Successfully joined the project team.",
                currentMembers = updatedCount
            });
        }

        // =====================================================================
        // DELETE /api/graduation-projects/{id}/leave
        // Leave a project team — Role = "member" only.
        //
        // The project owner (leader) cannot leave — they must delete the project.
        // =====================================================================
        [HttpDelete("{id:int}/leave")]
        public async Task<IActionResult> Leave(int id)
        {
            var student = await GetStudentProfileAsync();
            if (student == null) return Forbid();

            var membership = await _db.StudentProjectMembers
                .FirstOrDefaultAsync(m => m.ProjectId == id && m.StudentId == student.Id);

            if (membership == null)
                return NotFound(new { message = "You are not a member of this project." });

            // Owner/leader cannot leave — they must delete the project instead
            if (membership.Role == "leader")
                return BadRequest(new { message = "Project owner cannot leave the project. Delete the project instead." });

            _db.StudentProjectMembers.Remove(membership);
            await _db.SaveChangesAsync();

            return Ok(new { message = "You have left the project team." });
        }

        // =====================================================================
        // POST /api/graduation-projects/{projectId}/invite/{receiverId}
        // Send an invitation to a student to join the project.
        // Only the project owner can send invites.
        // =====================================================================
        [HttpPost("{projectId:int}/invite/{receiverId:int}")]
        public async Task<IActionResult> SendInvitation(int projectId, int receiverId)
        {
            var senderProfile = await GetStudentProfileAsync();
            if (senderProfile == null)
                return Forbid();

            // ── 1. Project exists ─────────────────────────────────────────────
            var project = await _db.StudentProjects
                .Include(p => p.Members)
                .FirstOrDefaultAsync(p => p.Id == projectId);

            if (project == null)
                return NotFound(new { message = "Project not found." });

            // ── 2. Current user is the owner ──────────────────────────────────
            if (project.OwnerId != senderProfile.Id)
                return StatusCode(403, new { message = "Not authorized." });

            // ── 3. Receiver exists and is not the owner ───────────────────────
            var receiverExists = await _db.StudentProfiles
                .AnyAsync(s => s.Id == receiverId);

            if (!receiverExists)
                return NotFound(new { message = "Receiver not found." });

            if (receiverId == senderProfile.Id)
                return BadRequest(new { message = "You cannot invite yourself." });

            // ── 4. Project is not full ────────────────────────────────────────
            // TotalCapacity = PartnersCount + 1 (leader slot included)
            if (project.Members.Count >= project.PartnersCount + 1)
                return BadRequest(new { message = "Project is full." });

            // ── 5. Receiver is not already a member ───────────────────────────
            var alreadyMember = project.Members.Any(m => m.StudentId == receiverId);
            if (alreadyMember)
                return BadRequest(new { message = "User already a member." });

            // ── 6. No existing pending invitation ────────────────────────────
            var pendingExists = await _db.ProjectInvitations
                .AnyAsync(i =>
                    i.ProjectId == projectId &&
                    i.ReceiverId == receiverId &&
                    i.Status == "pending");

            if (pendingExists)
                return Conflict(new { message = "Invitation already sent." });

            // ── 7. Create invitation ──────────────────────────────────────────
            var invitation = new ProjectInvitation
            {
                ProjectId = projectId,
                SenderId = senderProfile.Id,
                ReceiverId = receiverId,
                Status = "pending",
                CreatedAt = DateTime.UtcNow,
                RespondedAt = null
            };

            _db.ProjectInvitations.Add(invitation);
            await _db.SaveChangesAsync();

            return StatusCode(201, new
            {
                message = "Invitation sent successfully.",
                invitationId = invitation.Id
            });
        }

        // ── Private Helpers ───────────────────────────────────────────────────

        /// <summary>
        /// Resolves the full StudentProfile for the authenticated user.
        /// Returns null if the caller is not a student.
        /// </summary>
        private async Task<StudentProfile?> GetStudentProfileAsync()
        {
            if (AuthorizationHelper.GetRole(User) != "student") return null;
            var userId = AuthorizationHelper.GetUserId(User);
            return await _db.StudentProfiles.FirstOrDefaultAsync(s => s.UserId == userId);
        }

        /// <summary>
        /// Returns the StudentProfile.Id of the authenticated user,
        /// or null if the caller is not a student (e.g. doctor, company, admin).
        /// Used to populate IsOwner in MapToDto without requiring a full profile load.
        /// </summary>
        private async Task<int?> GetCurrentStudentProfileIdAsync()
        {
            if (AuthorizationHelper.GetRole(User) != "student") return null;
            var userId = AuthorizationHelper.GetUserId(User);
            var profile = await _db.StudentProfiles
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.UserId == userId);
            return profile?.Id;
        }

        /// <summary>
        /// Ensures a student is not already affiliated with any project
        /// (neither as an owner nor as a team member).
        /// Returns a conflict IActionResult if a violation is found, otherwise null.
        /// </summary>
        private async Task<IActionResult?> CheckProjectConflict(int studentId)
        {
            var ownsProject = await _db.StudentProjects
                .AnyAsync(p => p.OwnerId == studentId);
            if (ownsProject)
                return Conflict(new { message = "You already own a project." });

            var isMember = await _db.StudentProjectMembers
                .AnyAsync(m => m.StudentId == studentId);
            if (isMember)
                return Conflict(new { message = "You are already a member of another project." });

            return null;
        }

        /// <summary>
        /// Maps a StudentProject entity to its response DTO.
        ///
        /// IsFull / capacity logic:
        ///   PartnersCount   = number of NON-owner partners allowed.
        ///   TotalCapacity   = PartnersCount + 1  (leader occupies one slot)
        ///   IsFull          = CurrentMembers >= TotalCapacity
        ///   RemainingSeats  = max(0, TotalCapacity - CurrentMembers)
        ///
        /// IsOwner:
        ///   Compared against callerProfileId (StudentProfile.Id).
        ///   Null-safe — non-student callers simply get IsOwner = false.
        ///
        /// Role:
        ///   Each member's Role comes directly from the DB ("leader" | "member").
        /// </summary>
        private static StudentProjectResponseDto MapToDto(StudentProject p, int? callerProfileId)
        {
            var members = p.Members?.ToList() ?? new();
            var totalCapacity = p.PartnersCount + 1;           // +1 for the leader slot
            var currentCount = members.Count;

            return new StudentProjectResponseDto
            {
                Id = p.Id,
                OwnerId = p.OwnerId,
                OwnerUserId = p.Owner?.UserId ?? 0,
                OwnerName = p.Owner?.User?.Name ?? "",
                Name = p.Name,
                Description = p.Description,
                RequiredSkills = p.RequiredSkills != null
                    ? JsonSerializer.Deserialize<List<string>>(p.RequiredSkills) ?? new()
                    : new(),
                PartnersCount = p.PartnersCount,
                CurrentMembers = currentCount,
                IsFull = currentCount >= totalCapacity,
                IsOwner = callerProfileId.HasValue && p.OwnerId == callerProfileId.Value,
                RemainingSeats = Math.Max(0, totalCapacity - currentCount),
                Members = members.Select(m => new StudentProjectMemberDto
                {
                    StudentId = m.StudentId,
                    UserId = m.Student?.UserId ?? 0,
                    Name = m.Student?.User?.Name ?? "",
                    Email = m.Student?.User?.Email ?? "",
                    University = m.Student?.University ?? "",
                    Major = m.Student?.Major ?? "",
                    ProfilePicture = m.Student?.ProfilePictureBase64,
                    Role = m.Role,   // "leader" | "member" from DB
                    JoinedAt = m.JoinedAt,
                }).ToList(),
                CreatedAt = p.CreatedAt,
                UpdatedAt = p.UpdatedAt,
            };
        }
    }
}