using System;
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
    }

    public class AuthService : IAuthService
    {
        private readonly ApplicationDbContext _db;
        private readonly IConfiguration _config;

        public AuthService(ApplicationDbContext db, IConfiguration config)
        {
            _db = db;
            _config = config;
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
            var check = await CheckEmailAsync(dto.Email);
            if (check != null) return (null, check);

            var user = CreateUser(dto.Name, dto.Email, dto.Password, "company");
            _db.Users.Add(user);
            await _db.SaveChangesAsync();

            var profile = new CompanyProfile
            {
                UserId      = user.Id,
                CompanyName = dto.CompanyName,
                Industry    = dto.Industry,
                Description = dto.Description
            };
            _db.CompanyProfiles.Add(profile);
            await _db.SaveChangesAsync();

            return (BuildResponse(user, profile.Id), null);
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

    }
}
