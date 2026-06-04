using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using GraduationProject.API.Data;
using GraduationProject.API.DTOs;
using GraduationProject.API.Helpers;
using GraduationProject.API.Models;
using Microsoft.EntityFrameworkCore;

namespace GraduationProject.API.Services
{
    public class FeedService : IFeedService
    {
        private static readonly Random Rng = new();
        private const int MaxSectionItems = 40;
        /// <summary>Max posts taken from each source bucket before global newest-first merge.</summary>
        private const int MaxItemsPerFeedSource = 35;
        private const int MaxFeedTimelineItems = 120;
        private static readonly HashSet<string> ExcludedCompanyWorkflowStatuses = new(StringComparer.OrdinalIgnoreCase)
        {
            CompanyRequestStatus.Draft,
            CompanyRequestStatus.Archived,
        };
        private readonly ApplicationDbContext _db;
        private readonly IStudentRecommendationService _recommendations;

        public FeedService(ApplicationDbContext db, IStudentRecommendationService recommendations)
        {
            _db = db;
            _recommendations = recommendations;
        }

        public async Task<FeedResponseDto> GetFeedAsync(int userId, string role, string? search = null)
        {
            var normalizedRole = (role ?? "student").Trim().ToLowerInvariant();
            var searchTerm = search?.Trim();
            var isStudent = normalizedRole == "student";

            var allPosts = isStudent
                ? await BuildAllPostsAsync(userId)
                : new List<FeedPostDto>();

            if (!string.IsNullOrWhiteSpace(searchTerm))
                allPosts = FilterBySearch(allPosts, searchTerm);

            var ordered = allPosts
                .OrderByDescending(p => p.PublishedAt)
                .Take(MaxFeedTimelineItems)
                .ToList();

            var sidebar = await BuildSidebarAsync(userId, normalizedRole);

            FeedSuggestionsDto suggestions = new();
            if (isStudent)
            {
                try
                {
                    suggestions = await BuildSuggestionsAsync(userId, ordered);
                }
                catch
                {
                    suggestions = new FeedSuggestionsDto();
                }
            }

            var searchResults = !string.IsNullOrWhiteSpace(searchTerm) && isStudent
                ? await SearchMembersByNameAsync(userId, searchTerm)
                : new List<FeedDiscoverMemberDto>();

            return new FeedResponseDto
            {
                Items = ordered.Select(FeedMappingHelper.MapToFeedItem).ToList(),
                Sidebar = sidebar,
                Suggestions = suggestions,
                SearchResults = searchResults,
            };
        }

        private async Task<List<FeedPostDto>> BuildAllPostsAsync(int userId)
        {
            // Doctor timeline posts are intentionally omitted until explicit "Create Post" publishing exists.
            // Doctors remain discoverable via search, recommendations, and messaging.
            var buckets = new[]
            {
                await LoadAssociationEventPostsAsync(),
                await LoadAssociationRecruitmentPostsAsync(),
                await LoadAssociationRecruitmentPositionPostsAsync(),
                await LoadCompanyOpportunityPostsAsync(),
                await LoadCompanyTalentRequestPostsAsync(),
                await LoadStudentCollaborationPostsAsync(),
            };

            return MergeFeedTimeline(buckets);
        }

        /// <summary>
        /// Caps each source so one bucket cannot crowd out company/association/student activity,
        /// then orders the unified timeline by publish date (newest first).
        /// </summary>
        private static List<FeedPostDto> MergeFeedTimeline(IReadOnlyList<List<FeedPostDto>> buckets)
        {
            var seen = new HashSet<string>(StringComparer.Ordinal);
            var merged = new List<FeedPostDto>();

            foreach (var bucket in buckets)
            {
                foreach (var post in bucket.OrderByDescending(p => p.PublishedAt).Take(MaxItemsPerFeedSource))
                {
                    if (!seen.Add(post.PostKey))
                        continue;
                    merged.Add(post);
                }
            }

            return merged
                .OrderByDescending(p => p.PublishedAt)
                .Take(MaxFeedTimelineItems)
                .ToList();
        }

        private static bool IsVisibleCompanyRequestInFeed(CompanyRequest request) =>
            !ExcludedCompanyWorkflowStatuses.Contains(request.Status)
            && !string.Equals(
                request.RequestStatus,
                CompanyRequestLifecycleStatus.Closed,
                StringComparison.OrdinalIgnoreCase);

