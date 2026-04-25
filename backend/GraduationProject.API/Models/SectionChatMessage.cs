// Models/SectionChatMessage.cs
using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace GraduationProject.API.Models
{
    /// <summary>
    /// A single chat message sent inside a course section.
    /// All members of the section (students + the doctor who owns the course)
    /// can send and read messages.
    /// </summary>
    [Table("section_chat_messages")]
    public class SectionChatMessage
    {
        [Column("id")]          public int      Id         { get; set; }
        [Column("section_id")]  public int      SectionId  { get; set; }
        [Column("sender_user_id")] public int   SenderUserId { get; set; }
        [Column("text")]        public string   Text       { get; set; } = string.Empty;
        [Column("sent_at")]     public DateTime SentAt     { get; set; } = DateTime.UtcNow;

        // Navigation
        public CourseSection Section { get; set; } = null!;
        public User          Sender  { get; set; } = null!;
    }
}
