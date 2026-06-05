using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace GraduationProject.API.Models
{
    public static class CompanyActivityTypes
    {
        public const string RequestCreated = "request_created";
        public const string RequestPaused = "request_paused";
        public const string RequestReactivated = "request_reactivated";
        public const string RequestClosed = "request_closed";
        public const string RequestPublished = "request_published";
        public const string RequestUnpublished = "request_unpublished";
        public const string StudentSaved = "student_saved";
        public const string TeamSaved = "team_saved";
        public const string MemberAdded = "member_added";
        public const string NoteAdded = "note_added";
        public const string ProfileUpdated = "profile_updated";
    }

    [Table("company_activity_logs")]
    public class CompanyActivityLog
    {
        [Column("id")]
        public int Id { get; set; }

        [Column("company_profile_id")]
        public int CompanyProfileId { get; set; }

        [Column("user_id")]
        public int UserId { get; set; }

        [Column("activity_type")]
        public string ActivityType { get; set; } = string.Empty;

        [Column("description")]
        public string Description { get; set; } = string.Empty;

        [Column("created_at")]
        public DateTime CreatedAt { get; set; }

        public CompanyProfile CompanyProfile { get; set; } = null!;
        public User User { get; set; } = null!;
    }
}
