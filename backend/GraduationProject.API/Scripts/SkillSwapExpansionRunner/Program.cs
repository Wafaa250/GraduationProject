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
services.AddScoped<IDataSeederExpansion, DatabaseSeederExpansion>();

await using var sp = services.BuildServiceProvider();
var expansion = sp.GetRequiredService<IDataSeederExpansion>();

Console.WriteLine("SkillSwap Database Expansion");
Console.WriteLine("==========================");
Console.WriteLine("Additive only — existing records are preserved.");
Console.WriteLine();

var result = await expansion.ExpandAsync();

if (result.AlreadySeeded)
{
    Console.WriteLine("Expansion was already applied. No changes made.");
    Console.WriteLine($"Marker: {ExpansionContext.ExpansionMarkerEmail}");
    return 0;
}

if (!result.Success)
{
    Console.Error.WriteLine($"Expansion failed: {result.Error}");
    return 1;
}

Console.WriteLine($"Expansion completed in {result.Duration.TotalSeconds:F1}s");
Console.WriteLine();
Console.WriteLine("Records added per table:");
Console.WriteLine("------------------------");

foreach (var (table, count) in result.Counts.OrderBy(kv => kv.Key))
    Console.WriteLine($"  {table,-55} {count,6}");

var total = result.Counts.Values.Sum();
Console.WriteLine();
Console.WriteLine($"Total new records: {total:N0}");
Console.WriteLine($"New accounts use password: {SeedContext.DefaultPassword}");
Console.WriteLine($"Expansion marker: {ExpansionContext.ExpansionMarkerEmail}");

return 0;
