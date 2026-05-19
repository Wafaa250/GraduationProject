using System;
using System.Linq;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using GraduationProject.API.Data;
using GraduationProject.API.DTOs;
using GraduationProject.API.Models;
using GraduationProject.API.Options;
using Google.Apis.Auth;
using Microsoft.Extensions.Options;


namespace GraduationProject.API.Services
{
    public interface IAuthService
    {
        Task<(AuthResponseDto? result, string? error)> RegisterDoctorAsync(RegisterDoctorDto dto);
        Task<(AuthResponseDto? result, string? error)> RegisterCompanyAsync(RegisterCompanyDto dto);
        Task<(AuthResponseDto? result, string? error)> RegisterStudentAssociationAsync(StudentAssociationRegisterDto dto);
        Task<(AuthResponseDto? result, string? error)> LoginAsync(LoginDto dto);
        Task<(AuthResponseDto? result, string? error, string? errorCode)> GoogleLoginAsync(GoogleLoginDto dto);
    }

    public class AuthService : IAuthService
    {
        private readonly ApplicationDbContext _db;
        private readonly IConfiguration _config;
        private readonly GoogleOptions _google;

        public AuthService(ApplicationDbContext db, IConfiguration config, IOptions<GoogleOptions> google)
        {
            _db = db;
            _config = config;
            _google = google.Value;
        }

        // ===========================
        // REGISTER DOCTOR ✅ محدّث
        // ===========================
        public async Task<(AuthResponseDto? result, string? error)> RegisterDoctorAsync(RegisterDoctorDto dto)
        {
            // تحقق من الباسورد
            if (dto.Password != dto.ConfirmPassword)
                return (null, "Passwords do not match.");

            var check = await CheckEmailAsync(dto.Email);
            if (check != null) return (null, check);

            // إنشاء الـ User
            var user = CreateUser(dto.FullName, dto.Email, dto.Password, "doctor");
            _db.Users.Add(user);
            await _db.SaveChangesAsync();

            // إنشاء الـ DoctorProfile
            var profile = new DoctorProfile
            {
                UserId               = user.Id,
                Specialization       = dto.Specialization,
                SupervisionCapacity  = 0,
                Bio                  = dto.Bio ?? "",
                University           = dto.University,
                Faculty              = dto.Faculty,
                Department           = dto.Department,
                ProfilePictureBase64 = dto.ProfilePictureBase64,
            };
            _db.DoctorProfiles.Add(profile);
            await _db.SaveChangesAsync();

            return (BuildResponse(user, profile.Id), null);
        }

        // ===========================
        // REGISTER COMPANY
        // ===========================
        public async Task<(AuthResponseDto? result, string? error)> RegisterCompanyAsync(RegisterCompanyDto dto)
        {
            if (dto.Password != dto.ConfirmPassword)
                return (null, "Passwords do not match.");

            var website = NormalizeCompanyUrl(dto.WebsiteUrl);
            var linkedIn = NormalizeCompanyUrl(dto.LinkedInUrl);
            var description = (dto.Description ?? string.Empty).Trim();
            if (string.IsNullOrWhiteSpace(website) && string.IsNullOrWhiteSpace(linkedIn))
            {
                if (description.Length < 40)
                    return (null, "Add your company website or LinkedIn URL, or provide a company description of at least 40 characters.");
            }

            var check = await CheckEmailAsync(dto.Email);
            if (check != null) return (null, check);

            var user = CreateUser(dto.ContactName.Trim(), dto.Email, dto.Password, "company");
            _db.Users.Add(user);
            await _db.SaveChangesAsync();

            var profile = new CompanyProfile
            {
                UserId       = user.Id,
                CompanyName  = dto.CompanyName.Trim(),
                Industry     = string.IsNullOrWhiteSpace(dto.Industry) ? null : dto.Industry.Trim(),
                Description  = string.IsNullOrWhiteSpace(dto.Description) ? null : dto.Description.Trim(),
                Location     = string.IsNullOrWhiteSpace(dto.Location) ? null : dto.Location.Trim(),
                WebsiteUrl   = website,
                LinkedInUrl  = linkedIn,
            };
            _db.CompanyProfiles.Add(profile);
            await _db.SaveChangesAsync();

            return (BuildResponse(user, profile.Id), null);
        }

