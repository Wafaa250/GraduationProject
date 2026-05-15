using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GraduationProject.API.Data;
using GraduationProject.API.DTOs;
using GraduationProject.API.Helpers;
using GraduationProject.API.Models;
using GraduationProject.API.Services;

namespace GraduationProject.API.Controllers
{
    [ApiController]
    [Route("api/association")]
    [Authorize(Roles = "studentassociation,association")]
    public class StudentAssociationProfileController : ControllerBase
    {
        private const string LogoFolder = "uploads/association-logos";
        private const long MaxLogoBytes = 5 * 1024 * 1024;

        private static readonly HashSet<string> AllowedLogoExtensions = new(StringComparer.OrdinalIgnoreCase)
        {
            ".png", ".jpg", ".jpeg", ".webp"
        };

        private static readonly HashSet<string> AllowedLogoContentTypes = new(StringComparer.OrdinalIgnoreCase)
        {
            "image/png", "image/jpeg", "image/webp"
        };

        private readonly ApplicationDbContext _db;
        private readonly IFileStorageService _files;

        public StudentAssociationProfileController(ApplicationDbContext db, IFileStorageService files)
        {
            _db = db;
            _files = files;
        }

        // POST /api/association/upload-logo
        [HttpPost("upload-logo")]
        [RequestSizeLimit(MaxLogoBytes)]
        [RequestFormLimits(MultipartBodyLengthLimit = MaxLogoBytes)]
        public async Task<IActionResult> UploadLogo([FromForm] IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "Please select an image file to upload." });

            if (file.Length > MaxLogoBytes)
                return BadRequest(new { message = "Logo must be 5MB or smaller." });

            var ext = System.IO.Path.GetExtension(file.FileName);
            if (string.IsNullOrWhiteSpace(ext) || !AllowedLogoExtensions.Contains(ext))
                return BadRequest(new { message = "Only PNG, JPG, JPEG, and WebP images are allowed." });

            if (!string.IsNullOrWhiteSpace(file.ContentType) && !AllowedLogoContentTypes.Contains(file.ContentType))
                return BadRequest(new { message = "Only image files are allowed." });

            var userId = AuthorizationHelper.GetUserId(User);
            var profile = await _db.StudentAssociationProfiles
                .FirstOrDefaultAsync(p => p.UserId == userId);

            if (profile == null)
                return NotFound(new { message = "Association profile not found." });

            try
            {
                var previousPath = profile.LogoUrl;
                var storedPath = await _files.SaveFormFileAsync(
                    file,
                    LogoFolder,
                    AllowedLogoExtensions,
                    MaxLogoBytes);

                var logoUrl = _files.GetUrl(storedPath);
                profile.LogoUrl = logoUrl;
                await _db.SaveChangesAsync();

                if (!string.IsNullOrWhiteSpace(previousPath) &&
                    previousPath.StartsWith("/uploads/association-logos/", StringComparison.OrdinalIgnoreCase))
                {
                    var relative = previousPath.TrimStart('/').Replace("/", System.IO.Path.DirectorySeparatorChar.ToString());
                    try { await _files.DeleteAsync(relative); } catch { /* best-effort cleanup */ }
                }

                return Ok(new AssociationLogoUploadResponseDto { LogoUrl = logoUrl });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // GET /api/association/profile
        [HttpGet("profile")]
        public async Task<IActionResult> GetProfile()
        {
            var userId = AuthorizationHelper.GetUserId(User);
            var profile = await _db.StudentAssociationProfiles
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.UserId == userId);

            if (profile == null)
                return NotFound(new { message = "Association profile not found." });

            return Ok(MapToDto(profile));
        }

        // PUT /api/association/profile
        [HttpPut("profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateStudentAssociationProfileDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userId = AuthorizationHelper.GetUserId(User);
            var profile = await _db.StudentAssociationProfiles
                .Include(p => p.User)
                .FirstOrDefaultAsync(p => p.UserId == userId);

            if (profile == null)
                return NotFound(new { message = "Association profile not found." });

            if (!string.IsNullOrWhiteSpace(dto.Username))
            {
                var username = dto.Username.Trim().ToLowerInvariant();
                var taken = await _db.StudentAssociationProfiles
                    .AnyAsync(p => p.Username == username && p.UserId != userId);
                if (taken)
                    return Conflict(new { message = "This username is already taken." });
                profile.Username = username;
            }

            if (!string.IsNullOrWhiteSpace(dto.AssociationName))
            {
                profile.AssociationName = dto.AssociationName.Trim();
                profile.User.Name = profile.AssociationName;
            }

            if (dto.Description != null) profile.Description = dto.Description;
            if (dto.Faculty != null) profile.Faculty = dto.Faculty;

            if (dto.Category != null)
            {
                if (!StudentAssociationCategories.All.Contains(dto.Category))
                    return BadRequest(new { message = "Invalid category." });
                profile.Category = dto.Category;
            }

            if (dto.LogoUrl != null) profile.LogoUrl = dto.LogoUrl;
            if (dto.InstagramUrl != null) profile.InstagramUrl = dto.InstagramUrl;
            if (dto.FacebookUrl != null) profile.FacebookUrl = dto.FacebookUrl;
            if (dto.LinkedInUrl != null) profile.LinkedInUrl = dto.LinkedInUrl;

            await _db.SaveChangesAsync();
            return Ok(MapToDto(profile));
        }

        private static StudentAssociationProfileResponseDto MapToDto(StudentAssociationProfile profile) => new()
        {
            Id = profile.Id,
            UserId = profile.UserId,
            Role = "studentassociation",
            AssociationName = profile.AssociationName,
            Username = profile.Username,
            Email = profile.Email,
            Description = profile.Description,
            Faculty = profile.Faculty,
            Category = profile.Category,
            LogoUrl = profile.LogoUrl,
            InstagramUrl = profile.InstagramUrl,
            FacebookUrl = profile.FacebookUrl,
            LinkedInUrl = profile.LinkedInUrl,
            IsVerified = profile.IsVerified,
            CreatedAt = profile.CreatedAt,
        };
    }
}
