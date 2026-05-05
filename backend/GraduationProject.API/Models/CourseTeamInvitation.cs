namespace GraduationProject.API.Models
{
    public class CourseTeamInvitation
    {
        public int Id { get; set; }

        public int ProjectId { get; set; }

        public int SenderId { get; set; }

        public int ReceiverId { get; set; }

        /// <summary>pending | accepted | rejected</summary>
        public string Status { get; set; } = "pending";

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? RespondedAt { get; set; }

        // Navigation
        public CourseProject Project { get; set; } = null!;
        public StudentProfile Sender { get; set; } = null!;
        public StudentProfile Receiver { get; set; } = null!;
    }
}
