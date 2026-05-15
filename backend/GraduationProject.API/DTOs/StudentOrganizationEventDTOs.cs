using System;
using System.ComponentModel.DataAnnotations;

namespace GraduationProject.API.DTOs
{
    public static class OrganizationEventTypes
    {
        public static readonly string[] All =
        {
            "Workshop", "Hackathon", "Competition", "Training",
            "Volunteer", "Orientation", "Community", "Media"
        };
    }

    public static class OrganizationEventCategories
    {
        public static readonly string[] All =
        {
            "Technical", "Volunteer", "Cultural", "Media", "Career", "Social"
        };
    }

    public class CreateStudentOrganizationEventDto
    {
        [Required(ErrorMessage = "Title is required")]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        [Required(ErrorMessage = "Description is required")]
        [MaxLength(5000)]
        public string Description { get; set; } = string.Empty;

        [Required(ErrorMessage = "Event type is required")]
        public string EventType { get; set; } = string.Empty;

        [Required(ErrorMessage = "Category is required")]
        public string Category { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? Location { get; set; }

        public bool IsOnline { get; set; }

        [Required(ErrorMessage = "Event date is required")]
        public DateTime EventDate { get; set; }

        public DateTime? RegistrationDeadline { get; set; }

        [MaxLength(500)]
        public string? CoverImageUrl { get; set; }

        [Range(1, int.MaxValue, ErrorMessage = "Max participants must be a positive number")]
        public int? MaxParticipants { get; set; }
    }

    public class UpdateStudentOrganizationEventDto
    {
        [MaxLength(200)]
        public string? Title { get; set; }

        [MaxLength(5000)]
        public string? Description { get; set; }

        public string? EventType { get; set; }

        public string? Category { get; set; }

        [MaxLength(500)]
        public string? Location { get; set; }

        public bool? IsOnline { get; set; }

        public DateTime? EventDate { get; set; }

        public DateTime? RegistrationDeadline { get; set; }

        [MaxLength(500)]
        public string? CoverImageUrl { get; set; }

        [Range(1, int.MaxValue, ErrorMessage = "Max participants must be a positive number")]
        public int? MaxParticipants { get; set; }
    }

    public class StudentOrganizationEventResponseDto
    {
        public int Id { get; set; }
        public int OrganizationProfileId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string EventType { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string? Location { get; set; }
        public bool IsOnline { get; set; }
        public DateTime EventDate { get; set; }
        public DateTime? RegistrationDeadline { get; set; }
        public string? CoverImageUrl { get; set; }
        public int? MaxParticipants { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public string? OrganizationName { get; set; }
        public string? OrganizationLogoUrl { get; set; }
    }

    public class EventCoverUploadResponseDto
    {
        public string CoverImageUrl { get; set; } = string.Empty;
    }
}
