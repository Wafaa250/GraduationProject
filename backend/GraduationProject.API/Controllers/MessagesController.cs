using GraduationProject.API.DTOs;
using GraduationProject.API.Helpers;
using GraduationProject.API.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GraduationProject.API.Controllers
{
    [ApiController]
    [Route("api/messages")]
    [Authorize]
    public class MessagesController : ControllerBase
    {
        private readonly IConversationService _conversationService;

        public MessagesController(IConversationService conversationService)
        {
            _conversationService = conversationService;
        }

        [HttpPost]
        public async Task<IActionResult> SendMessage([FromBody] CreateMessageDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var userId = AuthorizationHelper.GetUserId(User);
            if (userId <= 0)
            {
                return Unauthorized(new { message = "Invalid token." });
            }

            var created = await _conversationService.CreateMessageAsync(userId, dto);
            if (created == null)
            {
                return BadRequest(new { message = "Unable to create message." });
            }

            return Ok(created);
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> EditMessage(int id, [FromBody] EditMessageDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (id <= 0)
            {
                return BadRequest(new { message = "Invalid message id." });
            }

            var userId = AuthorizationHelper.GetUserId(User);
            if (userId <= 0)
            {
                return Unauthorized(new { message = "Invalid token." });
            }

            var updated = await _conversationService.EditMessageAsync(id, userId, dto.Text);
            if (updated == null)
            {
                return BadRequest(new { message = "Unable to edit message." });
            }

            return Ok(updated);
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> UnsendMessage(int id)
        {
            if (id <= 0)
            {
                return BadRequest(new { message = "Invalid message id." });
            }

            var userId = AuthorizationHelper.GetUserId(User);
            if (userId <= 0)
            {
                return Unauthorized(new { message = "Invalid token." });
            }

            var removed = await _conversationService.UnsendMessageAsync(id, userId);
            if (removed == null)
            {
                return BadRequest(new { message = "Unable to delete message." });
            }

            return Ok(removed);
        }

        [HttpPost("{conversationId:int}/seen")]
        public async Task<IActionResult> MarkSeen(int conversationId)
        {
            if (conversationId <= 0)
            {
                return BadRequest(new { message = "Invalid conversation id." });
            }

            var userId = AuthorizationHelper.GetUserId(User);
            if (userId <= 0)
            {
                return Unauthorized(new { message = "Invalid token." });
            }

            var success = await _conversationService.MarkConversationSeenAsync(conversationId, userId);
            if (success == null)
            {
                return Forbid();
            }

            return Ok(new { success = true });
        }
    }
}
