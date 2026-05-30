using GraduationProject.API.Data;
using GraduationProject.API.Interfaces;
using GraduationProject.API.Models;
using Microsoft.EntityFrameworkCore;

namespace GraduationProject.API.Services
{
    public class CourseTeamConversationService : ICourseTeamConversationService
    {
        private readonly ApplicationDbContext _db;

        public CourseTeamConversationService(ApplicationDbContext db)
        {
            _db = db;
        }

        public async Task<bool> CanUserAccessTeamAsync(int userId, int teamId)
        {
            if (userId <= 0 || teamId <= 0)
                return false;

            var team = await _db.CourseTeams
                .AsNoTracking()
                .Where(t => t.Id == teamId)
                .Select(t => new
                {
                    DoctorUserId = t.Project.Course.Doctor.UserId,
                    IsMember = t.Members.Any(m => m.UserId == userId),
                })
                .FirstOrDefaultAsync();

            if (team == null)
                return false;

            return team.DoctorUserId == userId || team.IsMember;
        }

        public async Task EnsureTeamConversationsForProjectAsync(int projectId)
        {
            var teamIds = await _db.CourseTeams
                .AsNoTracking()
                .Where(t => t.CourseProjectId == projectId)
                .Select(t => t.Id)
                .ToListAsync();

            foreach (var teamId in teamIds)
                await EnsureTeamConversationAsync(teamId);
        }

        public async Task SyncTeamConversationParticipantsAsync(int teamId)
        {
            var conversationId = await _db.Conversations
                .AsNoTracking()
                .Where(c => c.CourseTeamId == teamId)
                .Select(c => (int?)c.Id)
                .FirstOrDefaultAsync();

            if (conversationId == null)
            {
                await EnsureTeamConversationAsync(teamId);
                return;
            }

            var context = await LoadTeamContextAsync(teamId);
            if (context == null)
                return;

            var conversation = await _db.Conversations
                .Include(c => c.ConversationUsers)
                .FirstOrDefaultAsync(c => c.Id == conversationId.Value);

            if (conversation == null)
                return;

            conversation.Title = BuildTitle(context.TeamIndex, context.ProjectTitle);

            var desiredUserIds = context.ParticipantUserIds.ToHashSet();
            var existingUserIds = conversation.ConversationUsers.Select(cu => cu.UserId).ToHashSet();

            foreach (var userId in desiredUserIds.Except(existingUserIds))
            {
                conversation.ConversationUsers.Add(new ConversationUser { UserId = userId });
            }

            var toRemove = conversation.ConversationUsers
                .Where(cu => !desiredUserIds.Contains(cu.UserId))
                .ToList();

            if (toRemove.Count > 0)
                _db.ConversationUsers.RemoveRange(toRemove);

            await _db.SaveChangesAsync();
        }

        public async Task<CourseTeamConversationResult?> EnsureTeamConversationAsync(int teamId)
        {
            var context = await LoadTeamContextAsync(teamId);
            if (context == null)
                return null;

            var title = BuildTitle(context.TeamIndex, context.ProjectTitle);
            var participantUserIds = context.ParticipantUserIds;

            if (participantUserIds.Count < 2)
                return null;

            var existingUsersCount = await _db.Users
                .Where(u => participantUserIds.Contains(u.Id))
                .Select(u => u.Id)
                .Distinct()
                .CountAsync();

            if (existingUsersCount != participantUserIds.Count)
                return null;

            var existingConversation = await _db.Conversations
                .Include(c => c.ConversationUsers)
                .FirstOrDefaultAsync(c => c.CourseTeamId == teamId);

            if (existingConversation != null)
            {
                existingConversation.Title = title;
                await SyncParticipantsOnConversation(existingConversation, participantUserIds);
                await _db.SaveChangesAsync();

                return new CourseTeamConversationResult
                {
                    ConversationId = existingConversation.Id,
                    Title = existingConversation.Title ?? title,
                    ParticipantCount = participantUserIds.Count,
                };
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
                await _db.SaveChangesAsync();

                return new CourseTeamConversationResult
                {
                    ConversationId = participantMatchedConversation.Id,
                    Title = participantMatchedConversation.Title,
                    ParticipantCount = participantUserIds.Count,
                };
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
                var raced = await _db.Conversations
                    .AsNoTracking()
                    .FirstOrDefaultAsync(c => c.CourseTeamId == teamId);

                if (raced != null)
                {
                    return new CourseTeamConversationResult
                    {
                        ConversationId = raced.Id,
                        Title = raced.Title ?? title,
                        ParticipantCount = participantUserIds.Count,
                    };
                }

                throw;
            }

            return new CourseTeamConversationResult
            {
                ConversationId = conversation.Id,
                Title = conversation.Title ?? title,
                ParticipantCount = participantUserIds.Count,
            };
        }

        private async Task<TeamConversationContext?> LoadTeamContextAsync(int teamId)
        {
            var team = await _db.CourseTeams
                .AsNoTracking()
                .Where(t => t.Id == teamId)
                .Select(t => new
                {
                    t.Id,
                    t.TeamIndex,
                    ProjectTitle = t.Project.Title,
                    DoctorUserId = t.Project.Course.Doctor.UserId,
                    MemberUserIds = t.Members.Select(m => m.UserId).ToList(),
                })
                .FirstOrDefaultAsync();

            if (team == null)
                return null;

            var participantUserIds = team.MemberUserIds
                .Append(team.DoctorUserId)
                .Distinct()
                .OrderBy(id => id)
                .ToList();

            return new TeamConversationContext(
                team.Id,
                team.TeamIndex,
                team.ProjectTitle,
                participantUserIds);
        }

        private static string BuildTitle(int teamIndex, string projectTitle) =>
            $"Team {teamIndex + 1} • {projectTitle.Trim()}";

        private static Task SyncParticipantsOnConversation(
            Conversation conversation,
            IReadOnlyList<int> participantUserIds)
        {
            var desiredUserIds = participantUserIds.ToHashSet();
            var existingUserIds = conversation.ConversationUsers.Select(cu => cu.UserId).ToHashSet();

            foreach (var userId in desiredUserIds.Except(existingUserIds))
            {
                conversation.ConversationUsers.Add(new ConversationUser { UserId = userId });
            }

            var toRemove = conversation.ConversationUsers
                .Where(cu => !desiredUserIds.Contains(cu.UserId))
                .ToList();

            foreach (var cu in toRemove)
                conversation.ConversationUsers.Remove(cu);

            return Task.CompletedTask;
        }

        private sealed record TeamConversationContext(
            int TeamId,
            int TeamIndex,
            string ProjectTitle,
            IReadOnlyList<int> ParticipantUserIds);
    }
}
