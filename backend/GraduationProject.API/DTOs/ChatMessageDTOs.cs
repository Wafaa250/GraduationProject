using System.ComponentModel.DataAnnotations;

namespace GraduationProject.API.DTOs
{
    public class SendChatMessageDto
    {
        [Required]
        [MaxLength(2000)]
        public string Text { get; set; } = string.Empty;
    }

    public class ChatMessageResponseDto
    {
        public int Id { get; set; }
        public int SectionId { get; set; }
        public int SenderUserId { get; set; }
        public string SenderName { get; set; } = string.Empty;
        public string Text { get; set; } = string.Empty;
        public DateTime SentAt { get; set; }
    }
}
