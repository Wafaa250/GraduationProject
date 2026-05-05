using System;
using System.Linq;
using System.Threading.Tasks;
using GraduationProject.API.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GraduationProject.API.Controllers
{
    [ApiController]
    [Route("api/search")]
    [Authorize]
    public class SearchController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        public SearchController(ApplicationDbContext context) => _context = context;

        [HttpGet]
        public async Task<IActionResult> Search([FromQuery] string? query)
        {
            var term = query?.Trim().ToLower();
            if (string.IsNullOrWhiteSpace(term))
            {
                return Ok(new
                {
                    students = Array.Empty<object>(),
                    doctors = Array.Empty<object>(),
                });
            }

            var students = await _context.StudentProfiles
                .Include(s => s.User)
                .Include(s => s.StudentSkills)
                    .ThenInclude(ss => ss.Skill)
                .Where(s => s.User != null)
                .Where(s =>
                    (s.User.Name != null && s.User.Name.ToLower().Contains(term)) ||
                    (s.User.Email != null && s.User.Email.ToLower().Contains(term)) ||
                    (s.Major != null && s.Major.ToLower().Contains(term)) ||
                    (s.Faculty != null && s.Faculty.ToLower().Contains(term)) ||
                    (s.University != null && s.University.ToLower().Contains(term)) ||
                    (s.Roles != null && s.Roles.ToLower().Contains(term)) ||
                    (s.TechnicalSkills != null && s.TechnicalSkills.ToLower().Contains(term)) ||
                    (s.Tools != null && s.Tools.ToLower().Contains(term)) ||
                    s.StudentSkills.Any(ss => ss.Skill != null && ss.Skill.Name.ToLower().Contains(term))
                )
                .Select(s => new
                {
                    // /api/students/{id} resolves by UserId, so search must return UserId
                    id = s.UserId,
                    name = s.User.Name,
                    email = s.User.Email,
                    major = s.Major ?? string.Empty
                })
                .Take(5)
                .AsNoTracking()
                .ToListAsync();

            var doctors = await _context.DoctorProfiles
                .Include(d => d.User)
                .Where(d =>
                    (d.User.Name != null && d.User.Name.ToLower().Contains(term)) ||
                    (d.User.Email != null && d.User.Email.ToLower().Contains(term)) ||
                    (d.Specialization != null && d.Specialization.ToLower().Contains(term)) ||
                    (d.Faculty != null && d.Faculty.ToLower().Contains(term))
                )
                .Select(d => new
                {
                    id = d.UserId,
                    name = d.User.Name,
                    email = d.User.Email,
                    specialization = d.Specialization ?? string.Empty
                })
                .Take(5)
                .AsNoTracking()
                .ToListAsync();

            return Ok(new { students, doctors });
        }
    }
}
