using System;
using System.ComponentModel.DataAnnotations;

namespace GraduationProject.API.DTOs
{
    public class CompanyMemberListItemDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }

    public class AddCompanyMemberDto
    {
        [Required(ErrorMessage = "Full name is required.")]
        [MaxLength(100)]
        public string FullName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Email is required.")]
        [EmailAddress(ErrorMessage = "Invalid email format.")]
        [MaxLength(150)]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Role is required.")]
        [MaxLength(20)]
        public string Role { get; set; } = "member";
    }

    public class AddCompanyMemberResponseDto
    {
        public CompanyMemberListItemDto Member { get; set; } = null!;
        public bool CredentialsEmailSent { get; set; }
    }
}
