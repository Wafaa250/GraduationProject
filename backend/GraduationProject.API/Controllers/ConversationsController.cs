using GraduationProject.API.DTOs;
using GraduationProject.API.Helpers;
using GraduationProject.API.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GraduationProject.API.Controllers
{
    [ApiController]
    [Route("api/conversations")]
    [Authorize]
    public class ConversationsController : ControllerBase
    {
        private readonly IConversationService _conversationService;

        public ConversationsController(IConversationService conversationService)
        {
            _conversationService = conversationService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllForCurrentUser()
        {
            var userId = AuthorizationHelper.GetUserId(User);
            if (userId <= 0)
            {
                return Unauthorized(new { message = "Invalid token." });
            }

            var conversations = await _conversationService.GetConversationsForUserAsync(userId);
            return Ok(conversations);
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id, [FromQuery] int page = 1, [FromQuery] int pageSize = 100)
        {
            if (id <= 0)
            {
                return BadRequest(new { message = "Invalid conversation id." });
            }

            var userId = AuthorizationHelper.GetUserId(User);
            if (userId <= 0)
            {
                return Unauthorized(new { message = "Invalid token." });
            }

            var conversation = await _conversationService.GetConversationByIdAsync(id, userId, page, pageSize);
            if (conversation == null)
            {
                return NotFound(new { message = "Conversation not found." });
            }

            return Ok(conversation);
        }

        [HttpPost("start/{targetUserId:int}")]
        public async Task<IActionResult> StartConversation(int targetUserId)
        {
            var userId = AuthorizationHelper.GetUserId(User);
            if (userId <= 0)
            {
                return Unauthorized(new { message = "Invalid token." });
            }

            if (targetUserId <= 0)
            {
                return BadRequest(new { message = "Invalid target user id." });
            }

            var conversationId = await _conversationService.StartConversationAsync(userId, targetUserId);
            if (!conversationId.HasValue)
            {
                return BadRequest(new { message = "Unable to start conversation." });
            }

            return Ok(new StartConversationResponseDto { ConversationId = conversationId.Value });
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteConversation(int id)
        {
            if (id <= 0)
            {
                return BadRequest(new { message = "Invalid conversation id." });
            }

            var userId = AuthorizationHelper.GetUserId(User);
            if (userId <= 0)
            {
                return Unauthorized(new { message = "Invalid token." });
            }

            var deleted = await _conversationService.DeleteConversationAsync(id, userId);
            if (!deleted)
            {
                return NotFound(new { message = "Conversation not found." });
            }

            return NoContent();
        }
    }
}
