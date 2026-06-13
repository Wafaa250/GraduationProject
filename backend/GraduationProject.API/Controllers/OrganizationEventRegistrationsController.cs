using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using GraduationProject.API.Data;
using GraduationProject.API.DTOs;
using GraduationProject.API.Helpers;
using GraduationProject.API.Models;
using GraduationProject.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GraduationProject.API.Controllers
{
    [ApiController]
    [Route("api/organization/events/{eventId:int}/registrations")]
    [Authorize(Roles = "studentassociation,association")]
    public class OrganizationEventRegistrationsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly IEventRegistrationRecommendationService _recommendations;

        public OrganizationEventRegistrationsController(
            ApplicationDbContext db,
            IEventRegistrationRecommendationService recommendations)
        {
            _db = db;
            _recommendations = recommendations;
        }

        [HttpGet]
        public async Task<IActionResult> List(int eventId)
        {
            var profile = await GetCurrentProfileAsync();
            if (profile == null)
                return NotFound(new { message = "Organization profile not found." });

            var eventExists = await _db.StudentOrganizationEvents.AnyAsync(e =>
                e.Id == eventId && e.OrganizationProfileId == profile.Id);
            if (!eventExists)
                return NotFound(new { message = "Event not found." });

            var rows = await _db.StudentOrganizationEventRegistrations
                .AsNoTracking()
                .Include(r => r.StudentProfile).ThenInclude(s => s.User)
                .Include(r => r.Answers).ThenInclude(a => a.Field)
                .Where(r => r.EventId == eventId && r.OrganizationProfileId == profile.Id)
                .OrderByDescending(r => r.SubmittedAt)
                .ToListAsync();

            var items = rows.Select(r =>
            {
                var firstAnswer = r.Answers
                    .OrderBy(a => a.Field.DisplayOrder)
                    .ThenBy(a => a.FieldId)
                    .FirstOrDefault();
                var preview = firstAnswer == null
                    ? string.Empty
                    : EventRegistrationHelper.MapAnswerResponse(firstAnswer).AnswerValue;

                if (preview.Length > 120)
                    preview = preview[..117] + "…";

                return new EventRegistrationListItemDto
                {
                    Id = r.Id,
                    StudentProfileId = r.StudentProfileId,
                    StudentName = r.StudentProfile.User?.Name ?? "Student",
                    StudentEmail = r.StudentProfile.User?.Email,
                    StudentMajor = r.StudentProfile.Major,
                    SubmittedAt = r.SubmittedAt,
                    PreviewAnswer = preview,
                };
            }).ToList();

            return Ok(items);
        }

        [HttpPost("generate-ai-recommendations")]
        public async Task<IActionResult> GenerateAiRecommendations(int eventId, CancellationToken cancellationToken)
        {
            var profile = await GetCurrentProfileAsync();
            if (profile == null)
                return NotFound(new { message = "Organization profile not found." });

            var eventEntity = await _db.StudentOrganizationEvents
                .AsNoTracking()
                .FirstOrDefaultAsync(e =>
                    e.Id == eventId && e.OrganizationProfileId == profile.Id,
                    cancellationToken);

            if (eventEntity == null)
                return NotFound(new { message = "Event not found." });

            var registrations = await _db.StudentOrganizationEventRegistrations
                .AsNoTracking()
                .Include(r => r.StudentProfile).ThenInclude(s => s.User)
                .Include(r => r.Answers).ThenInclude(a => a.Field)
                .Where(r => r.EventId == eventId && r.OrganizationProfileId == profile.Id)
                .OrderByDescending(r => r.SubmittedAt)
                .ToListAsync(cancellationToken);

            if (registrations.Count == 0)
            {
                return Ok(new EventRegistrationAiRecommendationsResponseDto
                {
                    UsedAi = false,
                    Recommendations = new List<EventRegistrationAiRecommendationDto>(),
                });
            }

            var allSkills = await _db.Skills
                .AsNoTracking()
                .Select(s => new { s.Id, s.Name })
                .ToListAsync(cancellationToken);
            var skillNameMap = allSkills.ToDictionary(s => s.Id, s => s.Name);

            var participants = registrations.Select(r =>
            {
                var student = r.StudentProfile;
                var skillIds = SkillHelper.ParseIntList(student.Roles)
                    .Concat(SkillHelper.ParseIntList(student.TechnicalSkills))
                    .Concat(SkillHelper.ParseIntList(student.Tools))
                    .Distinct()
                    .ToList();

                var skills = skillIds
                    .Where(skillNameMap.ContainsKey)
                    .Select(id => skillNameMap[id])
                    .Distinct()
                    .ToList();

                var interests = new List<string>();
                if (!string.IsNullOrWhiteSpace(student.LookingFor))
                    interests.Add(student.LookingFor.Trim());

                return new EventRegistrationParticipantContext
                {
                    RegistrationId = r.Id,
                    StudentProfileId = r.StudentProfileId,
                    StudentName = student.User?.Name ?? "Student",
                    Major = student.Major?.Trim() ?? string.Empty,
                    Faculty = student.Faculty?.Trim() ?? string.Empty,
                    Skills = skills,
                    Interests = interests,
                    FormAnswers = r.Answers
                        .OrderBy(a => a.Field.DisplayOrder)
                        .ThenBy(a => a.FieldId)
                        .Select(a =>
                        {
                            var mapped = EventRegistrationHelper.MapAnswerResponse(a);
                            return new EventRegistrationAnswerContext
                            {
                                FieldLabel = mapped.FieldLabel,
                                AnswerValue = mapped.AnswerValue,
                            };
                        })
                        .ToList(),
                };
            }).ToList();

            var outcome = await _recommendations.RankRegistrantsAsync(
                new EventRegistrationRecommendationContext
                {
                    Event = new EventRegistrationEventContext
                    {
                        EventId = eventEntity.Id,
                        Title = eventEntity.Title,
                        Description = eventEntity.Description,
                        EventType = eventEntity.EventType,
                        Category = eventEntity.Category,
                    },
                    Participants = participants,
                },
                cancellationToken);

            if (!outcome.Success)
            {
                return StatusCode(503, new { message = outcome.ErrorMessage ?? "AI recommendations are unavailable." });
            }

            return Ok(new EventRegistrationAiRecommendationsResponseDto
            {
                UsedAi = outcome.UsedAi,
                Recommendations = outcome.Rankings
                    .OrderByDescending(r => r.MatchScore)
                    .Select(r => new EventRegistrationAiRecommendationDto
                    {
                        RegistrationId = r.RegistrationId,
                        StudentProfileId = r.StudentProfileId,
                        StudentName = r.StudentName,
                        StudentMajor = r.StudentMajor,
                        MatchScore = r.MatchScore,
                        Reason = r.Reason,
                    })
                    .ToList(),
            });
        }

        [HttpGet("{registrationId:int}")]
        public async Task<IActionResult> Get(int eventId, int registrationId)
        {
            var profile = await GetCurrentProfileAsync();
            if (profile == null)
                return NotFound(new { message = "Organization profile not found." });

            var detail = await LoadRegistrationDetailAsync(eventId, registrationId, profile.Id);
            if (detail == null)
                return NotFound(new { message = "Registration not found." });

            return Ok(detail);
        }

        private async Task<EventRegistrationDetailDto?> LoadRegistrationDetailAsync(
            int eventId,
            int registrationId,
            int organizationProfileId)
        {
            var r = await _db.StudentOrganizationEventRegistrations
                .AsNoTracking()
                .Include(x => x.StudentProfile).ThenInclude(s => s.User)
                .Include(x => x.Event)
                .Include(x => x.Answers).ThenInclude(a => a.Field)
                .FirstOrDefaultAsync(x =>
                    x.Id == registrationId &&
                    x.EventId == eventId &&
                    x.OrganizationProfileId == organizationProfileId);

            if (r == null) return null;

            return new EventRegistrationDetailDto
            {
                Id = r.Id,
                OrganizationId = r.OrganizationProfileId,
                EventId = r.EventId,
                EventTitle = r.Event.Title,
                StudentProfileId = r.StudentProfileId,
                StudentName = r.StudentProfile.User?.Name ?? "Student",
                StudentEmail = r.StudentProfile.User?.Email,
                StudentMajor = r.StudentProfile.Major,
                StudentAcademicYear = r.StudentProfile.AcademicYear,
                SubmittedAt = r.SubmittedAt,
                Answers = r.Answers
                    .OrderBy(a => a.Field.DisplayOrder)
                    .ThenBy(a => a.FieldId)
                    .Select(EventRegistrationHelper.MapAnswerResponse)
                    .ToList(),
            };
        }

        private async Task<StudentAssociationProfile?> GetCurrentProfileAsync()
        {
            var userId = AuthorizationHelper.GetUserId(User);
            return await _db.StudentAssociationProfiles
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.UserId == userId);
        }
    }
}
