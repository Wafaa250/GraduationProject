using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using GraduationProject.API.Data;
using GraduationProject.API.DTOs;
using GraduationProject.API.Helpers;
using GraduationProject.API.Middleware;
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
        Task<(AuthResponseDto? result, string? error)> ChangePasswordAsync(int userId, ChangePasswordDto dto);
        Task<(AuthResponseDto? result, string? error)> GoogleLoginAsync(GoogleLoginDto dto);
        Task<string> ForgotPasswordAsync(ForgotPasswordDto dto);
        Task<(bool success, string? error)> ResetPasswordAsync(ResetPasswordDto dto);
    }

    public class AuthService : IAuthService
    {
        private const string ForgotPasswordSuccessMessage =
            "If an account exists for that email, you will receive password reset instructions shortly.";

        private readonly ApplicationDbContext _db;
        private readonly IConfiguration _config;
        private readonly IEmailService _emailService;
        private readonly ILogger<AuthService> _logger;
        private readonly ICompanyUniquenessService _companyUniqueness;

        public AuthService(
            ApplicationDbContext db,
            IConfiguration config,
            IEmailService emailService,
            ILogger<AuthService> logger,
            ICompanyUniquenessService companyUniqueness)
        {
            _db = db;
            _config = config;
            _emailService = emailService;
            _logger = logger;
            _companyUniqueness = companyUniqueness;
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

            var uniqueness = await _companyUniqueness.ValidateNewCompanyAsync(
                dto.CompanyName,
                dto.Email,
                website);
            if (!uniqueness.isAllowed)
                return (null, uniqueness.error);

            var user = CreateUser(dto.ContactName.Trim(), dto.Email, dto.Password, "company");
            _db.Users.Add(user);
            await _db.SaveChangesAsync();

            var location = string.IsNullOrWhiteSpace(dto.Location) ? null : dto.Location.Trim();

            var profile = new CompanyProfile
            {
                UserId       = user.Id,
                CompanyName  = dto.CompanyName.Trim(),
                NormalizedCompanyName = CompanyUniquenessHelper.NormalizeCompanyName(dto.CompanyName),
                PrimaryEmailDomain = CompanyUniquenessHelper.ResolvePrimaryEmailDomain(dto.Email),
                WebsiteDomain = CompanyUniquenessHelper.ExtractWebsiteDomain(website),
                Industry     = string.IsNullOrWhiteSpace(dto.Industry) ? null : dto.Industry.Trim(),
                Description  = string.IsNullOrWhiteSpace(dto.Description) ? null : dto.Description.Trim(),
                Location     = location,
                HeadquartersLocation = location,
                WebsiteUrl   = website,
                LinkedInUrl  = linkedIn,
            };
            _db.CompanyProfiles.Add(profile);
            await _db.SaveChangesAsync();

            _db.CompanyMembers.Add(new CompanyMember
            {
                UserId = user.Id,
                CompanyProfileId = profile.Id,
                Role = CompanyMemberRoles.Owner,
                CreatedAt = DateTime.UtcNow,
            });
            await _db.SaveChangesAsync();

            return (BuildResponse(user, profile.Id, CompanyMemberRoles.Owner), null);
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
            string? companyRole = null;
            if (user.Role == "company")
                companyRole = await GetCompanyRoleAsync(user.Id);

            return (BuildResponse(user, profileId, companyRole, user.MustChangePassword), null);
        }

        public async Task<(AuthResponseDto? result, string? error)> ChangePasswordAsync(
            int userId,
            ChangePasswordDto dto)
        {
            if (dto.NewPassword != dto.ConfirmPassword)
                return (null, "Passwords do not match.");

            if (dto.NewPassword == dto.CurrentPassword)
                return (null, "New password must be different from your current password.");

            var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null)
                return (null, "User not found.");

            if (!BCrypt.Net.BCrypt.Verify(dto.CurrentPassword, user.Password))
                return (null, "Current password is incorrect.");

            user.Password = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
            user.MustChangePassword = false;
            await _db.SaveChangesAsync();

            int profileId = await GetProfileIdAsync(user);
            string? companyRole = null;
            if (user.Role == "company")
                companyRole = await GetCompanyRoleAsync(user.Id);

            return (BuildResponse(user, profileId, companyRole, false), null);
        }

        // ── PRIVATE HELPERS ──────────────────────────────────────────────────

        private async Task<string?> CheckEmailAsync(string email)
        {
            bool exists = await _db.Users
                .AnyAsync(u => u.Email == email.ToLower().Trim());
            return exists ? "This email is already registered." : null;
        }

        private static User CreateUser(
            string name,
            string email,
            string password,
            string role,
            bool mustChangePassword = false) => new()
        {
            Name      = name.Trim(),
            Email     = email.ToLower().Trim(),
            Password  = BCrypt.Net.BCrypt.HashPassword(password),
            Role      = role,
            MustChangePassword = mustChangePassword,
            CreatedAt = DateTime.UtcNow
        };

        private AuthResponseDto BuildResponse(
            User user,
            int profileId,
            string? companyRole = null,
            bool? mustChangePassword = null) => new()
        {
            Token     = GenerateJwtToken(user),
            Role      = user.Role,
            UserId    = user.Id,
            Name      = user.Name,
            Email     = user.Email,
            ProfileId = profileId,
            CompanyRole = companyRole,
            MustChangePassword = mustChangePassword ?? user.MustChangePassword,
        };

        private async Task<int> GetProfileIdAsync(User user)
        {
            return user.Role switch
            {
                "student"     => (await _db.StudentProfiles.FirstOrDefaultAsync(s => s.UserId == user.Id))?.Id ?? 0,
                "doctor"      => (await _db.DoctorProfiles.FirstOrDefaultAsync(d => d.UserId == user.Id))?.Id ?? 0,
                "company"     => await GetCompanyProfileIdAsync(user.Id),
                "studentassociation" or "association" =>
                    (await _db.StudentAssociationProfiles.FirstOrDefaultAsync(a => a.UserId == user.Id))?.Id ?? 0,
                _             => 0
            };
        }

        private async Task<int> GetCompanyProfileIdAsync(int userId)
        {
            var membership = await _db.CompanyMembers
                .AsNoTracking()
                .FirstOrDefaultAsync(m => m.UserId == userId);

            if (membership != null)
                return membership.CompanyProfileId;

            return (await _db.CompanyProfiles
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.UserId == userId))?.Id ?? 0;
        }

        private async Task<string?> GetCompanyRoleAsync(int userId)
        {
            var membership = await _db.CompanyMembers
                .AsNoTracking()
                .FirstOrDefaultAsync(m => m.UserId == userId);

            if (membership != null)
                return membership.Role;

            var ownsProfile = await _db.CompanyProfiles
                .AsNoTracking()
                .AnyAsync(c => c.UserId == userId);

            return ownsProfile ? CompanyMemberRoles.Owner : null;
        }

        private string GenerateJwtToken(User user)
        {
            var jwtKey = _config["Jwt:Key"]
                ?? throw new InvalidOperationException("JWT Key missing.");

            var key   = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email,          user.Email),
                new Claim(ClaimTypes.Role,           user.Role),
                new Claim(ClaimTypes.Name,           user.Name),
            };

            if (user.MustChangePassword)
            {
                claims.Add(new Claim(
                    RequirePasswordChangeMiddleware.MustChangePasswordClaim,
                    "true"));
            }

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
        // FORGOT PASSWORD
        // ===========================
        public async Task<string> ForgotPasswordAsync(ForgotPasswordDto dto)
        {
            var email = dto.Email.ToLower().Trim();
            var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email);

            if (user != null)
            {
                var now = DateTime.UtcNow;
                var activeTokens = await _db.PasswordResetTokens
                    .Where(t => t.UserId == user.Id && t.UsedAt == null && t.ExpiresAt > now)
                    .ToListAsync();

                foreach (var token in activeTokens)
                    token.UsedAt = now;

                var rawToken = PasswordResetTokenHelper.GenerateRawToken();
                var expirationMinutes = _config.GetValue<int>("PasswordReset:TokenExpirationMinutes", 60);

                _db.PasswordResetTokens.Add(new PasswordResetToken
                {
                    UserId = user.Id,
                    TokenHash = PasswordResetTokenHelper.HashToken(rawToken),
                    ExpiresAt = now.AddMinutes(expirationMinutes),
                    CreatedAt = now,
                });
                await _db.SaveChangesAsync();

                var resetBaseUrl = (_config["PasswordReset:FrontendResetUrl"] ?? "http://localhost:5173/reset-password")
                    .TrimEnd('/');
                var resetUrl = $"{resetBaseUrl}?token={Uri.EscapeDataString(rawToken)}";

                try
                {
                    await _emailService.SendPasswordResetEmailAsync(user.Email, resetUrl);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to send password reset email for user {UserId}", user.Id);
                }
            }

            return ForgotPasswordSuccessMessage;
        }

        // ===========================
        // RESET PASSWORD
        // ===========================
        public async Task<(bool success, string? error)> ResetPasswordAsync(ResetPasswordDto dto)
        {
            if (dto.Password != dto.ConfirmPassword)
                return (false, "Passwords do not match.");

            if (string.IsNullOrWhiteSpace(dto.Token))
                return (false, "Invalid or expired reset link.");

            var tokenHash = PasswordResetTokenHelper.HashToken(dto.Token.Trim());
            var now = DateTime.UtcNow;

            var resetToken = await _db.PasswordResetTokens
                .Include(t => t.User)
                .FirstOrDefaultAsync(t =>
                    t.TokenHash == tokenHash &&
                    t.UsedAt == null &&
                    t.ExpiresAt > now);

            if (resetToken?.User == null)
                return (false, "Invalid or expired reset link.");

            resetToken.User.Password = BCrypt.Net.BCrypt.HashPassword(dto.Password);
            resetToken.User.MustChangePassword = false;
            resetToken.UsedAt = now;

            var otherActive = await _db.PasswordResetTokens
                .Where(t => t.UserId == resetToken.UserId && t.Id != resetToken.Id && t.UsedAt == null)
                .ToListAsync();

            foreach (var t in otherActive)
                t.UsedAt = now;

            await _db.SaveChangesAsync();
            return (true, null);
        }

    }
}
