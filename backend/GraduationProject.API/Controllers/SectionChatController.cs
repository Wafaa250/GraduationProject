// Controllers/SectionChatController.cs
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GraduationProject.API.Data;
using GraduationProject.API.Helpers;
using GraduationProject.API.Models;

namespace GraduationProject.API.Controllers
{
    /// <summary>
    /// Section Chat — real-time-style REST endpoints.
    ///
    /// GET  /api/sections/{sectionId}/chat?before=&limit=
    ///   → Returns up to `limit` messages (default 50, max 100) sent before
    ///     the given UTC timestamp (cursor-based pagination).
    ///     Newest-first so the client can show latest messages immediately.
    ///
    /// POST /api/sections/{sectionId}/chat
    ///   → Send a new message. Returns the saved message.
    ///
    /// DELETE /api/sections/{sectionId}/chat/{messageId}
    ///   → Delete own message (sender only). Doctor can delete any message
    ///     inside a section belonging to their course.
    ///
    /// Access rules:
    ///   - Student must be enrolled in the section (CourseSectionId matches).
    ///   - Doctor must own the course that contains the section.
    /// </summary>
    [ApiController]
    [Route("api/sections/{sectionId:int}/chat")]
    [Authorize]
    public class SectionChatController : ControllerBase
    {
        private readonly ApplicationDbContext _db;

        public SectionChatController(ApplicationDbContext db) => _db = db;

        // =====================================================================
        // GET /api/sections/{sectionId}/chat
        // =====================================================================
        [HttpGet]
        public async Task<IActionResult> GetMessages(
            int sectionId,
            [FromQuery] DateTime? before,
            [FromQuery] int limit = 50)
        {
            limit = Math.Clamp(limit, 1, 100);

            var (_, accessError) = await CheckAccessAsync(sectionId);
            if (accessError != null) return accessError;

            var query = _db.SectionChatMessages
                .AsNoTracking()
                .Where(m => m.SectionId == sectionId);

            if (before.HasValue)
                query = query.Where(m => m.SentAt < before.Value);

            var messages = await query
                .OrderByDescending(m => m.SentAt)
                .Take(limit)
                .Include(m => m.Sender)
                .ToListAsync();

            // Return in chronological order (oldest → newest) for UI rendering
            var result = messages
                .OrderBy(m => m.SentAt)
                .Select(m => MapToDto(m))
                .ToList();

            return Ok(result);
        }

        // =====================================================================
        // POST /api/sections/{sectionId}/chat
        // =====================================================================
        [HttpPost]
        public async Task<IActionResult> SendMessage(
            int sectionId,
            [FromBody] SendChatMessageDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var (userId, accessError) = await CheckAccessAsync(sectionId);
            if (accessError != null) return accessError;

            var message = new SectionChatMessage
            {
                SectionId    = sectionId,
                SenderUserId = userId,
                Text         = dto.Text.Trim(),
                SentAt       = DateTime.UtcNow
            };

            _db.SectionChatMessages.Add(message);
            await _db.SaveChangesAsync();

            // Reload with sender navigation for response
            await _db.Entry(message).Reference(m => m.Sender).LoadAsync();

            return StatusCode(201, MapToDto(message));
        }

        // =====================================================================
        // DELETE /api/sections/{sectionId}/chat/{messageId}
        // =====================================================================
        [HttpDelete("{messageId:int}")]
        public async Task<IActionResult> DeleteMessage(int sectionId, int messageId)
        {
            var (userId, accessError) = await CheckAccessAsync(sectionId);
            if (accessError != null) return accessError;

            var message = await _db.SectionChatMessages
                .FirstOrDefaultAsync(m => m.Id == messageId && m.SectionId == sectionId);

            if (message == null)
                return NotFound(new { message = "Message not found." });

            var role = AuthorizationHelper.GetRole(User);

            // Doctor can delete any message; student only their own
            if (role != "doctor" && message.SenderUserId != userId)
                return StatusCode(403, new { message = "You can only delete your own messages." });

            _db.SectionChatMessages.Remove(message);
            await _db.SaveChangesAsync();

            return Ok(new { message = "Message deleted." });
        }

        // ── Private helpers ───────────────────────────────────────────────────

        /// <summary>
        /// Validates section exists and caller has access.
        /// Returns (callerUserId, null) on success or (0, errorResult) on failure.
        /// </summary>
        private async Task<(int userId, IActionResult? error)> CheckAccessAsync(int sectionId)
        {
            var userId = AuthorizationHelper.GetUserId(User);
            var role   = AuthorizationHelper.GetRole(User);

            var section = await _db.CourseSections
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.Id == sectionId);

            if (section == null)
                return (0, NotFound(new { message = "Section not found." }));

            if (role == "student")
            {
                var student = await _db.StudentProfiles
                    .AsNoTracking()
                    .FirstOrDefaultAsync(s => s.UserId == userId);

                if (student == null)
                    return (0, StatusCode(403, new { message = "Student profile not found." }));

                var enrolled = await _db.CourseEnrollments
                    .AnyAsync(e => e.CourseSectionId == sectionId && e.StudentId == student.Id);

                if (!enrolled)
                    return (0, StatusCode(403, new { message = "You are not a member of this section." }));
            }
            else if (role == "doctor")
            {
                var doctor = await _db.DoctorProfiles
                    .AsNoTracking()
                    .FirstOrDefaultAsync(d => d.UserId == userId);

                if (doctor == null)
                    return (0, StatusCode(403, new { message = "Doctor profile not found." }));

                var ownesCourse = await _db.Courses
                    .AnyAsync(c => c.Id == section.CourseId && c.DoctorId == doctor.Id);

                if (!ownesCourse)
                    return (0, StatusCode(403, new { message = "You do not own this course." }));
            }
            else
            {
                return (0, StatusCode(403, new { message = "Not authorized." }));
            }

            return (userId, null);
        }

        private static ChatMessageDto MapToDto(SectionChatMessage m) => new()
        {
            Id           = m.Id,
            SectionId    = m.SectionId,
            SenderUserId = m.SenderUserId,
            SenderName   = m.Sender?.Name ?? string.Empty,
            Text         = m.Text,
            SentAt       = m.SentAt
        };
    }

    // ── DTOs (local — only used by this controller) ───────────────────────────

    public class SendChatMessageDto
    {
        [Required]
        [StringLength(4000, MinimumLength = 1, ErrorMessage = "Message must be 1–4000 characters.")]
        public string Text { get; set; } = string.Empty;
    }

    public class ChatMessageDto
    {
        public int      Id           { get; set; }
        public int      SectionId    { get; set; }
        public int      SenderUserId { get; set; }
        public string   SenderName   { get; set; } = string.Empty;
        public string   Text         { get; set; } = string.Empty;
        public DateTime SentAt       { get; set; }
    }
}
