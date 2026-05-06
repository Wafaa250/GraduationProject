using GraduationProject.API.DTOs;
using GraduationProject.API.Helpers;
using GraduationProject.API.Interfaces;
using GraduationProject.API.Models;
using GraduationProject.API.Services;
using GraduationProject.API.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GraduationProject.API.Controllers
{
    [ApiController]
    [Route("api/teams")]
    public class TeamChatController : ControllerBase
    {
        private readonly ICourseTeamChatRepository _chatRepo;
        private readonly IGraduationProjectNotificationService _notifications;
        private readonly ApplicationDbContext _db;

        public TeamChatController(
            ICourseTeamChatRepository chatRepo,
            IGraduationProjectNotificationService notifications,
            ApplicationDbContext db)
        {
            _chatRepo = chatRepo;
            _notifications = notifications;
            _db = db;
        }

        // ============================================================
        // GET /api/teams/{teamId}/chat?limit=100  (student)
        // ============================================================
        [HttpGet("{teamId:int}/chat")]
        [Authorize(Roles = "student")]
        public async Task<IActionResult> GetMessages(int teamId, [FromQuery] int limit = 100)
        {
            var userId = AuthorizationHelper.GetUserId(User);
            if (userId == 0)
                return Unauthorized(new { message = "Invalid token." });

            if (!await _chatRepo.IsTeamMemberAsync(teamId, userId))
                return Forbid();

            var messages = await _chatRepo.GetMessagesAsync(teamId, limit);
            await _notifications.MarkChatScopeReadAsync(userId, $"team:{teamId}");
            return Ok(messages.Select(MapToDto));
        }

        // ============================================================
        // POST /api/teams/{teamId}/chat  (student)
        // ============================================================
        [HttpPost("{teamId:int}/chat")]
        [Authorize(Roles = "student")]
        public async Task<IActionResult> SendMessage(int teamId, [FromBody] SendChatMessageDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userId = AuthorizationHelper.GetUserId(User);
            if (userId == 0)
                return Unauthorized(new { message = "Invalid token." });

            if (!await _chatRepo.IsTeamMemberAsync(teamId, userId))
                return Forbid();

            var message = new CourseTeamMessage
            {
                CourseTeamId = teamId,
                SenderUserId = userId,
                Text         = dto.Text.Trim(),
                SentAt       = DateTime.UtcNow,
            };

            var saved = await _chatRepo.SendMessageAsync(message);
            var recipientIds = await _db.CourseTeamMembers
                .Where(tm => tm.CourseTeamId == teamId)
                .Join(_db.StudentProfiles, tm => tm.StudentProfileId, sp => sp.Id, (_, sp) => sp.UserId)
                .Distinct()
                .ToListAsync();
            var senderName = await _db.Users
                .Where(u => u.Id == userId)
                .Select(u => u.Name)
                .FirstOrDefaultAsync() ?? "Someone";
            var projectId = await _db.CourseTeams
                .Where(t => t.Id == teamId)
                .Select(t => t.CourseProjectId)
                .FirstOrDefaultAsync();
            await _notifications.NotifyTeamChatMessageAsync(
                teamId,
                projectId,
                userId,
                senderName,
                dto.Text.Trim(),
                recipientIds);
            return Ok(MapToDto(saved));
        }

        private static object MapToDto(CourseTeamMessage m) => new
        {
            id           = m.Id,
            teamId       = m.CourseTeamId,
            senderUserId = m.SenderUserId,
            senderName   = m.Sender?.Name ?? string.Empty,
            text         = m.Text,
            sentAt       = m.SentAt,
        };
    }
}
