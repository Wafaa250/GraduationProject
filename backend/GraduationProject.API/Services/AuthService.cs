using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
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
        Task<(bool success, string? error)> VerifyResetCodeAsync(VerifyResetCodeDto dto);
        Task<(bool success, string? error)> ResetPasswordAsync(ResetPasswordDto dto);
    }

    public class AuthService : IAuthService
    {
        private const string ForgotPasswordSuccessMessage =
            "If an account exists, a verification code has been sent.";

        private static readonly Regex PasswordComplexityRegex = new(
            @"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$",
            RegexOptions.Compiled);

        private readonly ApplicationDbContext _db;
        private readonly IConfiguration _config;
        private readonly IEmailService _emailService;
        private readonly ILogger<AuthService> _logger;
        private readonly IMemoryCache _cache;
        private readonly ICompanyUniquenessService _companyUniqueness;
        private readonly ICompanyWorkspaceService _companyWorkspace;

        public AuthService(
            ApplicationDbContext db,
            IConfiguration config,
            IEmailService emailService,
            ILogger<AuthService> logger,
            IMemoryCache cache,
            ICompanyUniquenessService companyUniqueness,
            ICompanyWorkspaceService companyWorkspace)
        {
            _db = db;
            _config = config;
            _emailService = emailService;
            _logger = logger;
            _cache = cache;
            _companyUniqueness = companyUniqueness;
            _companyWorkspace = companyWorkspace;
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

            if (string.Equals(user.Role, "company", StringComparison.OrdinalIgnoreCase))
            {
                var workspace = await _companyWorkspace.ResolveWorkspaceAsync(user.Id);
                if (!workspace.Success)
                    return (null, workspace.UserFacingMessage);
            }

            int profileId = await GetProfileIdAsync(user);
            var companyRole = await GetCompanyRoleAsync(user.Id);

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
            var companyRole = await GetCompanyRoleAsync(user.Id);

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
            var companyRole = await GetCompanyRoleAsync(user.Id);

            return (BuildResponse(user, profileId, companyRole), null);
        }

        // ===========================
        // FORGOT PASSWORD (OTP)
        // ===========================
        public async Task<string> ForgotPasswordAsync(ForgotPasswordDto dto)
        {
            var email = dto.Email.ToLower().Trim();
            var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email);

            if (user != null)
            {
                _logger.LogInformation(
                    "Password reset send requested for user {UserId} ({Email})",
                    user.Id,
                    email);

                var (rateLimitReason, retryAfterSeconds) = await CheckSendRateLimitAsync(email);
                if (rateLimitReason != null)
                {
                    _logger.LogWarning(
                        "Rate limit triggered for password reset ({Reason}) user {UserId} ({Email}). RetryAfterSeconds={RetryAfterSeconds}",
                        rateLimitReason,
                        user.Id,
                        email,
                        retryAfterSeconds);
                    return ForgotPasswordSuccessMessage;
                }

                var now = DateTime.UtcNow;
                var unusedCodes = await _db.PasswordResetCodes
                    .Where(c => c.UserId == user.Id && !c.IsUsed)
                    .ToListAsync();

                foreach (var existing in unusedCodes)
                {
                    existing.IsUsed = true;
                    existing.UsedAt = now;
                }

                if (unusedCodes.Count > 0)
                {
                    _logger.LogInformation(
                        "Invalidated {Count} previous unused verification code(s) for user {UserId} ({Email})",
                        unusedCodes.Count,
                        user.Id,
                        email);
                }

                var rawCode = PasswordResetCodeHelper.GenerateCode();
                var expirationMinutes = _config.GetValue<int>("PasswordReset:CodeExpirationMinutes", 2);
                var expiresAt = now.AddMinutes(expirationMinutes);

                _db.PasswordResetCodes.Add(new PasswordResetCode
                {
                    UserId = user.Id,
                    Email = email,
                    CodeHash = PasswordResetCodeHelper.HashCode(rawCode),
                    ExpiresAt = expiresAt,
                    CreatedAt = now,
                    IsUsed = false,
                });
                await _db.SaveChangesAsync();

                _logger.LogInformation(
                    "Generated verification code for user {UserId} ({Email}). ExpiresAt={ExpiresAt:O} (hash stored only)",
                    user.Id,
                    email,
                    expiresAt);

                ClearVerifyAttempts(email);

                _logger.LogInformation(
                    "Email send started for password reset OTP to {Email} (user {UserId})",
                    user.Email,
                    user.Id);

                try
                {
                    await _emailService.SendPasswordResetOtpEmailAsync(user.Email, rawCode, user.Name);
                    _logger.LogInformation(
                        "Email send succeeded for password reset OTP to {Email} (user {UserId})",
                        user.Email,
                        user.Id);
                }
                catch (Exception ex)
                {
                    _logger.LogError(
                        ex,
                        "Email send failed for password reset OTP to {Email} (user {UserId})",
                        user.Email,
                        user.Id);
                }
            }
            else
            {
                _logger.LogInformation("Password reset requested for unknown email {Email}", email);
            }

            return ForgotPasswordSuccessMessage;
        }

        public async Task<(bool success, string? error)> VerifyResetCodeAsync(VerifyResetCodeDto dto)
        {
            var email = dto.Email.ToLower().Trim();
            var code = dto.Code.Trim();

            if (IsVerifyLockedOut(email))
                return (false, "Too many failed attempts. Please request a new verification code.");

            var (resetCode, lookupError) = await LookupResetCodeAsync(email, code);
            if (resetCode == null)
            {
                RecordFailedVerifyAttempt(email);
                _logger.LogWarning("Invalid password reset code verification attempt for {Email}", email);
                return (false, lookupError ?? InvalidResetCodeMessage);
            }

            ClearVerifyAttempts(email);
            _logger.LogInformation(
                "Password reset code verified for user {UserId} ({Email})",
                resetCode.UserId,
                email);
            return (true, null);
        }

        // ===========================
        // RESET PASSWORD (OTP)
        // ===========================
        public async Task<(bool success, string? error)> ResetPasswordAsync(ResetPasswordDto dto)
        {
            var email = dto.Email.ToLower().Trim();
            var code = dto.Code.Trim();

            if (!PasswordComplexityRegex.IsMatch(dto.NewPassword))
                return (false, "Password must include uppercase, lowercase, and a number.");

            if (IsVerifyLockedOut(email))
                return (false, "Too many failed attempts. Please request a new verification code.");

            var (resetCode, lookupError) = await LookupResetCodeAsync(email, code);
            if (resetCode?.User == null)
            {
                RecordFailedVerifyAttempt(email);
                _logger.LogWarning("Invalid password reset attempt for {Email}", email);
                return (false, lookupError ?? InvalidResetCodeMessage);
            }

            var now = DateTime.UtcNow;
            resetCode.User.Password = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
            resetCode.User.MustChangePassword = false;
            resetCode.IsUsed = true;
            resetCode.UsedAt = now;

            var otherActive = await _db.PasswordResetCodes
                .Where(c => c.UserId == resetCode.UserId && c.Id != resetCode.Id && !c.IsUsed)
                .ToListAsync();

            foreach (var active in otherActive)
            {
                active.IsUsed = true;
                active.UsedAt = now;
            }

            await _db.SaveChangesAsync();
            ClearVerifyAttempts(email);

            _logger.LogInformation(
                "Password reset completed for user {UserId} ({Email})",
                resetCode.UserId,
                email);
            return (true, null);
        }

        private const string ExpiredResetCodeMessage =
            "Verification code has expired. Please request a new code.";

        private const string InvalidResetCodeMessage =
            "Invalid or expired verification code.";

        private async Task<(PasswordResetCode? code, string? error)> LookupResetCodeAsync(string email, string code)
        {
            var codeHash = PasswordResetCodeHelper.HashCode(code);
            var now = DateTime.UtcNow;

            var candidate = await _db.PasswordResetCodes
                .Include(c => c.User)
                .Where(c => c.Email == email && c.CodeHash == codeHash)
                .OrderByDescending(c => c.CreatedAt)
                .FirstOrDefaultAsync();

            if (candidate == null)
                return (null, InvalidResetCodeMessage);

            if (candidate.IsUsed)
                return (null, InvalidResetCodeMessage);

            if (candidate.ExpiresAt <= now)
                return (null, ExpiredResetCodeMessage);

            return (candidate, null);
        }

        /// <summary>
        /// Resend cooldown aligns with the 2-minute forgot-password flow (ResendCooldownSeconds).
        /// Abuse cap uses a minute-based rolling window, not hourly buckets.
        /// </summary>
        private async Task<(string? reason, int? retryAfterSeconds)> CheckSendRateLimitAsync(string email)
        {
            var cooldownSeconds = _config.GetValue<int>("PasswordReset:ResendCooldownSeconds", 120);
            var maxInWindow = _config.GetValue<int>("PasswordReset:MaxAttemptsPerWindow", 10);
            var windowMinutes = _config.GetValue<int>("PasswordReset:RateLimitWindowMinutes", 30);
            var now = DateTime.UtcNow;

            var lastSentAt = await _db.PasswordResetCodes
                .Where(c => c.Email == email)
                .OrderByDescending(c => c.CreatedAt)
                .Select(c => (DateTime?)c.CreatedAt)
                .FirstOrDefaultAsync();

            if (lastSentAt.HasValue)
            {
                var elapsedSeconds = (int)(now - lastSentAt.Value).TotalSeconds;
                if (elapsedSeconds < cooldownSeconds)
                {
                    return ("resend_cooldown", cooldownSeconds - elapsedSeconds);
                }
            }

            var windowStart = now.AddMinutes(-windowMinutes);
            var attemptsInWindow = await _db.PasswordResetCodes
                .CountAsync(c => c.Email == email && c.CreatedAt > windowStart);

            if (attemptsInWindow >= maxInWindow)
            {
                return ("abuse_window", null);
            }

            return (null, null);
        }

        private string VerifyAttemptsCacheKey(string email) =>
            $"pwd-reset-verify:{email.ToLowerInvariant()}";

        private bool IsVerifyLockedOut(string email)
        {
            var maxAttempts = _config.GetValue<int>("PasswordReset:MaxVerifyAttempts", 5);
            return _cache.TryGetValue(VerifyAttemptsCacheKey(email), out int attempts) && attempts >= maxAttempts;
        }

        private void RecordFailedVerifyAttempt(string email)
        {
            var maxAttempts = _config.GetValue<int>("PasswordReset:MaxVerifyAttempts", 5);
            var expirationMinutes = _config.GetValue<int>("PasswordReset:CodeExpirationMinutes", 2);
            var key = VerifyAttemptsCacheKey(email);
            var attempts = _cache.TryGetValue(key, out int current) ? current + 1 : 1;

            _cache.Set(key, attempts, TimeSpan.FromMinutes(expirationMinutes));

            if (attempts >= maxAttempts)
            {
                _logger.LogWarning(
                    "Password reset verification locked out for {Email} after {Attempts} failed attempts",
                    email,
                    attempts);
            }
        }

        private void ClearVerifyAttempts(string email) =>
            _cache.Remove(VerifyAttemptsCacheKey(email));

    }
}
