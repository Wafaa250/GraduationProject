using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.IdentityModel.Tokens;
using GraduationProject.API.Data;
using GraduationProject.API.DTOs;
using GraduationProject.API.Models;
using Google.Apis.Auth;


namespace GraduationProject.API.Services
{
    public interface IAuthService
    {
        Task<(AuthResponseDto? result, string? error)> RegisterDoctorAsync(RegisterDoctorDto dto);
        Task<(AuthResponseDto? result, string? error)> RegisterCompanyAsync(RegisterCompanyDto dto);
        Task<(AuthResponseDto? result, string? error)> RegisterStudentAssociationAsync(StudentAssociationRegisterDto dto);
        Task<(AuthResponseDto? result, string? error)> LoginAsync(LoginDto dto);
        Task<(AuthResponseDto? result, string? error)> GoogleLoginAsync(GoogleLoginDto dto);
        Task<(ForgotPasswordResponseDto? result, string? error)> ForgotPasswordAsync(ForgotPasswordDto dto);
        Task<(bool success, string? error)> ResetPasswordAsync(ResetPasswordDto dto);
    }

    public class AuthService : IAuthService
    {
        private readonly ApplicationDbContext _db;
        private readonly IConfiguration _config;
        private readonly IHostEnvironment _env;
        private readonly IPasswordResetEmailService _passwordResetEmail;

        public AuthService(
            ApplicationDbContext db,
            IConfiguration config,
            IHostEnvironment env,
            IPasswordResetEmailService passwordResetEmail)
        {
            _db = db;
            _config = config;
            _env = env;
            _passwordResetEmail = passwordResetEmail;
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

        private AuthResponseDto BuildResponse(User user, int profileId) => new()
        {
            Token     = GenerateJwtToken(user),
            Role      = user.Role,
            UserId    = user.Id,
            Name      = user.Name,
            Email     = user.Email,
            ProfileId = profileId
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
        public async Task<(AuthResponseDto? result, string? error)> GoogleLoginAsync(GoogleLoginDto dto)
        {
            // ── 1. تحقق من الـ Google ID Token ──────────────────────────────
            GoogleJsonWebSignature.Payload googlePayload;
            try
            {
                var clientId = _config["Google:ClientId"]
                    ?? throw new InvalidOperationException("Google ClientId missing in config.");

                var settings = new GoogleJsonWebSignature.ValidationSettings
                {
                    Audience = new[] { clientId }
                };

                googlePayload = await GoogleJsonWebSignature.ValidateAsync(dto.IdToken, settings);
            }
            catch (InvalidJwtException)
            {
                return (null, "Invalid Google token.");
            }

            var email = googlePayload.Email?.ToLower().Trim();
            var name = googlePayload.Name ?? email ?? "User";

            if (string.IsNullOrWhiteSpace(email))
                return (null, "Could not retrieve email from Google token.");

            // ── 2. ابحث عن المستخدم أو أنشئه ────────────────────────────────
            var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email);

            if (user == null)
            {
                // مستخدم جديد — نسجّله تلقائياً
                var role = dto.Role?.ToLower() switch
                {
                    "doctor" => "doctor",
                    _ => "student"      // افتراضي
                };

                user = new User
                {
                    Name = name,
                    Email = email,
                    // لا يوجد باسورد للـ Google users — نحط قيمة غير قابلة للاستخدام
                    Password = BCrypt.Net.BCrypt.HashPassword(Guid.NewGuid().ToString()),
                    Role = role,
                    CreatedAt = DateTime.UtcNow
                };
                _db.Users.Add(user);
                await _db.SaveChangesAsync();

                // أنشئ الـ profile المناسب
                if (role == "student")
                {
                    _db.StudentProfiles.Add(new Models.StudentProfile
                    {
                        UserId = user.Id,
                        ProfilePictureBase64 = null,
                        // باقي الحقول فارغة — الطالب يكملها لاحقاً من صفحة الـ Profile
                    });
                }
                else if (role == "doctor")
                {
                    _db.DoctorProfiles.Add(new Models.DoctorProfile
                    {
                        UserId = user.Id,
                        Department = "",
                    });
                }

                await _db.SaveChangesAsync();
            }

            // ── 3. ارجع الـ JWT ───────────────────────────────────────────────
            int profileId = await GetProfileIdAsync(user);
            return (BuildResponse(user, profileId), null);
        }

        // ===========================
        // FORGOT / RESET PASSWORD
        // ===========================
        public async Task<(ForgotPasswordResponseDto? result, string? error)> ForgotPasswordAsync(ForgotPasswordDto dto)
        {
            const string genericMessage =
                "If an account exists for this email, you will receive password reset instructions shortly.";

            var email = dto.Email.ToLower().Trim();
            var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email);

            if (user == null)
            {
                return (new ForgotPasswordResponseDto
                {
                    Message = genericMessage,
                    EmailSent = false,
                    ResetUrl = null,
                }, null);
            }

            var rawToken = GenerateSecureToken();
            var tokenHash = HashResetToken(rawToken);
            var expiryMinutes = int.TryParse(_config["PasswordReset:TokenExpiryMinutes"], out var m) ? m : 60;

            var existing = await _db.PasswordResetTokens
                .Where(t => t.UserId == user.Id && t.UsedAt == null)
                .ToListAsync();
            foreach (var t in existing)
                t.UsedAt = DateTime.UtcNow;

            _db.PasswordResetTokens.Add(new PasswordResetToken
            {
                UserId = user.Id,
                TokenHash = tokenHash,
                ExpiresAt = DateTime.UtcNow.AddMinutes(expiryMinutes),
                CreatedAt = DateTime.UtcNow,
            });
            await _db.SaveChangesAsync();

            var baseUrl = (_config["PasswordReset:FrontendBaseUrl"] ?? "http://localhost:5173").TrimEnd('/');
            var resetUrl =
                $"{baseUrl}/reset-password?token={Uri.EscapeDataString(rawToken)}&email={Uri.EscapeDataString(email)}";

            var delivery = await _passwordResetEmail.SendPasswordResetAsync(email, resetUrl);
            var emailSent = delivery.Outcome == PasswordResetDeliveryOutcome.Sent;

            string? devResetUrl = null;
            if (_env.IsDevelopment() && !emailSent)
                devResetUrl = resetUrl;

            var message = genericMessage;
            if (_env.IsDevelopment() && devResetUrl != null)
            {
                message = delivery.Outcome switch
                {
                    PasswordResetDeliveryOutcome.NotConfigured =>
                        "No email was sent — SMTP is not configured on the server. Use the reset link below to continue.",
                    PasswordResetDeliveryOutcome.Failed =>
                        "We could not send the email. Use the reset link below to continue, or try again later.",
                    _ => genericMessage,
                };
            }

            return (new ForgotPasswordResponseDto
            {
                Message = message,
                EmailSent = emailSent,
                ResetUrl = devResetUrl,
            }, null);
        }

