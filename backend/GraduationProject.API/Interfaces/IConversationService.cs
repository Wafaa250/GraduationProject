using GraduationProject.API.DTOs;

namespace GraduationProject.API.Interfaces
{
    public interface IConversationService
    {
        Task<List<ConversationListItemDto>> GetConversationsForUserAsync(int userId);
        Task<ConversationDetailsDto?> GetConversationByIdAsync(int conversationId, int userId, int page, int pageSize);
        Task<int?> StartConversationAsync(int currentUserId, int targetUserId);
        Task<bool> DeleteConversationAsync(int conversationId, int userId);
        Task<MessageDto?> CreateMessageAsync(int userId, CreateMessageDto dto);
        Task<MessageDto?> EditMessageAsync(int messageId, int userId, string text);
        Task<MessageDto?> UnsendMessageAsync(int messageId, int userId);
        Task<bool?> MarkConversationSeenAsync(int conversationId, int userId);
    }
}