        private async Task<List<FeedPostDto>> LoadAssociationEventPostsAsync()
        {
            var rows = await _db.StudentOrganizationEvents
                .AsNoTracking()
                .Include(e => e.OrganizationProfile)
                .OrderByDescending(e => e.CreatedAt)
                .Take(120)
                .ToListAsync();

            return rows.Select(e =>
            {
                var org = e.OrganizationProfile;
                var meta = new List<FeedItemMetadataDto>();
                FeedMappingHelper.AddMetadata(meta, "Location", e.IsOnline ? "Online" : e.Location);
                FeedMappingHelper.AddMetadata(meta, "Event date", FeedMappingHelper.FormatDate(e.EventDate));
                FeedMappingHelper.AddMetadata(meta, "Deadline", FeedMappingHelper.FormatDate(e.RegistrationDeadline));
                FeedMappingHelper.AddMetadata(meta, "Type", e.EventType);
                if (e.MaxParticipants.HasValue)
                    FeedMappingHelper.AddMetadata(meta, "Capacity", e.MaxParticipants.Value.ToString());

                return new FeedPostDto
                {
                    PostKey = FeedPostKeyHelper.Build(FeedPostSourceTypes.AssociationEvent, e.Id),
                    SourceType = FeedPostSourceTypes.AssociationEvent,
                    EntityId = e.Id,
                    AuthorType = FeedAuthorTypes.Association,
                    AuthorId = e.OrganizationProfileId,
                    AuthorName = org?.AssociationName ?? "Association",
                    AuthorAvatarUrl = org?.LogoUrl,
                    SourceSubtitle = org?.Category ?? "Student Association",
                    Title = e.Title,
                    Content = FeedMappingHelper.Truncate(e.Description, 600),
                    ImageUrl = e.CoverImageUrl,
                    PostKind = e.EventType,
                    PublishedAt = e.UpdatedAt ?? e.CreatedAt,
                    Metadata = meta,
                    ActionLabel = "View Event",
                    ActionPath = FeedActionRoutes.AssociationEvent(e.Id, e.OrganizationProfileId),
                    EventId = e.Id,
                    OrganizationProfileId = e.OrganizationProfileId,
                };
            }).ToList();
        }

        private async Task<List<FeedPostDto>> LoadAssociationRecruitmentPostsAsync()
        {
            var rows = await _db.StudentOrganizationRecruitmentCampaigns
                .AsNoTracking()
                .Include(c => c.OrganizationProfile)
                .Include(c => c.Positions)
                .Where(c => c.IsPublished)
                .OrderByDescending(c => c.CreatedAt)
                .Take(80)
                .ToListAsync();

            return rows.Select(c =>
            {
                var org = c.OrganizationProfile;
                var meta = new List<FeedItemMetadataDto>();
                FeedMappingHelper.AddMetadata(meta, "Deadline", FeedMappingHelper.FormatDate(c.ApplicationDeadline));
                if (c.Positions.Count > 0)
                    FeedMappingHelper.AddMetadata(meta, "Open roles", c.Positions.Count.ToString());
                FeedMappingHelper.AddMetadata(meta, "Category", "Recruitment");

                return new FeedPostDto
                {
                    PostKey = FeedPostKeyHelper.Build(FeedPostSourceTypes.AssociationRecruitment, c.Id),
                    SourceType = FeedPostSourceTypes.AssociationRecruitment,
                    EntityId = c.Id,
                    AuthorType = FeedAuthorTypes.Association,
                    AuthorId = c.OrganizationProfileId,
                    AuthorName = org?.AssociationName ?? "Association",
                    AuthorAvatarUrl = org?.LogoUrl,
                    SourceSubtitle = org?.Category ?? "Student Association",
                    Title = c.Title,
                    Content = FeedMappingHelper.Truncate(c.Description, 600),
                    ImageUrl = c.CoverImageUrl,
                    PostKind = "Recruitment",
                    PublishedAt = c.UpdatedAt ?? c.CreatedAt,
                    Metadata = meta,
                    ActionLabel = "Apply Now",
                    ActionPath = FeedActionRoutes.AssociationRecruitmentCampaign(c.Id, c.OrganizationProfileId),
                    RecruitmentCampaignId = c.Id,
                    OrganizationProfileId = c.OrganizationProfileId,
                };
            }).ToList();
        }

