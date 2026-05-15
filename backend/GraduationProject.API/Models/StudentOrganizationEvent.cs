using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace GraduationProject.API.Models
{
    [Table("student_organization_events")]
    public class StudentOrganizationEvent
    {
        [Column("id")] public int Id { get; set; }
        [Column("organization_profile_id")] public int OrganizationProfileId { get; set; }
        [Column("title")] public string Title { get; set; } = string.Empty;
        [Column("description")] public string Description { get; set; } = string.Empty;
        [Column("event_type")] public string EventType { get; set; } = string.Empty;
        [Column("category")] public string Category { get; set; } = string.Empty;
        [Column("location")] public string? Location { get; set; }
        [Column("is_online")] public bool IsOnline { get; set; }
        [Column("event_date")] public DateTime EventDate { get; set; }
        [Column("registration_deadline")] public DateTime? RegistrationDeadline { get; set; }
        [Column("cover_image_url")] public string? CoverImageUrl { get; set; }
        [Column("max_participants")] public int? MaxParticipants { get; set; }
        [Column("created_at")] public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        [Column("updated_at")] public DateTime? UpdatedAt { get; set; }

        public StudentAssociationProfile OrganizationProfile { get; set; } = null!;
    }
}
