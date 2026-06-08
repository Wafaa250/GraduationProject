using GraduationProject.API.Helpers;
using GraduationProject.API.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace GraduationProject.API.Data.Seeding
{
    public sealed class AnNajahNormalizationService
    {
        private readonly ApplicationDbContext _db;
        private readonly ILogger<AnNajahNormalizationService> _logger;

        public AnNajahNormalizationService(ApplicationDbContext db, ILogger<AnNajahNormalizationService> logger)
        {
            _db = db;
            _logger = logger;
        }

        public async Task<AnNajahNormalizationResult> NormalizeAsync(CancellationToken cancellationToken = default)
        {
            var started = DateTime.UtcNow;
            var metrics = new AnNajahNormalizationResult();
            await using var tx = await _db.Database.BeginTransactionAsync(cancellationToken);

            try
            {
                var reservedEmails = (await _db.Users.AsNoTracking()
                    .Select(u => u.Email.ToLower())
                    .ToListAsync(cancellationToken))
                    .ToHashSet(StringComparer.OrdinalIgnoreCase);

                await NormalizeStudentDoctorEmailsAsync(metrics, reservedEmails, cancellationToken);
                await NormalizeStudentProfilesAsync(metrics, cancellationToken);
                await NormalizeDoctorProfilesAsync(metrics, cancellationToken);
                await NormalizeAssociationsAsync(metrics, reservedEmails, cancellationToken);
                await NormalizeTextEntitiesAsync(metrics, cancellationToken);

                await _db.SaveChangesAsync(cancellationToken);
                await tx.CommitAsync(cancellationToken);

                await PopulateRecordCountsAsync(metrics, cancellationToken);
                metrics.Success = true;
                metrics.Duration = DateTime.UtcNow - started;
                return metrics;
            }
            catch (Exception ex)
            {
                await tx.RollbackAsync(cancellationToken);
                _logger.LogError(ex, "An-Najah normalization failed");
                return new AnNajahNormalizationResult
                {
                    Success = false,
                    Error = ex.Message,
                    Duration = DateTime.UtcNow - started,
                };
            }
        }

        private async Task NormalizeStudentDoctorEmailsAsync(
            AnNajahNormalizationResult result,
            HashSet<string> reservedEmails,
            CancellationToken cancellationToken)
        {
            var users = await _db.Users
                .Where(u => u.Role == UserRoles.Student || u.Role == UserRoles.Doctor)
                .ToListAsync(cancellationToken);

            foreach (var user in users)
            {
                if (!SeedHelpers.IsLegacyUniversityEmail(user.Email) &&
                    !user.Email.EndsWith($"@{NajahSeedConstants.StudentDoctorEmailDomain}", StringComparison.OrdinalIgnoreCase))
                    continue;

                var local = user.Email.Contains('@')
                    ? user.Email[..user.Email.LastIndexOf('@')]
                    : user.Email;
                var candidate = SeedHelpers.ToGmailAddress(local);
                var suffix = 1;
                while (reservedEmails.Contains(candidate) &&
                       !string.Equals(candidate, user.Email, StringComparison.OrdinalIgnoreCase))
                {
                    candidate = SeedHelpers.ToGmailAddress($"{local}{suffix}");
                    suffix++;
                }

                if (string.Equals(candidate, user.Email, StringComparison.OrdinalIgnoreCase))
                    continue;

                reservedEmails.Remove(user.Email);
                reservedEmails.Add(candidate);
                user.Email = candidate;

                if (user.Role == UserRoles.Student)
                    result.StudentEmailsUpdated++;
                else
                    result.DoctorEmailsUpdated++;

                Bump(result, "users");
            }
        }

        private async Task NormalizeStudentProfilesAsync(AnNajahNormalizationResult result, CancellationToken cancellationToken)
        {
            foreach (var profile in await _db.StudentProfiles.ToListAsync(cancellationToken))
            {
                var changed = false;
                if (!string.Equals(profile.University, NajahSeedConstants.UniversityName, StringComparison.Ordinal))
                {
                    profile.University = NajahSeedConstants.UniversityName;
                    changed = true;
                }
                if (!string.Equals(profile.Faculty, NajahSeedConstants.UniversityFaculty, StringComparison.Ordinal))
                {
                    profile.Faculty = NajahSeedConstants.UniversityFaculty;
                    changed = true;
                }
                if (TryNormalizeText(profile.Bio, out var bio, out var refs))
                {
                    profile.Bio = bio;
                    result.UniversityReferencesRemoved += refs;
                    changed = true;
                }
                if (changed) Bump(result, "student_profiles");
            }
        }

        private async Task NormalizeDoctorProfilesAsync(AnNajahNormalizationResult result, CancellationToken cancellationToken)
        {
            foreach (var profile in await _db.DoctorProfiles.ToListAsync(cancellationToken))
            {
                var changed = false;
                if (!string.Equals(profile.University, NajahSeedConstants.UniversityName, StringComparison.Ordinal))
                {
                    profile.University = NajahSeedConstants.UniversityName;
                    changed = true;
                }
                if (!string.Equals(profile.Faculty, NajahSeedConstants.UniversityFaculty, StringComparison.Ordinal))
                {
                    profile.Faculty = NajahSeedConstants.UniversityFaculty;
                    changed = true;
                }
                if (TryNormalizeText(profile.Bio, out var bio, out var refs))
                {
                    profile.Bio = bio;
                    result.UniversityReferencesRemoved += refs;
                    changed = true;
                }
                if (changed) Bump(result, "doctor_profiles");
            }
        }

        private async Task NormalizeAssociationsAsync(
            AnNajahNormalizationResult result,
            HashSet<string> reservedEmails,
            CancellationToken cancellationToken)
        {
            var profiles = await _db.StudentAssociationProfiles
                .Include(p => p.User)
                .ToListAsync(cancellationToken);

            var replacementByUsername = NajahSeedConstants.AssociationReplacements
                .GroupBy(r => r.OldUsername, StringComparer.OrdinalIgnoreCase)
                .ToDictionary(g => g.Key, g => g.First(), StringComparer.OrdinalIgnoreCase);

            foreach (var profile in profiles)
            {
                if (!replacementByUsername.TryGetValue(profile.Username, out var replacement))
                {
                    if (ContainsOtherUniversity(profile.AssociationName) ||
                        ContainsOtherUniversity(profile.Description))
                    {
                        if (TryNormalizeText(profile.AssociationName, out var name, out var nameRefs))
                        {
                            profile.AssociationName = name;
                            result.UniversityReferencesRemoved += nameRefs;
                        }
                        if (TryNormalizeText(profile.Description, out var desc, out var descRefs))
                        {
                            profile.Description = desc;
                            result.UniversityReferencesRemoved += descRefs;
                        }
                        if (profile.User != null)
                            profile.User.Name = profile.AssociationName;
                        Bump(result, "student_association_profiles");
                    }
                    continue;
                }

                var oldName = profile.AssociationName;
                profile.AssociationName = replacement.NewName;
                profile.Username = replacement.NewUsername;
                profile.Description = replacement.Description;
                profile.Faculty = NajahSeedConstants.UniversityFaculty;

                var newEmail = $"{replacement.NewUsername}@orgs.skillswap.ps";
                if (!string.Equals(profile.Email, newEmail, StringComparison.OrdinalIgnoreCase))
                {
                    if (reservedEmails.Contains(newEmail) &&
                        !string.Equals(profile.Email, newEmail, StringComparison.OrdinalIgnoreCase))
                        newEmail = $"exp.{replacement.NewUsername}@orgs.skillswap.ps";

                    reservedEmails.Remove(profile.Email);
                    reservedEmails.Add(newEmail);
                    profile.Email = newEmail;
                    if (profile.User != null)
                    {
                        profile.User.Email = newEmail;
                        profile.User.Name = replacement.NewName;
                        Bump(result, "users");
                    }
                }
                else if (profile.User != null)
                {
                    profile.User.Name = replacement.NewName;
                    Bump(result, "users");
                }

                result.AssociationNamesReplaced.Add($"{oldName} -> {replacement.NewName}");
                Bump(result, "student_association_profiles");
            }
        }

        private async Task NormalizeTextEntitiesAsync(AnNajahNormalizationResult result, CancellationToken cancellationToken)
        {
            foreach (var company in await _db.CompanyProfiles.ToListAsync(cancellationToken))
            {
                if (TryNormalizeText(company.Description, out var desc, out var refs))
                {
                    company.Description = desc;
                    result.UniversityReferencesRemoved += refs;
                    Bump(result, "company_profiles");
                }
            }

            foreach (var project in await _db.StudentProjects.ToListAsync(cancellationToken))
            {
                var changed = false;
                if (TryNormalizeText(project.Name, out var name, out var nameRefs))
                {
                    project.Name = name;
                    result.UniversityReferencesRemoved += nameRefs;
                    changed = true;
                }
                if (TryNormalizeText(project.Abstract, out var abs, out var absRefs))
                {
                    project.Abstract = abs;
                    result.UniversityReferencesRemoved += absRefs;
                    changed = true;
                }
                if (changed) Bump(result, "graduation_projects");
            }

            foreach (var post in await _db.StudentPosts.ToListAsync(cancellationToken))
            {
                if (TryNormalizeText(post.Content, out var content, out var refs))
                {
                    post.Content = content;
                    result.UniversityReferencesRemoved += refs;
                    Bump(result, "student_posts");
                }
            }

            foreach (var post in await _db.DoctorPosts.ToListAsync(cancellationToken))
            {
                if (TryNormalizeText(post.Content, out var content, out var refs))
                {
                    post.Content = content;
                    result.UniversityReferencesRemoved += refs;
                    Bump(result, "doctor_posts");
                }
            }

            foreach (var message in await _db.Messages.ToListAsync(cancellationToken))
            {
                if (TryNormalizeText(message.Text, out var text, out var refs))
                {
                    message.Text = text;
                    result.UniversityReferencesRemoved += refs;
                    Bump(result, "messages");
                }
            }

            foreach (var notification in await _db.UserNotifications.ToListAsync(cancellationToken))
            {
                var changed = false;
                if (TryNormalizeText(notification.Title, out var title, out var titleRefs))
                {
                    notification.Title = title;
                    result.UniversityReferencesRemoved += titleRefs;
                    changed = true;
                }
                if (TryNormalizeText(notification.Body, out var body, out var bodyRefs))
                {
                    notification.Body = body;
                    result.UniversityReferencesRemoved += bodyRefs;
                    changed = true;
                }
                if (changed) Bump(result, "user_notifications");
            }

            foreach (var evt in await _db.StudentOrganizationEvents.ToListAsync(cancellationToken))
            {
                var changed = false;
                if (TryNormalizeText(evt.Title, out var title, out var titleRefs))
                {
                    evt.Title = title;
                    result.UniversityReferencesRemoved += titleRefs;
                    changed = true;
                }
                if (TryNormalizeText(evt.Description, out var desc, out var descRefs))
                {
                    evt.Description = desc;
                    result.UniversityReferencesRemoved += descRefs;
                    changed = true;
                }
                if (changed) Bump(result, "student_organization_events");
            }

            foreach (var campaign in await _db.StudentOrganizationRecruitmentCampaigns.ToListAsync(cancellationToken))
            {
                var changed = false;
                if (TryNormalizeText(campaign.Title, out var title, out var titleRefs))
                {
                    campaign.Title = title;
                    result.UniversityReferencesRemoved += titleRefs;
                    changed = true;
                }
                if (TryNormalizeText(campaign.Description, out var desc, out var descRefs))
                {
                    campaign.Description = desc;
                    result.UniversityReferencesRemoved += descRefs;
                    changed = true;
                }
                if (changed) Bump(result, "student_organization_recruitment_campaigns");
            }

            foreach (var request in await _db.CompanyRequests.ToListAsync(cancellationToken))
            {
                if (TryNormalizeText(request.Description, out var desc, out var refs))
                {
                    request.Description = desc;
                    result.UniversityReferencesRemoved += refs;
                    Bump(result, "company_requests");
                }
            }

            foreach (var rec in await _db.CompanyRequestRecommendations.ToListAsync(cancellationToken))
            {
                if (TryNormalizeText(rec.ReasonSummary, out var rationale, out var refs))
                {
                    rec.ReasonSummary = rationale;
                    result.UniversityReferencesRemoved += refs;
                    Bump(result, "company_request_recommendations");
                }
            }

            foreach (var comment in await _db.FeedPostComments.ToListAsync(cancellationToken))
            {
                if (TryNormalizeText(comment.Content, out var content, out var refs))
                {
                    comment.Content = content;
                    result.UniversityReferencesRemoved += refs;
                    Bump(result, "feed_post_comments");
                }
            }
        }

        private async Task PopulateRecordCountsAsync(AnNajahNormalizationResult result, CancellationToken cancellationToken)
        {
            result.RecordCounts["users"] = await _db.Users.CountAsync(cancellationToken);
            result.RecordCounts["student_profiles"] = await _db.StudentProfiles.CountAsync(cancellationToken);
            result.RecordCounts["doctor_profiles"] = await _db.DoctorProfiles.CountAsync(cancellationToken);
            result.RecordCounts["company_profiles"] = await _db.CompanyProfiles.CountAsync(cancellationToken);
            result.RecordCounts["student_association_profiles"] = await _db.StudentAssociationProfiles.CountAsync(cancellationToken);
            result.RecordCounts["graduation_projects"] = await _db.StudentProjects.CountAsync(cancellationToken);
            result.RecordCounts["student_posts"] = await _db.StudentPosts.CountAsync(cancellationToken);
            result.RecordCounts["doctor_posts"] = await _db.DoctorPosts.CountAsync(cancellationToken);
            result.RecordCounts["messages"] = await _db.Messages.CountAsync(cancellationToken);
            result.RecordCounts["user_notifications"] = await _db.UserNotifications.CountAsync(cancellationToken);
            result.RecordCounts["student_organization_events"] = await _db.StudentOrganizationEvents.CountAsync(cancellationToken);
            result.RecordCounts["student_organization_recruitment_campaigns"] =
                await _db.StudentOrganizationRecruitmentCampaigns.CountAsync(cancellationToken);
            result.RecordCounts["company_requests"] = await _db.CompanyRequests.CountAsync(cancellationToken);
            result.RecordCounts["organization_follows"] = await _db.OrganizationFollows.CountAsync(cancellationToken);
            result.RecordCounts["company_follows"] = await _db.CompanyFollows.CountAsync(cancellationToken);
            result.RecordCounts["conversations"] = await _db.Conversations.CountAsync(cancellationToken);
        }

        private static bool TryNormalizeText(string? input, out string output, out int refsRemoved)
        {
            output = input ?? string.Empty;
            refsRemoved = CountOtherUniversityReferences(output);
            var normalized = SeedHelpers.ReplaceUniversityReferences(output);
            if (string.Equals(normalized, output, StringComparison.Ordinal))
                return refsRemoved > 0;
            output = normalized;
            return true;
        }

        private static bool ContainsOtherUniversity(string? text) =>
            CountOtherUniversityReferences(text ?? string.Empty) > 0;

        private static int CountOtherUniversityReferences(string text)
        {
            if (string.IsNullOrWhiteSpace(text)) return 0;
            var count = 0;
            foreach (var name in NajahSeedConstants.OtherUniversityNames)
                count += CountOccurrences(text, name);
            foreach (var domain in NajahSeedConstants.LegacyUniversityDomains)
                count += CountOccurrences(text, domain);
            return count;
        }

        private static int CountOccurrences(string text, string value) =>
            string.IsNullOrEmpty(value) ? 0 :
            text.Split(value, StringSplitOptions.None).Length - 1;

        private static void Bump(AnNajahNormalizationResult result, string table)
        {
            result.TableUpdates.TryGetValue(table, out var current);
            result.TableUpdates[table] = current + 1;
        }
    }
}