        private async Task<List<FeedPostDto>> LoadCompanyOpportunityPostsAsync()
        {
            var rows = await _db.CompanyRequests
                .AsNoTracking()
                .Include(r => r.CompanyProfile)
                .Include(r => r.Roles).ThenInclude(role => role.Skills)
                .Where(r =>
                    r.Status != CompanyRequestStatus.Draft
                    && r.Status != CompanyRequestStatus.Archived
                    && r.RequestStatus != CompanyRequestLifecycleStatus.Closed)
                .OrderByDescending(r => r.SubmittedAt ?? r.UpdatedAt)
                .Take(80)
                .ToListAsync();

            return rows.Select(r =>
            {
                var company = r.CompanyProfile;
                var meta = new List<FeedItemMetadataDto>();
                FeedMappingHelper.AddMetadata(meta, "Type", r.Category);
                FeedMappingHelper.AddMetadata(meta, "Request", FeedMappingHelper.CompanyRequestTypeLabel(r.RequestType));
                FeedMappingHelper.AddMetadata(meta, "Duration", FeedMappingHelper.FormatCompanyDuration(r));
                FeedMappingHelper.AddMetadata(meta, "Format", FeedMappingHelper.FormatCollaboration(r.CollaborationFormat));
                FeedMappingHelper.AddMetadata(meta, "Location", company?.Location ?? company?.HeadquartersLocation);
                FeedMappingHelper.AddMetadata(meta, "Skills", FeedMappingHelper.CollectCompanySkills(r));
                if (r.Roles.Count > 0)
                    FeedMappingHelper.AddMetadata(meta, "Roles", r.Roles.Count.ToString());

                return new FeedPostDto
                {
                    PostKey = FeedPostKeyHelper.Build(FeedPostSourceTypes.CompanyOpportunity, r.Id),
                    SourceType = FeedPostSourceTypes.CompanyOpportunity,
                    EntityId = r.Id,
                    AuthorType = FeedAuthorTypes.Company,
                    AuthorId = r.CompanyProfileId,
                    AuthorName = company?.CompanyName ?? "Company",
                    SourceSubtitle = company?.Industry ?? "Company",
                    Title = r.Title,
                    Content = FeedMappingHelper.Truncate(r.Description, 600),
                    PostKind = r.Category,
                    PublishedAt = r.SubmittedAt ?? r.UpdatedAt,
                    Metadata = meta,
                    ActionLabel = "View Opportunity",
                    ActionPath = FeedActionRoutes.CompanyRequest(r.Id, r.CompanyProfileId),
                    CompanyRequestId = r.Id,
                    CompanyProfileId = r.CompanyProfileId,
                };
            }).ToList();
        }

        private async Task<List<FeedPostDto>> LoadCompanyTalentRequestPostsAsync()
        {
            var rows = await _db.CompanyTalentRequests
                .AsNoTracking()
                .Include(t => t.CompanyProfile)
                .OrderByDescending(t => t.CreatedAt)
                .Take(60)
                .ToListAsync();

            return rows.Select(t =>
            {
                var company = t.CompanyProfile;
                var meta = new List<FeedItemMetadataDto>();
                FeedMappingHelper.AddMetadata(meta, "Type", t.EngagementType);
                FeedMappingHelper.AddMetadata(meta, "Duration", t.Duration);
                FeedMappingHelper.AddMetadata(meta, "Major", t.PreferredMajor);
                FeedMappingHelper.AddMetadata(meta, "Skills", t.RequiredSkills);

                return new FeedPostDto
                {
                    PostKey = FeedPostKeyHelper.Build(FeedPostSourceTypes.CompanyTalentRequest, t.Id),
                    SourceType = FeedPostSourceTypes.CompanyTalentRequest,
                    EntityId = t.Id,
                    AuthorType = FeedAuthorTypes.Company,
                    AuthorId = t.CompanyProfileId,
                    AuthorName = company?.CompanyName ?? "Company",
                    SourceSubtitle = company?.Industry ?? "Company",
                    Title = t.Title,
                    Content = FeedMappingHelper.Truncate(t.Description, 600),
                    PostKind = t.EngagementType ?? "Talent request",
                    PublishedAt = t.CreatedAt,
                    Metadata = meta,
                    ActionLabel = "View Opportunity",
                    ActionPath = FeedActionRoutes.CompanyTalentRequest(t.Id, t.CompanyProfileId),
                    CompanyProfileId = t.CompanyProfileId,
                };
            }).ToList();
        }

