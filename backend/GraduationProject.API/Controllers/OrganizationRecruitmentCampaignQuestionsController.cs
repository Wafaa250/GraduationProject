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
    [Route("api/organization/recruitment-campaigns/{campaignId:int}/questions")]
    [Authorize(Roles = "studentassociation,association")]
    public class OrganizationRecruitmentCampaignQuestionsController : ControllerBase
    {
        private static readonly JsonSerializerOptions JsonOptions = new()
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        };

        private readonly ApplicationDbContext _db;

        public OrganizationRecruitmentCampaignQuestionsController(ApplicationDbContext db)
        {
            _db = db;
        }

        [HttpGet]
        public async Task<IActionResult> List(int campaignId)
        {
            var (_, notFound) = await GetOwnedCampaignAsync(campaignId);
            if (notFound) return NotFound(new { message = "Campaign not found." });

            var questions = await _db.StudentOrganizationRecruitmentQuestions
                .AsNoTracking()
                .Include(q => q.Position)
                .Where(q => q.CampaignId == campaignId)
                .OrderBy(q => q.PositionId.HasValue ? 1 : 0)
                .ThenBy(q => q.DisplayOrder)
                .ThenBy(q => q.Id)
                .ToListAsync();

            return Ok(questions.Select(MapToDto).ToList());
        }

        [HttpPost]
        public async Task<IActionResult> Create(int campaignId, [FromBody] CreateRecruitmentQuestionDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var validation = ValidateQuestion(dto.QuestionType, dto.Options);
            if (validation != null) return BadRequest(new { message = validation });

            var (_, notFound) = await GetOwnedCampaignAsync(campaignId);
            if (notFound) return NotFound(new { message = "Campaign not found." });

            var positionError = await ValidatePositionIdAsync(campaignId, dto.PositionId);
            if (positionError != null) return BadRequest(new { message = positionError });

            var entity = new StudentOrganizationRecruitmentQuestion
            {
                CampaignId = campaignId,
                PositionId = dto.PositionId,
                QuestionTitle = dto.QuestionTitle.Trim(),
                QuestionType = NormalizeType(dto.QuestionType),
                Placeholder = string.IsNullOrWhiteSpace(dto.Placeholder) ? null : dto.Placeholder.Trim(),
                HelpText = string.IsNullOrWhiteSpace(dto.HelpText) ? null : dto.HelpText.Trim(),
                IsRequired = dto.IsRequired,
                Options = SerializeOptions(dto.QuestionType, dto.Options),
                DisplayOrder = dto.DisplayOrder,
                CreatedAt = DateTime.UtcNow,
            };

            _db.StudentOrganizationRecruitmentQuestions.Add(entity);
            await _db.SaveChangesAsync();

            return StatusCode(201, MapToDto(entity));
        }

        [HttpPut("{questionId:int}")]
        public async Task<IActionResult> Update(
            int campaignId,
            int questionId,
            [FromBody] UpdateRecruitmentQuestionDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var (question, notFound) = await GetOwnedQuestionAsync(campaignId, questionId, tracking: true);
            if (notFound) return NotFound(new { message = "Question not found." });

            var type = dto.QuestionType?.Trim() ?? question!.QuestionType;
            var options = dto.Options ?? DeserializeOptions(question!.Options);
            var validation = ValidateQuestion(type, options);
            if (validation != null) return BadRequest(new { message = validation });

            if (!string.IsNullOrWhiteSpace(dto.QuestionTitle))
                question!.QuestionTitle = dto.QuestionTitle.Trim();
            if (!string.IsNullOrWhiteSpace(dto.QuestionType))
                question!.QuestionType = NormalizeType(dto.QuestionType);
            if (dto.Placeholder != null)
                question!.Placeholder = string.IsNullOrWhiteSpace(dto.Placeholder) ? null : dto.Placeholder.Trim();
            if (dto.HelpText != null)
                question!.HelpText = string.IsNullOrWhiteSpace(dto.HelpText) ? null : dto.HelpText.Trim();
            if (dto.IsRequired.HasValue) question!.IsRequired = dto.IsRequired.Value;
            if (dto.DisplayOrder.HasValue) question!.DisplayOrder = dto.DisplayOrder.Value;
            if (dto.Options != null || dto.QuestionType != null)
                question!.Options = SerializeOptions(type, options);
            if (!string.IsNullOrWhiteSpace(dto.QuestionTitle))
            {
                var positionError = await ValidatePositionIdAsync(campaignId, dto.PositionId);
                if (positionError != null) return BadRequest(new { message = positionError });
                question!.PositionId = dto.PositionId;
            }

            await _db.SaveChangesAsync();

            await _db.Entry(question!).Reference(q => q.Position).LoadAsync();
            return Ok(MapToDto(question!));
        }

        [HttpDelete("{questionId:int}")]
        public async Task<IActionResult> Delete(int campaignId, int questionId)
        {
            var (question, notFound) = await GetOwnedQuestionAsync(campaignId, questionId, tracking: true);
            if (notFound) return NotFound(new { message = "Question not found." });

            _db.StudentOrganizationRecruitmentQuestions.Remove(question!);
            await _db.SaveChangesAsync();

            return Ok(new { message = "Question deleted." });
        }

        private async Task<(StudentOrganizationRecruitmentCampaign? campaign, bool notFound)> GetOwnedCampaignAsync(
            int campaignId)
        {
            var userId = AuthorizationHelper.GetUserId(User);
            var profile = await _db.StudentAssociationProfiles
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.UserId == userId);

            if (profile == null)
                return (null, true);

            var campaign = await _db.StudentOrganizationRecruitmentCampaigns
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.Id == campaignId && c.OrganizationProfileId == profile.Id);

            return (campaign, campaign == null);
        }

        private async Task<(StudentOrganizationRecruitmentQuestion? question, bool notFound)> GetOwnedQuestionAsync(
            int campaignId,
            int questionId,
            bool tracking = false)
        {
            var (_, campaignNotFound) = await GetOwnedCampaignAsync(campaignId);
            if (campaignNotFound) return (null, true);

            IQueryable<StudentOrganizationRecruitmentQuestion> query = _db.StudentOrganizationRecruitmentQuestions;
            if (!tracking) query = query.AsNoTracking();

            var question = await query.FirstOrDefaultAsync(q =>
                q.Id == questionId && q.CampaignId == campaignId);

            return (question, question == null);
        }

        private static string NormalizeType(string questionType)
        {
            var t = questionType.Trim();
            return t.Equals(RecruitmentQuestionTypes.Link, StringComparison.Ordinal)
                ? RecruitmentQuestionTypes.Url
                : t;
        }

        private static string? ValidateQuestion(string questionType, List<string>? options)
        {
            var type = NormalizeType(questionType);
            if (!RecruitmentQuestionTypes.All.Contains(type))
                return "Invalid field type.";

            if (RecruitmentQuestionTypes.UsesOptions(type))
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

        private static string? SerializeOptions(string questionType, List<string>? options)
        {
            var type = NormalizeType(questionType);
            if (!RecruitmentQuestionTypes.UsesOptions(type))
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

        private async Task<string?> ValidatePositionIdAsync(int campaignId, int? positionId)
        {
            if (!positionId.HasValue) return null;

            var exists = await _db.StudentOrganizationRecruitmentPositions
                .AsNoTracking()
                .AnyAsync(p => p.Id == positionId.Value && p.CampaignId == campaignId);

            return exists ? null : "Position does not belong to this campaign.";
        }

        private static RecruitmentQuestionResponseDto MapToDto(StudentOrganizationRecruitmentQuestion q) => new()
        {
            Id = q.Id,
            CampaignId = q.CampaignId,
            QuestionTitle = q.QuestionTitle,
            QuestionType = q.QuestionType,
            Placeholder = q.Placeholder,
            HelpText = q.HelpText,
            IsRequired = q.IsRequired,
            Options = DeserializeOptions(q.Options),
            DisplayOrder = q.DisplayOrder,
            CreatedAt = q.CreatedAt,
            PositionId = q.PositionId,
            PositionRoleTitle = q.Position?.RoleTitle,
        };
    }
}
