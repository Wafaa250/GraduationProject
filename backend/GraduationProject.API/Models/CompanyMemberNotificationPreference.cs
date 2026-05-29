using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace GraduationProject.API.Models
{
    [Table("company_member_notification_preferences")]
    public class CompanyMemberNotificationPreference
    {
        [Column("id")]
        public int Id { get; set; }

        [Column("company_profile_id")]
        public int CompanyProfileId { get; set; }

        [Column("user_id")]
        public int UserId { get; set; }

        [Column("notify_ai_recommendations")]
        public bool NotifyAiRecommendations { get; set; } = true;

        [Column("notify_saved_recommendations")]
        public bool NotifySavedRecommendations { get; set; } = true;

        [Column("notify_request_updates")]
        public bool NotifyRequestStatusUpdates { get; set; } = true;

        [Column("notify_workspace_member_changes")]
        public bool NotifyWorkspaceMemberChanges { get; set; } = true;

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; }

        public CompanyProfile CompanyProfile { get; set; } = null!;
        public User User { get; set; } = null!;
    }
}
