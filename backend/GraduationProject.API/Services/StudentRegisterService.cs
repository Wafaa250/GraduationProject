using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using GraduationProject.API.Data;
using GraduationProject.API.DTOs;
using GraduationProject.API.Helpers;
using GraduationProject.API.Models;

namespace GraduationProject.API.Services
{
    public interface IStudentRegisterService
    {
        Task<(RegisterStudentResponseDto? result, string? error)> RegisterAsync(RegisterStudentDto dto);
    }

    public class StudentRegisterService : IStudentRegisterService
    {
        private readonly ApplicationDbContext _db;
        private readonly IConfiguration       _config;

        private static readonly string[] ValidYears =
            { "First Year", "Second Year", "Third Year", "Fourth Year", "Fifth Year" };

        public StudentRegisterService(ApplicationDbContext db, IConfiguration config)
        {
            _db     = db;
            _config = config;
        }

        public async Task<(RegisterStudentResponseDto? result, string? error)> RegisterAsync(RegisterStudentDto dto)
        {
            // ── 1. Passwords match ───────────────────────────────────────────
            if (dto.Password != dto.ConfirmPassword)
                return (null, "Passwords do not match.");

            // ── 2. Email unique ──────────────────────────────────────────────
            if (await _db.Users.AnyAsync(u => u.Email == dto.Email.ToLower().Trim()))
                return (null, "This email is already registered.");

            // ── 3. Valid academic year ───────────────────────────────────────
            if (!ValidYears.Contains(dto.AcademicYear))
                return (null, "Invalid academic year.");

            // ── 4. Create User ───────────────────────────────────────────────
            var user = new User
            {
                Name      = dto.FullName.Trim(),
                Email     = dto.Email.ToLower().Trim(),
                Password  = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                Role      = "student",
                CreatedAt = DateTime.UtcNow
            };
            _db.Users.Add(user);
            await _db.SaveChangesAsync();

            // ── 5. Skills: إذا موجودة استخدم الـ ID، إذا مش موجودة أضفها ────
            var rolesJson = await SkillHelper.NamesToIdsJson(_db, dto.Roles,           "role");
            var techJson  = await SkillHelper.NamesToIdsJson(_db, dto.TechnicalSkills, "technical");
            var toolsJson = await SkillHelper.NamesToIdsJson(_db, dto.Tools,           "tool");

            // ── 6. Create StudentProfile ─────────────────────────────────────
            var profile = new StudentProfile
            {
                UserId               = user.Id,
                StudentId            = dto.StudentId.Trim(),
                University           = dto.University.Trim(),
                Faculty              = dto.Faculty.Trim(),
                Major                = dto.Major.Trim(),
                AcademicYear         = dto.AcademicYear,
                Gpa                  = dto.Gpa,
                Bio                  = null,
                ProfilePictureBase64 = dto.ProfilePictureBase64,
                Roles                = rolesJson,
                TechnicalSkills      = techJson,
                Tools                = toolsJson,
            };
            _db.StudentProfiles.Add(profile);
            await _db.SaveChangesAsync();

            // ── 7. Response ──────────────────────────────────────────────────
            return (new RegisterStudentResponseDto
            {
                Token        = GenerateJwtToken(user),
                Role         = "student",
                UserId       = user.Id,
                ProfileId    = profile.Id,
                Name         = user.Name,
                Email        = user.Email,
                University   = profile.University   ?? "",
                Faculty      = profile.Faculty      ?? "",
                Major        = profile.Major        ?? "",
                AcademicYear = profile.AcademicYear ?? "",
                Skills       = dto.Roles.Concat(dto.TechnicalSkills).Concat(dto.Tools).ToList()
            }, null);
        }

        private string GenerateJwtToken(User user)
        {
            var key   = new SymmetricSecurityKey(
                            Encoding.UTF8.GetBytes(_config["Jwt:Key"]
                            ?? throw new InvalidOperationException("JWT Key missing.")));
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
                signingCredentials: creds);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
