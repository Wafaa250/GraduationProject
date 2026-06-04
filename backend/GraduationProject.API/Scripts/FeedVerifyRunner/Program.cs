using GraduationProject.API.Data;
using GraduationProject.API.Helpers;
using GraduationProject.API.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;

var apiRoot = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", ".."));
var config = new ConfigurationBuilder()
    .SetBasePath(apiRoot)
    .AddJsonFile("appsettings.json", optional: false)
    .AddJsonFile("appsettings.Development.json", optional: true)
    .Build();

var services = new ServiceCollection();
services.AddLogging(b => b.AddConsole().SetMinimumLevel(LogLevel.Warning));
services.AddDbContext<ApplicationDbContext>(o =>
    o.UseNpgsql(config.GetConnectionString("DefaultConnection")));
services.AddScoped<IFeedService, FeedService>();
services.AddScoped<IStudentRecommendationService, StudentRecommendationService>();

await using var sp = services.BuildServiceProvider();

var db = sp.GetRequiredService<ApplicationDbContext>();
Console.WriteLine("=== DATABASE COUNTS (feed source tables) ===");
await PrintDbCountsAsync(db);

var feed = sp.GetRequiredService<IFeedService>();
var studentUserId = await db.Users.AsNoTracking()
    .Where(u => u.Role == "student")
    .OrderByDescending(u => u.Id)
    .Select(u => u.Id)
    .FirstOrDefaultAsync();

if (studentUserId <= 0)
{
    Console.WriteLine("No student user in database.");
    return 1;
}

Console.WriteLine($"\n=== FEED SERVICE (current code, userId={studentUserId}) ===");
var result = await feed.GetFeedAsync(studentUserId, "student", search: null);
var items = result.Items;

Console.WriteLine($"Total items returned: {items.Count}");

var byPublisher = items.GroupBy(i => i.SourceType)
    .OrderBy(g => g.Key)
    .Select(g => (g.Key, g.Count()))
    .ToList();
var byRelated = items.GroupBy(i => i.RelatedEntityType)
    .OrderBy(g => g.Key)
    .Select(g => (g.Key, g.Count()))
    .ToList();

Console.WriteLine("\nBy publisher role (sourceType):");
foreach (var kv in byPublisher)
    Console.WriteLine($"  {kv.Key}: {kv.Item2}");

Console.WriteLine("\nBy post kind (relatedEntityType):");
foreach (var kv in byRelated)
    Console.WriteLine($"  {kv.Key}: {kv.Item2}");

var relatedMap = byRelated.ToDictionary(x => x.Key, x => x.Item2);
var associationTypes = new[]
{
    FeedPostSourceTypes.AssociationEvent,
    FeedPostSourceTypes.AssociationRecruitment,
    FeedPostSourceTypes.AssociationRecruitmentPosition,
};
Console.WriteLine("\nAssociation content in feed (from existing org modules, no feed tables):");
foreach (var t in associationTypes)
    Console.WriteLine($"  {t}: {(relatedMap.TryGetValue(t, out var c) ? c : 0)}");

var doctorTypes = new[]
{
    FeedPostSourceTypes.DoctorCourseProject,
    FeedPostSourceTypes.DoctorProject,
    FeedPostSourceTypes.DoctorAnnouncement,
};
Console.WriteLine("\nAuto-generated doctor posts (should be 0 until explicit doctor publishing):");
foreach (var t in doctorTypes)
    Console.WriteLine($"  {t}: {(relatedMap.TryGetValue(t, out var c) ? c : 0)}");

var eventPosts = items.Where(i => i.RelatedEntityType == FeedPostSourceTypes.AssociationEvent).Take(3).ToList();
var recruitmentPosts = items
    .Where(i => i.RelatedEntityType == FeedPostSourceTypes.AssociationRecruitment)
    .Take(3)
    .ToList();

Console.WriteLine("\nSample association events (View Event → /association/events/{id}?orgId=…):");
foreach (var e in eventPosts)
{
    Console.WriteLine(
        $"  {e.Title} | eventId={e.EventId} orgId={e.OrganizationProfileId} | CTA={e.ActionText} | {e.ActionUrl}");
}

Console.WriteLine("\nSample recruitment campaigns (Apply Now → /association/recruitment/{id}?orgId=…):");
foreach (var r in recruitmentPosts)
{
    Console.WriteLine(
        $"  {r.Title} | campaignId={r.RecruitmentCampaignId} orgId={r.OrganizationProfileId} | CTA={r.ActionText} | {r.ActionUrl}");
}

var keys = items.Select(i => i.Id).ToList();
var dupKeys = keys.GroupBy(k => k).Where(g => g.Count() > 1).Select(g => g.Key).ToList();
Console.WriteLine($"\nDuplicate post keys: {dupKeys.Count}");
if (dupKeys.Count > 0)
    Console.WriteLine("  " + string.Join(", ", dupKeys.Take(10)));

Console.WriteLine("\nPostKey format samples (first 12):");
foreach (var item in items.Take(12))
{
    var parsed = FeedPostKeyHelper.TryParse(item.Id, out var src, out var eid);
    Console.WriteLine($"  {item.Id} | parsed={parsed} | publisher={item.SourceType}");
}

return 0;

static async Task PrintDbCountsAsync(ApplicationDbContext db)
{
    var events = await db.StudentOrganizationEvents.CountAsync();
    var campaignsPublished = await db.StudentOrganizationRecruitmentCampaigns.CountAsync(c => c.IsPublished);
    var campaignsDraft = await db.StudentOrganizationRecruitmentCampaigns.CountAsync(c => !c.IsPublished);
    var positions = await db.StudentOrganizationRecruitmentPositions.CountAsync(p =>
        db.StudentOrganizationRecruitmentCampaigns.Any(c =>
            c.Id == p.CampaignId && c.IsPublished));
    var companyRequests = await db.CompanyRequests.CountAsync();
    var talentRequests = await db.CompanyTalentRequests.CountAsync();
    var courseProjects = await db.CourseProjects.CountAsync();

    Console.WriteLine($"  student_organization_events (Association → Events): {events}");
    Console.WriteLine($"  recruitment_campaigns published (Leadership Applications): {campaignsPublished}");
    Console.WriteLine($"  recruitment_campaigns unpublished (excluded from feed): {campaignsDraft}");
    Console.WriteLine($"  recruitment_positions (published campaigns): {positions}");
    Console.WriteLine($"  company_requests: {companyRequests}");
    Console.WriteLine($"  company_talent_requests: {talentRequests}");
    Console.WriteLine($"  course_projects: {courseProjects}");
}
