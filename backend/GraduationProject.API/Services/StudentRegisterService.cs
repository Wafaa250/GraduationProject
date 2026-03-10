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
        private readonly IConfiguration _config;

        // الـ skill IDs من الفرونت → الاسم الكامل للحفظ في DB
        private static readonly Dictionary<string, string> SkillLabels = new()
        {
            // General
            { "communication",     "Communication" },
            { "teamwork",          "Teamwork" },
            { "leadership",        "Leadership" },
            { "problem_solving",   "Problem Solving" },
            { "time_management",   "Time Management" },
            { "critical_thinking", "Critical Thinking" },
            // Tech
            { "programming",    "Programming" },
            { "web_dev",        "Web Development" },
            { "mobile_dev",     "Mobile Development" },
            { "ai_ml",          "AI / Machine Learning" },
            { "cyber_security", "Cyber Security" },
            { "data_analysis",  "Data Analysis" },
            { "networking",     "Networking" },
            { "database",       "Database Management" },
            // Engineering
            { "autocad",             "AutoCAD / CAD Design" },
            { "circuit_design",      "Circuit Design" },
            { "structural_analysis", "Structural Analysis" },
            { "programming_eng",     "Engineering Programming" },
            { "project_planning",    "Project Planning" },
            { "matlab",              "MATLAB / Simulation" },
            { "3d_modeling",         "3D Modeling" },
            { "materials_science",   "Materials Science" },
            { "energy_systems",      "Energy Systems" },
            { "quality_control",     "Quality Control" },
            // Medical
            { "clinical_skills",    "Clinical Skills" },
            { "patient_care",       "Patient Care" },
            { "medical_imaging",    "Medical Imaging" },
            { "lab_diagnostics",    "Lab Diagnostics" },
            { "health_informatics", "Health Informatics" },
            { "anatomy",            "Anatomy & Physiology" },
            { "nutrition_science",  "Nutrition Science" },
            { "rehabilitation",     "Rehabilitation Therapy" },
            { "research_methods",   "Research Methods" },
            { "medical_data",       "Medical Data Analysis" },
            // Business
            { "marketing",          "Marketing" },
            { "finance",            "Finance" },
            { "entrepreneurship",   "Entrepreneurship" },
            { "business_analysis",  "Business Analysis" },
            { "project_management", "Project Management" },
            // Design
            { "graphic_design", "Graphic Design" },
            { "ui_ux",          "UI/UX Design" },
            { "branding",       "Branding" },
            { "illustration",   "Illustration" },
            // Media
            { "content_writing", "Content Writing" },
            { "video_editing",   "Video Editing" },
            { "photography",     "Photography" },
            { "social_media",    "Social Media Management" },
            // Science
            { "research",          "Research & Analysis" },
            { "lab_skills",        "Laboratory Skills" },
            { "technical_writing", "Technical Writing" },
        };

        private static readonly Dictionary<string, string> FacultyCategory = new()
        {
            { "Faculty of Medicine and Allied Medical Sciences", "Medical" },
            { "Faculty of Engineering",                         "Engineering" },
            { "كلية تكنولوجيا المعلومات وهندسة الحاسوب",       "Technology" },
            { "كلية الهندسة",                                   "Engineering" },
            { "كلية إدارة الأعمال والاقتصاد",                  "Business" },
            { "كلية الفنون والتصميم",                           "Design" },
            { "كلية الإعلام والاتصال",                          "Media" },
            { "كلية العلوم",                                    "Science" },
        };

        private static readonly string[] ValidYears =
            { "First Year", "Second Year", "Third Year", "Fourth Year", "Fifth Year" };

        private static readonly string[] GeneralSkillIds =
            { "communication", "teamwork", "leadership", "problem_solving", "time_management", "critical_thinking" };

        public StudentRegisterService(ApplicationDbContext db, IConfiguration config)
        {
            _db = db;
            _config = config;
        }

        public async Task<(RegisterStudentResponseDto? result, string? error)> RegisterAsync(RegisterStudentDto dto)
        {
            // ── 1. Passwords match ───────────────────────────────────────────
            if (dto.Password != dto.ConfirmPassword)
                return (null, "Passwords do not match.");

            // ── 2. Email not taken ───────────────────────────────────────────
            if (await _db.Users.AnyAsync(u => u.Email == dto.Email.ToLower().Trim()))
                return (null, "This email is already registered.");

            // ── 3. Validate academic year ────────────────────────────────────
            if (!ValidYears.Contains(dto.AcademicYear))
                return (null, "Invalid academic year.");

            // ── 4. Create User ───────────────────────────────────────────────
            var user = new User
            {
                Name = dto.FullName.Trim(),
                Email = dto.Email.ToLower().Trim(),
                Password = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                Role = "student",
                CreatedAt = DateTime.UtcNow
            };
            _db.Users.Add(user);
            await _db.SaveChangesAsync();

            // ── 5. Create StudentProfile ─────────────────────────────────────
            var profile = new StudentProfile
            {
                UserId = user.Id,
                StudentId = dto.StudentId.Trim(),
                University = dto.University.Trim(),
                Faculty = dto.Faculty.Trim(),
                Major = dto.Major.Trim(),
                AcademicYear = dto.AcademicYear,
                Gpa = dto.Gpa,
                Bio = null
            };
            _db.StudentProfiles.Add(profile);
            await _db.SaveChangesAsync();

            // ── 6. Save Skills ───────────────────────────────────────────────
            var allSkillIds = dto.GeneralSkills.Concat(dto.MajorSkills).ToList();
            var savedSkillNames = new List<string>();

            foreach (var skillId in allSkillIds)
            {
                var skillName = SkillLabels.TryGetValue(skillId, out var label) ? label : skillId;

                // أضيف الـ skill لجدول skills إذا مش موجودة
                var skill = await _db.Skills.FirstOrDefaultAsync(s => s.Name == skillName);
                if (skill == null)
                {
                    skill = new Skill
                    {
                        Name = skillName,
                        Category = GetCategory(skillId, dto.Faculty)
                    };
                    _db.Skills.Add(skill);
                    await _db.SaveChangesAsync();
                }

                // ربط الـ skill بالطالب في student_skills
                bool exists = await _db.StudentSkills
                    .AnyAsync(ss => ss.StudentId == profile.Id && ss.SkillId == skill.Id);

                if (!exists)
                {
                    _db.StudentSkills.Add(new StudentSkill
                    {
                        StudentId = profile.Id,
                        SkillId = skill.Id,
                        Level = 1
                    });
                    savedSkillNames.Add(skillName);
                }
            }
            await _db.SaveChangesAsync();

            // ── 7. Return response ───────────────────────────────────────────
            return (new RegisterStudentResponseDto
            {
                Token = GenerateJwtToken(user),
                Role = "student",
                UserId = user.Id,
                ProfileId = profile.Id,
                Name = user.Name,
                Email = user.Email,
                University = profile.University ?? "",
                Faculty = profile.Faculty ?? "",
                Major = profile.Major ?? "",
                AcademicYear = profile.AcademicYear ?? "",
                Skills = savedSkillNames
            }, null);
        }

        // ── HELPERS ──────────────────────────────────────────────────────────

        private static string GetCategory(string skillId, string faculty)
        {
            if (GeneralSkillIds.Contains(skillId)) return "General";
            return FacultyCategory.TryGetValue(faculty, out var cat) ? cat : "Other";
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
