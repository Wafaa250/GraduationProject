using System.ComponentModel.DataAnnotations;

namespace GraduationProject.API.DTOs
{
    // ===========================
    // LOGIN  (نفسه لكل الـ roles)
    // ===========================
    public class LoginDto
    {
        [Required(ErrorMessage = "Email is required")]
        [EmailAddress(ErrorMessage = "Invalid email format")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Password is required")]
        public string Password { get; set; } = string.Empty;
    }

    // ===========================
    // REGISTER - STUDENT
    // ===========================
    public class RegisterStudentDto
    {
        [Required] public string Name { get; set; } = string.Empty;
        [Required, EmailAddress] public string Email { get; set; } = string.Empty;
        [Required, MinLength(6)] public string Password { get; set; } = string.Empty;

        // Student-specific
        public string? Major { get; set; }

        [Range(1, 7)]
        public int? Year { get; set; }
        public string? Bio { get; set; }

    }

    // ===========================
    // REGISTER - DOCTOR
    // ===========================
    public class RegisterDoctorDto
    {
        [Required] public string Name { get; set; } = string.Empty;
        [Required, EmailAddress] public string Email { get; set; } = string.Empty;
        [Required, MinLength(6)] public string Password { get; set; } = string.Empty;

        // Doctor-specific
        public string? Specialization { get; set; }

        [Range(0, 100)]
        public int SupervisionCapacity { get; set; } = 0;
    }

    // ===========================
    // REGISTER - COMPANY
    // ===========================
    public class RegisterCompanyDto
    {
        [Required] public string Name { get; set; } = string.Empty;
        [Required, EmailAddress] public string Email { get; set; } = string.Empty;
        [Required, MinLength(6)] public string Password { get; set; } = string.Empty;

        // Company-specific
        [Required] public string CompanyName { get; set; } = string.Empty;
        public string? Industry { get; set; }
        public string? Description { get; set; }
    }

    // ===========================
    // REGISTER - ASSOCIATION
    // ===========================
    public class RegisterAssociationDto
    {
        [Required] public string Name { get; set; } = string.Empty;
        [Required, EmailAddress] public string Email { get; set; } = string.Empty;
        [Required, MinLength(6)] public string Password { get; set; } = string.Empty;

        // Association-specific
        [Required] public string AssociationName { get; set; } = string.Empty;
        public string? Description { get; set; }
    }

    // ===========================
    // RESPONSE (نفسه للكل)
    // ===========================
    public class AuthResponseDto
    {
        public string Token { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public int UserId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public int ProfileId { get; set; }  // ID of the created profile
    }
}
