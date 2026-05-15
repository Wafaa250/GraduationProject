using System;
using System.ComponentModel.DataAnnotations;

namespace GraduationProject.API.DTOs
{
    public static class StudentAssociationCategories
    {
        public static readonly string[] All = { "Technical", "Volunteer", "Media", "Cultural" };
    }

    public class StudentAssociationRegisterDto
    {
        [Required(ErrorMessage = "Association name is required")]
        [MaxLength(150)]
        public string AssociationName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Username is required")]
        [MaxLength(50)]
        [RegularExpression(@"^[a-zA-Z0-9_]+$", ErrorMessage = "Username may only contain letters, numbers, and underscores")]
        public string Username { get; set; } = string.Empty;

        [Required(ErrorMessage = "Email is required")]
        [EmailAddress(ErrorMessage = "Invalid email format")]
        [MaxLength(150)]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Password is required")]
        [MinLength(8, ErrorMessage = "Password must be at least 8 characters")]
        public string Password { get; set; } = string.Empty;

        [Required(ErrorMessage = "Please confirm your password")]
        public string ConfirmPassword { get; set; } = string.Empty;

        [MaxLength(2000)]
        public string? Description { get; set; }

        [Required(ErrorMessage = "Faculty is required")]
        [MaxLength(150)]
        public string Faculty { get; set; } = string.Empty;

        [Required(ErrorMessage = "Category is required")]
        public string Category { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? LogoUrl { get; set; }

        [MaxLength(500)]
        public string? InstagramUrl { get; set; }

        [MaxLength(500)]
        public string? FacebookUrl { get; set; }

        [MaxLength(500)]
        public string? LinkedInUrl { get; set; }
    }

    public class StudentAssociationProfileResponseDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string Role { get; set; } = "studentassociation";
        public string AssociationName { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? Faculty { get; set; }
        public string? Category { get; set; }
        public string? LogoUrl { get; set; }
        public string? InstagramUrl { get; set; }
        public string? FacebookUrl { get; set; }
        public string? LinkedInUrl { get; set; }
        public bool IsVerified { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class AssociationLogoUploadResponseDto
    {
        public string LogoUrl { get; set; } = string.Empty;
    }

    public class UpdateStudentAssociationProfileDto
    {
        [MaxLength(150)]
        public string? AssociationName { get; set; }

        [MaxLength(50)]
        [RegularExpression(@"^[a-zA-Z0-9_]+$", ErrorMessage = "Username may only contain letters, numbers, and underscores")]
        public string? Username { get; set; }

        [MaxLength(2000)]
        public string? Description { get; set; }

        [MaxLength(150)]
        public string? Faculty { get; set; }

        public string? Category { get; set; }

        [MaxLength(500)]
        public string? LogoUrl { get; set; }

        [MaxLength(500)]
        public string? InstagramUrl { get; set; }

        [MaxLength(500)]
        public string? FacebookUrl { get; set; }

        [MaxLength(500)]
        public string? LinkedInUrl { get; set; }
    }
}