        private async Task<List<FeedPostDto>> LoadAssociationRecruitmentPositionPostsAsync()
        {
            var rows = await _db.StudentOrganizationRecruitmentPositions
                .AsNoTracking()
                .Include(p => p.Campaign).ThenInclude(c => c!.OrganizationProfile)
                .Where(p => p.Campaign != null && p.Campaign.IsPublished)
                .OrderByDescending(p => p.Campaign!.CreatedAt)
                .Take(100)
                .ToListAsync();

            return rows.Select(p =>
            {
                var campaign = p.Campaign!;
                var org = campaign.OrganizationProfile;
                var meta = new List<FeedItemMetadataDto>();
                FeedMappingHelper.AddMetadata(meta, "Role", p.RoleTitle);
                FeedMappingHelper.AddMetadata(meta, "Openings", p.NeededCount.ToString());
                FeedMappingHelper.AddMetadata(meta, "Skills", p.RequiredSkills);
                FeedMappingHelper.AddMetadata(meta, "CampaignId", campaign.Id.ToString());
                FeedMappingHelper.AddMetadata(meta, "Campaign", campaign.Title);
                FeedMappingHelper.AddMetadata(meta, "Deadline", FeedMappingHelper.FormatDate(campaign.ApplicationDeadline));
                FeedMappingHelper.AddMetadata(meta, "Category", "Leadership");

                return new FeedPostDto
                {
                    PostKey = FeedPostKeyHelper.Build(FeedPostSourceTypes.AssociationRecruitmentPosition, p.Id),
                    SourceType = FeedPostSourceTypes.AssociationRecruitmentPosition,
                    EntityId = p.Id,
                    AuthorType = FeedAuthorTypes.Association,
                    AuthorId = campaign.OrganizationProfileId,
                    AuthorName = org?.AssociationName ?? "Association",
                    AuthorAvatarUrl = org?.LogoUrl,
                    SourceSubtitle = org?.Category ?? "Student Association",
                    Title = $"Leadership opening: {p.RoleTitle}",
                    Content = FeedMappingHelper.Truncate(
                        p.Description ?? campaign.Description,
                        600),
                    ImageUrl = campaign.CoverImageUrl,
                    PostKind = "Leadership",
                    PublishedAt = campaign.UpdatedAt ?? campaign.CreatedAt,
                    Metadata = meta,
                    ActionLabel = "Apply Now",
                    ActionPath = FeedActionRoutes.AssociationRecruitmentCampaign(
                        campaign.Id,
                        campaign.OrganizationProfileId,
                        p.Id),
                    RecruitmentCampaignId = campaign.Id,
                    PositionId = p.Id,
                    OrganizationProfileId = campaign.OrganizationProfileId,
                };
            }).ToList();
        }

        private async Task<List<FeedPostDto>> LoadStudentCollaborationPostsAsync()
        {
            var rows = await _db.StudentProjects
                .AsNoTracking()
                .Where(p => p.SupervisorId == null)
                .Include(p => p.Owner).ThenInclude(s => s.User)
                .OrderByDescending(p => p.CreatedAt)
                .Take(80)
                .ToListAsync();

            return rows.Select(p =>
            {
                var required = string.IsNullOrWhiteSpace(p.RequiredSkills) ? "Teammates" : p.RequiredSkills!;
                var meta = new List<FeedItemMetadataDto>();
                FeedMappingHelper.AddMetadata(meta, "Track", p.ProjectType);
                FeedMappingHelper.AddMetadata(meta, "Skills", required);
                var openSeats = Math.Max(0, p.PartnersCount);
                FeedMappingHelper.AddMetadata(meta, "Open seats", openSeats.ToString());
                FeedMappingHelper.AddMetadata(meta, "Major", p.Owner.Major);

                var isGraduationProject = string.Equals(
                    p.ProjectType,
                    "GP",
                    StringComparison.OrdinalIgnoreCase);
                var title = isGraduationProject
                    ? $"Graduation project recruitment: {p.Name}"
                    : $"Looking for teammates: {p.Name}";

                return new FeedPostDto
                {
                    PostKey = FeedPostKeyHelper.Build(FeedPostSourceTypes.StudentCollaboration, p.Id),
                    SourceType = FeedPostSourceTypes.StudentCollaboration,
                    EntityId = p.Id,
                    AuthorType = FeedAuthorTypes.Student,
                    AuthorId = p.OwnerId,
                    AuthorName = p.Owner.User?.Name ?? "Student",
                    AuthorImageBase64 = p.Owner.ProfilePictureBase64,
                    SourceSubtitle = p.Owner.Major ?? "Student",
                    Title = title,
                    Content = FeedMappingHelper.Truncate(p.Abstract, 600),
                    PostKind = isGraduationProject ? "Graduation project" : FeedMappingHelper.Truncate(required, 90),
                    PublishedAt = p.CreatedAt,
                    Metadata = meta,
                    ActionLabel = isGraduationProject ? "View Project" : "View Team",
                    ActionPath = isGraduationProject
                        ? FeedActionRoutes.GraduationProjectWorkspace(p.Id)
                        : FeedActionRoutes.BrowseProjects(p.Id, "team"),
                };
            }).ToList();
        }

        private async Task<HashSet<int>> GetConnectedDoctorProfileIdsAsync(int studentProfileId)
        {
            var ids = new HashSet<int>();

            var enrolledDoctorIds = await _db.SectionEnrollments
                .AsNoTracking()
                .Where(e => e.StudentProfileId == studentProfileId)
                .Select(e => e.Section.Course.DoctorId)
                .ToListAsync();
            foreach (var id in enrolledDoctorIds) ids.Add(id);

            var supervisorIds = await _db.StudentProjects
                .AsNoTracking()
                .Where(p =>
                    (p.OwnerId == studentProfileId || p.Members.Any(m => m.StudentId == studentProfileId))
                    && p.SupervisorId != null)
                .Select(p => p.SupervisorId!.Value)
                .ToListAsync();
            foreach (var id in supervisorIds) ids.Add(id);

            var courseTeamDoctorIds = await _db.CourseTeamMembers
                .AsNoTracking()
                .Where(m => m.StudentProfileId == studentProfileId)
                .Select(m => m.Team.Project.Course.DoctorId)
                .ToListAsync();
            foreach (var id in courseTeamDoctorIds) ids.Add(id);

            return ids;
        }

