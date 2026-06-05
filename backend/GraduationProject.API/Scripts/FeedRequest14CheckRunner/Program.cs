using GraduationProject.API.Data;
using GraduationProject.API.Helpers;
using GraduationProject.API.Models;
using GraduationProject.API.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

const int requestId = 14;

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
var feed = sp.GetRequiredService<IFeedService>();

var row = await db.CompanyRequests.AsNoTracking()
    .Include(r => r.CompanyProfile)
    .FirstOrDefaultAsync(r => r.Id == requestId);

Console.WriteLine("=== Company Request 14 ===");
if (row == null)
{
    Console.WriteLine("NOT FOUND in database.");
}
else
{
    Console.WriteLine($"id:                 {row.Id}");
    Console.WriteLine($"title:              {row.Title}");
    Console.WriteLine($"company_profile_id: {row.CompanyProfileId}");
    Console.WriteLine($"company_name:       {row.CompanyProfile?.CompanyName}");
    Console.WriteLine($"status:             {row.Status}");
    Console.WriteLine($"request_status:     {row.RequestStatus}");
    Console.WriteLine($"is_published_to_hub:{row.IsPublishedToHub}");
    Console.WriteLine($"published_to_hub_at:{row.PublishedToHubAt:O}");
    Console.WriteLine($"submitted_at:       {row.SubmittedAt:O}");
    Console.WriteLine($"LoadCompanyOpportunityPosts query match: " +
        $"{row.Status == CompanyRequestStatus.Submitted && row.RequestStatus == CompanyRequestLifecycleStatus.Active && row.IsPublishedToHub}");
    Console.WriteLine($"IsVisibleInCommunicationHub: {CompanyRequestHubVisibility.IsVisibleInCommunicationHub(row)}");
}

var studentUserId = await db.Users.AsNoTracking()
    .Where(u => u.Role == "student")
    .OrderByDescending(u => u.Id)
    .Select(u => u.Id)
    .FirstOrDefaultAsync();

if (studentUserId <= 0)
{
    Console.WriteLine("No student user for feed test.");
    return 1;
}

var result = await feed.GetFeedAsync(studentUserId, "student");
var companyItems = result.Items
    .Where(i => i.RelatedEntityType == FeedPostSourceTypes.CompanyOpportunity)
    .ToList();

Console.WriteLine();
Console.WriteLine($"=== Feed API (student userId={studentUserId}) ===");
Console.WriteLine($"Total items: {result.Items.Count}");
Console.WriteLine($"Company opportunity items: {companyItems.Count}");
foreach (var item in companyItems.Take(10))
    Console.WriteLine($"  - {item.Id} | {item.Title} | requestId={item.CompanyRequestId}");

var req14InFeed = result.Items.Any(i =>
    i.RelatedEntityType == FeedPostSourceTypes.CompanyOpportunity && i.CompanyRequestId == requestId);
Console.WriteLine($"Request 14 in feed: {req14InFeed}");

return 0;
