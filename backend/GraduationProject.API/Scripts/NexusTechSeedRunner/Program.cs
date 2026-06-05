using GraduationProject.API.Data;
using GraduationProject.API.Helpers;
using GraduationProject.API.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

const string OwnerEmail = "careers@nexustech.ps";
const string OwnerPassword = "NexusTech2026!";
const string NormalizedCompanyName = "nexustech solutions";

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

await using var sp = services.BuildServiceProvider();
var db = sp.GetRequiredService<ApplicationDbContext>();

var existingProfile = await db.CompanyProfiles
    .AsNoTracking()
    .Include(c => c.User)
    .FirstOrDefaultAsync(c => c.NormalizedCompanyName == NormalizedCompanyName);

if (existingProfile != null)
{
    Console.WriteLine("NexusTech Solutions already exists.");
    PrintSummary(existingProfile.User, existingProfile);
    return 0;
}

var emailTaken = await db.Users.AsNoTracking()
    .AnyAsync(u => u.Email == OwnerEmail.ToLower());
if (emailTaken)
{
    Console.Error.WriteLine($"Cannot seed: email {OwnerEmail} is already in use by another account.");
    return 1;
}

var skills = new[]
{
    "React", "TypeScript", "Angular", ".NET", "ASP.NET Core", "PostgreSQL",
    "Docker", "Azure", "AI", "Machine Learning", "Python", "Node.js",
};

var now = DateTime.UtcNow;
var user = new User
{
    Name = "Nadine Khoury",
    Email = OwnerEmail.ToLower(),
    Password = BCrypt.Net.BCrypt.HashPassword(OwnerPassword),
    Role = UserRoles.Company,
    MustChangePassword = false,
    CreatedAt = now,
};

var profile = new CompanyProfile
{
    User = user,
    CompanyName = "NexusTech Solutions",
    NormalizedCompanyName = CompanyUniquenessHelper.NormalizeCompanyName("NexusTech Solutions"),
    PrimaryEmailDomain = CompanyUniquenessHelper.ResolvePrimaryEmailDomain(OwnerEmail),
    WebsiteDomain = CompanyUniquenessHelper.ExtractWebsiteDomain("https://www.nexustech.ps"),
    Industry = "Software Development & Digital Transformation",
    Description =
        "NexusTech Solutions is a technology company specializing in software engineering, web applications, mobile development, cloud infrastructure, artificial intelligence solutions, and digital transformation services. The company actively collaborates with universities and students to support innovation, professional development, and industry-academia partnerships.",
    Location = "Ramallah, Palestine",
    HeadquartersLocation = "Ramallah, Palestine",
    WorkingStyle = "Hybrid",
    AreasOfInterest = SkillHelper.ToJsonOrNull(skills),
    WebsiteUrl = "https://www.nexustech.ps",
    LinkedInUrl = "https://www.linkedin.com/company/nexustech-solutions",
    ContactEmail = OwnerEmail,
    OptionalContactLink = "tel:+970599000000",
};

db.Users.Add(user);
db.CompanyProfiles.Add(profile);
await db.SaveChangesAsync();

db.CompanyMembers.Add(new CompanyMember
{
    UserId = user.Id,
    CompanyProfileId = profile.Id,
    Role = CompanyMemberRoles.Owner,
    CreatedAt = now,
});

db.CompanyMemberNotificationPreferences.Add(new CompanyMemberNotificationPreference
{
    CompanyProfileId = profile.Id,
    UserId = user.Id,
    NotifyAiRecommendations = true,
    NotifySavedRecommendations = true,
    NotifyRequestStatusUpdates = true,
    NotifyWorkspaceMemberChanges = true,
    UpdatedAt = now,
});

await db.SaveChangesAsync();

Console.WriteLine("NexusTech Solutions seeded successfully.");
PrintSummary(user, profile);
return 0;

static void PrintSummary(User user, CompanyProfile profile)
{
    Console.WriteLine();
    Console.WriteLine("=== NexusTech Solutions ===");
    Console.WriteLine($"Company profile id: {profile.Id}");
    Console.WriteLine($"Owner user id:      {user.Id}");
    Console.WriteLine($"Owner name:         {user.Name}");
    Console.WriteLine($"Login email:        {user.Email}");
    Console.WriteLine($"Industry:           {profile.Industry}");
    Console.WriteLine($"Location:           {profile.Location}");
    Console.WriteLine($"Website:            {profile.WebsiteUrl}");
    Console.WriteLine($"LinkedIn:           {profile.LinkedInUrl}");
    Console.WriteLine($"Contact email:      {profile.ContactEmail}");
    Console.WriteLine($"Phone link:         {profile.OptionalContactLink}");
    Console.WriteLine($"Areas of interest:  {profile.AreasOfInterest}");
    Console.WriteLine();
    Console.WriteLine("Password (owner):   NexusTech2026!");
}
