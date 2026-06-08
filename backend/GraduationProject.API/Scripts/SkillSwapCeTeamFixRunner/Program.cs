using GraduationProject.API.Data;
using GraduationProject.API.Data.Seeding;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

var apiRoot = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", ".."));
var config = new ConfigurationBuilder()
    .SetBasePath(apiRoot)
    .AddJsonFile("appsettings.json", optional: false)
    .AddJsonFile("appsettings.Development.json", optional: true)
    .Build();

var services = new ServiceCollection();
services.AddLogging(b => b.AddConsole().SetMinimumLevel(LogLevel.Information));
services.AddDbContext<ApplicationDbContext>(o =>
    o.UseNpgsql(config.GetConnectionString("DefaultConnection")));
services.AddScoped<ComputerEngineeringTeamSizeFix>();

await using var sp = services.BuildServiceProvider();
var fixer = sp.GetRequiredService<ComputerEngineeringTeamSizeFix>();

Console.WriteLine("Computer Engineering Graduation Team Size Fix");
Console.WriteLine("============================================");
Console.WriteLine();

var result = await fixer.FixAsync();
if (!result.Success)
{
    Console.Error.WriteLine($"Fix failed: {result.Error}");
    return 1;
}

Console.WriteLine($"Completed in {result.Duration.TotalSeconds:F1}s");
Console.WriteLine($"Computer Engineering projects updated: {result.ProjectsUpdated}");
Console.WriteLine();

if (result.ResizedProjects.Count > 0)
{
    Console.WriteLine("Projects resized:");
    foreach (var line in result.ResizedProjects)
        Console.WriteLine($"  {line}");
    Console.WriteLine();
}

Console.WriteLine("Final CE team size distribution:");
foreach (var (size, count) in result.TeamSizeDistribution.OrderBy(kv => kv.Key))
    Console.WriteLine($"  {size} members: {count} projects");

await using var scope = sp.CreateAsyncScope();
var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
var ceOwnerIds = await db.StudentProfiles
    .Where(s => s.Major == ComputerEngineeringTeamSizeFix.TargetMajor)
    .Select(s => s.Id)
    .ToListAsync();

var invalid = await db.StudentProjects
    .Where(p => ceOwnerIds.Contains(p.OwnerId))
    .Select(p => new
    {
        p.Id,
        MemberCount = db.StudentProjectMembers.Count(m => m.ProjectId == p.Id),
    })
    .Where(x => x.MemberCount != ComputerEngineeringTeamSizeFix.TargetTeamSize)
    .CountAsync();

Console.WriteLine();
Console.WriteLine(invalid == 0
    ? "Confirmation: all Computer Engineering graduation projects contain exactly 2 students."
    : $"WARNING: {invalid} CE projects still do not have exactly 2 members.");

return invalid == 0 ? 0 : 1;
