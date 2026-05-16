using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GraduationProject.API.Data;
using GraduationProject.API.DTOs;
using GraduationProject.API.Helpers;
using GraduationProject.API.Models;

namespace GraduationProject.API.Controllers
{
    [ApiController]
    [Route("api/organization/events/{eventId:int}/registration-form")]
    [Authorize(Roles = "studentassociation,association")]
    public class OrganizationEventRegistrationFormController : ControllerBase
    {
        private static readonly JsonSerializerOptions JsonOptions = new()
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        };

        private readonly ApplicationDbContext _db;

        public OrganizationEventRegistrationFormController(ApplicationDbContext db)
        {
            _db = db;
        }

        [HttpGet]
        public async Task<IActionResult> Get(int eventId)
        {
            var (_, notFound) = await GetOwnedEventAsync(eventId);
            if (notFound) return NotFound(new { message = "Event not found." });

            var form = await LoadFormWithFieldsAsync(eventId);
            if (form == null) return NotFound(new { message = "Registration form not found." });

            return Ok(MapToDto(form));
        }

        [HttpPost]
        public async Task<IActionResult> Create(int eventId, [FromBody] CreateEventRegistrationFormDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var (_, notFound) = await GetOwnedEventAsync(eventId);
            if (notFound) return NotFound(new { message = "Event not found." });

            var exists = await _db.StudentOrganizationEventRegistrationForms
                .AsNoTracking()
                .AnyAsync(f => f.EventId == eventId);

            if (exists)
                return BadRequest(new { message = "This event already has a registration form." });

            var entity = new StudentOrganizationEventRegistrationForm
            {
                EventId = eventId,
                Title = dto.Title.Trim(),
                Description = string.IsNullOrWhiteSpace(dto.Description) ? null : dto.Description.Trim(),
                CreatedAt = DateTime.UtcNow,
            };

            _db.StudentOrganizationEventRegistrationForms.Add(entity);
            await _db.SaveChangesAsync();

            return StatusCode(201, MapToDto(entity));
        }

        [HttpPut]
        public async Task<IActionResult> Update(int eventId, [FromBody] UpdateEventRegistrationFormDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var (form, notFound) = await GetOwnedFormAsync(eventId, tracking: true);
            if (notFound) return NotFound(new { message = "Registration form not found." });

            if (!string.IsNullOrWhiteSpace(dto.Title))
                form!.Title = dto.Title.Trim();
            if (dto.Description != null)
                form!.Description = string.IsNullOrWhiteSpace(dto.Description) ? null : dto.Description.Trim();

            form!.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            await _db.Entry(form).Collection(f => f.Fields).LoadAsync();
            return Ok(MapToDto(form));
        }

        [HttpPost("fields")]
        public async Task<IActionResult> CreateField(int eventId, [FromBody] CreateEventRegistrationFieldDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var validation = ValidateField(dto.FieldType, dto.Options);
            if (validation != null) return BadRequest(new { message = validation });

            var (form, notFound) = await GetOwnedFormAsync(eventId, tracking: true);
            if (notFound) return NotFound(new { message = "Registration form not found." });

            var entity = new StudentOrganizationEventRegistrationField
            {
                FormId = form!.Id,
                Label = dto.Label.Trim(),
                FieldType = NormalizeType(dto.FieldType),
                Placeholder = string.IsNullOrWhiteSpace(dto.Placeholder) ? null : dto.Placeholder.Trim(),
                HelpText = string.IsNullOrWhiteSpace(dto.HelpText) ? null : dto.HelpText.Trim(),
                IsRequired = dto.IsRequired,
                Options = SerializeOptions(dto.FieldType, dto.Options),
                DisplayOrder = dto.DisplayOrder,
                CreatedAt = DateTime.UtcNow,
            };

            _db.StudentOrganizationEventRegistrationFields.Add(entity);
            form.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            return StatusCode(201, MapFieldToDto(entity));
        }

        [HttpPut("fields/{fieldId:int}")]
        public async Task<IActionResult> UpdateField(
            int eventId,
            int fieldId,
            [FromBody] UpdateEventRegistrationFieldDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var (field, notFound) = await GetOwnedFieldAsync(eventId, fieldId, tracking: true);
            if (notFound) return NotFound(new { message = "Field not found." });

            var type = dto.FieldType?.Trim() ?? field!.FieldType;
            var options = dto.Options ?? DeserializeOptions(field!.Options);
            var validation = ValidateField(type, options);
            if (validation != null) return BadRequest(new { message = validation });

            if (!string.IsNullOrWhiteSpace(dto.Label))
                field!.Label = dto.Label.Trim();
            if (!string.IsNullOrWhiteSpace(dto.FieldType))
                field!.FieldType = NormalizeType(dto.FieldType);
            if (dto.Placeholder != null)
                field!.Placeholder = string.IsNullOrWhiteSpace(dto.Placeholder) ? null : dto.Placeholder.Trim();
            if (dto.HelpText != null)
                field!.HelpText = string.IsNullOrWhiteSpace(dto.HelpText) ? null : dto.HelpText.Trim();
            if (dto.IsRequired.HasValue) field!.IsRequired = dto.IsRequired.Value;
            if (dto.DisplayOrder.HasValue) field!.DisplayOrder = dto.DisplayOrder.Value;
            if (dto.Options != null || dto.FieldType != null)
                field!.Options = SerializeOptions(type, options);

            var form = await _db.StudentOrganizationEventRegistrationForms
                .FirstAsync(f => f.Id == field!.FormId);
            form.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();
            return Ok(MapFieldToDto(field!));
        }

