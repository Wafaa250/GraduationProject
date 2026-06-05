using GraduationProject.API.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

const string NormalizedName = "helix martin systems";
var helixEmails = new[]
{
    "marcus.chen+e2e@helixmartin.com",
    "priya.sharma+e2e@helixmartin.com",
};

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

var profile = await db.CompanyProfiles
    .FirstOrDefaultAsync(c => c.NormalizedCompanyName == NormalizedName);

if (profile == null)
{
    Console.WriteLine("Helix Martin Systems not found — already removed or never seeded.");
}
else
{
    var profileId = profile.Id;
    var follows = await db.CompanyFollows
        .Where(f => f.CompanyProfileId == profileId)
        .ToListAsync();
    if (follows.Count > 0)
    {
        db.CompanyFollows.RemoveRange(follows);
        await db.SaveChangesAsync();
        Console.WriteLine($"Removed {follows.Count} company follow(s).");
    }

    db.CompanyProfiles.Remove(profile);
    await db.SaveChangesAsync();
    Console.WriteLine($"Removed company profile id={profileId} (Helix Martin Systems).");
}

var users = await db.Users
    .Where(u => helixEmails.Contains(u.Email))
    .ToListAsync();

if (users.Count > 0)
{
    db.Users.RemoveRange(users);
    await db.SaveChangesAsync();
    foreach (var u in users)
        Console.WriteLine($"Removed user id={u.Id} ({u.Email}).");
}
else
{
    Console.WriteLine("No Helix Martin workspace users found.");
}

var remaining = await db.CompanyProfiles.AsNoTracking()
    .AnyAsync(c => c.NormalizedCompanyName == NormalizedName);
Console.WriteLine(remaining ? "Warning: profile still exists." : "Done. Helix Martin Systems deleted.");
