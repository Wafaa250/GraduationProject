using System.Security.Claims;
using GraduationProject.API.Data;
using GraduationProject.API.Helpers;
using GraduationProject.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace GraduationProject.API.Controllers
{
    [ApiController]
    [Route("api/course-teams")]
    [Authorize(Roles = $"{UserRoles.Doctor},{UserRoles.Student}")]
    public class CourseTeamConversationsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ILogger<CourseTeamConversationsController> _logger;

        public CourseTeamConversationsController(
            ApplicationDbContext db,
            ILogger<CourseTeamConversationsController> logger)
        {
            _db = db;
            _logger = logger;
        }

        [HttpPost("{teamId:int}/conversation")]
        public async Task<IActionResult> GetOrCreateTeamConversation(int teamId)
        {
            var userId = AuthorizationHelper.GetUserId(User);
            if (userId <= 0)
            {
                _logger.LogWarning(
                    "[TeamChat] Auth failed: invalid token. teamId={TeamId}",
                    teamId);
                return Unauthorized(new { message = "Invalid token." });
            }

            var role = User.FindFirstValue(ClaimTypes.Role) ?? string.Empty;
            var isDoctor = User.IsInRole(UserRoles.Doctor);
            var isStudent = User.IsInRole(UserRoles.Student);

            var team = await _db.CourseTeams
                .Where(t => t.Id == teamId)
                .Select(t => new
                {
                    t.Id,
                    t.TeamIndex,
                    ProjectTitle = t.Project.Title,
                    CourseDoctorProfileId = t.Project.Course.DoctorId,
                })
                .FirstOrDefaultAsync();

            if (team == null)
            {
                _logger.LogWarning(
                    "[TeamChat] Team not found. userId={UserId} role={Role} teamId={TeamId}",
                    userId, role, teamId);
                return NotFound(new { message = "Team not found." });
            }

            if (isDoctor)
            {
                var doctorProfileId = await _db.DoctorProfiles
                    .Where(d => d.UserId == userId)
                    .Select(d => (int?)d.Id)
                    .FirstOrDefaultAsync();

                if (doctorProfileId == null)
                {
                    _logger.LogWarning(
                        "[TeamChat] Doctor profile missing. userId={UserId} teamId={TeamId}",
                        userId, teamId);
                    return Unauthorized(new { message = "Doctor profile not found." });
                }

                if (team.CourseDoctorProfileId != doctorProfileId.Value)
                {
                    _logger.LogWarning(
                        "[TeamChat] Doctor not course owner. userId={UserId} teamId={TeamId} doctorProfileId={DoctorProfileId} courseDoctorProfileId={CourseDoctorProfileId}",
                        userId, teamId, doctorProfileId.Value, team.CourseDoctorProfileId);
                    return Forbid();
                }
            }
            else if (isStudent)
            {
                var isTeamMember = await _db.CourseTeamMembers
                    .AnyAsync(m => m.CourseTeamId == teamId && m.UserId == userId);

                if (!isTeamMember)
                {
                    _logger.LogWarning(
                        "[TeamChat] Student not on team. userId={UserId} teamId={TeamId}",
                        userId, teamId);
                    return Forbid();
                }
            }
            else
            {
                _logger.LogWarning(
                    "[TeamChat] Unsupported role. userId={UserId} role={Role} teamId={TeamId}",
                    userId, role, teamId);
                return Forbid();
            }

            var memberUserIds = await _db.CourseTeamMembers
                .Where(m => m.CourseTeamId == teamId)
                .Select(m => m.UserId)
                .Distinct()
                .ToListAsync();

            var courseDoctorUserId = await _db.DoctorProfiles
                .Where(d => d.Id == team.CourseDoctorProfileId)
                .Select(d => (int?)d.UserId)
                .FirstOrDefaultAsync();

            var participantUserIds = memberUserIds
                .Append(courseDoctorUserId ?? 0)
                .Where(id => id > 0)
                .Distinct()
                .OrderBy(id => id)
                .ToList();

            _logger.LogInformation(
                "[TeamChat] Access granted. userId={UserId} role={Role} teamId={TeamId} memberUserIds=[{MemberUserIds}] participantUserIds=[{ParticipantUserIds}]",
                userId,
                role,
                teamId,
                string.Join(",", memberUserIds),
                string.Join(",", participantUserIds));

            if (participantUserIds.Count < 2)
            {
                _logger.LogWarning(
                    "[TeamChat] Not enough participants. userId={UserId} teamId={TeamId} participantCount={ParticipantCount}",
                    userId, teamId, participantUserIds.Count);
                return BadRequest(new { message = "Cannot create a conversation with less than two users." });
            }

            var existingUsersCount = await _db.Users
                .Where(u => participantUserIds.Contains(u.Id))
                .Select(u => u.Id)
                .Distinct()
                .CountAsync();

            if (existingUsersCount != participantUserIds.Count)
            {
                _logger.LogWarning(
                    "[TeamChat] Invalid participant user ids. userId={UserId} teamId={TeamId} expected={Expected} found={Found}",
                    userId, teamId, participantUserIds.Count, existingUsersCount);
                return BadRequest(new { message = "One or more conversation participants are invalid." });
            }

            var title = $"{team.ProjectTitle} - Team {team.TeamIndex + 1}";

            var existingConversation = await _db.Conversations
                .Include(c => c.ConversationUsers)
                .FirstOrDefaultAsync(c => c.CourseTeamId == teamId);

            if (existingConversation != null)
            {
                await SyncParticipantsAsync(existingConversation, participantUserIds);

                if (!await _db.ConversationUsers.AnyAsync(cu =>
                        cu.ConversationId == existingConversation.Id && cu.UserId == userId))
                {
                    _logger.LogError(
                        "[TeamChat] Requesting user missing from participants after sync. userId={UserId} teamId={TeamId} conversationId={ConversationId} participantUserIds=[{ParticipantUserIds}]",
                        userId,
                        teamId,
                        existingConversation.Id,
                        string.Join(",", participantUserIds));
                    return StatusCode(500, new { message = "Team conversation participants could not be synchronized." });
                }

                _logger.LogInformation(
                    "[TeamChat] Returning existing conversation. userId={UserId} teamId={TeamId} conversationId={ConversationId} participantCount={ParticipantCount}",
                    userId,
                    teamId,
                    existingConversation.Id,
                    participantUserIds.Count);

                return Ok(new
                {
                    conversationId = existingConversation.Id,
                    title = existingConversation.Title ?? title,
                    participantCount = participantUserIds.Count,
                });
            }

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
                await SyncParticipantsAsync(participantMatchedConversation, participantUserIds);
                await _db.SaveChangesAsync();

                _logger.LogInformation(
                    "[TeamChat] Linked participant-matched conversation. userId={UserId} teamId={TeamId} conversationId={ConversationId}",
                    userId, teamId, participantMatchedConversation.Id);

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
            catch (DbUpdateException ex)
            {
                _logger.LogWarning(
                    ex,
                    "[TeamChat] Concurrent conversation create race. userId={UserId} teamId={TeamId}",
                    userId,
                    teamId);

                var raced = await _db.Conversations
                    .Include(c => c.ConversationUsers)
                    .FirstOrDefaultAsync(c => c.CourseTeamId == teamId);

                if (raced != null)
                {
                    await SyncParticipantsAsync(raced, participantUserIds);
                    await _db.SaveChangesAsync();

                    return Ok(new
                    {
                        conversationId = raced.Id,
                        title = raced.Title ?? title,
                        participantCount = participantUserIds.Count,
                    });
                }

                throw;
            }

            _logger.LogInformation(
                "[TeamChat] Created conversation. userId={UserId} teamId={TeamId} conversationId={ConversationId} participantUserIds=[{ParticipantUserIds}]",
                userId,
                teamId,
                conversation.Id,
                string.Join(",", participantUserIds));

            return Ok(new
            {
                conversationId = conversation.Id,
                title = conversation.Title,
                participantCount = participantUserIds.Count,
            });
        }

        private async Task SyncParticipantsAsync(Conversation conversation, IReadOnlyCollection<int> participantUserIds)
        {
            var existingUserIds = conversation.ConversationUsers
                .Select(cu => cu.UserId)
                .ToHashSet();

            var missingUserIds = participantUserIds
                .Where(id => !existingUserIds.Contains(id))
                .ToList();

            if (missingUserIds.Count == 0)
                return;

            foreach (var missingUserId in missingUserIds)
            {
                conversation.ConversationUsers.Add(new ConversationUser
                {
                    ConversationId = conversation.Id,
                    UserId = missingUserId,
                });
            }

            await _db.SaveChangesAsync();

            _logger.LogInformation(
                "[TeamChat] Synced missing participants. conversationId={ConversationId} addedUserIds=[{AddedUserIds}]",
                conversation.Id,
                string.Join(",", missingUserIds));
        }
    }
}
