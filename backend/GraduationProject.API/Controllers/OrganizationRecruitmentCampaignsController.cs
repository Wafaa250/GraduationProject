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
    [Route("api/organization/recruitment-campaigns")]
    [Authorize(Roles = "studentassociation,association")]
    public class OrganizationRecruitmentCampaignsController : ControllerBase
    {
        private const string CoverFolder = "uploads/organization-recruitment-campaigns";
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

        public OrganizationRecruitmentCampaignsController(ApplicationDbContext db, IFileStorageService files)
        {
            _db = db;
            _files = files;
        }

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

                return Ok(new RecruitmentCoverUploadResponseDto
                {
                    CoverImageUrl = _files.GetUrl(storedPath)
                });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet]
        public async Task<IActionResult> List()
        {
            var profile = await GetCurrentProfileAsync();
            if (profile == null)
                return NotFound(new { message = "Organization profile not found." });

            var campaigns = await _db.StudentOrganizationRecruitmentCampaigns
                .AsNoTracking()
                .Include(c => c.Positions)
                .Where(c => c.OrganizationProfileId == profile.Id)
                .OrderByDescending(c => c.ApplicationDeadline)
                .ToListAsync();

            return Ok(campaigns.Select(c => MapToDto(c, profile)).ToList());
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var (campaign, profile, notFound) = await GetOwnedCampaignAsync(id);
            if (notFound) return NotFound(new { message = "Campaign not found." });

            return Ok(MapToDto(campaign!, profile!));
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateRecruitmentCampaignDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var positionError = ValidatePositions(dto.Positions);
            if (positionError != null) return BadRequest(new { message = positionError });

            var profile = await GetCurrentProfileForWriteAsync();
            if (profile == null)
                return NotFound(new { message = "Organization profile not found." });

            var deadline = ToUtc(dto.ApplicationDeadline);
            if (deadline <= DateTime.UtcNow)
                return BadRequest(new { message = "Application deadline must be in the future." });

            var campaign = new StudentOrganizationRecruitmentCampaign
            {
                OrganizationProfileId = profile.Id,
                Title = dto.Title.Trim(),
                Description = dto.Description.Trim(),
                ApplicationDeadline = deadline,
                CoverImageUrl = string.IsNullOrWhiteSpace(dto.CoverImageUrl) ? null : dto.CoverImageUrl.Trim(),
                IsPublished = dto.IsPublished,
                CreatedAt = DateTime.UtcNow,
            };

            ApplyPositions(campaign, dto.Positions);

            _db.StudentOrganizationRecruitmentCampaigns.Add(campaign);
            await _db.SaveChangesAsync();

            return StatusCode(201, MapToDto(campaign, profile));
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateRecruitmentCampaignDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (dto.Positions != null)
            {
                var positionError = ValidatePositions(dto.Positions);
                if (positionError != null) return BadRequest(new { message = positionError });
            }

            var (campaign, profile, notFound) = await GetOwnedCampaignAsync(id, tracking: true);
            if (notFound) return NotFound(new { message = "Campaign not found." });

            if (!string.IsNullOrWhiteSpace(dto.Title)) campaign!.Title = dto.Title.Trim();
            if (dto.Description != null) campaign!.Description = dto.Description.Trim();
            if (dto.ApplicationDeadline.HasValue)
            {
                var deadline = ToUtc(dto.ApplicationDeadline.Value);
                if (deadline <= DateTime.UtcNow)
                    return BadRequest(new { message = "Application deadline must be in the future." });
                campaign!.ApplicationDeadline = deadline;
            }
            if (dto.CoverImageUrl != null)
                campaign!.CoverImageUrl = string.IsNullOrWhiteSpace(dto.CoverImageUrl) ? null : dto.CoverImageUrl.Trim();
            if (dto.IsPublished.HasValue) campaign!.IsPublished = dto.IsPublished.Value;

            if (dto.Positions != null)
                await SyncPositionsAsync(campaign!, dto.Positions);

            campaign!.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            await _db.Entry(campaign).Collection(c => c.Positions).LoadAsync();

            return Ok(MapToDto(campaign, profile!));
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var (campaign, _, notFound) = await GetOwnedCampaignAsync(id, tracking: true);
            if (notFound) return NotFound(new { message = "Campaign not found." });

            _db.StudentOrganizationRecruitmentCampaigns.Remove(campaign!);
            await _db.SaveChangesAsync();

            return Ok(new { message = "Recruitment campaign deleted." });
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

        private async Task<(StudentOrganizationRecruitmentCampaign? campaign, StudentAssociationProfile? profile, bool notFound)>
            GetOwnedCampaignAsync(int id, bool tracking = false)
        {
            var userId = AuthorizationHelper.GetUserId(User);
            var profile = await _db.StudentAssociationProfiles
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.UserId == userId);

            if (profile == null)
                return (null, null, true);

            IQueryable<StudentOrganizationRecruitmentCampaign> query = _db.StudentOrganizationRecruitmentCampaigns
                .Include(c => c.Positions);
            if (!tracking) query = query.AsNoTracking();

            var campaign = await query.FirstOrDefaultAsync(c =>
                c.Id == id && c.OrganizationProfileId == profile.Id);

            if (campaign == null)
                return (null, profile, true);

            return (campaign, profile, false);
        }

        private static string? ValidatePositions(IList<RecruitmentPositionInputDto> positions)
        {
            if (positions == null || positions.Count == 0)
                return "Add at least one required position.";

            foreach (var p in positions)
            {
                if (string.IsNullOrWhiteSpace(p.RoleTitle))
                    return "Each position needs a role title.";
                if (p.NeededCount < 1)
                    return "Needed count must be at least 1 for each position.";
            }

            return null;
        }

        private static void ApplyPositions(
            StudentOrganizationRecruitmentCampaign campaign,
            IList<RecruitmentPositionInputDto> positions)
        {
            var order = 0;
            foreach (var p in positions.OrderBy(x => x.DisplayOrder).ThenBy(x => x.RoleTitle))
            {
                campaign.Positions.Add(MapPositionEntity(p, order++));
            }
        }

        private async Task SyncPositionsAsync(
            StudentOrganizationRecruitmentCampaign campaign,
            IList<RecruitmentPositionInputDto> positions)
        {
            var existing = await _db.StudentOrganizationRecruitmentPositions
                .Where(p => p.CampaignId == campaign.Id)
                .ToListAsync();

            var keepIds = positions.Where(p => p.Id.HasValue).Select(p => p.Id!.Value).ToHashSet();
            var toRemove = existing.Where(e => !keepIds.Contains(e.Id)).ToList();
            if (toRemove.Count > 0)
                _db.StudentOrganizationRecruitmentPositions.RemoveRange(toRemove);

            var order = 0;
            foreach (var input in positions.OrderBy(x => x.DisplayOrder).ThenBy(x => x.RoleTitle))
            {
                if (input.Id.HasValue)
                {
                    var entity = existing.FirstOrDefault(e => e.Id == input.Id.Value);
                    if (entity != null)
                    {
                        UpdatePositionEntity(entity, input, order++);
                        continue;
                    }
                }

                _db.StudentOrganizationRecruitmentPositions.Add(MapPositionEntity(input, order++, campaign.Id));
            }
        }

        private static StudentOrganizationRecruitmentPosition MapPositionEntity(
            RecruitmentPositionInputDto input,
            int displayOrder,
            int? campaignId = null)
        {
            var entity = new StudentOrganizationRecruitmentPosition
            {
                RoleTitle = input.RoleTitle.Trim(),
                NeededCount = input.NeededCount,
                Description = string.IsNullOrWhiteSpace(input.Description) ? null : input.Description.Trim(),
                Requirements = string.IsNullOrWhiteSpace(input.Requirements) ? null : input.Requirements.Trim(),
                RequiredSkills = string.IsNullOrWhiteSpace(input.RequiredSkills) ? null : input.RequiredSkills.Trim(),
                DisplayOrder = input.DisplayOrder != 0 ? input.DisplayOrder : displayOrder,
            };
            if (campaignId.HasValue) entity.CampaignId = campaignId.Value;
            return entity;
        }

        private static void UpdatePositionEntity(
            StudentOrganizationRecruitmentPosition entity,
            RecruitmentPositionInputDto input,
            int displayOrder)
        {
            entity.RoleTitle = input.RoleTitle.Trim();
            entity.NeededCount = input.NeededCount;
            entity.Description = string.IsNullOrWhiteSpace(input.Description) ? null : input.Description.Trim();
            entity.Requirements = string.IsNullOrWhiteSpace(input.Requirements) ? null : input.Requirements.Trim();
            entity.RequiredSkills = string.IsNullOrWhiteSpace(input.RequiredSkills) ? null : input.RequiredSkills.Trim();
            entity.DisplayOrder = input.DisplayOrder != 0 ? input.DisplayOrder : displayOrder;
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

        private static RecruitmentCampaignResponseDto MapToDto(
            StudentOrganizationRecruitmentCampaign c,
            StudentAssociationProfile profile) => new()
        {
            Id = c.Id,
            OrganizationProfileId = c.OrganizationProfileId,
            Title = c.Title,
            Description = c.Description,
            ApplicationDeadline = c.ApplicationDeadline,
            CoverImageUrl = c.CoverImageUrl,
            IsPublished = c.IsPublished,
            CreatedAt = c.CreatedAt,
            UpdatedAt = c.UpdatedAt,
            OrganizationName = profile.AssociationName,
            OrganizationLogoUrl = profile.LogoUrl,
            Positions = c.Positions
                .OrderBy(p => p.DisplayOrder)
                .ThenBy(p => p.Id)
                .Select(MapPositionDto)
                .ToList(),
        };

        private static RecruitmentPositionResponseDto MapPositionDto(StudentOrganizationRecruitmentPosition p) => new()
        {
            Id = p.Id,
            CampaignId = p.CampaignId,
            RoleTitle = p.RoleTitle,
            NeededCount = p.NeededCount,
            Description = p.Description,
            Requirements = p.Requirements,
            RequiredSkills = p.RequiredSkills,
            DisplayOrder = p.DisplayOrder,
        };
    }
}
