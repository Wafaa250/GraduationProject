using System.ComponentModel.DataAnnotations;

namespace GraduationProject.API.DTOs
{
    public class ConversationUserDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
    }

    public class MessageDto
    {
        public int Id { get; set; }
        public int SenderId { get; set; }
        public string Text { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public bool Edited { get; set; }
        public bool Deleted { get; set; }
        public bool Seen { get; set; }
    }

    public class ConversationListItemDto
    {
        public int Id { get; set; }
        public ConversationUserDto? OtherUser { get; set; }
        public MessageDto? LastMessage { get; set; }
        public int UnseenCount { get; set; }
    }

    public class ConversationDetailsDto
    {
        public int Id { get; set; }
        public DateTime CreatedAt { get; set; }
        public List<ConversationUserDto> Users { get; set; } = new();
        public List<MessageDto> Messages { get; set; } = new();
    }

    public class StartConversationResponseDto
    {
        public int ConversationId { get; set; }
    }

    public class CreateMessageDto
    {
        [Required]
        [Range(1, int.MaxValue)]
        public int ConversationId { get; set; }

        [Required]
        [MaxLength(2000)]
        public string Text { get; set; } = string.Empty;
    }

    public class EditMessageDto
    {
        [Required]
        [MaxLength(2000)]
        public string Text { get; set; } = string.Empty;
    }
}