        private static string? NormalizeCompanyUrl(string? url)
        {
            if (string.IsNullOrWhiteSpace(url)) return null;
            var trimmed = url.Trim();
            if (!trimmed.StartsWith("http://", StringComparison.OrdinalIgnoreCase) &&
                !trimmed.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
            {
                trimmed = "https://" + trimmed;
            }

            return Uri.TryCreate(trimmed, UriKind.Absolute, out _) ? trimmed : null;
        }

        // ===========================
        // REGISTER STUDENT ASSOCIATION
        // ===========================
        public async Task<(AuthResponseDto? result, string? error)> RegisterStudentAssociationAsync(StudentAssociationRegisterDto dto)
        {
            if (dto.Password != dto.ConfirmPassword)
                return (null, "Passwords do not match.");

            if (!StudentAssociationCategories.All.Contains(dto.Category))
                return (null, "Invalid category.");

            var check = await CheckEmailAsync(dto.Email);
            if (check != null) return (null, check);

            var username = dto.Username.Trim().ToLowerInvariant();
            var usernameTaken = await _db.StudentAssociationProfiles
                .AnyAsync(p => p.Username == username);
            if (usernameTaken)
                return (null, "This username is already taken.");

            var user = CreateUser(dto.AssociationName.Trim(), dto.Email, dto.Password, "studentassociation");
            _db.Users.Add(user);
            await _db.SaveChangesAsync();

            var email = dto.Email.ToLower().Trim();
            var profile = new StudentAssociationProfile
            {
                UserId = user.Id,
                AssociationName = dto.AssociationName.Trim(),
                Username = username,
                Email = email,
                Description = dto.Description,
                Faculty = dto.Faculty.Trim(),
                Category = dto.Category,
                LogoUrl = dto.LogoUrl,
                InstagramUrl = dto.InstagramUrl,
                FacebookUrl = dto.FacebookUrl,
                LinkedInUrl = dto.LinkedInUrl,
                IsVerified = false,
                CreatedAt = DateTime.UtcNow,
            };
            _db.StudentAssociationProfiles.Add(profile);
            await _db.SaveChangesAsync();

            return (BuildResponse(user, profile.Id), null);
        }

        // ===========================
        // LOGIN
        // ===========================
        public async Task<(AuthResponseDto? result, string? error)> LoginAsync(LoginDto dto)
        {
            var user = await _db.Users
                .FirstOrDefaultAsync(u => u.Email == dto.Email.ToLower().Trim());

            if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.Password))
                return (null, "Invalid email or password.");

            int profileId = await GetProfileIdAsync(user);

            return (BuildResponse(user, profileId), null);
        }

        // ── PRIVATE HELPERS ──────────────────────────────────────────────────

        private async Task<string?> CheckEmailAsync(string email)
        {
            bool exists = await _db.Users
                .AnyAsync(u => u.Email == email.ToLower().Trim());
            return exists ? "This email is already registered." : null;
        }

        private static User CreateUser(string name, string email, string password, string role) => new()
        {
            Name      = name.Trim(),
            Email     = email.ToLower().Trim(),
            Password  = BCrypt.Net.BCrypt.HashPassword(password),
            Role      = role,
            CreatedAt = DateTime.UtcNow
        };

        private AuthResponseDto BuildResponse(User user, int profileId, bool isNewUser = false) => new()
        {
            Token     = GenerateJwtToken(user),
            Role      = user.Role,
            UserId    = user.Id,
            Name      = user.Name,
            Email     = user.Email,
            ProfileId = profileId,
            IsNewUser = isNewUser,
        };

        private async Task<int> GetProfileIdAsync(User user)
        {
            return user.Role switch
            {
                "student"     => (await _db.StudentProfiles.FirstOrDefaultAsync(s => s.UserId == user.Id))?.Id ?? 0,
                "doctor"      => (await _db.DoctorProfiles.FirstOrDefaultAsync(d => d.UserId == user.Id))?.Id ?? 0,
                "company"     => (await _db.CompanyProfiles.FirstOrDefaultAsync(c => c.UserId == user.Id))?.Id ?? 0,
                "studentassociation" or "association" =>
                    (await _db.StudentAssociationProfiles.FirstOrDefaultAsync(a => a.UserId == user.Id))?.Id ?? 0,
                _             => 0
            };
        }

