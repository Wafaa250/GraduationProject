using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace GraduationProject.API.Models
{
    public static class CompanyRequestInvitationStatus
    {
        public const string Pending = "pending";
        public const string Accepted = "accepted";
        public const string Rejected = "rejected";
        public const string Cancelled = "cancelled";
    }

    [Table("company_request_invitations")]
    public class CompanyRequestInvitation
    {
        [Column("id")] public int Id { get; set; }
        [Column("company_request_id")] public int CompanyRequestId { get; set; }
        [Column("company_profile_id")] public int CompanyProfileId { get; set; }
        [Column("student_profile_id")] public int StudentProfileId { get; set; }
        [Column("invited_by_user_id")] public int InvitedByUserId { get; set; }
        [Column("company_request_role_id")] public int? CompanyRequestRoleId { get; set; }
        [Column("message")] public string? Message { get; set; }
        [Column("status")] public string Status { get; set; } = CompanyRequestInvitationStatus.Pending;
        [Column("match_score")] public decimal? MatchScore { get; set; }
        [Column("source")] public string? Source { get; set; }
        [Column("created_at")] public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        [Column("responded_at")] public DateTime? RespondedAt { get; set; }
        [Column("cancelled_at")] public DateTime? CancelledAt { get; set; }

        public CompanyRequest CompanyRequest { get; set; } = null!;
        public CompanyProfile CompanyProfile { get; set; } = null!;
        public StudentProfile StudentProfile { get; set; } = null!;
        public User InvitedByUser { get; set; } = null!;
        public CompanyRequestRole? CompanyRequestRole { get; set; }
    }
}