        private async Task<FeedSidebarSummaryDto> BuildSidebarAsync(int userId, string role)
        {
            var result = new FeedSidebarSummaryDto { Role = role };

            switch (role)
            {
                case "doctor":
                    result.Doctor = await BuildDoctorSidebarAsync(userId);
                    break;
                case "company":
                    result.Company = await BuildCompanySidebarAsync(userId);
                    break;
                case "student_association":
                case "association":
                    result.Association = await BuildAssociationSidebarAsync(userId);
                    break;
                default:
                    result.Student = await BuildStudentSidebarAsync(userId);
                    break;
            }

            return result;
        }

        private async Task<StudentFeedSidebarDto?> BuildStudentSidebarAsync(int userId)
        {
            var profile = await _db.StudentProfiles
                .AsNoTracking()
                .Include(s => s.User)
                .FirstOrDefaultAsync(s => s.UserId == userId);
            if (profile == null) return null;

            var skillIds = SkillHelper.ParseIntList(profile.Roles)
                .Concat(SkillHelper.ParseIntList(profile.TechnicalSkills))
                .Concat(SkillHelper.ParseIntList(profile.Tools))
                .Distinct()
                .Count();

            var gpMemberships = await _db.StudentProjectMembers
                .AsNoTracking()
                .CountAsync(m => m.StudentId == profile.Id);
            var ownsProject = await _db.StudentProjects
                .AsNoTracking()
                .AnyAsync(p => p.OwnerId == profile.Id);
            var courseTeams = await _db.CourseTeamMembers
                .AsNoTracking()
                .CountAsync(m => m.StudentProfileId == profile.Id);

            var joinedTeams = gpMemberships + (ownsProject ? 1 : 0) + courseTeams;

            var completedProjects = await _db.StudentProjects
                .AsNoTracking()
                .CountAsync(p =>
                    p.SupervisorId != null
                    && (p.OwnerId == profile.Id || p.Members.Any(m => m.StudentId == profile.Id)));

            var roleBadges = await ResolveSkillNamesAsync(
                SkillHelper.ParseIntList(profile.Roles).Take(3).ToList());

            var strength = BuildProfileCompletion(profile);

            return new StudentFeedSidebarDto
            {
                Name = profile.User.Name ?? "",
                ProfilePictureBase64 = profile.ProfilePictureBase64,
                Major = profile.Major,
                University = profile.University,
                AcademicYear = profile.AcademicYear,
                SkillsCount = skillIds,
                JoinedTeamsCount = joinedTeams,
                CompletedProjectsCount = completedProjects,
                RoleBadges = roleBadges,
                ProfileCompletionPercent = strength,
            };
        }

        private async Task<DoctorFeedSidebarDto?> BuildDoctorSidebarAsync(int userId)
        {
            var profile = await _db.DoctorProfiles
                .AsNoTracking()
                .Include(d => d.User)
                .FirstOrDefaultAsync(d => d.UserId == userId);
            if (profile == null) return null;

            var coursesCount = await _db.Courses.AsNoTracking().CountAsync(c => c.DoctorId == profile.Id);
            var supervised = await _db.StudentProjects.AsNoTracking()
                .CountAsync(p => p.SupervisorId == profile.Id);

            return new DoctorFeedSidebarDto
            {
                Name = profile.User.Name ?? "",
                ProfilePictureBase64 = profile.ProfilePictureBase64,
                Specialization = profile.Specialization,
                CoursesCount = coursesCount,
                SupervisedProjectsCount = supervised,
            };
        }

        private async Task<CompanyFeedSidebarDto?> BuildCompanySidebarAsync(int userId)
        {
            var profile = await _db.CompanyProfiles
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.UserId == userId);
            if (profile == null) return null;

            var activeCount = await _db.CompanyRequests.AsNoTracking()
                .CountAsync(r =>
                    r.CompanyProfileId == profile.Id
                    && r.Status == CompanyRequestStatus.Submitted
                    && r.RequestStatus == CompanyRequestLifecycleStatus.Active);

            return new CompanyFeedSidebarDto
            {
                CompanyName = profile.CompanyName,
                Industry = profile.Industry,
                ActiveOpportunitiesCount = activeCount,
            };
        }

        private async Task<AssociationFeedSidebarDto?> BuildAssociationSidebarAsync(int userId)
        {
            var profile = await _db.StudentAssociationProfiles
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.UserId == userId);
            if (profile == null) return null;

            var activeAnnouncements = await _db.StudentOrganizationEvents.AsNoTracking()
                .CountAsync(e => e.OrganizationProfileId == profile.Id)
                + await _db.StudentOrganizationRecruitmentCampaigns.AsNoTracking()
                    .CountAsync(c => c.OrganizationProfileId == profile.Id && c.IsPublished);

