// Controllers/ProjectController.cs
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
using GraduationProject.API.Services;

namespace GraduationProject.API.Controllers
{
    [ApiController]
    [Route("api/doctor/channels/{channelId}/projects")]
    [Authorize]
    public class ProjectController : ControllerBase
    {
        private readonly ApplicationDbContext  _db;
        private readonly IFileStorageService   _storage;

        public ProjectController(ApplicationDbContext db, IFileStorageService storage)
        {
            _db      = db;
            _storage = storage;
        }

        [HttpGet]
        public async Task<IActionResult> GetProjects(int channelId)
        {
            var doctorId = GetDoctorProfileId();
            if (doctorId == null) return Forbid();

            var channel = await _db.Channels
                .FirstOrDefaultAsync(c => c.Id == channelId && c.DoctorId == doctorId);
            if (channel == null)
                return NotFound(new { message = "Channel not found." });

            var projects = await _db.Projects
                .Where(p => p.ChannelId == channelId)
                .Include(p => p.Teams)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();

            return Ok(projects.Select(p => MapToDto(p)));
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetProject(int channelId, int id)
        {
            var doctorId = GetDoctorProfileId();
            if (doctorId == null) return Forbid();

            var project = await _db.Projects
                .Include(p => p.Teams)
                    .ThenInclude(t => t.TeamMembers)
                        .ThenInclude(tm => tm.Student)
                            .ThenInclude(s => s.User)
                .Include(p => p.Channel)
                .FirstOrDefaultAsync(p => p.Id == id
                                       && p.ChannelId == channelId
                                       && p.Channel.DoctorId == doctorId);

            if (project == null)
                return NotFound(new { message = "Project not found." });

            return Ok(MapToDto(project));
        }

        [HttpPost]
        public async Task<IActionResult> CreateProject(int channelId, [FromBody] CreateProjectDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var doctorId = GetDoctorProfileId();
            if (doctorId == null) return Forbid();

            var channel = await _db.Channels
                .FirstOrDefaultAsync(c => c.Id == channelId && c.DoctorId == doctorId);
            if (channel == null)
                return NotFound(new { message = "Channel not found." });

            if (dto.FormationMode != "students" && dto.FormationMode != "doctor")
                return BadRequest(new { message = "FormationMode must be 'students' or 'doctor'." });

            // ── File via storage service (swap service = swap storage backend) ─
            string? filePath = null;
            if (!string.IsNullOrEmpty(dto.FileBase64) && !string.IsNullOrEmpty(dto.FileName))
            {
                try   { filePath = await _storage.SaveAsync(dto.FileBase64, dto.FileName, "projects"); }
                catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
            }

            var project = new Project
            {
                ChannelId      = channelId,
                Name           = dto.Name.Trim(),
                Description    = dto.Description?.Trim(),
                FormationMode  = dto.FormationMode,
                PublishDate    = dto.PublishDate.HasValue ? DateTime.SpecifyKind(dto.PublishDate.Value, DateTimeKind.Utc) : null,
                DueDate        = dto.DueDate.HasValue    ? DateTime.SpecifyKind(dto.DueDate.Value,    DateTimeKind.Utc) : null,
                Weight         = dto.Weight,
                MaxTeamSize    = dto.MaxTeamSize,
                RequiredSkills = dto.RequiredSkills.Count > 0 ? JsonSerializer.Serialize(dto.RequiredSkills) : null,
                FilePath       = filePath,
                CreatedAt      = DateTime.UtcNow,
            };

            _db.Projects.Add(project);
            await _db.SaveChangesAsync();
            return StatusCode(201, MapToDto(project));
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateProject(int channelId, int id, [FromBody] UpdateProjectDto dto)
        {
            var doctorId = GetDoctorProfileId();
            if (doctorId == null) return Forbid();

            var project = await _db.Projects
                .Include(p => p.Channel)
                .FirstOrDefaultAsync(p => p.Id == id && p.ChannelId == channelId && p.Channel.DoctorId == doctorId);

            if (project == null)
                return NotFound(new { message = "Project not found." });

            if (dto.Name           != null) project.Name          = dto.Name.Trim();
            if (dto.Description    != null) project.Description   = dto.Description.Trim();
            if (dto.FormationMode  != null) project.FormationMode = dto.FormationMode;
            if (dto.PublishDate    != null) project.PublishDate   = DateTime.SpecifyKind(dto.PublishDate.Value, DateTimeKind.Utc);
            if (dto.DueDate        != null) project.DueDate       = DateTime.SpecifyKind(dto.DueDate.Value,    DateTimeKind.Utc);
            if (dto.Weight         != null) project.Weight        = dto.Weight;
            if (dto.MaxTeamSize    != null) project.MaxTeamSize   = dto.MaxTeamSize;
            if (dto.RequiredSkills != null)
                project.RequiredSkills = dto.RequiredSkills.Count > 0 ? JsonSerializer.Serialize(dto.RequiredSkills) : null;

            await _db.SaveChangesAsync();
            return Ok(MapToDto(project));
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProject(int channelId, int id)
        {
            var doctorId = GetDoctorProfileId();
            if (doctorId == null) return Forbid();

            var project = await _db.Projects
                .Include(p => p.Channel)
                .FirstOrDefaultAsync(p => p.Id == id && p.ChannelId == channelId && p.Channel.DoctorId == doctorId);

            if (project == null)
                return NotFound(new { message = "Project not found." });

            // Delete physical file through the storage abstraction
            if (!string.IsNullOrEmpty(project.FilePath))
                await _storage.DeleteAsync(project.FilePath);

            _db.Projects.Remove(project);
            await _db.SaveChangesAsync();
            return Ok(new { message = "Project deleted successfully." });
        }

        // ── Helpers ──────────────────────────────────────────────────────────

        private ProjectResponseDto MapToDto(Project p) => new()
        {
            Id             = p.Id,
            ChannelId      = p.ChannelId,
            Name           = p.Name,
            Description    = p.Description,
            FormationMode  = p.FormationMode,
            PublishDate    = p.PublishDate,
            DueDate        = p.DueDate,
            Weight         = p.Weight,
            MaxTeamSize    = p.MaxTeamSize,
            RequiredSkills = p.RequiredSkills != null
                ? JsonSerializer.Deserialize<List<string>>(p.RequiredSkills) ?? new() : new(),
            HasFile        = p.FilePath != null,
            FilePath       = p.FilePath != null ? _storage.GetUrl(p.FilePath) : null,
            TeamCount      = p.Teams?.Count ?? 0,
            CreatedAt      = p.CreatedAt,
        };

        private int? GetDoctorProfileId()
        {
            var role    = AuthorizationHelper.GetRole(User);
            if (role != "doctor") return null;
            var userId  = AuthorizationHelper.GetUserId(User);
            var profile = _db.DoctorProfiles.FirstOrDefault(d => d.UserId == userId);
            return profile?.Id;
        }
    }
}
