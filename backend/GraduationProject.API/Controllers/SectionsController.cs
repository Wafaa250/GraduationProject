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
    [Route("api/sections")]
    public class SectionsController : ControllerBase
    {
        private readonly ISectionChatRepository _chatRepo;
        private readonly ICourseSectionRepository _sectionRepo;
        private readonly ICourseRepository _courseRepo;
        private readonly IGraduationProjectNotificationService _notifications;
        private readonly ApplicationDbContext _db;

        public SectionsController(
            ISectionChatRepository chatRepo,
            ICourseSectionRepository sectionRepo,
            ICourseRepository courseRepo,
            IGraduationProjectNotificationService notifications,
            ApplicationDbContext db)
        {
            _chatRepo    = chatRepo;
            _sectionRepo = sectionRepo;
            _courseRepo  = courseRepo;
            _notifications = notifications;
            _db = db;
        }

        // ============================================================
        // GET /api/sections/{sectionId}/chat?limit=100
        // ============================================================
        [HttpGet("{sectionId:int}/chat")]
        [Authorize(Roles = "student")]
        public async Task<IActionResult> GetMessages(
            int sectionId,
            [FromQuery] int limit = 100)
        {
            var studentId = await GetCurrentStudentIdAsync();
            if (studentId == null)
                return Unauthorized(new { message = "Student profile not found." });

            // Verify student is enrolled in this section
            if (!await IsStudentInSectionAsync(studentId.Value, sectionId))
                return Forbid();

            var messages = await _chatRepo.GetMessagesAsync(sectionId, Math.Clamp(limit, 1, 500));
            var userId = AuthorizationHelper.GetUserId(User);
            if (userId > 0)
                await _notifications.MarkChatScopeReadAsync(userId, $"section:{sectionId}");
            return Ok(messages.Select(MapToDto));
        }

        // ============================================================
        // POST /api/sections/{sectionId}/chat
        // ============================================================
        [HttpPost("{sectionId:int}/chat")]
        [Authorize(Roles = "student")]
        public async Task<IActionResult> SendMessage(
            int sectionId,
            [FromBody] SendChatMessageDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userId = AuthorizationHelper.GetUserId(User);
            if (userId == 0)
                return Unauthorized(new { message = "Invalid token." });

            var studentId = await GetCurrentStudentIdAsync();
            if (studentId == null)
                return Unauthorized(new { message = "Student profile not found." });

            // Verify student is enrolled in this section
            if (!await IsStudentInSectionAsync(studentId.Value, sectionId))
                return Forbid();

            var message = new SectionChatMessage
            {
                CourseSectionId = sectionId,
                SenderUserId    = userId,
                Text            = dto.Text.Trim(),
                SentAt          = DateTime.UtcNow,
            };

            var saved = await _chatRepo.SendMessageAsync(message);
            var recipientIds = await _db.SectionEnrollments
                .Where(e => e.CourseSectionId == sectionId)
                .Join(_db.StudentProfiles, e => e.StudentProfileId, s => s.Id, (_, s) => s.UserId)
                .Distinct()
                .ToListAsync();
            var senderName = await _db.Users
                .Where(u => u.Id == userId)
                .Select(u => u.Name)
                .FirstOrDefaultAsync() ?? "Someone";
            var courseId = await _db.CourseSections
                .Where(cs => cs.Id == sectionId)
                .Select(cs => cs.CourseId)
                .FirstOrDefaultAsync();
            recipientIds = recipientIds
                .Where(id => id > 0)
                .Distinct()
                .ToList();
            await _notifications.NotifySectionChatMessageAsync(
                sectionId,
                courseId,
                userId,
                senderName,
                dto.Text.Trim(),
                recipientIds);
            return Ok(MapToDto(saved));
        }

        // ============================================================
        // PRIVATE HELPERS
        // ============================================================
        private async Task<int?> GetCurrentStudentIdAsync()
        {
            var userId = AuthorizationHelper.GetUserId(User);
            if (userId == 0) return null;
            return await _courseRepo.GetStudentProfileIdByUserIdAsync(userId);
        }

        private async Task<bool> IsStudentInSectionAsync(int studentProfileId, int sectionId)
        {
            var enrollments = await _sectionRepo.GetEnrolledSectionsByStudentAsync(studentProfileId);
            return enrollments.Any(e => e.CourseSectionId == sectionId);
        }

        private static ChatMessageResponseDto MapToDto(SectionChatMessage m) => new()
        {
            Id           = m.Id,
            SectionId    = m.CourseSectionId,
            SenderUserId = m.SenderUserId,
            SenderName   = m.Sender?.Name ?? string.Empty,
            Text         = m.Text,
            SentAt       = m.SentAt,
        };
    }
}
