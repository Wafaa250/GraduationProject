using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using GraduationProject.API.Data;
using GraduationProject.API.DTOs;
using GraduationProject.API.Helpers;
using GraduationProject.API.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace GraduationProject.API.Services
{
    public class RecruitmentApplicationWorkflowService : IRecruitmentApplicationWorkflowService
    {
        private readonly ApplicationDbContext _db;
        private readonly IRecruitmentApplicantAnalysisService _applicantAnalysis;
        private readonly IGraduationProjectNotificationService _notifications;
        private readonly IOrganizationMembershipService _membership;
        private readonly IConfiguration _configuration;
        private readonly ILogger<RecruitmentApplicationWorkflowService> _logger;

        public RecruitmentApplicationWorkflowService(
            ApplicationDbContext db,
            IRecruitmentApplicantAnalysisService applicantAnalysis,
            IGraduationProjectNotificationService notifications,
            IOrganizationMembershipService membership,
            IConfiguration configuration,
            ILogger<RecruitmentApplicationWorkflowService> logger)
        {
            _db = db;
            _applicantAnalysis = applicantAnalysis;
            _notifications = notifications;
            _membership = membership;
            _configuration = configuration;
            _logger = logger;
        }

        public async Task<RecruitmentApplicantAnalysisResponseDto?> RunAiRankingAsync(
            StudentAssociationProfile organization,
            StudentOrganizationRecruitmentCampaign campaign,
            StudentOrganizationRecruitmentPosition position,
            RecruitmentAiRegenerateRequestDto? preferences,
            bool isRegenerate,
            CancellationToken cancellationToken = default)
        {
            preferences ??= new RecruitmentAiRegenerateRequestDto();

            var allForPosition = await _db.StudentOrganizationRecruitmentApplications
                .Include(a => a.StudentProfile).ThenInclude(s => s.User)
                .Include(a => a.StudentProfile).ThenInclude(s => s.StudentSkills).ThenInclude(ss => ss.Skill)
                .Include(a => a.Answers).ThenInclude(ans => ans.Question)
                .Where(a =>
                    a.CampaignId == campaign.Id &&
                    a.PositionId == position.Id &&
                    a.OrganizationProfileId == organization.Id)
                .OrderByDescending(a => a.SubmittedAt)
                .ToListAsync(cancellationToken);

            var analyzedAt = DateTimeOffset.UtcNow;
            var acceptedCount = allForPosition.Count(a => a.Status == RecruitmentApplicationStatuses.Accepted);
            var remainingSeats = Math.Max(0, position.NeededCount - acceptedCount);

            if (isRegenerate && remainingSeats == 0)
            {
                return new RecruitmentApplicantAnalysisResponseDto
                {
                    Results = new List<RecruitmentApplicantAnalysisResultDto>(),
                    AnalyzedAt = analyzedAt,
                };
            }

            var excludeStudentIds = new HashSet<int>(preferences.ExcludeStudentIds ?? new List<int>());
            foreach (var accepted in allForPosition.Where(a => a.Status == RecruitmentApplicationStatuses.Accepted))
                excludeStudentIds.Add(accepted.StudentProfileId);

            var eligible = allForPosition.Where(a =>
            {
                if (a.Status == RecruitmentApplicationStatuses.Accepted)
                    return false;
                if (excludeStudentIds.Contains(a.StudentProfileId))
                    return false;
                if (preferences.ExcludeRejectedApplicants &&
                    a.Status == RecruitmentApplicationStatuses.Rejected)
                    return false;
                return RecruitmentApplicationStatuses.OpenForAiRanking.Contains(a.Status);
            }).ToList();

            if (eligible.Count == 0)
            {
                return new RecruitmentApplicantAnalysisResponseDto
                {
                    Results = new List<RecruitmentApplicantAnalysisResultDto>(),
                    AnalyzedAt = analyzedAt,
                };
            }

            if (string.IsNullOrWhiteSpace(_configuration["OpenAI:ApiKey"]))
                return null;

            var topK = isRegenerate
                ? Math.Max(1, Math.Min(remainingSeats, eligible.Count))
                : Math.Min(position.NeededCount, eligible.Count);

            var applicable = RecruitmentApplicationHelper
                .GetApplicableQuestions(campaign.Questions, position.Id)
                .ToList();

            var studentProfileIds = eligible.Select(a => a.StudentProfileId).Distinct().ToList();
            var (followerSet, priorAppsByStudent) = await RecruitmentApplicantAnalysisHelper.LoadOrgEngagementAsync(
                _db,
                organization.Id,
                campaign.Id,
                position.Id,
                studentProfileIds,
                cancellationToken);

            var qPayload = applicable
                .Select(q => new object[]
                {
                    q.Id,
                    RecruitmentApplicantAnalysisHelper.Truncate(q.QuestionTitle, 160),
                })
                .ToList();

            var needSkills = RecruitmentApplicantAnalysisHelper.ParseCommaSkills(position.RequiredSkills);
            var preferSkills = (preferences.PreferSkills ?? new List<string>())
                .Where(s => !string.IsNullOrWhiteSpace(s))
                .Select(s => s.Trim())
                .Take(12)
                .ToList();
            var preferMajors = (preferences.PreferMajors ?? new List<string>())
                .Where(s => !string.IsNullOrWhiteSpace(s))
                .Select(s => s.Trim())
                .Take(8)
                .ToList();

            object? prefsObj = null;
            if (isRegenerate && (preferSkills.Count > 0 || preferMajors.Count > 0 || preferences.MinMatch > 0))
            {
                prefsObj = new
                {
                    skills = preferSkills,
                    majors = preferMajors,
                    minMatch = Math.Clamp(preferences.MinMatch, 0, 100),
                };
            }

            var needObj = new Dictionary<string, object?>
            {
                ["org"] = new
                {
                    n = RecruitmentApplicantAnalysisHelper.Truncate(organization.AssociationName, 80),
                    g = RecruitmentApplicantAnalysisHelper.Truncate(organization.Category, 60),
                },
                ["c"] = RecruitmentApplicantAnalysisHelper.Truncate(campaign.Title, 100),
                ["cd"] = RecruitmentApplicantAnalysisHelper.Truncate(campaign.Description, 400),
                ["t"] = RecruitmentApplicantAnalysisHelper.Truncate(position.RoleTitle, 120),
                ["d"] = RecruitmentApplicantAnalysisHelper.Truncate(position.Description, 500),
                ["r"] = RecruitmentApplicantAnalysisHelper.Truncate(position.Requirements, 420),
                ["s"] = needSkills,
            };
            if (prefsObj != null)
                needObj["prefs"] = prefsObj;

            var appPayload = new List<object>();
            var applicationIndex = new Dictionary<int, (int StudentProfileId, int StudentUserId)>();
            var displayByProfile = new Dictionary<int, StudentApplicantDisplayInfo>();
            var statusByApplicationId = new Dictionary<int, string>();

            foreach (var app in eligible)
            {
                var sp = app.StudentProfile;
                var pr = await RecruitmentApplicantAnalysisHelper.BuildProfilePrAsync(_db, sp);
                var orderedAnswers = app.Answers
                    .OrderBy(ans => ans.Question.DisplayOrder)
                    .ThenBy(ans => ans.QuestionId)
                    .Select(ans => new object[]
                    {
                        ans.QuestionId,
                        RecruitmentApplicantAnalysisHelper.AnswerTextForAi(ans),
                    })
                    .ToList();

                var prior = priorAppsByStudent.TryGetValue(app.StudentProfileId, out var c) ? c : 0;
                appPayload.Add(new
                {
                    i = app.Id,
                    p = app.StudentProfileId,
                    a = orderedAnswers,
                    pr,
                    part = new
                    {
                        f = followerSet.Contains(app.StudentProfileId) ? 1 : 0,
                        r = prior,
                    },
                });

                applicationIndex[app.Id] = (app.StudentProfileId, sp.UserId);
                displayByProfile[app.StudentProfileId] = new StudentApplicantDisplayInfo
                {
                    Name = sp.User?.Name ?? "Student",
                    Faculty = sp.Faculty,
                    Major = sp.Major,
                };
                statusByApplicationId[app.Id] = app.Status;
            }

            var payloadObj = new { K = topK, need = needObj, Q = qPayload, A = appPayload };
            var compactJson = JsonSerializer.Serialize(payloadObj, new JsonSerializerOptions
            {
                PropertyNamingPolicy = null,
            });

            var aiContext = new RecruitmentApplicantAnalysisAiContext
            {
                TopK = topK,
                CompactPayloadJson = compactJson,
                ApplicationIndex = applicationIndex,
                StudentDisplayByProfileId = displayByProfile,
            };

            var outcome = await _applicantAnalysis.RankApplicantsAsync(aiContext, cancellationToken);
            if (!outcome.Success || outcome.Results == null || outcome.Results.Count == 0)
            {
                _logger.LogWarning(
                    "Recruitment AI ranking failed campaignId={CampaignId} positionId={PositionId} regenerate={Regenerate}. {Message}",
                    campaign.Id,
                    position.Id,
                    isRegenerate,
                    outcome.ErrorMessage);
                return null;
            }

            var minMatch = isRegenerate ? Math.Clamp(preferences.MinMatch, 0, 100) : 0;
            var filtered = outcome.Results
                .Where(r => minMatch <= 0 || r.MatchScore >= minMatch)
                .Take(topK)
                .ToList();

            foreach (var row in filtered)
            {
                if (statusByApplicationId.TryGetValue(row.ApplicationId, out var st))
                    row.Status = st;
            }

            var suggestedIds = filtered
                .Select(r => r.ApplicationId)
                .Distinct()
                .ToList();

            if (suggestedIds.Count > 0)
            {
                var toUpdate = await _db.StudentOrganizationRecruitmentApplications
                    .Where(a =>
                        suggestedIds.Contains(a.Id) &&
                        RecruitmentApplicationStatuses.OpenForAiRanking.Contains(a.Status))
                    .ToListAsync(cancellationToken);

                var now = DateTime.UtcNow;
                foreach (var entity in toUpdate)
                {
                    entity.Status = RecruitmentApplicationStatuses.AiSuggested;
                    entity.UpdatedAt = now;
                    statusByApplicationId[entity.Id] = entity.Status;
                }

                foreach (var row in filtered)
                {
                    if (statusByApplicationId.TryGetValue(row.ApplicationId, out var st))
                        row.Status = st;
                }
            }

            var response = new RecruitmentApplicantAnalysisResponseDto
            {
                Results = filtered,
                AnalyzedAt = analyzedAt,
            };

            var storedJson = JsonSerializer.Serialize(response, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            });

            _db.StudentOrganizationRecruitmentApplicantAnalyses.Add(new StudentOrganizationRecruitmentApplicantAnalysis
            {
                OrganizationProfileId = organization.Id,
                CampaignId = campaign.Id,
                PositionId = position.Id,
                TopK = topK,
                ResultsJson = storedJson,
                CreatedAtUtc = analyzedAt.UtcDateTime,
            });
            await _db.SaveChangesAsync(cancellationToken);

            return response;
        }

        public async Task<RecruitmentApplicationDecisionResponseDto?> AcceptAsync(
            int applicationId,
            int organizationProfileId,
            CancellationToken cancellationToken = default)
        {
            var entity = await _db.StudentOrganizationRecruitmentApplications
                .Include(a => a.StudentProfile).ThenInclude(s => s.User)
                .Include(a => a.Campaign)
                .Include(a => a.Position)
                .Include(a => a.OrganizationProfile)
                .Include(a => a.Answers).ThenInclude(ans => ans.Question)
                .FirstOrDefaultAsync(a =>
                    a.Id == applicationId && a.OrganizationProfileId == organizationProfileId,
                    cancellationToken);

            if (entity == null)
            {
                _logger.LogWarning(
                    "Recruitment accept -> application not found applicationId={ApplicationId} orgId={OrgId}",
                    applicationId,
                    organizationProfileId);
                return null;
            }

            _logger.LogInformation(
                "Recruitment accept -> begin applicationId={ApplicationId} studentProfileId={StudentId}",
                applicationId,
                entity.StudentProfileId);

            var now = DateTime.UtcNow;

            if (entity.Status != RecruitmentApplicationStatuses.Accepted)
            {
                entity.Status = RecruitmentApplicationStatuses.Accepted;
                entity.AcceptedAt = now;
                entity.UpdatedAt = now;
            }

            RecruitmentMembershipSyncResult membershipSync;
            try
            {
                membershipSync = await _membership.SyncFromRecruitmentAcceptanceAsync(entity, cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Recruitment accept -> membership sync failed applicationId={ApplicationId}",
                    applicationId);
                throw;
            }

            await _notifications.NotifyRecruitmentApplicationAcceptedAsync(
                entity.Id,
                entity.StudentProfileId,
                entity.OrganizationProfile.AssociationName,
                entity.Campaign.Title,
                entity.Position.RoleTitle,
                membershipSync.MembershipKind,
                cancellationToken);

            return new RecruitmentApplicationDecisionResponseDto
            {
                Application = MapDetail(entity),
                AddedToOrganization = membershipSync.CreatedOrganizationMember || membershipSync.UpdatedExisting,
                MemberAcceptedAt = entity.AcceptedAt,
                OrganizationMemberId = membershipSync.OrganizationMemberId,
                MembershipKind = membershipSync.MembershipKind,
                TeamMemberId = membershipSync.TeamMemberId,
                AddedToLeadershipShowcase = membershipSync.CreatedLeadershipShowcaseEntry,
            };
        }

        public async Task<RecruitmentApplicationDecisionResponseDto?> RejectAsync(
            int applicationId,
            int organizationProfileId,
            CancellationToken cancellationToken = default)
        {
            var entity = await _db.StudentOrganizationRecruitmentApplications
                .Include(a => a.StudentProfile).ThenInclude(s => s.User)
                .Include(a => a.Campaign)
                .Include(a => a.Position)
                .Include(a => a.Answers).ThenInclude(ans => ans.Question)
                .FirstOrDefaultAsync(a =>
                    a.Id == applicationId && a.OrganizationProfileId == organizationProfileId,
                    cancellationToken);

            if (entity == null)
                return null;

            if (entity.Status != RecruitmentApplicationStatuses.Rejected)
            {
                entity.Status = RecruitmentApplicationStatuses.Rejected;
                entity.UpdatedAt = DateTime.UtcNow;
                await _db.SaveChangesAsync(cancellationToken);
            }

            await _notifications.NotifyRecruitmentApplicationRejectedAsync(
                entity.Id,
                entity.StudentProfileId,
                entity.Position.RoleTitle,
                cancellationToken);

            return new RecruitmentApplicationDecisionResponseDto
            {
                Application = MapDetail(entity),
                AddedToOrganization = false,
                MemberAcceptedAt = null,
            };
        }

        private static RecruitmentApplicationDetailDto MapDetail(StudentOrganizationRecruitmentApplication a) =>
            new()
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
                AcceptedAt = a.AcceptedAt,
                Answers = a.Answers
                    .OrderBy(ans => ans.Question.DisplayOrder)
                    .ThenBy(ans => ans.QuestionId)
                    .Select(RecruitmentApplicationHelper.MapAnswerResponse)
                    .ToList(),
            };
    }
}
