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
    /// <summary>Organization review of recruitment applications.</summary>
    [ApiController]
    [Route("api/organization/recruitment-campaigns")]
    [Authorize(Roles = "studentassociation,association")]
    public class OrganizationRecruitmentApplicationsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;

        public OrganizationRecruitmentApplicationsController(ApplicationDbContext db)
        {
            _db = db;
        }

        [HttpGet("{campaignId:int}/applications")]
        public async Task<IActionResult> List(int campaignId, [FromQuery] int? positionId, [FromQuery] string? status)
        {
            var profile = await GetCurrentProfileAsync();
            if (profile == null)
                return NotFound(new { message = "Organization profile not found." });

            var campaignExists = await _db.StudentOrganizationRecruitmentCampaigns.AnyAsync(c =>
                c.Id == campaignId && c.OrganizationProfileId == profile.Id);
            if (!campaignExists)
                return NotFound(new { message = "Campaign not found." });

            var query = _db.StudentOrganizationRecruitmentApplications
                .AsNoTracking()
                .Include(a => a.StudentProfile).ThenInclude(s => s.User)
                .Include(a => a.Position)
                .Include(a => a.Answers).ThenInclude(ans => ans.Question)
                .Where(a => a.CampaignId == campaignId && a.OrganizationProfileId == profile.Id);

            if (positionId.HasValue)
                query = query.Where(a => a.PositionId == positionId.Value);

            if (!string.IsNullOrWhiteSpace(status))
            {
                var normalized = status.Trim();
                if (!RecruitmentApplicationStatuses.All.Contains(normalized))
                    return BadRequest(new { message = "Invalid status filter." });
                query = query.Where(a => a.Status == normalized);
            }

            var rows = await query
                .OrderByDescending(a => a.SubmittedAt)
                .ToListAsync();

            var items = rows.Select(a =>
            {
                var firstAnswer = a.Answers.OrderBy(ans => ans.Question.DisplayOrder).FirstOrDefault();
                var preview = firstAnswer == null
                    ? string.Empty
                    : RecruitmentApplicationHelper.MapAnswerResponse(firstAnswer).AnswerValue;

                if (preview.Length > 120)
                    preview = preview[..117] + "…";

                return new RecruitmentApplicationListItemDto
                {
                    Id = a.Id,
                    StudentProfileId = a.StudentProfileId,
                    StudentName = a.StudentProfile.User?.Name ?? "Student",
                    StudentEmail = a.StudentProfile.User?.Email,
                    StudentMajor = a.StudentProfile.Major,
                    PositionId = a.PositionId,
                    PositionRoleTitle = a.Position.RoleTitle,
                    Status = a.Status,
                    SubmittedAt = a.SubmittedAt,
                    PreviewAnswer = preview,
                };
            }).ToList();

            return Ok(items);
        }

        [HttpGet("{campaignId:int}/applications/{applicationId:int}")]
        public async Task<IActionResult> Get(int campaignId, int applicationId)
        {
            var profile = await GetCurrentProfileAsync();
            if (profile == null)
                return NotFound(new { message = "Organization profile not found." });

            var app = await LoadApplicationDetailAsync(campaignId, applicationId, profile.Id);
            if (app == null)
                return NotFound(new { message = "Application not found." });

            return Ok(app);
        }

        [HttpPatch("{campaignId:int}/applications/{applicationId:int}/status")]
        public async Task<IActionResult> UpdateStatus(
            int campaignId,
            int applicationId,
            [FromBody] UpdateRecruitmentApplicationStatusDto dto)
        {
            var profile = await GetCurrentProfileAsync();
            if (profile == null)
                return NotFound(new { message = "Organization profile not found." });

            var normalized = dto.Status.Trim();
            if (!RecruitmentApplicationStatuses.All.Contains(normalized))
                return BadRequest(new { message = "Invalid status." });

            var entity = await _db.StudentOrganizationRecruitmentApplications
                .FirstOrDefaultAsync(a =>
                    a.Id == applicationId &&
                    a.CampaignId == campaignId &&
                    a.OrganizationProfileId == profile.Id);

            if (entity == null)
                return NotFound(new { message = "Application not found." });

            entity.Status = normalized;
            entity.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            var detail = await LoadApplicationDetailAsync(campaignId, applicationId, profile.Id);
            return Ok(detail);
        }

        private async Task<RecruitmentApplicationDetailDto?> LoadApplicationDetailAsync(
            int campaignId,
            int applicationId,
            int organizationProfileId)
        {
            var a = await _db.StudentOrganizationRecruitmentApplications
                .AsNoTracking()
                .Include(x => x.StudentProfile).ThenInclude(s => s.User)
                .Include(x => x.Campaign)
                .Include(x => x.Position)
                .Include(x => x.Answers).ThenInclude(ans => ans.Question)
                .FirstOrDefaultAsync(x =>
                    x.Id == applicationId &&
                    x.CampaignId == campaignId &&
                    x.OrganizationProfileId == organizationProfileId);

            if (a == null) return null;

            return new RecruitmentApplicationDetailDto
            {
                Id = a.Id,
                OrganizationId = a.OrganizationProfileId,
                CampaignId = a.CampaignId,
                CampaignTitle = a.Campaign.Title,
                PositionId = a.PositionId,
                PositionRoleTitle = a.Position.RoleTitle,
                StudentProfileId = a.StudentProfileId,
                StudentName = a.StudentProfile.User?.Name ?? "Student",
                StudentEmail = a.StudentProfile.User?.Email,
                StudentMajor = a.StudentProfile.Major,
                StudentAcademicYear = a.StudentProfile.AcademicYear,
                Status = a.Status,
                SubmittedAt = a.SubmittedAt,
                UpdatedAt = a.UpdatedAt,
                Answers = a.Answers
                    .OrderBy(ans => ans.Question.DisplayOrder)
                    .ThenBy(ans => ans.QuestionId)
                    .Select(RecruitmentApplicationHelper.MapAnswerResponse)
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

    /// <summary>Student submission for public recruitment campaigns.</summary>
    [ApiController]
    [Route("api/organizations/{organizationId:int}/recruitment-campaigns/{campaignId:int}")]
    public class PublicRecruitmentApplicationsController : ControllerBase
    {
        private const string UploadFolder = "uploads/recruitment-application-files";
        private const long MaxFileBytes = 8 * 1024 * 1024;

        private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
        {
            ".png", ".jpg", ".jpeg", ".webp", ".pdf", ".doc", ".docx",
        };

        private readonly ApplicationDbContext _db;
        private readonly IFileStorageService _files;

        public PublicRecruitmentApplicationsController(ApplicationDbContext db, IFileStorageService files)
        {
            _db = db;
            _files = files;
        }

        [HttpGet("positions/{positionId:int}/applications/mine")]
        [Authorize(Roles = "student")]
        public async Task<IActionResult> GetMyApplication(int organizationId, int campaignId, int positionId)
        {
            var studentId = await GetCurrentStudentProfileIdAsync();
            if (!studentId.HasValue)
                return NotFound(new { message = "Student profile not found." });

            var existing = await _db.StudentOrganizationRecruitmentApplications
                .AsNoTracking()
                .FirstOrDefaultAsync(a =>
                    a.StudentProfileId == studentId.Value &&
                    a.OrganizationProfileId == organizationId &&
                    a.CampaignId == campaignId &&
                    a.PositionId == positionId);

            if (existing == null)
                return Ok(new StudentRecruitmentApplicationStatusDto { HasSubmitted = false });

            return Ok(new StudentRecruitmentApplicationStatusDto
            {
                HasSubmitted = true,
                ApplicationId = existing.Id,
                Status = existing.Status,
                SubmittedAt = existing.SubmittedAt,
            });
        }

        [HttpPost("positions/{positionId:int}/applications")]
        [Authorize(Roles = "student")]
        public async Task<IActionResult> Submit(
            int organizationId,
            int campaignId,
            int positionId,
            [FromBody] SubmitRecruitmentApplicationDto dto)
        {
            var studentId = await GetCurrentStudentProfileIdAsync();
            if (!studentId.HasValue)
                return NotFound(new { message = "Student profile not found." });

            var now = DateTime.UtcNow;
            var campaign = await _db.StudentOrganizationRecruitmentCampaigns
                .AsNoTracking()
                .Include(c => c.Positions)
                .Include(c => c.Questions)
                .FirstOrDefaultAsync(c =>
                    c.Id == campaignId &&
                    c.OrganizationProfileId == organizationId &&
                    c.IsPublished &&
                    c.ApplicationDeadline >= now);

            if (campaign == null)
                return NotFound(new { message = "Recruitment campaign not found or no longer accepting applications." });

            var position = campaign.Positions.FirstOrDefault(p => p.Id == positionId);
            if (position == null)
                return NotFound(new { message = "Position not found." });

            var duplicate = await _db.StudentOrganizationRecruitmentApplications.AnyAsync(a =>
                a.StudentProfileId == studentId.Value && a.PositionId == positionId);
            if (duplicate)
                return Conflict(new { message = "You have already applied for this position." });

            var applicable = RecruitmentApplicationHelper
                .GetApplicableQuestions(campaign.Questions, positionId)
                .ToList();

            if (applicable.Count == 0)
                return BadRequest(new { message = "This position has no application form configured yet." });

            var validationError = RecruitmentApplicationHelper.ValidateAnswers(applicable, dto.Answers);
            if (validationError != null)
                return BadRequest(new { message = validationError });

            var application = new StudentOrganizationRecruitmentApplication
            {
                StudentProfileId = studentId.Value,
                OrganizationProfileId = organizationId,
                CampaignId = campaignId,
                PositionId = positionId,
                Status = RecruitmentApplicationStatuses.Pending,
                SubmittedAt = now,
            };

            foreach (var question in applicable)
            {
                var input = dto.Answers.LastOrDefault(a => a.QuestionId == question.Id);
                if (input == null) continue;

                var stored = RecruitmentApplicationHelper.NormalizeStoredAnswer(input, question.QuestionType);
                if (string.IsNullOrWhiteSpace(stored) || stored == "[]") continue;

                application.Answers.Add(new StudentOrganizationRecruitmentApplicationAnswer
                {
                    QuestionId = question.Id,
                    AnswerValue = stored,
                });
            }

            if (application.Answers.Count == 0)
                return BadRequest(new { message = "Please complete at least one answer before submitting." });

            _db.StudentOrganizationRecruitmentApplications.Add(application);
            await _db.SaveChangesAsync();

            return Ok(new RecruitmentApplicationSubmitResponseDto
            {
                ApplicationId = application.Id,
                Status = application.Status,
                SubmittedAt = application.SubmittedAt,
                Message = "Your application was submitted successfully.",
            });
        }

        [HttpPost("application-uploads")]
        [Authorize(Roles = "student")]
        [RequestSizeLimit(MaxFileBytes)]
        public async Task<IActionResult> UploadFile(int organizationId, int campaignId, [FromForm] IFormFile file)
        {
            _ = organizationId;
            _ = campaignId;

            if (file == null || file.Length == 0)
                return BadRequest(new { message = "File is required." });

            if (file.Length > MaxFileBytes)
                return BadRequest(new { message = "File must be 8 MB or smaller." });

            try
            {
                var storedPath = await _files.SaveFormFileAsync(file, UploadFolder, AllowedExtensions, MaxFileBytes);
                return Ok(new RecruitmentApplicationFileUploadResponseDto
                {
                    FileUrl = _files.GetUrl(storedPath),
                });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

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
