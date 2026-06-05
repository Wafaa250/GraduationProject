using System;
using System.Linq;
using System.Threading.Tasks;
using GraduationProject.API.Data;
using GraduationProject.API.DTOs;
using GraduationProject.API.Helpers;
using GraduationProject.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GraduationProject.API.Controllers
{
    [ApiController]
    [Route("api/organizations/{organizationId:int}/events/{eventId:int}/registrations")]
    public class PublicEventRegistrationsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;

        public PublicEventRegistrationsController(ApplicationDbContext db)
        {
            _db = db;
        }

        [HttpGet("mine")]
        [Authorize(Roles = "student")]
        public async Task<IActionResult> GetMine(int organizationId, int eventId)
        {
            var studentId = await GetCurrentStudentProfileIdAsync();
            if (!studentId.HasValue)
                return NotFound(new { message = "Student profile not found." });

            var evt = await LoadEventAsync(organizationId, eventId);
            if (evt == null)
                return NotFound(new { message = "Event not found." });

            var existing = await _db.StudentOrganizationEventRegistrations
                .AsNoTracking()
                .Include(r => r.Event)
                .Include(r => r.OrganizationProfile)
                .FirstOrDefaultAsync(r =>
                    r.StudentProfileId == studentId.Value &&
                    r.EventId == eventId &&
                    r.OrganizationProfileId == organizationId);

            if (existing == null)
            {
                return Ok(new StudentEventRegistrationStatusDto
                {
                    HasSubmitted = false,
                    OrganizationId = organizationId,
                    EventId = eventId,
                    EventTitle = evt.Title,
                });
            }

            return Ok(new StudentEventRegistrationStatusDto
            {
                HasSubmitted = true,
                RegistrationId = existing.Id,
                SubmittedAt = existing.SubmittedAt,
                OrganizationId = organizationId,
                OrganizationName = existing.OrganizationProfile.AssociationName,
                EventId = eventId,
                EventTitle = existing.Event.Title,
            });
        }

        [HttpPost]
        [Authorize(Roles = "student")]
        public async Task<IActionResult> Submit(
            int organizationId,
            int eventId,
            [FromBody] SubmitEventRegistrationDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var studentId = await GetCurrentStudentProfileIdAsync();
            if (!studentId.HasValue)
                return NotFound(new { message = "Student profile not found." });

            var evt = await LoadEventAsync(organizationId, eventId);
            if (evt == null)
                return NotFound(new { message = "Event not found." });

            var now = DateTime.UtcNow;
            if (EventRegistrationHelper.IsRegistrationDeadlinePassed(evt.RegistrationDeadline, now))
                return BadRequest(new { message = "Registration for this event is closed." });

            var duplicate = await _db.StudentOrganizationEventRegistrations.AnyAsync(r =>
                r.StudentProfileId == studentId.Value && r.EventId == eventId);
            if (duplicate)
                return Conflict(new { message = "You have already registered for this event." });

            if (evt.MaxParticipants.HasValue)
            {
                var count = await _db.StudentOrganizationEventRegistrations
                    .CountAsync(r => r.EventId == eventId);
                if (count >= evt.MaxParticipants.Value)
                    return BadRequest(new { message = "This event has reached maximum capacity." });
            }

            var form = await _db.StudentOrganizationEventRegistrationForms
                .AsNoTracking()
                .Include(f => f.Fields)
                .FirstOrDefaultAsync(f => f.EventId == eventId);

            if (form == null)
                return BadRequest(new { message = "This event has no registration form configured yet." });

            var fields = form.Fields.ToList();
            var validationError = EventRegistrationHelper.ValidateAnswers(fields, dto.Answers);
            if (validationError != null)
                return BadRequest(new { message = validationError });

            var registration = new StudentOrganizationEventRegistration
            {
                EventId = eventId,
                StudentProfileId = studentId.Value,
                OrganizationProfileId = organizationId,
                SubmittedAt = now,
            };

            foreach (var field in fields.OrderBy(f => f.DisplayOrder).ThenBy(f => f.Id))
            {
                var input = dto.Answers.LastOrDefault(a => a.FieldId == field.Id);
                if (input == null) continue;

                var stored = EventRegistrationHelper.NormalizeStoredAnswer(input, field.FieldType);
                if (string.IsNullOrWhiteSpace(stored) || stored == "[]") continue;

                registration.Answers.Add(new StudentOrganizationEventRegistrationAnswer
                {
                    FieldId = field.Id,
                    AnswerValue = stored,
                });
            }

            if (registration.Answers.Count == 0)
                return BadRequest(new { message = "Please complete at least one answer before submitting." });

            _db.StudentOrganizationEventRegistrations.Add(registration);
            await _db.SaveChangesAsync();

            return Ok(new EventRegistrationSubmitResponseDto
            {
                RegistrationId = registration.Id,
                SubmittedAt = registration.SubmittedAt,
                Message = "Your registration was submitted successfully.",
            });
        }

        private async Task<StudentOrganizationEvent?> LoadEventAsync(int organizationId, int eventId) =>
            await _db.StudentOrganizationEvents
                .AsNoTracking()
                .FirstOrDefaultAsync(e =>
                    e.Id == eventId &&
                    e.OrganizationProfileId == organizationId &&
                    e.IsPublished);

        private async Task<int?> GetCurrentStudentProfileIdAsync()
        {
            var userId = AuthorizationHelper.GetUserId(User);
            return await _db.StudentProfiles
                .AsNoTracking()
                .Where(s => s.UserId == userId)
                .Select(s => (int?)s.Id)
                .FirstOrDefaultAsync();
        }
    }
}
