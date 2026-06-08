using GraduationProject.API.Models;
using Microsoft.EntityFrameworkCore;

namespace GraduationProject.API.Data.Seeding
{
    public sealed class ExpansionContext
    {
        public const string ExpansionMarkerEmail = "platform.expansion@skillswap.ps";

        public DateTime Now { get; } = DateTime.UtcNow;
        public Random Rng { get; } = new(20260609);

        public Dictionary<string, int> Counts { get; } = new(StringComparer.OrdinalIgnoreCase);
        public Dictionary<int, User> UserById { get; } = new();
        public HashSet<string> ExistingEmails { get; } = new(StringComparer.OrdinalIgnoreCase);

        public List<StudentProfile> Students { get; } = new();
        public List<DoctorProfile> Doctors { get; } = new();
        public List<CompanyProfile> Companies { get; } = new();
        public List<StudentAssociationProfile> Associations { get; } = new();
        public List<StudentProject> GraduationProjects { get; } = new();
        public List<Course> Courses { get; } = new();
        public List<CourseSection> CourseSections { get; } = new();
        public List<CourseProject> CourseProjects { get; } = new();
        public List<CourseTeam> CourseTeams { get; } = new();
        public List<CompanyRequest> CompanyRequests { get; } = new();
        public List<StudentOrganizationEvent> Events { get; } = new();
        public List<StudentOrganizationRecruitmentCampaign> RecruitmentCampaigns { get; } = new();
        public HashSet<int> ProjectOwnerIds { get; } = new();
        public HashSet<int> CompaniesWithDraft { get; } = new();
        public HashSet<(int OrgId, int StudentId)> ExistingOrgFollows { get; } = new();
        public HashSet<(int CompanyId, int StudentId)> ExistingCompanyFollows { get; } = new();
        public HashSet<(int OrgId, int StudentId)> ExistingOrgMembers { get; } = new();
        public HashSet<(int OrgId, int StudentId)> ExistingTeamMembers { get; } = new();
        public HashSet<(int UserId, string PostKey, string Type)> ExistingFeedEngagements { get; } = new();

        public static async Task<ExpansionContext> LoadAsync(ApplicationDbContext db)
        {
            var ctx = new ExpansionContext();

            foreach (var email in await db.Users.AsNoTracking().Select(u => u.Email).ToListAsync())
                ctx.ExistingEmails.Add(email);

            foreach (var user in await db.Users.AsNoTracking().ToListAsync())
                ctx.UserById[user.Id] = user;

            ctx.Students.AddRange(await db.StudentProfiles.AsNoTracking().ToListAsync());
            ctx.Doctors.AddRange(await db.DoctorProfiles.AsNoTracking().ToListAsync());
            ctx.Companies.AddRange(await db.CompanyProfiles.AsNoTracking().ToListAsync());
            ctx.Associations.AddRange(await db.StudentAssociationProfiles.AsNoTracking().ToListAsync());
            ctx.GraduationProjects.AddRange(await db.StudentProjects.AsNoTracking().ToListAsync());
            ctx.Courses.AddRange(await db.Courses.AsNoTracking().ToListAsync());
            ctx.CourseSections.AddRange(await db.CourseSections.AsNoTracking().ToListAsync());
            ctx.CourseProjects.AddRange(await db.CourseProjects.AsNoTracking().ToListAsync());
            ctx.CourseTeams.AddRange(await db.CourseTeams.AsNoTracking().ToListAsync());
            ctx.CompanyRequests.AddRange(await db.CompanyRequests.AsNoTracking().ToListAsync());
            ctx.Events.AddRange(await db.StudentOrganizationEvents.AsNoTracking().ToListAsync());
            ctx.RecruitmentCampaigns.AddRange(await db.StudentOrganizationRecruitmentCampaigns.AsNoTracking().ToListAsync());

            foreach (var p in ctx.GraduationProjects)
                ctx.ProjectOwnerIds.Add(p.OwnerId);

            foreach (var r in ctx.CompanyRequests.Where(r => r.Status == CompanyRequestStatus.Draft))
                ctx.CompaniesWithDraft.Add(r.CompanyProfileId);

            foreach (var f in await db.OrganizationFollows.AsNoTracking()
                .Select(f => new { f.OrganizationProfileId, f.StudentProfileId }).ToListAsync())
                ctx.ExistingOrgFollows.Add((f.OrganizationProfileId, f.StudentProfileId));

            foreach (var f in await db.CompanyFollows.AsNoTracking()
                .Select(f => new { f.CompanyProfileId, f.StudentProfileId }).ToListAsync())
                ctx.ExistingCompanyFollows.Add((f.CompanyProfileId, f.StudentProfileId));

            foreach (var m in await db.StudentOrganizationMembers.AsNoTracking()
                .Select(m => new { m.OrganizationProfileId, m.StudentProfileId }).ToListAsync())
                ctx.ExistingOrgMembers.Add((m.OrganizationProfileId, m.StudentProfileId));

            foreach (var t in await db.StudentOrganizationTeamMembers.AsNoTracking()
                .Where(t => t.StudentProfileId != null)
                .Select(t => new { t.OrganizationProfileId, StudentId = t.StudentProfileId!.Value }).ToListAsync())
                ctx.ExistingTeamMembers.Add((t.OrganizationProfileId, t.StudentId));

            foreach (var e in await db.FeedPostEngagements.AsNoTracking()
                .Select(e => new { e.UserId, e.PostKey, e.EngagementType }).ToListAsync())
                ctx.ExistingFeedEngagements.Add((e.UserId, e.PostKey, e.EngagementType));

            return ctx;
        }

        public void TrackUser(User user)
        {
            UserById[user.Id] = user;
            ExistingEmails.Add(user.Email);
        }

        public User GetUser(int userId) => UserById[userId];

        public void Increment(string table, int by = 1)
        {
            Counts.TryGetValue(table, out var current);
            Counts[table] = current + by;
        }

        public T Pick<T>(IReadOnlyList<T> items) => items[Rng.Next(items.Count)];

        public IEnumerable<T> PickMany<T>(IReadOnlyList<T> items, int count)
        {
            var copy = items.ToList();
            for (var i = 0; i < count && copy.Count > 0; i++)
            {
                var idx = Rng.Next(copy.Count);
                yield return copy[idx];
                copy.RemoveAt(idx);
            }
        }

        public DateTime DaysAgo(int days) => Now.AddDays(-days);
        public DateTime DaysFromNow(int days) => Now.AddDays(days);
        public DateTime HoursAgo(int hours) => Now.AddHours(-hours);

        public string UniqueEmail(string local, string domain)
        {
            var email = $"{local}@{domain}".ToLower();
            var n = 1;
            while (!ExistingEmails.Add(email))
            {
                email = $"{local}{n}@{domain}".ToLower();
                n++;
            }
            return email;
        }

        public List<StudentProfile> StudentsWithoutProjects() =>
            Students.Where(s => !ProjectOwnerIds.Contains(s.Id)).ToList();
    }
}
