// Controllers/ChannelController.cs
using System;
using System.Linq;
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
    [Route("api/doctor/channels")]
    [Authorize]
    public class ChannelController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        public ChannelController(ApplicationDbContext db) => _db = db;

        // =====================================================
        // GET /api/doctor/channels
        // جلب كل قنوات الدكتور
        // =====================================================
        [HttpGet]
        public async Task<IActionResult> GetChannels()
        {
            var doctorId = GetDoctorProfileId();
            if (doctorId == null) return Forbid();

            var channels = await _db.Channels
                .Where(c => c.DoctorId == doctorId)
                .Include(c => c.ChannelStudents)
                .Include(c => c.Teams)
                .OrderByDescending(c => c.CreatedAt)
                .Select(c => new ChannelResponseDto
                {
                    Id            = c.Id,
                    Name          = c.Name,
                    CourseCode    = c.CourseCode,
                    Section       = c.Section,
                    InviteCode    = c.InviteCode,
                    Color         = c.Color,
                    StudentsCount = c.ChannelStudents.Count,
                    TeamsCount    = c.Teams.Count,
                    CreatedAt     = c.CreatedAt,
                })
                .ToListAsync();

            return Ok(channels);
        }

        // =====================================================
        // GET /api/doctor/channels/:id
        // جلب تفاصيل قناة واحدة (مع الطلاب والفرق)
        // =====================================================
        [HttpGet("{id}")]
        public async Task<IActionResult> GetChannel(int id)
        {
            var doctorId = GetDoctorProfileId();
            if (doctorId == null) return Forbid();

            var channel = await _db.Channels
                .Include(c => c.ChannelStudents)
                    .ThenInclude(cs => cs.Student)
                        .ThenInclude(s => s.User)
                .Include(c => c.Teams)
                    .ThenInclude(t => t.TeamMembers)
                        .ThenInclude(tm => tm.Student)
                            .ThenInclude(s => s.User)
                .FirstOrDefaultAsync(c => c.Id == id && c.DoctorId == doctorId);

            if (channel == null)
                return NotFound(new { message = "Channel not found." });

            // IDs الطلاب اللي في فرق
            var studentsInTeams = channel.Teams
                .SelectMany(t => t.TeamMembers.Select(tm => tm.StudentId))
                .ToHashSet();

            var dto = new ChannelDetailDto
            {
                Id            = channel.Id,
                Name          = channel.Name,
                CourseCode    = channel.CourseCode,
                Section       = channel.Section,
                InviteCode    = channel.InviteCode,
                Color         = channel.Color,
                StudentsCount = channel.ChannelStudents.Count,
                TeamsCount    = channel.Teams.Count,
                CreatedAt     = channel.CreatedAt,
                Students = channel.ChannelStudents.Select(cs => new ChannelStudentDto
                {
                    Id        = cs.Student.Id,
                    Name      = cs.Student.User.Name,
                    StudentId = cs.Student.StudentId ?? "",
                    Email     = cs.Student.User.Email,
                    InTeam    = studentsInTeams.Contains(cs.StudentId),
                }).ToList(),
                Teams = channel.Teams.Select(t => new TeamDto
                {
                    Id           = t.Id,
                    Name         = t.Name,
                    ProjectTitle = t.ProjectTitle,
                    Members = t.TeamMembers.Select(tm => new TeamMemberDto
                    {
                        Id        = tm.Student.Id,
                        Name      = tm.Student.User.Name,
                        StudentId = tm.Student.StudentId ?? "",
                    }).ToList(),
                }).ToList(),
            };

            return Ok(dto);
        }

        // =====================================================
        // POST /api/doctor/channels
        // إنشاء قناة جديدة
        // =====================================================
        [HttpPost]
        public async Task<IActionResult> CreateChannel([FromBody] CreateChannelDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var doctorId = GetDoctorProfileId();
            if (doctorId == null) return Forbid();

            // توليد invite code فريد
            var inviteCode = $"{dto.CourseCode.ToUpper()}-{Guid.NewGuid().ToString()[..6].ToUpper()}";

            var channel = new Channel
            {
                DoctorId   = doctorId.Value,
                Name       = dto.Name.Trim(),
                CourseCode = dto.CourseCode.Trim().ToUpper(),
                Section    = dto.Section.Trim(),
                InviteCode = inviteCode,
                Color      = dto.Color,
                CreatedAt  = DateTime.UtcNow,
            };

            _db.Channels.Add(channel);
            await _db.SaveChangesAsync();

            return StatusCode(201, new ChannelResponseDto
            {
                Id            = channel.Id,
                Name          = channel.Name,
                CourseCode    = channel.CourseCode,
                Section       = channel.Section,
                InviteCode    = channel.InviteCode,
                Color         = channel.Color,
                StudentsCount = 0,
                TeamsCount    = 0,
                CreatedAt     = channel.CreatedAt,
            });
        }

        // =====================================================
        // PUT /api/doctor/channels/:id
        // تعديل قناة
        // =====================================================
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateChannel(int id, [FromBody] UpdateChannelDto dto)
        {
            var doctorId = GetDoctorProfileId();
            if (doctorId == null) return Forbid();

            var channel = await _db.Channels
                .FirstOrDefaultAsync(c => c.Id == id && c.DoctorId == doctorId);

            if (channel == null)
                return NotFound(new { message = "Channel not found." });

            if (dto.Name       != null) channel.Name       = dto.Name.Trim();
            if (dto.CourseCode != null) channel.CourseCode = dto.CourseCode.Trim().ToUpper();
            if (dto.Section    != null) channel.Section    = dto.Section.Trim();
            if (dto.Color      != null) channel.Color      = dto.Color;

            await _db.SaveChangesAsync();
            return Ok(new { message = "Channel updated successfully." });
        }

        // =====================================================
        // DELETE /api/doctor/channels/:id
        // حذف قناة
        // =====================================================
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteChannel(int id)
        {
            var doctorId = GetDoctorProfileId();
            if (doctorId == null) return Forbid();

            var channel = await _db.Channels
                .FirstOrDefaultAsync(c => c.Id == id && c.DoctorId == doctorId);

            if (channel == null)
                return NotFound(new { message = "Channel not found." });

            _db.Channels.Remove(channel);
            await _db.SaveChangesAsync();

            return Ok(new { message = "Channel deleted successfully." });
        }

        // ── Helper ───────────────────────────────────────────────────────────
        private int? GetDoctorProfileId()
        {
            var role   = AuthorizationHelper.GetRole(User);
            if (role != "doctor") return null;

            var userId = AuthorizationHelper.GetUserId(User);
            var profile = _db.DoctorProfiles.FirstOrDefault(d => d.UserId == userId);
            return profile?.Id;
        }
    }
}
