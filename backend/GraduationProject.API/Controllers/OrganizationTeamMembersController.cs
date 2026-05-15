using System;
using System.Collections.Generic;
using System.IO;
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
    [Route("api/organization/team-members")]
    [Authorize(Roles = "studentassociation,association")]
    public class OrganizationTeamMembersController : ControllerBase
    {
        private const string ImageFolder = "uploads/organization-team-members";
        private const long MaxImageBytes = 5 * 1024 * 1024;

        private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
        {
            ".png", ".jpg", ".jpeg", ".webp"
        };

        private static readonly HashSet<string> AllowedContentTypes = new(StringComparer.OrdinalIgnoreCase)
        {
            "image/png", "image/jpeg", "image/webp"
        };

        private readonly ApplicationDbContext _db;
        private readonly IFileStorageService _files;

        public OrganizationTeamMembersController(ApplicationDbContext db, IFileStorageService files)
        {
            _db = db;
            _files = files;
        }

        // POST /api/organization/team-members/upload-image
        [HttpPost("upload-image")]
        [RequestSizeLimit(MaxImageBytes)]
        [RequestFormLimits(MultipartBodyLengthLimit = MaxImageBytes)]
        public async Task<IActionResult> UploadImage([FromForm] IFormFile file)
        {
            var validation = ValidateImageFile(file);
            if (validation != null) return validation;

            var profile = await GetCurrentProfileAsync();
            if (profile == null)
                return NotFound(new { message = "Organization profile not found." });

            try
            {
                var storedPath = await _files.SaveFormFileAsync(
                    file!,
                    ImageFolder,
                    AllowedExtensions,
                    MaxImageBytes);

                var url = _files.GetUrl(storedPath);
                return Ok(new TeamMemberImageUploadResponseDto { ImageUrl = url });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // GET /api/organization/team-members
        [HttpGet]
        public async Task<IActionResult> List()
        {
            var profile = await GetCurrentProfileAsync();
            if (profile == null)
                return NotFound(new { message = "Organization profile not found." });

            var rows = await _db.StudentOrganizationTeamMembers
                .AsNoTracking()
                .Where(m => m.OrganizationProfileId == profile.Id)
                .OrderBy(m => m.DisplayOrder)
                .ThenBy(m => m.CreatedAt)
                .ToListAsync();

            return Ok(rows.Select(MapToDto).ToList());
        }

        // POST /api/organization/team-members
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateStudentOrganizationTeamMemberDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var profile = await GetCurrentProfileForWriteAsync();
            if (profile == null)
                return NotFound(new { message = "Organization profile not found." });

            var entity = new StudentOrganizationTeamMember
            {
                OrganizationProfileId = profile.Id,
                FullName = dto.FullName.Trim(),
                RoleTitle = dto.RoleTitle.Trim(),
                Major = string.IsNullOrWhiteSpace(dto.Major) ? null : dto.Major.Trim(),
                ImageUrl = string.IsNullOrWhiteSpace(dto.ImageUrl) ? null : dto.ImageUrl.Trim(),
                LinkedInUrl = string.IsNullOrWhiteSpace(dto.LinkedInUrl) ? null : dto.LinkedInUrl.Trim(),
                DisplayOrder = dto.DisplayOrder,
                CreatedAt = DateTime.UtcNow,
            };

            _db.StudentOrganizationTeamMembers.Add(entity);
            await _db.SaveChangesAsync();

            return Ok(MapToDto(entity));
        }

        // PUT /api/organization/team-members/{id}
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateStudentOrganizationTeamMemberDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var profile = await GetCurrentProfileForWriteAsync();
            if (profile == null)
                return NotFound(new { message = "Organization profile not found." });

            var entity = await _db.StudentOrganizationTeamMembers
                .FirstOrDefaultAsync(m => m.Id == id && m.OrganizationProfileId == profile.Id);

            if (entity == null)
                return NotFound(new { message = "Team member not found." });

            var previousImage = entity.ImageUrl;

            entity.FullName = dto.FullName.Trim();
            entity.RoleTitle = dto.RoleTitle.Trim();
            entity.Major = string.IsNullOrWhiteSpace(dto.Major) ? null : dto.Major.Trim();
            entity.ImageUrl = string.IsNullOrWhiteSpace(dto.ImageUrl) ? null : dto.ImageUrl.Trim();
            entity.LinkedInUrl = string.IsNullOrWhiteSpace(dto.LinkedInUrl) ? null : dto.LinkedInUrl.Trim();
            entity.DisplayOrder = dto.DisplayOrder;
            entity.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();

            if (!string.Equals(previousImage, entity.ImageUrl, StringComparison.Ordinal) &&
                IsTeamMemberUploadUrl(previousImage))
            {
                await TryDeleteImageFileAsync(previousImage);
            }

            return Ok(MapToDto(entity));
        }

        // DELETE /api/organization/team-members/{id}
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var profile = await GetCurrentProfileForWriteAsync();
            if (profile == null)
                return NotFound(new { message = "Organization profile not found." });

            var entity = await _db.StudentOrganizationTeamMembers
                .FirstOrDefaultAsync(m => m.Id == id && m.OrganizationProfileId == profile.Id);

            if (entity == null)
                return NotFound(new { message = "Team member not found." });

            var imageUrl = entity.ImageUrl;
            _db.StudentOrganizationTeamMembers.Remove(entity);
            await _db.SaveChangesAsync();

            if (IsTeamMemberUploadUrl(imageUrl))
                await TryDeleteImageFileAsync(imageUrl);

            return Ok(new { message = "Team member removed." });
        }

        private async Task<StudentAssociationProfile?> GetCurrentProfileAsync()
        {
            var userId = AuthorizationHelper.GetUserId(User);
            return await _db.StudentAssociationProfiles
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.UserId == userId);
        }

        private async Task<StudentAssociationProfile?> GetCurrentProfileForWriteAsync()
        {
            var userId = AuthorizationHelper.GetUserId(User);
            return await _db.StudentAssociationProfiles
                .FirstOrDefaultAsync(p => p.UserId == userId);
        }

        private static bool IsTeamMemberUploadUrl(string? url) =>
            !string.IsNullOrWhiteSpace(url) &&
            url.StartsWith("/uploads/organization-team-members/", StringComparison.OrdinalIgnoreCase);

        private async Task TryDeleteImageFileAsync(string? imageUrl)
        {
            if (!IsTeamMemberUploadUrl(imageUrl)) return;
            var relative = imageUrl!.TrimStart('/').Replace("/", Path.DirectorySeparatorChar.ToString());
            try
            {
                await _files.DeleteAsync(relative);
            }
            catch
            {
                /* best-effort */
            }
        }

        private IActionResult? ValidateImageFile(IFormFile? file)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "Please select an image file to upload." });

            if (file.Length > MaxImageBytes)
                return BadRequest(new { message = "Image must be 5MB or smaller." });

            var ext = Path.GetExtension(file.FileName);
            if (string.IsNullOrWhiteSpace(ext) || !AllowedExtensions.Contains(ext))
                return BadRequest(new { message = "Only PNG, JPG, JPEG, and WebP images are allowed." });

            if (!string.IsNullOrWhiteSpace(file.ContentType) && !AllowedContentTypes.Contains(file.ContentType))
                return BadRequest(new { message = "Only image files are allowed." });

            return null;
        }

        private static StudentOrganizationTeamMemberResponseDto MapToDto(StudentOrganizationTeamMember m) => new()
        {
            Id = m.Id,
            OrganizationProfileId = m.OrganizationProfileId,
            FullName = m.FullName,
            RoleTitle = m.RoleTitle,
            Major = m.Major,
            ImageUrl = m.ImageUrl,
            LinkedInUrl = m.LinkedInUrl,
            DisplayOrder = m.DisplayOrder,
            CreatedAt = m.CreatedAt,
            UpdatedAt = m.UpdatedAt,
        };
    }
}
