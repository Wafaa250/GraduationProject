using GraduationProject.API.Helpers;
using GraduationProject.API.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GraduationProject.API.Controllers
{
    [ApiController]
    [Route("api/course-teams")]
    [Authorize]
    public class CourseTeamConversationsController : ControllerBase
    {
        private readonly ICourseTeamConversationService _teamConversations;

        public CourseTeamConversationsController(ICourseTeamConversationService teamConversations)
        {
            _teamConversations = teamConversations;
        }

        [HttpPost("{teamId:int}/conversation")]
        public async Task<IActionResult> GetOrCreateTeamConversation(int teamId)
        {
            var userId = AuthorizationHelper.GetUserId(User);
            if (userId <= 0)
                return Unauthorized(new { message = "Invalid token." });

            if (!await _teamConversations.CanUserAccessTeamAsync(userId, teamId))
                return Forbid();

            var result = await _teamConversations.EnsureTeamConversationAsync(teamId);
            if (result == null)
                return NotFound(new { message = "Team not found." });

            if (result.ParticipantCount < 2)
            {
                return BadRequest(new { message = "Cannot create a conversation with less than two users." });
            }

            return Ok(new
            {
                conversationId = result.ConversationId,
                title = result.Title,
                participantCount = result.ParticipantCount,
            });
        }
    }
}
