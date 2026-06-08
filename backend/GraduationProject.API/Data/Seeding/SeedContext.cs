using GraduationProject.API.Models;

namespace GraduationProject.API.Data.Seeding
{
    public sealed class SeedContext
    {
        public const string DefaultPassword = "SkillSwap2026!";
        public const string SeedMarkerEmail = "platform.seed@skillswap.ps";

        public DateTime Now { get; } = DateTime.UtcNow;
        public Random Rng { get; } = new(20260608);

        public Dictionary<string, int> Counts { get; } = new(StringComparer.OrdinalIgnoreCase);

        public List<User> Users { get; } = new();
        public List<StudentProfile> Students { get; } = new();
        public List<DoctorProfile> Doctors { get; } = new();
        public List<CompanyProfile> Companies { get; } = new();
        public List<StudentAssociationProfile> Associations { get; } = new();
        public List<Skill> Skills { get; } = new();
        public List<StudentProject> GraduationProjects { get; } = new();
        public List<Course> Courses { get; } = new();
        public List<CourseSection> CourseSections { get; } = new();
        public List<CourseProject> CourseProjects { get; } = new();
        public List<CourseTeam> CourseTeams { get; } = new();
        public List<CompanyRequest> CompanyRequests { get; } = new();
        public List<StudentOrganizationEvent> Events { get; } = new();
        public List<StudentOrganizationRecruitmentCampaign> RecruitmentCampaigns { get; } = new();
        public List<Conversation> Conversations { get; } = new();
        public Dictionary<int, User> UserById { get; } = new();

        public User GetUser(int userId) => UserById[userId];

        public void TrackUser(User user) => UserById[user.Id] = user;

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
    }
}
