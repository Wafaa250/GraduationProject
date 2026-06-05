using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using GraduationProject.API.Data;
using GraduationProject.API.DTOs;
using GraduationProject.API.Helpers;
using GraduationProject.API.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace GraduationProject.API.Services
{
    public class StudentRecommendationService : IStudentRecommendationService
    {
        /// <summary>Ranked pool size before time-based rotation picks the visible slice.</summary>
        private const int RankedPoolSize = 36;
        /// <summary>Items per group in the Communication Hub “Recommended For You” card.</summary>
        public const int RecommendedForYouSectionLimit = 3;
        /// <summary>Visible mixed recommendations in the Communication Hub sidebar.</summary>
        public const int UnifiedRecommendedDisplayCount = 4;
        private const int MeaningfulMatchThreshold = 55;
        private const int CandidatePool = 120;
        /// <summary>Pick among candidates within this many points of the pool top score.</summary>
        private const int ScoreBandSpread = 18;

        private readonly ApplicationDbContext _db;
        private readonly ILogger<StudentRecommendationService> _logger;

        public StudentRecommendationService(
            ApplicationDbContext db,
            ILogger<StudentRecommendationService> logger)
        {
            _db = db;
            _logger = logger;
        }

        public async Task<FeedRecommendationsResponseDto> GetRecommendationsForUserAsync(int userId)
        {
            var student = await _db.StudentProfiles.AsNoTracking()
                .FirstOrDefaultAsync(s => s.UserId == userId);
            if (student == null)
                return new FeedRecommendationsResponseDto();

            return await GetRecommendationsForStudentAsync(student.Id);
        }

        public async Task<FeedRecommendationsResponseDto> GetRecommendationsForStudentAsync(int studentProfileId)
        {
            var slot = GetRotationSlot(studentProfileId);
            var students = SelectRotatingSlice(
                await GetSuggestedStudentsAsync(studentProfileId),
                slot,
                RecommendedForYouSectionLimit);
            var doctors = SelectRotatingSlice(
                await GetSuggestedDoctorsAsync(studentProfileId),
                slot + 1,
                RecommendedForYouSectionLimit);
            var companies = SelectRotatingSlice(
                await GetSuggestedCompaniesAsync(studentProfileId),
                slot + 2,
                RecommendedForYouSectionLimit);
            var associations = SelectRotatingSlice(
                await GetSuggestedAssociationsAsync(studentProfileId),
                slot + 3,
                RecommendedForYouSectionLimit);
            return new FeedRecommendationsResponseDto
            {
                Students = students,
                Doctors = doctors,
                Companies = companies,
                Associations = associations,
            };
        }

        /// <summary>UTC time bucket (default 60s) + profile id for rotating suggestions.</summary>
        public static int GetRotationSlot(int studentProfileId, int bucketSeconds = 60)
        {
            var buckets = (long)(DateTime.UtcNow - DateTime.UnixEpoch).TotalSeconds / Math.Max(1, bucketSeconds);
            return (int)((buckets + studentProfileId) % 1_000_000);
        }

        private static List<T> SelectRotatingSlice<T>(IReadOnlyList<T> ranked, int slot, int take)
        {
            if (ranked.Count == 0) return new List<T>();
            if (ranked.Count <= take) return ranked.ToList();
            var start = slot % ranked.Count;
            var result = new List<T>(take);
            for (var i = 0; i < take; i++)
                result.Add(ranked[(start + i) % ranked.Count]);
            return result;
        }

        private static int CombineRotationSeed(
            int studentProfileId,
            int? rotationTick,
            IReadOnlySet<string> excludeIds)
        {
            var tick = rotationTick ?? (int)(DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() % int.MaxValue);
            if (tick < 0) tick = -tick;

            var excludeHash = 0;
            foreach (var id in excludeIds.OrderBy(x => x, StringComparer.Ordinal))
                excludeHash = HashCode.Combine(excludeHash, id.GetHashCode(StringComparison.Ordinal));

            return HashCode.Combine(studentProfileId, tick, excludeHash);
        }

        private static FeedRecommendedItemDto? PickRandomInScoreBand(
            IReadOnlyList<FeedRecommendedItemDto> pool,
            int seed,
            IReadOnlySet<string> alreadyPicked)
        {
            var available = pool.Where(x => !alreadyPicked.Contains(x.Id)).ToList();
            if (available.Count == 0) return null;
            if (available.Count == 1) return available[0];

            var topScore = available.Max(x => x.MatchScore);
            var bandItems = available.Where(x => x.MatchScore >= topScore - ScoreBandSpread).ToList();
            if (bandItems.Count == 0) bandItems = available;

            var rng = new Random(seed);
            return bandItems[rng.Next(bandItems.Count)];
        }

        private static List<FeedRecommendedItemDto> PoolForPick(
            IReadOnlyList<FeedRecommendedItemDto> source,
            IReadOnlySet<string> excludeIds,
            bool relaxWhenEmpty,
            bool preferUnfollowed = false)
        {
            var pool = source;
            if (preferUnfollowed)
            {
                var unfollowed = source.Where(x => !x.IsFollowing).ToList();
                if (unfollowed.Count > 0)
                    pool = unfollowed;
            }

            var filtered = pool.Where(x => !excludeIds.Contains(x.Id)).ToList();
            if (filtered.Count > 0 || !relaxWhenEmpty)
                return filtered;
            return pool.ToList();
        }

        /// <summary>
        /// Mandatory 1+1+1+1 mix when pools exist; fill order prioritizes orgs before students.
        /// </summary>
        private static List<FeedRecommendedItemDto> BuildBalancedRecommendedWindow(
            IReadOnlyList<FeedRecommendedItemDto> students,
            IReadOnlyList<FeedRecommendedItemDto> doctors,
            IReadOnlyList<FeedRecommendedItemDto> companies,
            IReadOnlyList<FeedRecommendedItemDto> associations,
            int rotationSeed,
            int displayCount,
            IReadOnlySet<string> excludeIds)
        {
            var picked = new List<FeedRecommendedItemDto>(displayCount);
            var pickedIds = new HashSet<string>(StringComparer.Ordinal);

            void TryAdd(FeedRecommendedItemDto? item)
            {
                if (item == null || picked.Count >= displayCount) return;
                if (!pickedIds.Add(item.Id)) return;
                picked.Add(item);
            }

            // Phase 1 — one mandatory pick per role (company → association → student → doctor).
            var mandatory = new (string Type, IReadOnlyList<FeedRecommendedItemDto> Pool, int SeedOffset, bool Relax)[]
            {
                ("company", companies, 11, true),
                ("association", associations, 22, true),
                ("student", students, 33, false),
                ("doctor", doctors, 44, false),
            };

            foreach (var (roleType, pool, seedOffset, relax) in mandatory)
            {
                if (pool.Count == 0) continue;
                var preferUnfollowed = roleType is "company" or "association";
                var available = PoolForPick(pool, excludeIds, relax, preferUnfollowed);
                TryAdd(PickRandomInScoreBand(available, rotationSeed + seedOffset, pickedIds));
            }

            // Phase 2 — fill only missing role types (max one per role when that pool has data).
            var fillRoles = new (string Type, IReadOnlyList<FeedRecommendedItemDto> Pool, int SeedOffset, bool Relax)[]
            {
                ("company", companies, 100, true),
                ("association", associations, 117, true),
                ("student", students, 134, false),
                ("doctor", doctors, 151, false),
            };

            foreach (var (roleType, pool, seedOffset, relax) in fillRoles)
            {
                if (picked.Count >= displayCount || pool.Count == 0) continue;
                if (picked.Any(p => p.Type == roleType)) continue;
                var preferUnfollowed = roleType is "company" or "association";
                var available = PoolForPick(pool, excludeIds, relax, preferUnfollowed);
                TryAdd(PickRandomInScoreBand(available, rotationSeed + seedOffset, pickedIds));
            }

            // Phase 2b — still short: next best from any pool, prefer types not yet shown.
            var refillRound = 0;
            while (picked.Count < displayCount && refillRound < displayCount * 8)
            {
                var added = false;
                foreach (var (roleType, pool, seedOffset, relax) in fillRoles)
                {
                    if (picked.Count >= displayCount) break;
                    if (pool.Count == 0) continue;
                    var roleCount = picked.Count(p => p.Type == roleType);
                    if (roleCount > 0 && fillRoles.Any(r => r.Type != roleType && r.Pool.Count > 0
                            && !picked.Any(p => p.Type == r.Type)))
                        continue;

                    var preferUnfollowed = roleType is "company" or "association";
                    var available = PoolForPick(pool, excludeIds, relax, preferUnfollowed)
                        .Where(x => !pickedIds.Contains(x.Id))
                        .ToList();
                    if (available.Count == 0) continue;
                    var pick = PickRandomInScoreBand(available, rotationSeed + 200 + seedOffset + refillRound, pickedIds);
                    if (pick == null) continue;
                    TryAdd(pick);
                    added = true;
                }

                if (!added) break;
                refillRound++;
            }

            // Phase 3 — force org roles if DB had them but picks missed.
            EnsureRoleRepresented(picked, pickedIds, companies, "company", rotationSeed + 501, displayCount);
            EnsureRoleRepresented(picked, pickedIds, associations, "association", rotationSeed + 502, displayCount);
            EnsureRoleRepresented(picked, pickedIds, students, "student", rotationSeed + 503, displayCount);
            EnsureRoleRepresented(picked, pickedIds, doctors, "doctor", rotationSeed + 504, displayCount);

            return OrderRecommendedForDisplay(picked.Take(displayCount).ToList());
        }

        /// <summary>If the DB has org profiles, at least one must appear when possible.</summary>
        private static void EnsureRoleRepresented(
            List<FeedRecommendedItemDto> picked,
            HashSet<string> pickedIds,
            IReadOnlyList<FeedRecommendedItemDto> fullPool,
            string roleType,
            int seed,
            int displayCount)
        {
            if (fullPool.Count == 0 || picked.Any(p => p.Type == roleType))
                return;

            var pool = roleType is "company" or "association"
                ? PoolForPick(fullPool, new HashSet<string>(StringComparer.Ordinal), relaxWhenEmpty: true, preferUnfollowed: true)
                : fullPool.Where(x => !pickedIds.Contains(x.Id)).ToList();
            if (pool.Count == 0)
                pool = fullPool.ToList();

            var candidate = PickRandomInScoreBand(pool, seed, pickedIds)
                ?? PickRandomInScoreBand(pool, seed + 7, new HashSet<string>(StringComparer.Ordinal));
            if (candidate == null)
                return;

            if (picked.Count >= displayCount)
            {
                var removable = picked.LastOrDefault(p => p.Type == "student")
                    ?? picked.LastOrDefault(p => p.Type == "doctor");
                if (removable == null)
                    return;
                picked.Remove(removable);
                pickedIds.Remove(removable.Id);
            }

            if (!pickedIds.Add(candidate.Id))
                return;
            picked.Add(candidate);
        }

        private static void ApplyRecommendedItemMetadata(FeedRecommendedItemDto item)
        {
            item.IsFollowed = item.IsFollowing;

            switch (item.Type)
            {
                case "student":
                    item.CanMessage = item.UserId is > 0;
                    item.CanFollow = false;
                    item.ProfileUrl = item.UserId is > 0 ? $"/students/{item.UserId}" : null;
                    break;
                case "doctor":
                    item.CanMessage = item.UserId is > 0;
                    item.CanFollow = false;
                    item.ProfileUrl = item.UserId is > 0 ? $"/doctors/{item.UserId}" : null;
                    break;
                case "company":
                    item.CanMessage = false;
                    item.CanFollow = item.EntityId > 0;
                    item.ProfileUrl = item.EntityId > 0
                        ? FeedActionRoutes.CompanyPublicProfile(item.EntityId)
                        : null;
                    break;
                case "association":
                    item.CanMessage = false;
                    item.CanFollow = item.EntityId > 0;
                    item.ProfileUrl = item.EntityId > 0
                        ? FeedActionRoutes.OrganizationPublicProfile(item.EntityId)
                        : null;
                    break;
                default:
                    item.CanMessage = false;
                    item.CanFollow = false;
                    item.ProfileUrl = null;
                    break;
            }
        }

        private static bool IsDiscoverableRecommendedItem(
            FeedRecommendedItemDto item,
            IReadOnlySet<int> excludedUserIds)
        {
            if (item.Type is not ("student" or "doctor" or "company" or "association"))
                return false;

            if (item.UserId is > 0 && excludedUserIds.Contains(item.UserId.Value))
                return false;

            if (string.Equals(item.Subtitle?.Trim(), "Company account", StringComparison.OrdinalIgnoreCase))
                return false;

            return item.Type switch
            {
                "student" or "doctor" => item.UserId is > 0,
                "company" or "association" => item.EntityId > 0,
                _ => false,
            };
        }

        private static List<FeedRecommendedItemDto> FilterDiscoverableRecommendedItems(
            IEnumerable<FeedRecommendedItemDto> items,
            IReadOnlySet<int> excludedUserIds)
        {
            return items
                .Where(item => IsDiscoverableRecommendedItem(item, excludedUserIds))
                .ToList();
        }

        /// <summary>Mixed roles, highest AI match score first.</summary>
        private static List<FeedRecommendedItemDto> OrderRecommendedForDisplay(
            List<FeedRecommendedItemDto> items)
        {
            return items
                .OrderByDescending(x => x.MatchScore)
                .ThenBy(x => x.Name, StringComparer.OrdinalIgnoreCase)
                .ToList();
        }

        public async Task<List<StudentRecommendedStudentDto>> GetSuggestedStudentsAsync(int studentProfileId)
        {
            var viewer = await _db.StudentProfiles.AsNoTracking()
                .Include(s => s.User)
                .FirstOrDefaultAsync(s => s.Id == studentProfileId);
            if (viewer == null) return new List<StudentRecommendedStudentDto>();

            var viewerCtx = await BuildMatchContextAsync(viewer);

            var excludedUserIds = await LoadExcludedRecommendationUserIdsAsync();

            var candidates = await _db.StudentProfiles
                .AsNoTracking()
                .Include(s => s.User)
                .Where(s =>
                    s.UserId != viewer.UserId
                    && s.User != null
                    && s.User.Role == UserRoles.Student
                    && !excludedUserIds.Contains(s.UserId))
                .OrderByDescending(s => s.Id)
                .Take(CandidatePool)
                .ToListAsync();

            if (candidates.Count == 0) return new List<StudentRecommendedStudentDto>();

            var candidateIds = candidates.Select(c => c.Id).ToList();
            var allSkillIds = candidates
                .SelectMany(c =>
                    SkillHelper.ParseIntList(c.TechnicalSkills).Concat(SkillHelper.ParseIntList(c.Roles)))
                .Distinct()
                .ToList();
            var skillNameById = allSkillIds.Count == 0
                ? new Dictionary<int, string>()
                : await _db.Skills.AsNoTracking()
                    .Where(s => allSkillIds.Contains(s.Id))
                    .ToDictionaryAsync(s => s.Id, s => s.Name);

            var linkedByStudent = await _db.StudentSkills.AsNoTracking()
                .Where(ss => candidateIds.Contains(ss.StudentId))
                .Join(_db.Skills.AsNoTracking(), ss => ss.SkillId, sk => sk.Id, (ss, sk) => new { ss.StudentId, sk.Name })
                .GroupBy(x => x.StudentId)
                .ToDictionaryAsync(g => g.Key, g => g.Select(x => x.Name).ToList());

            var ranked = new List<(StudentProfile Profile, int Score)>();
            foreach (var candidate in candidates)
            {
                var ids = SkillHelper.ParseIntList(candidate.TechnicalSkills)
                    .Concat(SkillHelper.ParseIntList(candidate.Roles));
                var names = ids.Where(skillNameById.ContainsKey).Select(id => skillNameById[id]).ToList();
                if (linkedByStudent.TryGetValue(candidate.Id, out var linked))
                    names.AddRange(linked);
                var candidateSkillNames = SkillHelper.NormalizeUniqueStrings(names);

                var score = StudentRecommendationScorer.ScoreStudentPeer(candidate, viewerCtx, candidateSkillNames);
                ranked.Add((candidate, score));
            }

            var top = ranked
                .OrderByDescending(x => x.Score)
                .ThenBy(x => x.Profile.User?.Name ?? "")
                .Take(RankedPoolSize)
                .ToList();

            return top.Select(x => new StudentRecommendedStudentDto
            {
                UserId = x.Profile.UserId,
                ProfileId = x.Profile.Id,
                Name = x.Profile.User?.Name ?? "Student",
                Subtitle = FormatStudentSubtitle(x.Profile),
                AvatarBase64 = x.Profile.ProfilePictureBase64,
                MatchScore = x.Score,
            }).ToList();
        }

        public async Task<List<StudentRecommendedDoctorDto>> GetSuggestedDoctorsAsync(int studentProfileId)
        {
            var viewer = await _db.StudentProfiles.AsNoTracking()
                .FirstOrDefaultAsync(s => s.Id == studentProfileId);
            if (viewer == null) return new List<StudentRecommendedDoctorDto>();

            var viewerCtx = await BuildMatchContextAsync(viewer);

            var excludedUserIds = await LoadExcludedRecommendationUserIdsAsync();

            var candidates = await _db.DoctorProfiles
                .AsNoTracking()
                .Include(d => d.User)
                .Where(d =>
                    d.User != null
                    && d.User.Role == UserRoles.Doctor
                    && !excludedUserIds.Contains(d.UserId))
                .OrderByDescending(d => d.Id)
                .Take(CandidatePool)
                .ToListAsync();

            if (candidates.Count == 0) return new List<StudentRecommendedDoctorDto>();

            var ranked = candidates
                .Select(d => new { Doctor = d, Score = StudentRecommendationScorer.ScoreDoctor(d, viewerCtx) })
                .OrderByDescending(x => x.Score)
                .ThenBy(x => x.Doctor.User?.Name ?? "")
                .Take(RankedPoolSize)
                .ToList();

            return ranked.Select(x => new StudentRecommendedDoctorDto
            {
                UserId = x.Doctor.UserId,
                ProfileId = x.Doctor.Id,
                Name = x.Doctor.User?.Name ?? "Doctor",
                Subtitle = FormatDoctorSubtitle(x.Doctor),
                AvatarBase64 = x.Doctor.ProfilePictureBase64,
                MatchScore = x.Score,
            }).ToList();
        }

        public async Task<List<StudentRecommendedCompanyDto>> GetSuggestedCompaniesAsync(int studentProfileId)
        {
            var student = await LoadStudentAsync(studentProfileId);
            if (student == null) return new List<StudentRecommendedCompanyDto>();

            var ctx = await BuildMatchContextAsync(student);
            var following = await LoadFollowingCompanyIdsAsync(studentProfileId);

            var companies = await _db.CompanyProfiles.AsNoTracking()
                .Include(c => c.User)
                .Where(c => c.User != null && c.User.Role == UserRoles.Company)
                .OrderByDescending(c => c.Id)
                .Take(CandidatePool)
                .ToListAsync();

            if (companies.Count == 0) return new List<StudentRecommendedCompanyDto>();

            var ranked = companies
                .Select(c => new
                {
                    Company = c,
                    Score = StudentRecommendationScorer.ScoreCompany(c, ctx),
                    IsFollowing = following.Contains(c.Id),
                })
                .OrderBy(x => x.IsFollowing)
                .ThenByDescending(x => x.Score)
                .ThenBy(x => x.Company.CompanyName, StringComparer.OrdinalIgnoreCase)
                .Take(RankedPoolSize)
                .ToList();

            return ranked.Select(x => new StudentRecommendedCompanyDto
            {
                Id = x.Company.Id,
                Name = CompanySearchHelper.DisplayName(x.Company),
                LogoUrl = null,
                Category = FormatCompanyCategory(x.Company),
                MatchScore = x.Score,
                IsFollowing = x.IsFollowing,
            }).ToList();
        }

        public async Task<List<StudentRecommendedAssociationDto>> GetSuggestedAssociationsAsync(int studentProfileId)
        {
            var student = await LoadStudentAsync(studentProfileId);
            if (student == null) return new List<StudentRecommendedAssociationDto>();

            var ctx = await BuildMatchContextAsync(student);
            var following = await LoadFollowingOrganizationIdsAsync(studentProfileId);

            var orgs = await _db.StudentAssociationProfiles.AsNoTracking()
                .Include(a => a.User)
                .Where(a =>
                    a.User != null
                    && (a.User.Role == UserRoles.StudentAssociation || a.User.Role == UserRoles.Association))
                .OrderByDescending(a => a.Id)
                .Take(CandidatePool)
                .ToListAsync();

            if (orgs.Count == 0) return new List<StudentRecommendedAssociationDto>();

            var ranked = orgs
                .Select(o => new
                {
                    Org = o,
                    Score = StudentRecommendationScorer.ScoreAssociation(o, ctx),
                    IsFollowing = following.Contains(o.Id),
                })
                .OrderBy(x => x.IsFollowing)
                .ThenByDescending(x => x.Score)
                .ThenBy(x => x.Org.AssociationName, StringComparer.OrdinalIgnoreCase)
                .Take(RankedPoolSize)
                .ToList();

            return ranked.Select(x => new StudentRecommendedAssociationDto
            {
                Id = x.Org.Id,
                Name = x.Org.AssociationName,
                LogoUrl = x.Org.LogoUrl,
                Category = FormatAssociationCategory(x.Org),
                MatchScore = x.Score,
                IsFollowing = x.IsFollowing,
            }).ToList();
        }

        public async Task<FeedRecommendedResponseDto> GetUnifiedRecommendedForUserAsync(
            int userId,
            int? rotationTick = null,
            IReadOnlyList<string>? excludeIds = null)
        {
            var student = await _db.StudentProfiles.AsNoTracking()
                .FirstOrDefaultAsync(s => s.UserId == userId);
            if (student == null)
                return new FeedRecommendedResponseDto();

            var dbCompanyCount = await _db.CompanyProfiles.AsNoTracking().CountAsync();
            var dbAssociationCount = await _db.StudentAssociationProfiles.AsNoTracking().CountAsync();

            var followingCompanyIds = await LoadFollowingCompanyIdsAsync(student.Id);
            var followingOrgIds = await LoadFollowingOrganizationIdsAsync(student.Id);
            var excludedUserIds = await LoadExcludedRecommendationUserIdsAsync();

            var students = await GetSuggestedStudentsAsync(student.Id);
            var doctors = await GetSuggestedDoctorsAsync(student.Id);

            var studentItems = students.Select(s => new FeedRecommendedItemDto
            {
                Id = $"student-{s.UserId}",
                Type = "student",
                EntityId = s.ProfileId,
                UserId = s.UserId,
                Name = s.Name,
                Subtitle = s.Subtitle,
                AvatarBase64 = s.AvatarBase64,
                MatchScore = s.MatchScore,
            }).ToList();

            var doctorItems = doctors.Select(d => new FeedRecommendedItemDto
            {
                Id = $"doctor-{d.UserId}",
                Type = "doctor",
                EntityId = d.ProfileId,
                UserId = d.UserId,
                Name = d.Name,
                Subtitle = d.Subtitle,
                AvatarBase64 = d.AvatarBase64,
                MatchScore = d.MatchScore,
            }).ToList();

            // Always build org pools directly from DB (not only top scored slice).
            var companyItems = await BuildCompanyRecommendationPoolAsync(student, followingCompanyIds);
            var associationItems = await BuildAssociationRecommendationPoolAsync(student, followingOrgIds);

            _logger.LogInformation(
                "Feed recommended candidate pools for student {StudentId}: Students={Students}, Doctors={Doctors}, Companies={Companies} (db={DbCompanies}), Associations={Associations} (db={DbAssociations})",
                student.Id,
                studentItems.Count,
                doctorItems.Count,
                companyItems.Count,
                dbCompanyCount,
                associationItems.Count,
                dbAssociationCount);

            if (studentItems.Count == 0 && doctorItems.Count == 0
                && companyItems.Count == 0 && associationItems.Count == 0)
            {
                _logger.LogWarning(
                    "Feed recommended: all pools empty for student {StudentId}. Check student_profiles, doctor_profiles, company_profiles, student_association_profiles tables.",
                    student.Id);
                return new FeedRecommendedResponseDto
                {
                    PoolStats = new FeedRecommendedPoolStatsDto
                    {
                        CompaniesInDatabase = dbCompanyCount,
                        AssociationsInDatabase = dbAssociationCount,
                    },
                };
            }

            var excludeSet = excludeIds == null || excludeIds.Count == 0
                ? new HashSet<string>(StringComparer.Ordinal)
                : excludeIds.ToHashSet(StringComparer.Ordinal);

            var rotationSeed = CombineRotationSeed(student.Id, rotationTick, excludeSet);

            var window = BuildBalancedRecommendedWindow(
                studentItems,
                doctorItems,
                companyItems,
                associationItems,
                rotationSeed,
                UnifiedRecommendedDisplayCount,
                excludeSet);

            if (window.Count < UnifiedRecommendedDisplayCount && excludeSet.Count > 0)
            {
                window = BuildBalancedRecommendedWindow(
                    studentItems,
                    doctorItems,
                    companyItems,
                    associationItems,
                    rotationSeed + 17,
                    UnifiedRecommendedDisplayCount,
                    new HashSet<string>(StringComparer.Ordinal));
            }

            foreach (var item in window)
                ApplyRecommendedItemMetadata(item);

            window = FilterDiscoverableRecommendedItems(window, excludedUserIds);

            var returnedTypes = string.Join(", ", window.GroupBy(w => w.Type).Select(g => $"{g.Key}:{g.Count()}"));

            _logger.LogInformation(
                "Feed recommended result for student {StudentId}: seed={Seed}, excluded={ExcludeCount}, returned=[{ReturnedIds}], types=[{Types}]",
                student.Id,
                rotationSeed,
                excludeSet.Count,
                string.Join(", ", window.Select(w => w.Id)),
                returnedTypes);

            if (dbCompanyCount > 0 && !window.Any(w => w.Type == "company"))
                _logger.LogWarning("Feed recommended: {DbCompanies} companies in DB but none returned.", dbCompanyCount);

            if (dbAssociationCount > 0 && !window.Any(w => w.Type == "association"))
                _logger.LogWarning("Feed recommended: {DbAssociations} associations in DB but none returned.", dbAssociationCount);

            return new FeedRecommendedResponseDto
            {
                Items = window,
                PoolStats = new FeedRecommendedPoolStatsDto
                {
                    StudentsInPool = studentItems.Count,
                    DoctorsInPool = doctorItems.Count,
                    CompaniesInPool = companyItems.Count,
                    AssociationsInPool = associationItems.Count,
                    CompaniesInDatabase = dbCompanyCount,
                    AssociationsInDatabase = dbAssociationCount,
                    RotationSeed = rotationSeed,
                    ExcludedCount = excludeSet.Count,
                    ReturnedTypes = returnedTypes,
                },
            };
        }

        private async Task<List<FeedRecommendedItemDto>> BuildCompanyRecommendationPoolAsync(
            StudentProfile student,
            HashSet<int> followingCompanyIds)
        {
            var ctx = await BuildMatchContextAsync(student);
            const int minDisplayScore = 40;

            var companies = await _db.CompanyProfiles.AsNoTracking()
                .Include(c => c.User)
                .Where(c => c.User != null && c.User.Role == UserRoles.Company)
                .OrderByDescending(c => c.Id)
                .Take(CandidatePool)
                .ToListAsync();

            var ranked = companies
                .Where(c => c.Id > 0)
                .Select(c => new FeedRecommendedItemDto
                {
                    Id = $"company-{c.Id}",
                    Type = "company",
                    EntityId = c.Id,
                    Name = CompanySearchHelper.DisplayName(c),
                    Subtitle = FormatCompanyCategory(c),
                    AvatarUrl = null,
                    MatchScore = Math.Max(minDisplayScore, StudentRecommendationScorer.ScoreCompany(c, ctx)),
                    IsFollowing = followingCompanyIds.Contains(c.Id),
                })
                .OrderByDescending(x => x.MatchScore)
                .ThenBy(x => x.Name, StringComparer.OrdinalIgnoreCase)
                .ToList();

            var notFollowing = ranked.Where(x => !x.IsFollowing).ToList();
            var pool = notFollowing.Count > 0 ? notFollowing : ranked;
            return pool.Take(RankedPoolSize).ToList();
        }

        private async Task<List<FeedRecommendedItemDto>> BuildAssociationRecommendationPoolAsync(
            StudentProfile student,
            HashSet<int> followingOrgIds)
        {
            var ctx = await BuildMatchContextAsync(student);
            const int minDisplayScore = 40;

            var orgs = await _db.StudentAssociationProfiles.AsNoTracking()
                .Include(a => a.User)
                .Where(a =>
                    a.User != null
                    && (a.User.Role == UserRoles.StudentAssociation || a.User.Role == UserRoles.Association))
                .OrderByDescending(a => a.Id)
                .Take(CandidatePool)
                .ToListAsync();

            var ranked = orgs
                .Where(o => o.Id > 0)
                .Select(o => new FeedRecommendedItemDto
                {
                    Id = $"association-{o.Id}",
                    Type = "association",
                    EntityId = o.Id,
                    Name = o.AssociationName,
                    Subtitle = FormatAssociationCategory(o),
                    AvatarUrl = o.LogoUrl,
                    MatchScore = Math.Max(minDisplayScore, StudentRecommendationScorer.ScoreAssociation(o, ctx)),
                    IsFollowing = followingOrgIds.Contains(o.Id),
                })
                .OrderByDescending(x => x.MatchScore)
                .ThenBy(x => x.Name, StringComparer.OrdinalIgnoreCase)
                .ToList();

            var notFollowing = ranked.Where(x => !x.IsFollowing).ToList();
            var pool = notFollowing.Count > 0 ? notFollowing : ranked;
            return pool.Take(RankedPoolSize).ToList();
        }

        public async Task<StudentAiMatchStatusDto> GetAiMatchStatusForUserAsync(int userId)
        {
            var student = await _db.StudentProfiles.AsNoTracking()
                .FirstOrDefaultAsync(s => s.UserId == userId);
            if (student == null)
                return EmptyAiMatchStatus();

            var profileStrength = ComputeProfileStrengthScore(student);
            var availability = FormatAvailabilityStatus(student);

            var students = await GetSuggestedStudentsAsync(student.Id);
            var doctors = await GetSuggestedDoctorsAsync(student.Id);
            var companies = await GetSuggestedCompaniesAsync(student.Id);
            var associations = await GetSuggestedAssociationsAsync(student.Id);

            var studentCount = CountMeaningfulMatches(students.Select(s => s.MatchScore));
            var doctorCount = CountMeaningfulMatches(doctors.Select(d => d.MatchScore));
            var companyCount = CountMeaningfulMatches(companies.Select(c => c.MatchScore));
            var associationCount = CountMeaningfulMatches(associations.Select(a => a.MatchScore));

            var allScores = students.Select(s => s.MatchScore)
                .Concat(doctors.Select(d => d.MatchScore))
                .Concat(companies.Select(c => c.MatchScore))
                .Concat(associations.Select(a => a.MatchScore))
                .Where(s => s > 0)
                .OrderByDescending(s => s)
                .ToList();

            var hasInsights = studentCount + doctorCount + companyCount + associationCount > 0;
            var matchPercent = allScores.Count > 0
                ? (int)Math.Round(allScores.Take(8).Average())
                : profileStrength;

            matchPercent = Math.Clamp(matchPercent, 0, 100);

            var showEmpty = !hasInsights && profileStrength < 40;

            return new StudentAiMatchStatusDto
            {
                MatchScorePercent = matchPercent,
                Headline = showEmpty
                    ? "Profile strength is growing."
                    : matchPercent >= 65
                        ? $"{matchPercent}% Match Ready"
                        : $"{matchPercent}% Match score",
                Insight = showEmpty
                    ? "Complete more profile information to improve recommendations."
                    : BuildMatchInsight(studentCount, doctorCount, companyCount, associationCount),
                AvailabilityStatus = availability,
                StudentMatchCount = studentCount,
                DoctorMatchCount = doctorCount,
                CompanyMatchCount = companyCount,
                AssociationMatchCount = associationCount,
                ProfileStrengthScore = profileStrength,
                HasMatchInsights = hasInsights,
                ShowEmptyState = showEmpty,
            };
        }

        private static StudentAiMatchStatusDto EmptyAiMatchStatus() =>
            new()
            {
                ShowEmptyState = true,
                Headline = "Profile strength is growing.",
                Insight = "Complete more profile information to improve recommendations.",
            };

        private static int CountMeaningfulMatches(IEnumerable<int> scores) =>
            scores.Count(s => s >= MeaningfulMatchThreshold);

        private static int ComputeProfileStrengthScore(StudentProfile profile)
        {
            var score = 0;
            if (!string.IsNullOrEmpty(profile.ProfilePictureBase64)) score += 20;
            if (SkillHelper.ParseIntList(profile.Roles).Any()) score += 25;
            if (SkillHelper.ParseIntList(profile.TechnicalSkills).Any()) score += 25;
            if (!string.IsNullOrWhiteSpace(profile.Bio)) score += 15;
            if (profile.Gpa.HasValue) score += 15;
            return Math.Clamp(score, 0, 100);
        }

        private static string FormatAvailabilityStatus(StudentProfile profile)
        {
            if (!string.IsNullOrWhiteSpace(profile.Availability))
                return profile.Availability.Trim();
            if (!string.IsNullOrWhiteSpace(profile.LookingFor))
                return profile.LookingFor.Trim();
            return "Open for collaboration";
        }

        private static string BuildMatchInsight(int students, int doctors, int companies, int associations)
        {
            var parts = new List<string>();
            if (students > 0)
                parts.Add($"{students} student{(students == 1 ? "" : "s")}");
            if (doctors > 0)
                parts.Add($"{doctors} doctor{(doctors == 1 ? "" : "s")}");
            if (companies > 0)
                parts.Add($"{companies} compan{(companies == 1 ? "y" : "ies")}");
            if (associations > 0)
                parts.Add($"{associations} association{(associations == 1 ? "" : "s")}");

            if (parts.Count == 0)
                return "Keep building your profile to unlock more AI matches.";

            if (parts.Count == 1)
                return $"You match with {parts[0]}.";

            var last = parts[^1];
            var rest = string.Join(", ", parts.Take(parts.Count - 1));
            return $"You match with {rest}, and {last}.";
        }

        /// <summary>
        /// Ensures enough companies and associations exist in the rotation pool (includes already-followed
        /// orgs when few unfollowed matches remain, so the hub can still surface Follow/Following actions).
        /// </summary>
        private async Task EnrichOrganizationRecommendationPoolsAsync(
            StudentProfile student,
            HashSet<int> followingCompanyIds,
            HashSet<int> followingOrgIds,
            List<FeedRecommendedItemDto> companyItems,
            List<FeedRecommendedItemDto> associationItems)
        {
            const int targetPool = 24;
            var ctx = await BuildMatchContextAsync(student);

            if (companyItems.Count < targetPool)
            {
                var existing = companyItems.Select(c => c.EntityId).ToHashSet();
                var candidates = await _db.CompanyProfiles.AsNoTracking()
                    .OrderByDescending(c => c.Id)
                    .Take(CandidatePool)
                    .ToListAsync();

                var ranked = candidates
                    .Where(c => c.Id > 0 && !existing.Contains(c.Id))
                    .Select(c => new
                    {
                        Company = c,
                        Score = StudentRecommendationScorer.ScoreCompany(c, ctx),
                        IsFollowing = followingCompanyIds.Contains(c.Id),
                    })
                    .OrderBy(x => x.IsFollowing)
                    .ThenByDescending(x => x.Score)
                    .ThenBy(x => x.Company.CompanyName, StringComparer.OrdinalIgnoreCase)
                    .Take(targetPool - companyItems.Count)
                    .ToList();

                foreach (var x in ranked)
                {
                    companyItems.Add(new FeedRecommendedItemDto
                    {
                        Id = $"company-{x.Company.Id}",
                        Type = "company",
                        EntityId = x.Company.Id,
                        Name = CompanySearchHelper.DisplayName(x.Company),
                        Subtitle = FormatCompanyCategory(x.Company),
                        AvatarUrl = null,
                        MatchScore = x.Score,
                        IsFollowing = x.IsFollowing,
                    });
                }
            }

            if (associationItems.Count < targetPool)
            {
                var existing = associationItems.Select(a => a.EntityId).ToHashSet();
                var orgs = await _db.StudentAssociationProfiles.AsNoTracking()
                    .OrderByDescending(a => a.Id)
                    .Take(CandidatePool)
                    .ToListAsync();

                var ranked = orgs
                    .Where(o => o.Id > 0 && !existing.Contains(o.Id))
                    .Select(o => new
                    {
                        Org = o,
                        Score = StudentRecommendationScorer.ScoreAssociation(o, ctx),
                        IsFollowing = followingOrgIds.Contains(o.Id),
                    })
                    .OrderBy(x => x.IsFollowing)
                    .ThenByDescending(x => x.Score)
                    .ThenBy(x => x.Org.AssociationName, StringComparer.OrdinalIgnoreCase)
                    .Take(targetPool - associationItems.Count)
                    .ToList();

                foreach (var x in ranked)
                {
                    associationItems.Add(new FeedRecommendedItemDto
                    {
                        Id = $"association-{x.Org.Id}",
                        Type = "association",
                        EntityId = x.Org.Id,
                        Name = x.Org.AssociationName,
                        Subtitle = FormatAssociationCategory(x.Org),
                        AvatarUrl = x.Org.LogoUrl,
                        MatchScore = x.Score,
                        IsFollowing = x.IsFollowing,
                    });
                }
            }
        }

        /// <summary>Loads every company/association profile when scored pools are empty.</summary>
        private async Task GuaranteeOrganizationPoolsAsync(
            StudentProfile student,
            HashSet<int> followingCompanyIds,
            HashSet<int> followingOrgIds,
            List<FeedRecommendedItemDto> companyItems,
            List<FeedRecommendedItemDto> associationItems)
        {
            var ctx = await BuildMatchContextAsync(student);
            const int minHubScore = 48;

            if (companyItems.Count == 0)
            {
                var companies = await _db.CompanyProfiles.AsNoTracking()
                    .OrderByDescending(c => c.Id)
                    .Take(RankedPoolSize)
                    .ToListAsync();

                foreach (var c in companies.Where(c => c.Id > 0))
                {
                    var score = Math.Max(minHubScore, StudentRecommendationScorer.ScoreCompany(c, ctx));
                    companyItems.Add(new FeedRecommendedItemDto
                    {
                        Id = $"company-{c.Id}",
                        Type = "company",
                        EntityId = c.Id,
                        Name = CompanySearchHelper.DisplayName(c),
                        Subtitle = FormatCompanyCategory(c),
                        AvatarUrl = null,
                        MatchScore = score,
                        IsFollowing = followingCompanyIds.Contains(c.Id),
                    });
                }
            }

            if (associationItems.Count == 0)
            {
                var orgs = await _db.StudentAssociationProfiles.AsNoTracking()
                    .OrderByDescending(a => a.Id)
                    .Take(RankedPoolSize)
                    .ToListAsync();

                foreach (var o in orgs.Where(o => o.Id > 0))
                {
                    var score = Math.Max(minHubScore, StudentRecommendationScorer.ScoreAssociation(o, ctx));
                    associationItems.Add(new FeedRecommendedItemDto
                    {
                        Id = $"association-{o.Id}",
                        Type = "association",
                        EntityId = o.Id,
                        Name = o.AssociationName,
                        Subtitle = FormatAssociationCategory(o),
                        AvatarUrl = o.LogoUrl,
                        MatchScore = score,
                        IsFollowing = followingOrgIds.Contains(o.Id),
                    });
                }
            }
        }

        private async Task<StudentProfile?> LoadStudentAsync(int studentProfileId) =>
            await _db.StudentProfiles.AsNoTracking().FirstOrDefaultAsync(s => s.Id == studentProfileId);

        private async Task<StudentMatchContext> BuildMatchContextAsync(StudentProfile student)
        {
            var skillIds = SkillHelper.ParseIntList(student.TechnicalSkills)
                .Concat(SkillHelper.ParseIntList(student.Roles))
                .Distinct()
                .ToList();

            var skillNames = await ResolveSkillNamesAsync(skillIds);

            var linkedSkills = await _db.StudentSkills.AsNoTracking()
                .Where(ss => ss.StudentId == student.Id)
                .Join(_db.Skills.AsNoTracking(), ss => ss.SkillId, sk => sk.Id, (_, sk) => sk.Name)
                .ToListAsync();

            var allSkills = SkillHelper.NormalizeUniqueStrings(skillNames.Concat(linkedSkills));
            return StudentRecommendationScorer.BuildContext(student, allSkills);
        }

        private async Task<List<string>> ResolveSkillNamesAsync(List<int> skillIds)
        {
            if (skillIds.Count == 0) return new List<string>();
            return await _db.Skills.AsNoTracking()
                .Where(s => skillIds.Contains(s.Id))
                .Select(s => s.Name)
                .ToListAsync();
        }

        private async Task<HashSet<int>> LoadFollowingCompanyIdsAsync(int studentProfileId)
        {
            try
            {
                var ids = await _db.CompanyFollows.AsNoTracking()
                    .Where(f => f.StudentProfileId == studentProfileId)
                    .Select(f => f.CompanyProfileId)
                    .ToListAsync();
                return ids.ToHashSet();
            }
            catch
            {
                return new HashSet<int>();
            }
        }

        private async Task<HashSet<int>> LoadFollowingOrganizationIdsAsync(int studentProfileId)
        {
            var ids = await _db.OrganizationFollows.AsNoTracking()
                .Where(f => f.StudentProfileId == studentProfileId)
                .Select(f => f.OrganizationProfileId)
                .ToListAsync();
            return ids.ToHashSet();
        }

        /// <summary>CompanyMember and other internal accounts must never surface in recommendations.</summary>
        private async Task<HashSet<int>> LoadExcludedRecommendationUserIdsAsync()
        {
            var excluded = await _db.Users.AsNoTracking()
                .Where(u => u.Role == UserRoles.CompanyMember || u.Role == UserRoles.Admin)
                .Select(u => u.Id)
                .ToListAsync();

            var companyMemberIds = await _db.CompanyMembers.AsNoTracking()
                .Select(m => m.UserId)
                .ToListAsync();

            foreach (var id in companyMemberIds)
                excluded.Add(id);

            return excluded.ToHashSet();
        }

        private static string? FormatCompanyCategory(CompanyProfile company)
        {
            if (!string.IsNullOrWhiteSpace(company.Industry)) return company.Industry.Trim();
            if (!string.IsNullOrWhiteSpace(company.AreasOfInterest)) return company.AreasOfInterest.Trim();
            return "Company";
        }

        private static string? FormatAssociationCategory(StudentAssociationProfile org)
        {
            if (!string.IsNullOrWhiteSpace(org.Category)) return org.Category.Trim();
            if (!string.IsNullOrWhiteSpace(org.Faculty)) return org.Faculty.Trim();
            return "Student Association";
        }

        private static string FormatStudentSubtitle(StudentProfile profile)
        {
            var parts = new[] { profile.Major, profile.AcademicYear, profile.University }
                .Where(p => !string.IsNullOrWhiteSpace(p))
                .Select(p => p!.Trim())
                .ToList();
            return parts.Count > 0 ? string.Join(" · ", parts) : "Student";
        }

        private static string FormatDoctorSubtitle(DoctorProfile doctor)
        {
            if (!string.IsNullOrWhiteSpace(doctor.Department)) return doctor.Department.Trim();
            if (!string.IsNullOrWhiteSpace(doctor.Specialization)) return doctor.Specialization.Trim();
            if (!string.IsNullOrWhiteSpace(doctor.Faculty)) return doctor.Faculty.Trim();
            return "Academic Department";
        }

    }
}
