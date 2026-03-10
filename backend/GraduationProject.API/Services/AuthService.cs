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

namespace GraduationProject.API.Services
{
    public interface IAuthService
    {
        Task<(AuthResponseDto? result, string? error)> RegisterDoctorAsync(RegisterDoctorDto dto);
        Task<(AuthResponseDto? result, string? error)> RegisterCompanyAsync(RegisterCompanyDto dto);
        Task<(AuthResponseDto? result, string? error)> RegisterAssociationAsync(RegisterAssociationDto dto);
        Task<(AuthResponseDto? result, string? error)> LoginAsync(LoginDto dto);
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
        // REGISTER DOCTOR
        // ===========================
        public async Task<(AuthResponseDto? result, string? error)> RegisterDoctorAsync(RegisterDoctorDto dto)
        {
            var check = await CheckEmailAsync(dto.Email);
            if (check != null) return (null, check);

            var user = CreateUser(dto.Name, dto.Email, dto.Password, "doctor");
            _db.Users.Add(user);
            await _db.SaveChangesAsync();

            var profile = new DoctorProfile
            {
                UserId = user.Id,
                Specialization = dto.Specialization,
                SupervisionCapacity = dto.SupervisionCapacity
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
                UserId = user.Id,
                CompanyName = dto.CompanyName,
                Industry = dto.Industry,
                Description = dto.Description
            };
            _db.CompanyProfiles.Add(profile);
            await _db.SaveChangesAsync();

            return (BuildResponse(user, profile.Id), null);
        }

        // ===========================
        // REGISTER ASSOCIATION
        // ===========================
        public async Task<(AuthResponseDto? result, string? error)> RegisterAssociationAsync(RegisterAssociationDto dto)
        {
            var check = await CheckEmailAsync(dto.Email);
            if (check != null) return (null, check);

            var user = CreateUser(dto.Name, dto.Email, dto.Password, "association");
            _db.Users.Add(user);
            await _db.SaveChangesAsync();

            var profile = new AssociationProfile
            {
                UserId = user.Id,
                AssociationName = dto.AssociationName,
                Description = dto.Description
            };
            _db.AssociationProfiles.Add(profile);
            await _db.SaveChangesAsync();

            return (BuildResponse(user, profile.Id), null);
        }

        // ===========================
        // LOGIN (نفسه لكل الـ roles)
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
            Name = name.Trim(),
            Email = email.ToLower().Trim(),
            Password = BCrypt.Net.BCrypt.HashPassword(password),
            Role = role,
            CreatedAt = DateTime.UtcNow
        };

        private AuthResponseDto BuildResponse(User user, int profileId) => new()
        {
            Token = GenerateJwtToken(user),
            Role = user.Role,
            UserId = user.Id,
            Name = user.Name,
            Email = user.Email,
            ProfileId = profileId
        };

        private async Task<int> GetProfileIdAsync(User user)
        {
            return user.Role switch
            {
                "student" => (await _db.StudentProfiles.FirstOrDefaultAsync(s => s.UserId == user.Id))?.Id ?? 0,
                "doctor" => (await _db.DoctorProfiles.FirstOrDefaultAsync(d => d.UserId == user.Id))?.Id ?? 0,
                "company" => (await _db.CompanyProfiles.FirstOrDefaultAsync(c => c.UserId == user.Id))?.Id ?? 0,
                "association" => (await _db.AssociationProfiles.FirstOrDefaultAsync(a => a.UserId == user.Id))?.Id ?? 0,
                _ => 0
            };
        }

        private string GenerateJwtToken(User user)
        {
            var jwtKey = _config["Jwt:Key"]
                ?? throw new InvalidOperationException("JWT Key missing.");

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email,          user.Email),
                new Claim(ClaimTypes.Role,           user.Role),
                new Claim(ClaimTypes.Name,           user.Name)
            };

            var token = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"],
                audience: _config["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddDays(7),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
