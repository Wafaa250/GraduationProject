using System;
using System.ComponentModel.DataAnnotations;

namespace GraduationProject.API.DTOs
{
    public class CreateStudentOrganizationTeamMemberDto
    {
        [Required(ErrorMessage = "Full name is required.")]
        [MaxLength(200)]
        public string FullName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Role title is required.")]
        [MaxLength(120)]
        public string RoleTitle { get; set; } = string.Empty;

        [MaxLength(200)]
        public string? Major { get; set; }

        [MaxLength(2048)]
        public string? ImageUrl { get; set; }

        [MaxLength(2048)]
        public string? LinkedInUrl { get; set; }

        public int DisplayOrder { get; set; }
    }

    public class UpdateStudentOrganizationTeamMemberDto
    {
        [Required(ErrorMessage = "Full name is required.")]
        [MaxLength(200)]
        public string FullName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Role title is required.")]
        [MaxLength(120)]
        public string RoleTitle { get; set; } = string.Empty;

        [MaxLength(200)]
        public string? Major { get; set; }

        [MaxLength(2048)]
        public string? ImageUrl { get; set; }

        [MaxLength(2048)]
        public string? LinkedInUrl { get; set; }

        public int DisplayOrder { get; set; }
    }

    public class StudentOrganizationTeamMemberResponseDto
    {
        public int Id { get; set; }
        public int OrganizationProfileId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string RoleTitle { get; set; } = string.Empty;
        public string? Major { get; set; }
        public string? ImageUrl { get; set; }
        public string? LinkedInUrl { get; set; }
        public int DisplayOrder { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    public class TeamMemberImageUploadResponseDto
    {
        public string ImageUrl { get; set; } = string.Empty;
    }
}
