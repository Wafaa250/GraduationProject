namespace GraduationProject.API.Models
{
    public class Conversation
    {
        public int Id { get; set; }

        public string? Title { get; set; }

        /// <summary>When set, this conversation is the shared group chat for a course team.</summary>
        public int? CourseTeamId { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public CourseTeam? CourseTeam { get; set; }
        public ICollection<ConversationUser> ConversationUsers { get; set; } = new List<ConversationUser>();
        public ICollection<Message> Messages { get; set; } = new List<Message>();
    }

    public class ConversationUser
    {
        public int Id { get; set; }

        public int ConversationId { get; set; }

        public int UserId { get; set; }

        public Conversation Conversation { get; set; } = null!;
        public User User { get; set; } = null!;
    }

    public class Message
    {
        public int Id { get; set; }

        public int ConversationId { get; set; }

        public int SenderId { get; set; }

        public string Text { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public bool Edited { get; set; }

        public bool Deleted { get; set; }

        public bool Seen { get; set; }

        public Conversation Conversation { get; set; } = null!;
        public User Sender { get; set; } = null!;
    }
}
