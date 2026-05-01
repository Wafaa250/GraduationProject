using GraduationProject.API.DTOs;
using GraduationProject.API.Helpers;
using GraduationProject.API.Interfaces;
using GraduationProject.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GraduationProject.API.Controllers
{
    [ApiController]
    [Route("api/teams")]
    public class TeamChatController : ControllerBase
    {
        private readonly ICourseTeamChatRepository _chatRepo;

        public TeamChatController(ICourseTeamChatRepository chatRepo)
        {
            _chatRepo = chatRepo;
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
