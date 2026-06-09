using GraduationProject.API.Data;
using GraduationProject.API.Helpers;
using GraduationProject.API.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

var apiRoot = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", ".."));
var config = new ConfigurationBuilder().SetBasePath(apiRoot).AddJsonFile("appsettings.json").Build();
var services = new ServiceCollection();
services.AddDbContext<ApplicationDbContext>(o => o.UseNpgsql(config.GetConnectionString("DefaultConnection")));
services.AddScoped<IFeedService, FeedService>();
await using var sp = services.BuildServiceProvider();
var db = sp.GetRequiredService<ApplicationDbContext>();
var feed = sp.GetRequiredService<IFeedService>();

var ieee = await db.StudentOrganizationProfiles.AsNoTracking()
    .Where(o => o.AssociationName.Contains("IEEE An-Najah"))
    .Select(o => new { o.Id, o.AssociationName })
    .FirstOrDefaultAsync();

if (ieee == null) { Console.WriteLine("IEEE org not found"); return; }
Console.WriteLine($"Org: {ieee.AssociationName} (id={ieee.Id})");

var campaigns = await db.StudentOrganizationRecruitmentCampaigns.AsNoTracking()
    .Where(c => c.OrganizationProfileId == ieee.Id)
    .OrderByDescending(c => c.IsPublished).ThenBy(c => c.Id)
    .Select(c => new { c.Id, c.Title, c.IsPublished, c.CreatedAt, c.UpdatedAt })
    .ToListAsync();

Console.WriteLine("\nCampaigns:");
foreach (var c in campaigns)
    Console.WriteLine($"  [{c.Id}] published={c.IsPublished} | {c.Title} | updated={c.UpdatedAt:yyyy-MM-dd}");

var result = await feed.GetFeedAsync(702, "student");
var feedIds = result.Items
    .Where(i => i.OrganizationProfileId == ieee.Id)
    .Select(i => new { i.Title, i.RelatedEntityType, i.RecruitmentCampaignId, i.PositionId })
    .ToList();

Console.WriteLine($"\nIEEE items IN feed: {feedIds.Count}");
foreach (var i in feedIds)
    Console.WriteLine($"  {i.RelatedEntityType} | campaign={i.RecruitmentCampaignId} pos={i.PositionId} | {i.Title}");

var publishedIds = campaigns.Where(c => c.IsPublished).Select(c => c.Id).ToHashSet();
var inFeedCampaignIds = result.Items
    .Where(i => i.RecruitmentCampaignId.HasValue && publishedIds.Contains(i.RecruitmentCampaignId.Value))
    .Select(i => i.RecruitmentCampaignId!.Value).Distinct().ToHashSet();

var missing = campaigns.Where(c => c.IsPublished && !inFeedCampaignIds.Contains(c.Id)).ToList();
Console.WriteLine($"\nPublished but NOT in feed ({missing.Count}):");
foreach (var c in missing)
    Console.WriteLine($"  [{c.Id}] {c.Title}");
