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
            var projects = await _db.StudentProjects
                .Include(p => p.Owner).ThenInclude(o => o.User)
                .Include(p => p.Members).ThenInclude(m => m.Student).ThenInclude(s => s.User)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();

            // [AI HOOK] Replace or augment the ordered list here with
            //           AI-ranked results once the matching service is ready.

            return Ok(projects.Select(MapToDto));
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
                return Ok(new { role = "owner", project = MapToDto(ownedProject) });

            // Check if the student is a team member in another project
            var membership = await _db.StudentProjectMembers
                .Include(m => m.Project)
                    .ThenInclude(p => p.Owner).ThenInclude(o => o.User)
                .Include(m => m.Project)
                    .ThenInclude(p => p.Members).ThenInclude(mem => mem.Student).ThenInclude(s => s.User)
                .FirstOrDefaultAsync(m => m.StudentId == student.Id);

            if (membership != null)
                return Ok(new { role = "member", project = MapToDto(membership.Project) });

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
            var project = await _db.StudentProjects
                .Include(p => p.Owner).ThenInclude(o => o.User)
                .Include(p => p.Members).ThenInclude(m => m.Student).ThenInclude(s => s.User)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (project == null)
                return NotFound(new { message = "Project not found." });

            // [AI HOOK] Attach AI insights to the response here (e.g., team
            //           compatibility score, suggested collaborators) when ready.

            return Ok(MapToDto(project));
        }

        // =====================================================================
        // POST /api/graduation-projects
        // Create a new project — students only.
        // Each student may own exactly one project at a time.
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
                OwnerId        = student.Id,
                Name           = dto.Name.Trim(),
                Description    = dto.Description?.Trim(),
                RequiredSkills = dto.RequiredSkills.Count > 0
                                    ? JsonSerializer.Serialize(dto.RequiredSkills)
                                    : null,
                PartnersCount  = dto.PartnersCount,
                CreatedAt      = DateTime.UtcNow,
                UpdatedAt      = DateTime.UtcNow,
            };

            _db.StudentProjects.Add(project);
            await _db.SaveChangesAsync();

            // Reload navigation properties for response mapping
            await _db.Entry(project).Reference(p => p.Owner).LoadAsync();
            await _db.Entry(project.Owner).Reference(o => o.User).LoadAsync();

            return StatusCode(201, MapToDto(project));
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

            if (dto.Name           != null) project.Name          = dto.Name.Trim();
            if (dto.Description    != null) project.Description   = dto.Description.Trim();
            if (dto.PartnersCount  != null) project.PartnersCount = dto.PartnersCount.Value;
            if (dto.RequiredSkills != null)
                project.RequiredSkills = dto.RequiredSkills.Count > 0
                    ? JsonSerializer.Serialize(dto.RequiredSkills)
                    : null;

            project.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();
            return Ok(MapToDto(project));
        }

        // =====================================================================
        // DELETE /api/graduation-projects/{id}
        // Delete a project and its entire team — project owner only.
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
        // A student cannot own a separate project and join another simultaneously.
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

            if (project.OwnerId == student.Id)
                return BadRequest(new { message = "You cannot join your own project as a member." });

            var conflict = await CheckProjectConflict(student.Id);
            if (conflict != null) return conflict;

            if (project.Members.Count >= project.PartnersCount)
                return BadRequest(new { message = "This project's team is already full." });

            _db.StudentProjectMembers.Add(new StudentProjectMember
            {
                ProjectId = project.Id,
                StudentId = student.Id,
                JoinedAt  = DateTime.UtcNow,
            });

            await _db.SaveChangesAsync();
            return Ok(new { message = "Successfully joined the project team." });
        }

        // =====================================================================
        // DELETE /api/graduation-projects/{id}/leave
        // Leave a project team — team members only (not the owner).
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

            _db.StudentProjectMembers.Remove(membership);
            await _db.SaveChangesAsync();

            return Ok(new { message = "You have left the project team." });
        }

        // ── Private Helpers ───────────────────────────────────────────────────

        /// <summary>
        /// Resolves the StudentProfile for the authenticated user.
        /// Returns null if the caller is not a student.
        /// </summary>
        private async Task<StudentProfile?> GetStudentProfileAsync()
        {
            if (AuthorizationHelper.GetRole(User) != "student") return null;
            var userId = AuthorizationHelper.GetUserId(User);
            return await _db.StudentProfiles.FirstOrDefaultAsync(s => s.UserId == userId);
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
        /// </summary>
        private static StudentProjectResponseDto MapToDto(StudentProject p) => new()
        {
            Id             = p.Id,
            OwnerId        = p.OwnerId,
            OwnerUserId    = p.Owner?.UserId ?? 0,
            OwnerName      = p.Owner?.User?.Name ?? "",
            Name           = p.Name,
            Description    = p.Description,
            RequiredSkills = p.RequiredSkills != null
                ? JsonSerializer.Deserialize<List<string>>(p.RequiredSkills) ?? new()
                : new(),
            PartnersCount  = p.PartnersCount,
            CurrentMembers = p.Members?.Count ?? 0,
            IsFull         = (p.Members?.Count ?? 0) >= p.PartnersCount,
            Members        = p.Members?.Select(m => new StudentProjectMemberDto
            {
                StudentId      = m.StudentId,
                UserId         = m.Student?.UserId ?? 0,
                Name           = m.Student?.User?.Name ?? "",
                Email          = m.Student?.User?.Email ?? "",
                University     = m.Student?.University ?? "",
                Major          = m.Student?.Major ?? "",
                ProfilePicture = m.Student?.ProfilePictureBase64,
                JoinedAt       = m.JoinedAt,
            }).ToList() ?? new(),
            CreatedAt      = p.CreatedAt,
            UpdatedAt      = p.UpdatedAt,
        };
    }
}
