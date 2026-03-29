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
    [ApiController]
    [Route("api/graduation-projects")]
    [Authorize]
    public class StudentProjectController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        public StudentProjectController(ApplicationDbContext db) => _db = db;

        // =====================================================
        // GET /api/graduation-projects
        // جلب كل مشاريع التخرج (للبحث والاستعراض)
        // =====================================================
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var projects = await _db.StudentProjects
                .Include(p => p.Owner).ThenInclude(o => o.User)
                .Include(p => p.Members).ThenInclude(m => m.Student).ThenInclude(s => s.User)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();

            return Ok(projects.Select(p => MapToDto(p)));
        }

        // =====================================================
        // GET /api/graduation-projects/my
        // جلب مشروع الطالب الحالي (owner أو member)
        // =====================================================
        [HttpGet("my")]
        public async Task<IActionResult> GetMy()
        {
            var studentProfile = await GetStudentProfileAsync();
            if (studentProfile == null) return Forbid();

            // شايل المشروع كـ owner
            var asOwner = await _db.StudentProjects
                .Include(p => p.Owner).ThenInclude(o => o.User)
                .Include(p => p.Members).ThenInclude(m => m.Student).ThenInclude(s => s.User)
                .FirstOrDefaultAsync(p => p.OwnerId == studentProfile.Id);

            if (asOwner != null)
                return Ok(new { role = "owner", project = MapToDto(asOwner) });

            // شايل المشروع كـ member
            var membership = await _db.StudentProjectMembers
                .Include(m => m.Project)
                    .ThenInclude(p => p.Owner).ThenInclude(o => o.User)
                .Include(m => m.Project)
                    .ThenInclude(p => p.Members).ThenInclude(mem => mem.Student).ThenInclude(s => s.User)
                .FirstOrDefaultAsync(m => m.StudentId == studentProfile.Id);

            if (membership != null)
                return Ok(new { role = "member", project = MapToDto(membership.Project) });

            // مش عنده مشروع
            return Ok(new { role = (string?)null, project = (object?)null });
        }

        // =====================================================
        // GET /api/graduation-projects/{id}
        // جلب تفاصيل مشروع واحد
        // =====================================================
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var project = await _db.StudentProjects
                .Include(p => p.Owner).ThenInclude(o => o.User)
                .Include(p => p.Members).ThenInclude(m => m.Student).ThenInclude(s => s.User)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (project == null)
                return NotFound(new { message = "Graduation project not found." });

            return Ok(MapToDto(project));
        }

        // =====================================================
        // POST /api/graduation-projects
        // إنشاء مشروع تخرج جديد — الطالب بس
        // =====================================================
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateStudentProjectDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var studentProfile = await GetStudentProfileAsync();
            if (studentProfile == null) return Forbid();

            // تأكد إنه مش عنده مشروع قبل كـ owner
            var alreadyOwner = await _db.StudentProjects
                .AnyAsync(p => p.OwnerId == studentProfile.Id);
            if (alreadyOwner)
                return Conflict(new { message = "You already have a graduation project." });

            // تأكد إنه مش member بمشروع ثاني
            var alreadyMember = await _db.StudentProjectMembers
                .AnyAsync(m => m.StudentId == studentProfile.Id);
            if (alreadyMember)
                return Conflict(new { message = "You are already a member of another graduation project." });

            var project = new StudentProject
            {
                OwnerId        = studentProfile.Id,
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

            // أعد تحميل مع الـ navigation
            await _db.Entry(project).Reference(p => p.Owner).LoadAsync();
            await _db.Entry(project.Owner).Reference(o => o.User).LoadAsync();

            return StatusCode(201, MapToDto(project));
        }

        // =====================================================
        // PUT /api/graduation-projects/{id}
        // تعديل المشروع — Owner فقط
        // =====================================================
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateStudentProjectDto dto)
        {
            var studentProfile = await GetStudentProfileAsync();
            if (studentProfile == null) return Forbid();

            var project = await _db.StudentProjects
                .Include(p => p.Owner).ThenInclude(o => o.User)
                .Include(p => p.Members).ThenInclude(m => m.Student).ThenInclude(s => s.User)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (project == null)
                return NotFound(new { message = "Graduation project not found." });

            if (project.OwnerId != studentProfile.Id)
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

        // =====================================================
        // DELETE /api/graduation-projects/{id}
        // حذف المشروع — Owner فقط
        // =====================================================
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var studentProfile = await GetStudentProfileAsync();
            if (studentProfile == null) return Forbid();

            var project = await _db.StudentProjects
                .FirstOrDefaultAsync(p => p.Id == id);

            if (project == null)
                return NotFound(new { message = "Graduation project not found." });

            if (project.OwnerId != studentProfile.Id)
                return Forbid();

            _db.StudentProjects.Remove(project);
            await _db.SaveChangesAsync();

            return Ok(new { message = "Graduation project deleted successfully." });
        }

        // =====================================================
        // POST /api/graduation-projects/{id}/join
        // طالب ينضم لمشروع كـ partner
        // =====================================================
        [HttpPost("{id:int}/join")]
        public async Task<IActionResult> Join(int id)
        {
            var studentProfile = await GetStudentProfileAsync();
            if (studentProfile == null) return Forbid();

            var project = await _db.StudentProjects
                .Include(p => p.Members)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (project == null)
                return NotFound(new { message = "Graduation project not found." });

            if (project.OwnerId == studentProfile.Id)
                return BadRequest(new { message = "You are the owner of this project." });

            var hasOwnProject = await _db.StudentProjects
                .AnyAsync(p => p.OwnerId == studentProfile.Id);
            if (hasOwnProject)
                return Conflict(new { message = "You already own a graduation project." });

            var alreadyMember = await _db.StudentProjectMembers
                .AnyAsync(m => m.StudentId == studentProfile.Id);
            if (alreadyMember)
                return Conflict(new { message = "You are already a member of a graduation project." });

            if (project.Members.Count >= project.PartnersCount)
                return BadRequest(new { message = "This project is already full." });

            _db.StudentProjectMembers.Add(new StudentProjectMember
            {
                ProjectId = project.Id,
                StudentId = studentProfile.Id,
                JoinedAt  = DateTime.UtcNow,
            });

            await _db.SaveChangesAsync();
            return Ok(new { message = "Successfully joined the project." });
        }

        // =====================================================
        // DELETE /api/graduation-projects/{id}/leave
        // طالب يغادر المشروع (member بس، مش owner)
        // =====================================================
        [HttpDelete("{id:int}/leave")]
        public async Task<IActionResult> Leave(int id)
        {
            var studentProfile = await GetStudentProfileAsync();
            if (studentProfile == null) return Forbid();

            var membership = await _db.StudentProjectMembers
                .FirstOrDefaultAsync(m => m.ProjectId == id && m.StudentId == studentProfile.Id);

            if (membership == null)
                return NotFound(new { message = "You are not a member of this project." });

            _db.StudentProjectMembers.Remove(membership);
            await _db.SaveChangesAsync();

            return Ok(new { message = "Left the project successfully." });
        }

        // ── Helpers ──────────────────────────────────────────────────────────

        private async Task<StudentProfile?> GetStudentProfileAsync()
        {
            var role = AuthorizationHelper.GetRole(User);
            if (role != "student") return null;

            var userId = AuthorizationHelper.GetUserId(User);
            return await _db.StudentProfiles.FirstOrDefaultAsync(s => s.UserId == userId);
        }

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
