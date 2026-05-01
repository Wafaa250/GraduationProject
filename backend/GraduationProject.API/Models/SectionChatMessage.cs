namespace GraduationProject.API.Models
{
    public class SectionChatMessage
    {
        public int Id { get; set; }

        public int CourseSectionId { get; set; }

        public int SenderUserId { get; set; }

        public string Text { get; set; } = string.Empty;

        public DateTime SentAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public CourseSection Section { get; set; } = null!;
        public User Sender { get; set; } = null!;
    }
}
