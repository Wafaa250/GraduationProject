using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace GraduationProject.API.DTOs
{
    // ===========================
    // LOGIN
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
        [Required(ErrorMessage = "Full name is required")]
        [MaxLength(100)]
        public string FullName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Email is required")]
        [EmailAddress(ErrorMessage = "Invalid email format")]
        [MaxLength(150)]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Password is required")]
        [MinLength(8, ErrorMessage = "Password must be at least 8 characters")]
        public string Password { get; set; } = string.Empty;

        [Required(ErrorMessage = "Please confirm your password")]
        public string ConfirmPassword { get; set; } = string.Empty;

        public string? ProfilePictureBase64 { get; set; }

        [Required(ErrorMessage = "Student ID is required")]
        [MaxLength(50)]
        public string StudentId { get; set; } = string.Empty;

        [Required(ErrorMessage = "University is required")]
        [MaxLength(150)]
        public string University { get; set; } = string.Empty;

        [Required(ErrorMessage = "Faculty is required")]
        [MaxLength(150)]
        public string Faculty { get; set; } = string.Empty;

        [Required(ErrorMessage = "Major is required")]
        [MaxLength(120)]
        public string Major { get; set; } = string.Empty;

        [Required(ErrorMessage = "Academic year is required")]
        public string AcademicYear { get; set; } = string.Empty;

        [Range(0.0, 4.0, ErrorMessage = "GPA must be between 0.0 and 4.0")]
        public decimal? Gpa { get; set; }

        // ── Step 4: Skills ───────────────────────────────
        [MinLength(1, ErrorMessage = "Please select at least one role")]
        public List<string> Roles { get; set; } = new();           // "Frontend Developer", etc.

        public List<string> TechnicalSkills { get; set; } = new(); // "Web Development", etc.

        public List<string> Tools { get; set; } = new();           // "React", "Python", etc.

        [MinLength(1, ErrorMessage = "Please select at least one general skill")]
        public List<string> GeneralSkills { get; set; } = new();

        public List<string> MajorSkills { get; set; } = new();
    }

    // ===========================
    // REGISTER - DOCTOR
    // ===========================
    public class RegisterDoctorDto
    {
        [Required(ErrorMessage = "Full name is required")]
        [MaxLength(100)]
        public string FullName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Email is required")]
        [EmailAddress(ErrorMessage = "Invalid email format")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Password is required")]
        [MinLength(8, ErrorMessage = "Password must be at least 8 characters")]
        public string Password { get; set; } = string.Empty;

        [Required(ErrorMessage = "Please confirm your password")]
        public string ConfirmPassword { get; set; } = string.Empty;

        [Required(ErrorMessage = "University is required")]
        public string University { get; set; } = string.Empty;

        [Required(ErrorMessage = "Faculty is required")]
        public string Faculty { get; set; } = string.Empty;

        [Required(ErrorMessage = "Department is required")]
        public string Department { get; set; } = string.Empty;

        [Required(ErrorMessage = "Specialization is required")]
        public string Specialization { get; set; } = string.Empty;

        public string? Bio                  { get; set; }
        public string? ProfilePictureBase64 { get; set; }
    }

    // ===========================
    // REGISTER - COMPANY
    // ===========================
    public class RegisterCompanyDto
    {
        [Required] public string Name        { get; set; } = string.Empty;
        [Required, EmailAddress] public string Email { get; set; } = string.Empty;
        [Required, MinLength(6)] public string Password { get; set; } = string.Empty;

        [Required] public string CompanyName { get; set; } = string.Empty;
        public string? Industry    { get; set; }
        public string? Description { get; set; }
    }

    // ===========================
    // REGISTER - ASSOCIATION
    // ===========================
    public class RegisterAssociationDto
    {
        [Required] public string Name        { get; set; } = string.Empty;
        [Required, EmailAddress] public string Email { get; set; } = string.Empty;
        [Required, MinLength(6)] public string Password { get; set; } = string.Empty;

        [Required] public string AssociationName { get; set; } = string.Empty;
        public string? Description { get; set; }
    }

    // ===========================
    // AUTH RESPONSE
    // ===========================
    public class AuthResponseDto
    {
        public string Token     { get; set; } = string.Empty;
        public string Role      { get; set; } = string.Empty;
        public int    UserId    { get; set; }
        public string Name      { get; set; } = string.Empty;
        public string Email     { get; set; } = string.Empty;
        public int    ProfileId { get; set; }
    }

    // ===========================
    // STUDENT REGISTER RESPONSE
    // ===========================
    public class RegisterStudentResponseDto
    {
        public string Token        { get; set; } = string.Empty;
        public string Role         { get; set; } = "student";
        public int    UserId       { get; set; }
        public int    ProfileId    { get; set; }
        public string Name         { get; set; } = string.Empty;
        public string Email        { get; set; } = string.Empty;
        public string University   { get; set; } = string.Empty;
        public string Faculty      { get; set; } = string.Empty;
        public string Major        { get; set; } = string.Empty;
        public string AcademicYear { get; set; } = string.Empty;
        public List<string> Skills { get; set; } = new();
    }
}