        private string GenerateJwtToken(User user)
        {
            var jwtKey = _config["Jwt:Key"]
                ?? throw new InvalidOperationException("JWT Key missing.");

            var key   = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email,          user.Email),
                new Claim(ClaimTypes.Role,           user.Role),
                new Claim(ClaimTypes.Name,           user.Name)
            };

            var token = new JwtSecurityToken(
                issuer:             _config["Jwt:Issuer"],
                audience:           _config["Jwt:Audience"],
                claims:             claims,
                expires:            DateTime.UtcNow.AddDays(7),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }


        // ===========================
        // GOOGLE LOGIN / REGISTER
        // ===========================
        public async Task<(AuthResponseDto? result, string? error, string? errorCode)> GoogleLoginAsync(GoogleLoginDto dto)
        {
            if (!_google.IsConfigured)
                return (null, "Google sign-in is not configured on the server.", "GOOGLE_NOT_CONFIGURED");

            GoogleJsonWebSignature.Payload googlePayload;
            try
            {
                var settings = new GoogleJsonWebSignature.ValidationSettings
                {
                    Audience = new[] { _google.ClientId }
                };

                googlePayload = await GoogleJsonWebSignature.ValidateAsync(dto.IdToken, settings);
            }
            catch (InvalidJwtException)
            {
                return (null, "Invalid Google token.", null);
            }

            if (!googlePayload.EmailVerified)
                return (null, "Google account email is not verified.", null);

            var email = googlePayload.Email?.ToLower().Trim();
            var name = googlePayload.Name ?? email ?? "User";

            if (string.IsNullOrWhiteSpace(email))
                return (null, "Could not retrieve email from Google token.", null);

            var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email);
            var isNewUser = false;

            if (user == null)
            {
                var role = NormalizeGoogleRole(dto.Role);
                if (role == null)
                {
                    return (
                        null,
                        "No account found for this Google email. Choose your role on the sign-up page, then continue with Google.",
                        "REGISTRATION_REQUIRED");
                }

                user = new User
                {
                    Name = name,
                    Email = email,
                    Password = BCrypt.Net.BCrypt.HashPassword(Guid.NewGuid().ToString("N")),
                    Role = role,
                    CreatedAt = DateTime.UtcNow,
                };
                _db.Users.Add(user);
                await _db.SaveChangesAsync();

                await CreateGoogleProfileAsync(user, name, email);
                isNewUser = true;
            }

            var profileId = await GetProfileIdAsync(user);
            if (profileId == 0)
                return (null, "Account profile is incomplete. Please contact support.", null);

            return (BuildResponse(user, profileId, isNewUser), null, null);
        }

        private static string? NormalizeGoogleRole(string? role) => role?.Trim().ToLowerInvariant() switch
        {
            "student" => "student",
            "doctor" => "doctor",
            "company" => "company",
            "association" or "studentassociation" => "studentassociation",
            _ => null,
        };

        private async Task CreateGoogleProfileAsync(User user, string displayName, string email)
        {
            switch (user.Role)
            {
                case "student":
                    _db.StudentProfiles.Add(new StudentProfile { UserId = user.Id });
                    break;

                case "doctor":
                    _db.DoctorProfiles.Add(new DoctorProfile
                    {
                        UserId = user.Id,
                        Department = string.Empty,
                    });
                    break;

                case "company":
                    _db.CompanyProfiles.Add(new CompanyProfile
                    {
                        UserId = user.Id,
                        CompanyName = displayName,
                    });
                    break;

                case "studentassociation":
                    var username = await GenerateUniqueAssociationUsernameAsync(email);
                    _db.StudentAssociationProfiles.Add(new StudentAssociationProfile
                    {
                        UserId = user.Id,
                        AssociationName = displayName,
                        Username = username,
                        Email = email,
                        Faculty = string.Empty,
                        IsVerified = false,
                        CreatedAt = DateTime.UtcNow,
                    });
                    break;

                default:
                    throw new InvalidOperationException($"Unsupported role for Google sign-up: {user.Role}");
            }

            await _db.SaveChangesAsync();
        }

        private async Task<string> GenerateUniqueAssociationUsernameAsync(string email)
        {
            var local = email.Split('@')[0].ToLowerInvariant();
            var sanitized = new string(local.Where(c => char.IsLetterOrDigit(c) || c == '_').ToArray());
            if (string.IsNullOrWhiteSpace(sanitized))
                sanitized = "org";

            var username = sanitized;
            var suffix = 0;
            while (await _db.StudentAssociationProfiles.AnyAsync(p => p.Username == username))
            {
                suffix++;
                username = $"{sanitized}{suffix}";
            }

            return username;
        }

    }
}
