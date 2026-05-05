using GraduationProject.API.Data;
using GraduationProject.API.DTOs;
using GraduationProject.API.Interfaces;
using GraduationProject.API.Models;
using Microsoft.EntityFrameworkCore;

namespace GraduationProject.API.Services
{
    public class ConversationService : IConversationService
    {
        private readonly ApplicationDbContext _context;

        public ConversationService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<ConversationListItemDto>> GetConversationsForUserAsync(int userId)
        {
            var conversations = await _context.Conversations
                .AsNoTracking()
                .Where(c => c.ConversationUsers.Any(cu => cu.UserId == userId))
                .Include(c => c.ConversationUsers)
                    .ThenInclude(cu => cu.User)
                .Include(c => c.Messages)
                .ToListAsync();

            return conversations
                .Select(c =>
                {
                    var otherUser = c.ConversationUsers
                        .Where(cu => cu.UserId != userId)
                        .Select(cu => cu.User)
                        .FirstOrDefault();

                    var lastMessage = c.Messages
                        .OrderByDescending(m => m.CreatedAt)
                        .FirstOrDefault();

                    return new ConversationListItemDto
                    {
                        Id = c.Id,
                        OtherUser = otherUser == null
                            ? null
                            : new ConversationUserDto
                            {
                                Id = otherUser.Id,
                                Name = otherUser.Name,
                                Email = otherUser.Email
                            },
                        LastMessage = lastMessage == null ? null : MapMessage(lastMessage),
                        UnseenCount = c.Messages.Count(m => m.SenderId != userId && !m.Seen && !m.Deleted)
                    };
                })
                .OrderByDescending(c => c.LastMessage?.CreatedAt ?? DateTime.MinValue)
                .ToList();
        }

        public async Task<ConversationDetailsDto?> GetConversationByIdAsync(int conversationId, int userId, int page, int pageSize)
        {
            var conversation = await _context.Conversations
                .AsNoTracking()
                .Where(c => c.Id == conversationId)
                .Where(c => c.ConversationUsers.Any(cu => cu.UserId == userId))
                .Include(c => c.ConversationUsers)
                    .ThenInclude(cu => cu.User)
                .Include(c => c.Messages)
                .FirstOrDefaultAsync();

            if (conversation == null)
            {
                return null;
            }

            page = Math.Max(page, 1);
            pageSize = Math.Clamp(pageSize, 1, 100);

            var orderedMessages = conversation.Messages
                .OrderBy(m => m.CreatedAt)
                .ToList();

            var skip = (page - 1) * pageSize;
            var pagedMessages = orderedMessages.Skip(skip).Take(pageSize).ToList();

            return new ConversationDetailsDto
            {
                Id = conversation.Id,
                CreatedAt = conversation.CreatedAt,
                Users = conversation.ConversationUsers
                    .Select(cu => new ConversationUserDto
                    {
                        Id = cu.User.Id,
                        Name = cu.User.Name,
                        Email = cu.User.Email
                    })
                    .ToList(),
                Messages = pagedMessages.Select(MapMessage).ToList()
            };
        }

        public async Task<int?> StartConversationAsync(int currentUserId, int targetUserId)
        {
            if (currentUserId <= 0 || targetUserId <= 0 || currentUserId == targetUserId)
            {
                return null;
            }

            var usersExist = await _context.Users
                .CountAsync(u => u.Id == currentUserId || u.Id == targetUserId);

            if (usersExist != 2)
            {
                return null;
            }

            var existingConversationId = await _context.Conversations
                .Where(c => c.ConversationUsers.Count == 2)
                .Where(c => c.ConversationUsers.Any(cu => cu.UserId == currentUserId))
                .Where(c => c.ConversationUsers.Any(cu => cu.UserId == targetUserId))
                .Select(c => (int?)c.Id)
                .FirstOrDefaultAsync();

            if (existingConversationId.HasValue)
            {
                return existingConversationId.Value;
            }

            var conversation = new Conversation
            {
                CreatedAt = DateTime.UtcNow,
                ConversationUsers = new List<ConversationUser>
                {
                    new() { UserId = currentUserId },
                    new() { UserId = targetUserId }
                }
            };

            _context.Conversations.Add(conversation);
            await _context.SaveChangesAsync();

            return conversation.Id;
        }

        public async Task<bool> DeleteConversationAsync(int conversationId, int userId)
        {
            var conversation = await _context.Conversations
                .Where(c => c.Id == conversationId)
                .Where(c => c.ConversationUsers.Any(cu => cu.UserId == userId))
                .FirstOrDefaultAsync();

            if (conversation == null)
            {
                return false;
            }

            _context.Conversations.Remove(conversation);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<MessageDto?> CreateMessageAsync(int userId, CreateMessageDto dto)
        {
            var canAccessConversation = await _context.ConversationUsers
                .AnyAsync(cu => cu.ConversationId == dto.ConversationId && cu.UserId == userId);

            if (!canAccessConversation)
            {
                return null;
            }

            var text = dto.Text.Trim();
            if (string.IsNullOrWhiteSpace(text))
            {
                return null;
            }

            var message = new Message
            {
                ConversationId = dto.ConversationId,
                SenderId = userId,
                Text = text,
                CreatedAt = DateTime.UtcNow,
                Edited = false,
                Deleted = false,
                Seen = false
            };

            _context.Messages.Add(message);
            await _context.SaveChangesAsync();

            return MapMessage(message);
        }

        public async Task<MessageDto?> EditMessageAsync(int messageId, int userId, string text)
        {
            var message = await _context.Messages
                .FirstOrDefaultAsync(m => m.Id == messageId);

            if (message == null || message.SenderId != userId || message.Deleted)
            {
                return null;
            }

            var trimmedText = text.Trim();
            if (string.IsNullOrWhiteSpace(trimmedText))
            {
                return null;
            }

            message.Text = trimmedText;
            message.Edited = true;

            await _context.SaveChangesAsync();
            return MapMessage(message);
        }

        public async Task<MessageDto?> UnsendMessageAsync(int messageId, int userId)
        {
            var message = await _context.Messages
                .FirstOrDefaultAsync(m => m.Id == messageId);

            if (message == null || message.SenderId != userId)
            {
                return null;
            }

            message.Deleted = true;
            message.Edited = false;
            message.Text = "Message removed";

            await _context.SaveChangesAsync();
            return MapMessage(message);
        }

        public async Task<bool?> MarkConversationSeenAsync(int conversationId, int userId)
        {
            var canAccessConversation = await _context.ConversationUsers
                .AnyAsync(cu => cu.ConversationId == conversationId && cu.UserId == userId);

            if (!canAccessConversation)
            {
                return null;
            }

            var unseenMessages = await _context.Messages
                .Where(m => m.ConversationId == conversationId && m.SenderId != userId && !m.Seen)
                .ToListAsync();

            if (unseenMessages.Count == 0)
            {
                return true;
            }

            foreach (var message in unseenMessages)
            {
                message.Seen = true;
            }

            await _context.SaveChangesAsync();
            return true;
        }

        private static MessageDto MapMessage(Message message)
        {
            return new MessageDto
            {
                Id = message.Id,
                SenderId = message.SenderId,
                Text = message.Text,
                CreatedAt = message.CreatedAt,
                Edited = message.Edited,
                Deleted = message.Deleted,
                Seen = message.Seen
            };
        }
    }
}
