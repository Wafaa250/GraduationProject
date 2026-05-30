using GraduationProject.API.Data;
using GraduationProject.API.DTOs;
using GraduationProject.API.Helpers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GraduationProject.API.Controllers
{
    [ApiController]
    [Route("api/users")]
    [Authorize]
    public class UsersController : ControllerBase
    {
        private readonly ApplicationDbContext _db;

        public UsersController(ApplicationDbContext db)
        {
            _db = db;
        }

        /// <summary>Search students and doctors by name for starting a new conversation.</summary>
        [HttpGet("search")]
        public async Task<IActionResult> Search([FromQuery] string? q)
        {
            var userId = AuthorizationHelper.GetUserId(User);
            if (userId <= 0)
                return Unauthorized(new { message = "Invalid token." });

            var term = q?.Trim().ToLowerInvariant();
            if (string.IsNullOrWhiteSpace(term) || term.Length < 2)
                return Ok(Array.Empty<UserSearchResultDto>());

            var studentRows = await _db.StudentProfiles
                .AsNoTracking()
                .Where(s => s.UserId != userId && s.User != null)
                .Where(s => s.User!.Name != null && s.User.Name.ToLower().Contains(term))
                .OrderBy(s => s.User!.Name)
                .Take(10)
                .Select(s => new
                {
                    s.UserId,
                    FullName = s.User!.Name ?? string.Empty,
                    s.Major,
                    s.ProfilePictureBase64,
                })
                .ToListAsync();

            var doctorRows = await _db.DoctorProfiles
                .AsNoTracking()
                .Where(d => d.UserId != userId && d.User != null)
                .Where(d => d.User!.Name != null && d.User.Name.ToLower().Contains(term))
                .OrderBy(d => d.User!.Name)
                .Take(10)
                .Select(d => new
                {
                    d.UserId,
                    FullName = d.User!.Name ?? string.Empty,
                    Major = d.Specialization ?? string.Empty,
                    d.ProfilePictureBase64,
                })
                .ToListAsync();

            var results = studentRows
                .Select(s => new UserSearchResultDto
                {
                    Id = s.UserId,
                    FullName = s.FullName,
                    Role = "Student",
                    Major = s.Major ?? string.Empty,
                    ProfilePictureUrl = UserSearchHelper.ToProfilePictureUrl(s.ProfilePictureBase64),
                })
                .Concat(doctorRows.Select(d => new UserSearchResultDto
                {
                    Id = d.UserId,
                    FullName = d.FullName,
                    Role = "Doctor",
                    Major = d.Major,
                    ProfilePictureUrl = UserSearchHelper.ToProfilePictureUrl(d.ProfilePictureBase64),
                }))
                .OrderBy(r => r.FullName, StringComparer.OrdinalIgnoreCase)
                .Take(15)
                .ToList();

            return Ok(results);
        }
    }
}
