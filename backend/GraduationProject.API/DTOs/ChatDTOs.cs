using System.ComponentModel.DataAnnotations;

namespace GraduationProject.API.DTOs
{
    // ── Request ───────────────────────────────────────────────────────────────

    public class SendChatMessageDto
    {
        [Required(ErrorMessage = "Message text is required.")]
        [StringLength(2000, MinimumLength = 1)]
        public string Text { get; set; } = string.Empty;
    }

    // ── Response ──────────────────────────────────────────────────────────────

    /// <summary>
    /// Matches the ChatMessage type in StudentCoursesPage.tsx.
    /// </summary>
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