        public async Task<(bool success, string? error)> ResetPasswordAsync(ResetPasswordDto dto)
        {
            if (dto.Password != dto.ConfirmPassword)
                return (false, "Passwords do not match.");

            var email = dto.Email.ToLower().Trim();
            var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email);
            if (user == null)
                return (false, "Invalid or expired reset link.");

            var tokenHash = HashResetToken(dto.Token.Trim());
            var record = await _db.PasswordResetTokens
                .Where(t => t.UserId == user.Id && t.TokenHash == tokenHash && t.UsedAt == null)
                .OrderByDescending(t => t.CreatedAt)
                .FirstOrDefaultAsync();

            if (record == null || record.ExpiresAt < DateTime.UtcNow)
                return (false, "Invalid or expired reset link.");

            user.Password = BCrypt.Net.BCrypt.HashPassword(dto.Password);
            record.UsedAt = DateTime.UtcNow;

            var otherActive = await _db.PasswordResetTokens
                .Where(t => t.UserId == user.Id && t.UsedAt == null && t.Id != record.Id)
                .ToListAsync();
            foreach (var t in otherActive)
                t.UsedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();
            return (true, null);
        }

        private static string GenerateSecureToken()
        {
            var bytes = new byte[32];
            RandomNumberGenerator.Fill(bytes);
            return Convert.ToBase64String(bytes)
                .Replace('+', '-')
                .Replace('/', '_')
                .TrimEnd('=');
        }

        private static string HashResetToken(string token) =>
            Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token))).ToLowerInvariant();

    }
}
