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
services.AddScoped<IDataSeeder, DatabaseSeeder>();

await using var sp = services.BuildServiceProvider();
var seeder = sp.GetRequiredService<IDataSeeder>();

Console.WriteLine("SkillSwap Database Seeder");
Console.WriteLine("=========================");
Console.WriteLine();

var result = await seeder.SeedAsync();

if (result.AlreadySeeded)
{
    Console.WriteLine("Database was already seeded. No changes made.");
    Console.WriteLine($"To re-seed, clear application data first (see backend/DatabaseScripts/clear-all-data.sql).");
    return 0;
}

if (!result.Success)
{
    Console.Error.WriteLine($"Seed failed: {result.Error}");
    return 1;
}

Console.WriteLine($"Seed completed in {result.Duration.TotalSeconds:F1}s");
Console.WriteLine();
Console.WriteLine("Records created per table:");
Console.WriteLine("--------------------------");

foreach (var (table, count) in result.Counts.OrderBy(kv => kv.Key))
    Console.WriteLine($"  {table,-55} {count,6}");

Console.WriteLine();
Console.WriteLine("Default password for all seeded accounts: SkillSwap2026!");
Console.WriteLine("Seed marker account (admin): platform.seed@skillswap.ps");
Console.WriteLine();
Console.WriteLine("Sample logins:");
Console.WriteLine("  Student:  mohammad.hammad1@gmail.com");
Console.WriteLine("  Doctor:   dr.sami-barakat@gmail.com");
Console.WriteLine("  Company:  careers@asaltech.com");
Console.WriteLine("  Org:      ieee-anajah@orgs.skillswap.ps");

return 0;
