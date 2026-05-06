using GraduationProject.API.Data;
using GraduationProject.API.Helpers;
using GraduationProject.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GraduationProject.API.Controllers
{
    [ApiController]
    [Route("api/course-teams")]
    [Authorize(Roles = "doctor")]
    public class CourseTeamConversationsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;

        public CourseTeamConversationsController(ApplicationDbContext db)
        {
            _db = db;
        }

        [HttpPost("{teamId:int}/conversation")]
        public async Task<IActionResult> GetOrCreateTeamConversation(int teamId)
        {
            var doctorUserId = AuthorizationHelper.GetUserId(User);
            if (doctorUserId <= 0)
                return Unauthorized(new { message = "Invalid token." });

            var doctorProfileId = await _db.DoctorProfiles
                .Where(d => d.UserId == doctorUserId)
                .Select(d => (int?)d.Id)
                .FirstOrDefaultAsync();
            if (doctorProfileId == null)
                return Unauthorized(new { message = "Doctor profile not found." });

            var team = await _db.CourseTeams
                .Where(t => t.Id == teamId)
                .Select(t => new
                {
                    t.Id,
                    t.TeamIndex,
                    ProjectTitle = t.Project.Title,
                    CourseDoctorId = t.Project.Course.DoctorId,
                })
                .FirstOrDefaultAsync();
            if (team == null)
                return NotFound(new { message = "Team not found." });

            if (team.CourseDoctorId != doctorProfileId.Value)
                return Forbid();

            var memberUserIds = await _db.CourseTeamMembers
                .Where(m => m.CourseTeamId == teamId)
                .Select(m => m.UserId)
                .Distinct()
                .ToListAsync();

            var participantUserIds = memberUserIds
                .Append(doctorUserId)
                .Distinct()
                .OrderBy(id => id)
                .ToList();

            if (participantUserIds.Count < 2)
                return BadRequest(new { message = "Cannot create a conversation with less than two users." });

            var existingUsersCount = await _db.Users
                .Where(u => participantUserIds.Contains(u.Id))
                .Select(u => u.Id)
                .Distinct()
                .CountAsync();
            if (existingUsersCount != participantUserIds.Count)
                return BadRequest(new { message = "One or more conversation participants are invalid." });

            var title = $"{team.ProjectTitle} - Team {team.TeamIndex + 1}";

            var existingConversation = await _db.Conversations
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.CourseTeamId == teamId);

            if (existingConversation != null)
                return Ok(new
                {
                    conversationId = existingConversation.Id,
                    title = existingConversation.Title ?? title,
                    participantCount = participantUserIds.Count,
                });

            var expectedCount = participantUserIds.Count;
            var participantMatchedConversation = await _db.Conversations
                .Include(c => c.ConversationUsers)
                .FirstOrDefaultAsync(c =>
                    c.CourseTeamId == null &&
                    c.ConversationUsers.Count == expectedCount &&
                    c.ConversationUsers.All(cu => participantUserIds.Contains(cu.UserId)));

            if (participantMatchedConversation != null)
            {
                participantMatchedConversation.CourseTeamId = teamId;
                participantMatchedConversation.Title = title;
                await _db.SaveChangesAsync();

                return Ok(new
                {
                    conversationId = participantMatchedConversation.Id,
                    title = participantMatchedConversation.Title,
                    participantCount = participantUserIds.Count,
                });
            }

            var conversation = new Conversation
            {
                Title = title,
                CourseTeamId = teamId,
                CreatedAt = DateTime.UtcNow,
                ConversationUsers = participantUserIds
                    .Select(uid => new ConversationUser { UserId = uid })
                    .ToList(),
            };

            try
            {
                _db.Conversations.Add(conversation);
                await _db.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                // Another request may have created the same team conversation concurrently.
                var raced = await _db.Conversations
                    .AsNoTracking()
                    .FirstOrDefaultAsync(c => c.CourseTeamId == teamId);
                if (raced != null)
                {
                    return Ok(new
                    {
                        conversationId = raced.Id,
                        title = raced.Title ?? title,
                        participantCount = participantUserIds.Count,
                    });
                }

                throw;
            }

            return Ok(new
            {
                conversationId = conversation.Id,
                title = conversation.Title,
                participantCount = participantUserIds.Count,
            });
        }
    }
}
