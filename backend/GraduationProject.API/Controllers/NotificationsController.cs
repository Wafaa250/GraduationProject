using System;
using System.Linq;
using System.Threading.Tasks;
using GraduationProject.API.Data;
using GraduationProject.API.Helpers;
using GraduationProject.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GraduationProject.API.Controllers
{
    [ApiController]
    [Route("api/notifications")]
    [Authorize]
    public class NotificationsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;

        public NotificationsController(ApplicationDbContext db) => _db = db;

        /// <summary>List current user's graduation-project notifications (newest first).</summary>
        [HttpGet]
        public async Task<IActionResult> GetMine([FromQuery] int take = 50, [FromQuery] string? category = null)
        {
            var userId = AuthorizationHelper.GetUserId(User);
            take = Math.Clamp(take, 1, 100);
            var cat = string.IsNullOrWhiteSpace(category)
                ? GraduationProjectNotificationService.Category
                : category.Trim();

            var items = await _db.UserNotifications
                .AsNoTracking()
                .Where(n => n.UserId == userId && n.Category == cat)
                .OrderByDescending(n => n.CreatedAt)
                .Take(take)
                .Select(n => new
                {
                    n.Id,
                    n.Category,
                    n.Title,
                    n.Body,
                    n.EventType,
                    n.ProjectId,
                    n.CreatedAt,
                    n.ReadAt,
                })
                .ToListAsync();

            return Ok(items);
        }

        [HttpGet("unread-count")]
        public async Task<IActionResult> GetUnreadCount([FromQuery] string? category = null)
        {
            var userId = AuthorizationHelper.GetUserId(User);
            var cat = string.IsNullOrWhiteSpace(category)
                ? GraduationProjectNotificationService.Category
                : category.Trim();
            var count = await _db.UserNotifications
                .AsNoTracking()
                .CountAsync(n =>
                    n.UserId == userId &&
                    n.Category == cat &&
                    n.ReadAt == null);

            return Ok(new { count });
        }

        [HttpPost("{id:int}/read")]
        public async Task<IActionResult> MarkRead(int id)
        {
            var userId = AuthorizationHelper.GetUserId(User);
            var row = await _db.UserNotifications
                .FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId);

            if (row == null)
                return NotFound();

            if (row.ReadAt == null)
            {
                row.ReadAt = DateTime.UtcNow;
                await _db.SaveChangesAsync();
            }

            return Ok();
        }

        /// <summary>Mark all notifications in a category read (default: graduation_project).</summary>
        [HttpPost("read-all")]
        public async Task<IActionResult> MarkAllRead([FromQuery] string? category = null)
        {
            var userId = AuthorizationHelper.GetUserId(User);
            var cat = string.IsNullOrWhiteSpace(category)
                ? GraduationProjectNotificationService.Category
                : category.Trim();

            var rows = await _db.UserNotifications
                .Where(n => n.UserId == userId && n.Category == cat && n.ReadAt == null)
                .ToListAsync();

            var now = DateTime.UtcNow;
            foreach (var r in rows)
                r.ReadAt = now;

            await _db.SaveChangesAsync();
            return Ok(new { marked = rows.Count });
        }

        [HttpPost("read-scope")]
        public async Task<IActionResult> MarkScopeRead([FromQuery] string scope, [FromQuery] string category = "chat")
        {
            var userId = AuthorizationHelper.GetUserId(User);
            if (string.IsNullOrWhiteSpace(scope))
                return BadRequest(new { message = "Scope is required." });

            var normalizedScope = scope.Trim();
            var normalizedCategory = string.IsNullOrWhiteSpace(category) ? "chat" : category.Trim();
            var prefix = $"chat:{normalizedScope}:";
            var rows = await _db.UserNotifications
                .Where(n =>
                    n.UserId == userId &&
                    n.Category == normalizedCategory &&
                    n.ReadAt == null &&
                    n.DedupKey != null &&
                    n.DedupKey.StartsWith(prefix))
                .ToListAsync();

            if (rows.Count == 0)
                return Ok(new { marked = 0 });

            var now = DateTime.UtcNow;
            foreach (var row in rows)
                row.ReadAt = now;

            await _db.SaveChangesAsync();
            return Ok(new { marked = rows.Count });
        }
    }
}
