// Controllers/ChannelJoinController.cs
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
    [Route("api/channels")]
    [Authorize]
    public class ChannelJoinController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        public ChannelJoinController(ApplicationDbContext db) => _db = db;

        // =====================================================
        // POST /api/channels/join
        // الطالب ينضم لقناة بالـ invite code
        // =====================================================
        [HttpPost("join")]
        public async Task<IActionResult> JoinChannel([FromBody] JoinChannelDto dto)
        {
            // تأكد إنه طالب
            var role = AuthorizationHelper.GetRole(User);
            if (role != "student")
                return Forbid();

            var userId = AuthorizationHelper.GetUserId(User);

            // جيب الـ student profile
            var student = await _db.StudentProfiles
                .FirstOrDefaultAsync(s => s.UserId == userId);

            if (student == null)
                return NotFound(new { message = "Student profile not found." });

            // شوف القناة بالـ invite code
            var channel = await _db.Channels
                .FirstOrDefaultAsync(c => c.InviteCode == dto.InviteCode.Trim().ToUpper());

            if (channel == null)
                return NotFound(new { message = "Invalid invite code. Channel not found." });

            // شوف إذا مسجل قبل
            var alreadyJoined = await _db.ChannelStudents
                .AnyAsync(cs => cs.ChannelId == channel.Id && cs.StudentId == student.Id);

            if (alreadyJoined)
                return Conflict(new { message = "You are already a member of this channel." });

            // أضفه للقناة
            _db.ChannelStudents.Add(new ChannelStudent
            {
                ChannelId = channel.Id,
                StudentId = student.Id,
                JoinedAt  = System.DateTime.UtcNow,
            });

            await _db.SaveChangesAsync();

            return Ok(new
            {
                message    = "Successfully joined the channel!",
                channelId  = channel.Id,
                channelName = channel.Name,
                courseCode = channel.CourseCode,
                section    = channel.Section,
            });
        }

        // =====================================================
        // GET /api/channels/my
        // جلب القنوات اللي الطالب منضم فيها
        // =====================================================
        [HttpGet("my")]
        public async Task<IActionResult> GetMyChannels()
        {
            var role = AuthorizationHelper.GetRole(User);
            if (role != "student") return Forbid();

            var userId = AuthorizationHelper.GetUserId(User);

            var student = await _db.StudentProfiles
                .FirstOrDefaultAsync(s => s.UserId == userId);

            if (student == null) return NotFound();

            var channels = await _db.ChannelStudents
                .Where(cs => cs.StudentId == student.Id)
                .Include(cs => cs.Channel)
                .Select(cs => new
                {
                    id         = cs.Channel.Id,
                    name       = cs.Channel.Name,
                    courseCode = cs.Channel.CourseCode,
                    section    = cs.Channel.Section,
                    color      = cs.Channel.Color,
                    joinedAt   = cs.JoinedAt,
                })
                .ToListAsync();

            return Ok(channels);
        }
    }

    // ── DTO ───────────────────────────────────────────────────────────────────
    public class JoinChannelDto
    {
        [System.ComponentModel.DataAnnotations.Required]
        public string InviteCode { get; set; } = string.Empty;
    }
}