            return new AssociationFeedSidebarDto
            {
                AssociationName = profile.AssociationName,
                LogoUrl = profile.LogoUrl,
                Category = profile.Category,
                ActiveAnnouncementsCount = activeAnnouncements,
            };
        }

        private async Task<FeedSuggestionsDto> BuildSuggestionsAsync(int userId, List<FeedPostDto> allPosts)
        {
            var student = await _db.StudentProfiles.AsNoTracking()
                .FirstOrDefaultAsync(s => s.UserId == userId);
            if (student == null) return new FeedSuggestionsDto();

            var followingOrgIds = (await _db.OrganizationFollows.AsNoTracking()
                .Where(f => f.StudentProfileId == student.Id)
                .Select(f => f.OrganizationProfileId)
                .ToListAsync()).ToHashSet();

            HashSet<int> followingCompanyIds;
            try
            {
                followingCompanyIds = (await _db.CompanyFollows.AsNoTracking()
                    .Where(f => f.StudentProfileId == student.Id)
                    .Select(f => f.CompanyProfileId)
                    .ToListAsync()).ToHashSet();
            }
            catch
            {
                followingCompanyIds = new HashSet<int>();
            }

            var skillNames = await ResolveSkillNamesAsync(
                SkillHelper.ParseIntList(student.TechnicalSkills)
                    .Concat(SkillHelper.ParseIntList(student.Roles))
                    .Take(12)
                    .ToList());

            var discoverMembers = await BuildDiscoverMembersAsync(
                student,
                followingCompanyIds,
                followingOrgIds,
                skillNames);

            return new FeedSuggestionsDto
            {
                SuggestedCompanies = new List<FeedSuggestedCompanyDto>(),
                SuggestedAssociations = new List<FeedSuggestedAssociationDto>(),
                DiscoverMembers = discoverMembers,
                RecommendedForYou = new FeedRecommendedForYouDto(),
            };
        }

        private async Task<List<FeedDiscoverMemberDto>> BuildDiscoverMembersAsync(
            StudentProfile student,
            HashSet<int> followingCompanyIds,
            HashSet<int> followingOrgIds,
            List<string> skillNames)
        {
            var candidates = new List<(FeedDiscoverMemberDto Item, int Score)>();

            var students = await _db.StudentProfiles
                .AsNoTracking()
                .Include(s => s.User)
                .Where(s => s.UserId != student.UserId)
                .OrderByDescending(s => s.Id)
                .Take(80)
                .ToListAsync();
            foreach (var s in students)
            {
                var score = 0;
                if (!string.IsNullOrWhiteSpace(student.Faculty)
                    && string.Equals(student.Faculty?.Trim(), s.Faculty?.Trim(), StringComparison.OrdinalIgnoreCase))
                    score += 5;
                if (!string.IsNullOrWhiteSpace(student.Major)
                    && string.Equals(student.Major?.Trim(), s.Major?.Trim(), StringComparison.OrdinalIgnoreCase))
                    score += 5;

                var studentSkillText = string.Join(" ", s.TechnicalSkills, s.Roles, s.Tools).ToLowerInvariant();
                foreach (var skill in skillNames)
                {
                    if (!string.IsNullOrWhiteSpace(skill) && studentSkillText.Contains(skill.ToLowerInvariant()))
                        score += 1;
                }

                candidates.Add((new FeedDiscoverMemberDto
                {
                    EntityType = FeedAuthorTypes.Student,
                    EntityId = s.Id,
                    Name = s.User?.Name ?? "Student",
                    Subtitle = !string.IsNullOrWhiteSpace(s.Major) ? s.Major : "Student",
                    AvatarBase64 = s.ProfilePictureBase64,
                }, score));
            }

            var doctors = await _db.DoctorProfiles
                .AsNoTracking()
                .Include(d => d.User)
                .OrderByDescending(d => d.Id)
                .Take(60)
                .ToListAsync();
            foreach (var d in doctors)
            {
                var score = 0;
                if (!string.IsNullOrWhiteSpace(student.Faculty)
                    && string.Equals(student.Faculty?.Trim(), d.Faculty?.Trim(), StringComparison.OrdinalIgnoreCase))
                    score += 4;
                if (!string.IsNullOrWhiteSpace(student.University)
                    && string.Equals(student.University?.Trim(), d.University?.Trim(), StringComparison.OrdinalIgnoreCase))
                    score += 2;

                var docSkillText = string.Join(" ", d.Specialization, d.Department, d.TechnicalSkills, d.ResearchSkills)
                    .ToLowerInvariant();
                foreach (var skill in skillNames)
                {
                    if (!string.IsNullOrWhiteSpace(skill) && docSkillText.Contains(skill.ToLowerInvariant()))
                        score += 1;
                }

                candidates.Add((new FeedDiscoverMemberDto
                {
                    EntityType = FeedAuthorTypes.Doctor,
                    EntityId = d.Id,
                    Name = d.User?.Name ?? "Doctor",
                    Subtitle = !string.IsNullOrWhiteSpace(d.Department)
                        ? d.Department
                        : (d.Specialization ?? "Academic Department"),
                    AvatarBase64 = d.ProfilePictureBase64,
                }, score));
            }

            var companies = await _db.CompanyProfiles
                .AsNoTracking()
                .OrderByDescending(c => c.Id)
                .Take(60)
                .ToListAsync();
            foreach (var c in companies.Where(c => !followingCompanyIds.Contains(c.Id)))
            {
                var score = ScoreCompanyMatch(c, student, skillNames);
                candidates.Add((new FeedDiscoverMemberDto
                {
                    EntityType = FeedAuthorTypes.Company,
                    EntityId = c.Id,
                    Name = c.CompanyName,
                    Subtitle = !string.IsNullOrWhiteSpace(c.Industry) ? c.Industry : "Software Company",
                }, score));
            }

            var associations = await _db.StudentAssociationProfiles
                .AsNoTracking()
                .OrderByDescending(a => a.Id)
                .Take(60)
                .ToListAsync();
            foreach (var a in associations.Where(a => !followingOrgIds.Contains(a.Id)))
            {
                var score = 0;
                if (!string.IsNullOrWhiteSpace(student.Faculty)
                    && string.Equals(student.Faculty?.Trim(), a.Faculty?.Trim(), StringComparison.OrdinalIgnoreCase))
                    score += 4;
                if (!string.IsNullOrWhiteSpace(student.Major)
                    && string.Equals(student.Major?.Trim(), a.Category?.Trim(), StringComparison.OrdinalIgnoreCase))
                    score += 1;
                candidates.Add((new FeedDiscoverMemberDto
                {
                    EntityType = FeedAuthorTypes.Association,
                    EntityId = a.Id,
                    Name = a.AssociationName,
                    Subtitle = !string.IsNullOrWhiteSpace(a.Category) ? a.Category : "Student Community",
                    AvatarUrl = a.LogoUrl,
                }, score));
            }

            var top = candidates
                .OrderByDescending(x => x.Score)
                .Take(24)
                .ToList();

            return top
                .OrderBy(_ => Rng.Next())
                .Take(5)
                .Select(x => x.Item)
                .ToList();
        }

        private static int ScoreCompanyMatch(CompanyProfile company, StudentProfile student, List<string> skillNames)
        {
            var score = 0;
            var haystack = string.Join(
                " ",
                company.Industry,
                company.AreasOfInterest,
                company.Description).ToLowerInvariant();

            if (!string.IsNullOrWhiteSpace(student.Major)
                && haystack.Contains(student.Major.Trim().ToLowerInvariant()))
                score += 3;

            foreach (var skill in skillNames)
            {
                if (haystack.Contains(skill.ToLowerInvariant()))
                    score += 2;
            }

            return score;
        }

        private async Task<List<string>> ResolveSkillNamesAsync(List<int> skillIds)
        {
            if (skillIds.Count == 0) return new List<string>();
            return await _db.Skills.AsNoTracking()
                .Where(s => skillIds.Contains(s.Id))
                .Select(s => s.Name)
                .ToListAsync();
        }

        private static int BuildProfileCompletion(StudentProfile profile)
        {
            var score = 0;
            if (!string.IsNullOrEmpty(profile.ProfilePictureBase64)) score += 20;
            if (SkillHelper.ParseIntList(profile.Roles).Any()) score += 25;
            if (SkillHelper.ParseIntList(profile.TechnicalSkills).Any()) score += 25;
            if (!string.IsNullOrEmpty(profile.Bio)) score += 15;
            if (profile.Gpa.HasValue) score += 15;
            return Math.Min(score, 100);
        }

        private async Task<List<FeedDiscoverMemberDto>> SearchMembersByNameAsync(int userId, string term)
        {
            var query = term.Trim();
            if (query.Length == 0)
                return new List<FeedDiscoverMemberDto>();

            var pattern = $"%{query}%";
            const int perTypeLimit = 8;
            var results = new List<FeedDiscoverMemberDto>();

            var students = await _db.StudentProfiles
                .AsNoTracking()
                .Include(s => s.User)
                .Where(s => s.UserId != userId && EF.Functions.ILike(s.User.Name, pattern))
                .OrderBy(s => s.User.Name)
                .Take(perTypeLimit)
                .ToListAsync();
            foreach (var s in students)
            {
                results.Add(new FeedDiscoverMemberDto
                {
                    EntityType = FeedAuthorTypes.Student,
                    EntityId = s.Id,
                    Name = s.User?.Name ?? "Student",
                    Subtitle = !string.IsNullOrWhiteSpace(s.Major) ? s.Major : "Student",
                    AvatarBase64 = s.ProfilePictureBase64,
                });
            }

            var doctors = await _db.DoctorProfiles
                .AsNoTracking()
                .Include(d => d.User)
                .Where(d =>
                    EF.Functions.ILike(d.User.Name, pattern)
                    || EF.Functions.ILike(d.User.Email, pattern)
                    || EF.Functions.ILike(d.Department, pattern)
                    || (d.Specialization != null && EF.Functions.ILike(d.Specialization, pattern))
                    || (d.Faculty != null && EF.Functions.ILike(d.Faculty, pattern))
                    || (d.ResearchSkills != null && EF.Functions.ILike(d.ResearchSkills, pattern))
                    || (d.TechnicalSkills != null && EF.Functions.ILike(d.TechnicalSkills, pattern)))
                .OrderBy(d => d.User.Name)
                .Take(perTypeLimit)
                .ToListAsync();
            foreach (var d in doctors)
            {
                results.Add(new FeedDiscoverMemberDto
                {
                    EntityType = FeedAuthorTypes.Doctor,
                    EntityId = d.Id,
                    Name = d.User?.Name ?? "Doctor",
                    Subtitle = !string.IsNullOrWhiteSpace(d.Department)
                        ? d.Department
                        : (d.Specialization ?? "Academic Department"),
                    AvatarBase64 = d.ProfilePictureBase64,
                });
            }

            var companies = await _db.CompanyProfiles
                .AsNoTracking()
                .Include(c => c.User)
                .Where(CompanySearchHelper.MatchesPattern(pattern))
                .OrderBy(c => c.CompanyName)
                .Take(perTypeLimit)
                .ToListAsync();
            foreach (var c in companies)
            {
                results.Add(new FeedDiscoverMemberDto
                {
                    EntityType = FeedAuthorTypes.Company,
                    EntityId = c.Id,
                    Name = CompanySearchHelper.DisplayName(c),
                    Subtitle = CompanySearchHelper.FormatCompanySubtitle(c.Industry, c.Description) ?? "Company",
                });
            }

            if (companies.Count < perTypeLimit)
            {
                var profileUserIds = companies.Select(c => c.UserId).ToHashSet();
                var orphanUsers = await _db.Users
                    .AsNoTracking()
                    .Where(u => u.Role == "company")
                    .Where(u => !profileUserIds.Contains(u.Id))
                    .Where(u => !_db.CompanyProfiles.Any(c => c.UserId == u.Id))
                    .Where(u =>
                        EF.Functions.ILike(u.Name, pattern)
                        || EF.Functions.ILike(u.Email, pattern))
                    .OrderBy(u => u.Name)
                    .Take(perTypeLimit - companies.Count)
                    .ToListAsync();

                foreach (var u in orphanUsers)
                {
                    results.Add(new FeedDiscoverMemberDto
                    {
                        EntityType = FeedAuthorTypes.Company,
                        EntityId = u.Id,
                        Name = string.IsNullOrWhiteSpace(u.Name) ? u.Email : u.Name.Trim(),
                        Subtitle = "Company account",
                    });
                }
            }

            var associations = await _db.StudentAssociationProfiles
                .AsNoTracking()
                .Where(a =>
                    EF.Functions.ILike(a.AssociationName, pattern)
                    || EF.Functions.ILike(a.Username, pattern))
                .OrderBy(a => a.AssociationName)
                .Take(perTypeLimit)
                .ToListAsync();
            foreach (var a in associations)
            {
                results.Add(new FeedDiscoverMemberDto
                {
                    EntityType = FeedAuthorTypes.Association,
                    EntityId = a.Id,
                    Name = a.AssociationName,
                    Subtitle = !string.IsNullOrWhiteSpace(a.Category) ? a.Category : "Student Association",
                    AvatarUrl = a.LogoUrl,
                });
            }

            return results
                .OrderBy(r => r.Name, StringComparer.OrdinalIgnoreCase)
                .Take(24)
                .ToList();
        }

        private static List<FeedPostDto> FilterBySearch(List<FeedPostDto> posts, string term)
        {
            var q = term.ToLowerInvariant();
            return posts
                .Where(p =>
                    p.Title.ToLowerInvariant().Contains(q)
                    || p.Content.ToLowerInvariant().Contains(q)
                    || p.AuthorName.ToLowerInvariant().Contains(q)
                    || (p.SourceSubtitle != null && p.SourceSubtitle.ToLowerInvariant().Contains(q))
                    || (p.PostKind != null && p.PostKind.ToLowerInvariant().Contains(q))
                    || p.Metadata.Any(m =>
                        m.Value.ToLowerInvariant().Contains(q)
                        || m.Label.ToLowerInvariant().Contains(q)))
                .ToList();
        }
    }
}
