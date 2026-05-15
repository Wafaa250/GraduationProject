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
    [Route("api/organization/events")]
    [Authorize(Roles = "studentassociation,association")]
    public class OrganizationEventsController : ControllerBase
    {
        private const string CoverFolder = "uploads/organization-events";
        private const long MaxCoverBytes = 5 * 1024 * 1024;

        private static readonly HashSet<string> AllowedImageExtensions = new(StringComparer.OrdinalIgnoreCase)
        {
            ".png", ".jpg", ".jpeg", ".webp"
        };

        private static readonly HashSet<string> AllowedImageContentTypes = new(StringComparer.OrdinalIgnoreCase)
        {
            "image/png", "image/jpeg", "image/webp"
        };

        private readonly ApplicationDbContext _db;
        private readonly IFileStorageService _files;
        private readonly IGraduationProjectNotificationService _notifications;

        public OrganizationEventsController(
            ApplicationDbContext db,
            IFileStorageService files,
            IGraduationProjectNotificationService notifications)
        {
            _db = db;
            _files = files;
            _notifications = notifications;
        }

        // POST /api/organization/events/upload-cover
        [HttpPost("upload-cover")]
        [RequestSizeLimit(MaxCoverBytes)]
        [RequestFormLimits(MultipartBodyLengthLimit = MaxCoverBytes)]
        public async Task<IActionResult> UploadCover([FromForm] IFormFile file)
        {
            var validation = ValidateImageFile(file);
            if (validation != null) return validation;

            try
            {
                var storedPath = await _files.SaveFormFileAsync(
                    file!,
                    CoverFolder,
                    AllowedImageExtensions,
                    MaxCoverBytes);

                return Ok(new EventCoverUploadResponseDto
                {
                    CoverImageUrl = _files.GetUrl(storedPath)
                });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // POST /api/organization/events
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateStudentOrganizationEventDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var error = ValidateEventDto(dto.EventType, dto.Category, dto.EventDate, dto.RegistrationDeadline, dto.MaxParticipants);
            if (error != null) return BadRequest(new { message = error });

            var profile = await GetCurrentProfileAsync();
            if (profile == null)
                return NotFound(new { message = "Organization profile not found." });

            var entity = new StudentOrganizationEvent
            {
                OrganizationProfileId = profile.Id,
                Title = dto.Title.Trim(),
                Description = dto.Description.Trim(),
                EventType = dto.EventType.Trim(),
                Category = dto.Category.Trim(),
                Location = dto.Location?.Trim(),
                IsOnline = dto.IsOnline,
                EventDate = ToUtc(dto.EventDate),
                RegistrationDeadline = dto.RegistrationDeadline.HasValue
                    ? ToUtc(dto.RegistrationDeadline.Value)
                    : null,
                CoverImageUrl = dto.CoverImageUrl,
                MaxParticipants = dto.MaxParticipants,
                CreatedAt = DateTime.UtcNow,
            };

            _db.StudentOrganizationEvents.Add(entity);
            await _db.SaveChangesAsync();

            await _notifications.NotifyOrganizationFollowersNewEventAsync(
                profile.Id,
                profile.AssociationName,
                entity.Id,
                entity.Title);

            return StatusCode(201, MapToDto(entity, profile));
        }

        // GET /api/organization/events
        [HttpGet]
        public async Task<IActionResult> List()
        {
            var profile = await GetCurrentProfileAsync();
            if (profile == null)
                return NotFound(new { message = "Organization profile not found." });

            var events = await _db.StudentOrganizationEvents
                .AsNoTracking()
                .Where(e => e.OrganizationProfileId == profile.Id)
                .OrderByDescending(e => e.EventDate)
                .ToListAsync();

            return Ok(events.Select(e => MapToDto(e, profile)).ToList());
        }

        // GET /api/organization/events/{id}
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var (entity, profile, notFound) = await GetOwnedEventAsync(id);
            if (notFound) return NotFound(new { message = "Event not found." });

            return Ok(MapToDto(entity!, profile!));
        }

        // PUT /api/organization/events/{id}
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateStudentOrganizationEventDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var (entity, profile, notFound) = await GetOwnedEventAsync(id, tracking: true);
            if (notFound) return NotFound(new { message = "Event not found." });

            var eventDate = dto.EventDate ?? entity!.EventDate;
            var registrationDeadline = dto.RegistrationDeadline ?? entity!.RegistrationDeadline;
            var eventType = dto.EventType ?? entity!.EventType;
            var category = dto.Category ?? entity!.Category;
            var maxParticipants = dto.MaxParticipants ?? entity!.MaxParticipants;

            var error = ValidateEventDto(eventType, category, eventDate, registrationDeadline, maxParticipants, requireCategory: false);
            if (error != null) return BadRequest(new { message = error });

            if (!string.IsNullOrWhiteSpace(dto.Title)) entity!.Title = dto.Title.Trim();
            if (dto.Description != null) entity!.Description = dto.Description.Trim();
            if (!string.IsNullOrWhiteSpace(dto.EventType)) entity!.EventType = dto.EventType.Trim();
            if (dto.Category != null) entity!.Category = dto.Category.Trim();
            if (dto.Location != null) entity!.Location = dto.Location.Trim();
            if (dto.IsOnline.HasValue) entity!.IsOnline = dto.IsOnline.Value;
            if (dto.EventDate.HasValue) entity!.EventDate = ToUtc(dto.EventDate.Value);
            if (dto.RegistrationDeadline.HasValue)
                entity!.RegistrationDeadline = ToUtc(dto.RegistrationDeadline.Value);
            if (dto.CoverImageUrl != null) entity!.CoverImageUrl = dto.CoverImageUrl;
            if (dto.MaxParticipants.HasValue) entity!.MaxParticipants = dto.MaxParticipants;

            entity!.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            return Ok(MapToDto(entity, profile!));
        }

        // DELETE /api/organization/events/{id}
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var (entity, _, notFound) = await GetOwnedEventAsync(id, tracking: true);
            if (notFound) return NotFound(new { message = "Event not found." });

            _db.StudentOrganizationEvents.Remove(entity!);
            await _db.SaveChangesAsync();

            return Ok(new { message = "Event deleted successfully." });
        }

        private async Task<StudentAssociationProfile?> GetCurrentProfileAsync()
        {
            var userId = AuthorizationHelper.GetUserId(User);
            return await _db.StudentAssociationProfiles
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.UserId == userId);
        }

        private async Task<(StudentOrganizationEvent? entity, StudentAssociationProfile? profile, bool notFound)> GetOwnedEventAsync(
            int id,
            bool tracking = false)
        {
            var userId = AuthorizationHelper.GetUserId(User);
            var profile = await _db.StudentAssociationProfiles
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.UserId == userId);

            if (profile == null)
                return (null, null, true);

            IQueryable<StudentOrganizationEvent> query = _db.StudentOrganizationEvents;
            if (!tracking) query = query.AsNoTracking();

            var entity = await query.FirstOrDefaultAsync(e =>
                e.Id == id && e.OrganizationProfileId == profile.Id);

            if (entity == null)
                return (null, profile, true);

            return (entity, profile, false);
        }

        private static string? ValidateEventDto(
            string eventType,
            string? category,
            DateTime eventDate,
            DateTime? registrationDeadline,
            int? maxParticipants,
            bool requireCategory = true)
        {
            if (!OrganizationEventTypes.All.Contains(eventType))
                return "Invalid event type.";

            if (requireCategory && !string.IsNullOrWhiteSpace(category) &&
                !OrganizationEventCategories.All.Contains(category))
                return "Invalid category.";

            if (!requireCategory && !string.IsNullOrWhiteSpace(category) &&
                !OrganizationEventCategories.All.Contains(category))
                return "Invalid category.";

            if (registrationDeadline.HasValue && registrationDeadline.Value > eventDate)
                return "Registration deadline must be on or before the event date.";

            if (maxParticipants.HasValue && maxParticipants.Value < 1)
                return "Max participants must be a positive number.";

            return null;
        }

        private IActionResult? ValidateImageFile(IFormFile? file)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "Please select an image file to upload." });

            if (file.Length > MaxCoverBytes)
                return BadRequest(new { message = "Cover image must be 5MB or smaller." });

            var ext = System.IO.Path.GetExtension(file.FileName);
            if (string.IsNullOrWhiteSpace(ext) || !AllowedImageExtensions.Contains(ext))
                return BadRequest(new { message = "Only PNG, JPG, JPEG, and WebP images are allowed." });

            if (!string.IsNullOrWhiteSpace(file.ContentType) && !AllowedImageContentTypes.Contains(file.ContentType))
                return BadRequest(new { message = "Only image files are allowed." });

            return null;
        }

        private static DateTime ToUtc(DateTime dt) =>
            dt.Kind == DateTimeKind.Unspecified
                ? DateTime.SpecifyKind(dt, DateTimeKind.Utc)
                : dt.ToUniversalTime();

        private static StudentOrganizationEventResponseDto MapToDto(
            StudentOrganizationEvent e,
            StudentAssociationProfile profile) => new()
        {
            Id = e.Id,
            OrganizationProfileId = e.OrganizationProfileId,
            Title = e.Title,
            Description = e.Description,
            EventType = e.EventType,
            Category = e.Category,
            Location = e.Location,
            IsOnline = e.IsOnline,
            EventDate = e.EventDate,
            RegistrationDeadline = e.RegistrationDeadline,
            CoverImageUrl = e.CoverImageUrl,
            MaxParticipants = e.MaxParticipants,
            CreatedAt = e.CreatedAt,
            UpdatedAt = e.UpdatedAt,
            OrganizationName = profile.AssociationName,
            OrganizationLogoUrl = profile.LogoUrl,
        };
    }
}
