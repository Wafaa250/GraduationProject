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
services.AddScoped<AnNajahNormalizationService>();

await using var sp = services.BuildServiceProvider();
var normalizer = sp.GetRequiredService<AnNajahNormalizationService>();

Console.WriteLine("SkillSwap An-Najah Normalization");
Console.WriteLine("================================");
Console.WriteLine();

var result = await normalizer.NormalizeAsync();

if (!result.Success)
{
    Console.Error.WriteLine($"Normalization failed: {result.Error}");
    return 1;
}

Console.WriteLine($"Normalization completed in {result.Duration.TotalSeconds:F1}s");
Console.WriteLine();
Console.WriteLine($"Student emails updated:  {result.StudentEmailsUpdated}");
Console.WriteLine($"Doctor emails updated:   {result.DoctorEmailsUpdated}");
Console.WriteLine($"University refs removed: {result.UniversityReferencesRemoved}");
Console.WriteLine();

if (result.AssociationNamesReplaced.Count > 0)
{
    Console.WriteLine("Association names replaced:");
    foreach (var line in result.AssociationNamesReplaced.Distinct().OrderBy(x => x))
        Console.WriteLine($"  {line}");
    Console.WriteLine();
}

Console.WriteLine("Tables updated:");
foreach (var (table, count) in result.TableUpdates.OrderBy(kv => kv.Key))
    Console.WriteLine($"  {table,-55} {count,6}");

Console.WriteLine();
Console.WriteLine("Total records per table:");
foreach (var (table, count) in result.RecordCounts.OrderBy(kv => kv.Key))
    Console.WriteLine($"  {table,-55} {count,6}");

Console.WriteLine();
Console.WriteLine("Verification:");
await using var scope = sp.CreateAsyncScope();
var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

const string annajah = "An-Najah National University";
var legacyDomains = new[] { "birzeit.edu", "najah.edu", "anajah.edu", "ppu.edu", "alquds.edu", "aau.edu", "bethlehem.edu", "metrosu.edu" };
bool IsLegacyEmail(string email) =>
    legacyDomains.Any(d => email.EndsWith("@" + d, StringComparison.OrdinalIgnoreCase));

var otherUnis = await db.StudentProfiles
    .Where(sp => sp.University != annajah)
    .CountAsync();
var otherDoctorUnis = await db.DoctorProfiles
    .Where(dp => dp.University != annajah)
    .CountAsync();
var roleEmails = await db.Users
    .Where(u => u.Role == "student" || u.Role == "doctor")
    .Select(u => new { u.Role, u.Email })
    .ToListAsync();
var legacyStudentEmails = roleEmails.Count(u =>
    u.Role == "student" && IsLegacyEmail(u.Email));
var legacyDoctorEmails = roleEmails.Count(u =>
    u.Role == "doctor" && IsLegacyEmail(u.Email));
var nonGmailStudents = roleEmails.Count(u =>
    u.Role == "student" && !u.Email.EndsWith("@gmail.com", StringComparison.OrdinalIgnoreCase));
var nonGmailDoctors = roleEmails.Count(u =>
    u.Role == "doctor" && !u.Email.EndsWith("@gmail.com", StringComparison.OrdinalIgnoreCase));

Console.WriteLine($"  Non-An-Najah student profiles: {otherUnis}");
Console.WriteLine($"  Non-An-Najah doctor profiles:  {otherDoctorUnis}");
Console.WriteLine($"  Legacy-domain student emails:  {legacyStudentEmails}");
Console.WriteLine($"  Legacy-domain doctor emails:   {legacyDoctorEmails}");
Console.WriteLine($"  Non-Gmail student emails:      {nonGmailStudents}");
Console.WriteLine($"  Non-Gmail doctor emails:       {nonGmailDoctors}");

return 0;