        [HttpDelete("fields/{fieldId:int}")]
        public async Task<IActionResult> DeleteField(int eventId, int fieldId)
        {
            var (field, notFound) = await GetOwnedFieldAsync(eventId, fieldId, tracking: true);
            if (notFound) return NotFound(new { message = "Field not found." });

            var form = await _db.StudentOrganizationEventRegistrationForms
                .FirstAsync(f => f.Id == field!.FormId);

            _db.StudentOrganizationEventRegistrationFields.Remove(field!);
            form.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            return Ok(new { message = "Field deleted." });
        }

        private async Task<StudentOrganizationEventRegistrationForm?> LoadFormWithFieldsAsync(int eventId) =>
            await _db.StudentOrganizationEventRegistrationForms
                .AsNoTracking()
                .Include(f => f.Fields.OrderBy(x => x.DisplayOrder).ThenBy(x => x.Id))
                .FirstOrDefaultAsync(f => f.EventId == eventId);

        private async Task<(StudentOrganizationEvent? entity, bool notFound)> GetOwnedEventAsync(
            int eventId,
            bool tracking = false)
        {
            var userId = AuthorizationHelper.GetUserId(User);
            var profile = await _db.StudentAssociationProfiles
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.UserId == userId);

            if (profile == null)
                return (null, true);

            IQueryable<StudentOrganizationEvent> query = _db.StudentOrganizationEvents;
            if (!tracking) query = query.AsNoTracking();

            var entity = await query.FirstOrDefaultAsync(e =>
                e.Id == eventId && e.OrganizationProfileId == profile.Id);

            return (entity, entity == null);
        }

        private async Task<(StudentOrganizationEventRegistrationForm? form, bool notFound)> GetOwnedFormAsync(
            int eventId,
            bool tracking = false)
        {
            var (_, eventNotFound) = await GetOwnedEventAsync(eventId);
            if (eventNotFound) return (null, true);

            IQueryable<StudentOrganizationEventRegistrationForm> query = _db.StudentOrganizationEventRegistrationForms;
            if (!tracking) query = query.AsNoTracking();

            var form = await query
                .Include(f => f.Fields)
                .FirstOrDefaultAsync(f => f.EventId == eventId);

            return (form, form == null);
        }

        private async Task<(StudentOrganizationEventRegistrationField? field, bool notFound)> GetOwnedFieldAsync(
            int eventId,
            int fieldId,
            bool tracking = false)
        {
            var (form, formNotFound) = await GetOwnedFormAsync(eventId);
            if (formNotFound) return (null, true);

            IQueryable<StudentOrganizationEventRegistrationField> query = _db.StudentOrganizationEventRegistrationFields;
            if (!tracking) query = query.AsNoTracking();

            var field = await query.FirstOrDefaultAsync(f =>
                f.Id == fieldId && f.FormId == form!.Id);

            return (field, field == null);
        }

        private static string NormalizeType(string fieldType)
        {
            var t = fieldType.Trim();
            if (t.Equals(EventRegistrationFieldTypes.Link, StringComparison.Ordinal))
                return EventRegistrationFieldTypes.Url;
            if (t.Equals("FileUpload", StringComparison.Ordinal))
                return EventRegistrationFieldTypes.FileUploadPlaceholder;
            return t;
        }

        private static string? ValidateField(string fieldType, List<string>? options)
        {
            var type = NormalizeType(fieldType);
            if (!EventRegistrationFieldTypes.All.Contains(type))
                return "Invalid field type.";

            if (EventRegistrationFieldTypes.UsesOptions(type))
            {
                var cleaned = CleanOptions(options);
                if (cleaned.Count < 2)
                    return "Choice-based fields need at least two options.";
            }

            return null;
        }

        private static List<string> CleanOptions(List<string>? options) =>
            options?
                .Select(o => o?.Trim() ?? "")
                .Where(o => o.Length > 0)
                .ToList() ?? new List<string>();

        private static string? SerializeOptions(string fieldType, List<string>? options)
        {
            var type = NormalizeType(fieldType);
            if (!EventRegistrationFieldTypes.UsesOptions(type))
                return null;

            var cleaned = CleanOptions(options);
            return cleaned.Count == 0 ? null : JsonSerializer.Serialize(cleaned, JsonOptions);
        }

        private static List<string>? DeserializeOptions(string? json)
        {
            if (string.IsNullOrWhiteSpace(json)) return null;
            try
            {
                return JsonSerializer.Deserialize<List<string>>(json, JsonOptions);
            }
            catch
            {
                return null;
            }
        }

        private static EventRegistrationFormResponseDto MapToDto(StudentOrganizationEventRegistrationForm form) =>
            new()
            {
                Id = form.Id,
                EventId = form.EventId,
                Title = form.Title,
                Description = form.Description,
                CreatedAt = form.CreatedAt,
                UpdatedAt = form.UpdatedAt,
                Fields = form.Fields
                    .OrderBy(f => f.DisplayOrder)
                    .ThenBy(f => f.Id)
                    .Select(MapFieldToDto)
                    .ToList(),
            };

        private static EventRegistrationFieldResponseDto MapFieldToDto(StudentOrganizationEventRegistrationField f) =>
            new()
            {
                Id = f.Id,
                FormId = f.FormId,
                Label = f.Label,
                FieldType = f.FieldType,
                Placeholder = f.Placeholder,
                HelpText = f.HelpText,
                IsRequired = f.IsRequired,
                Options = DeserializeOptions(f.Options),
                DisplayOrder = f.DisplayOrder,
                CreatedAt = f.CreatedAt,
            };
    }
}
