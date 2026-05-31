using GraduationProject.API.Data;
using GraduationProject.API.DTOs;
using GraduationProject.API.Services;
using GraduationProject.API.Services.Recommendations;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

var config = new ConfigurationBuilder()
    .SetBasePath(Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "..", "..", "backend", "GraduationProject.API")))
    .AddJsonFile("appsettings.json", optional: false)
    .Build();

var services = new ServiceCollection();
services.AddSingleton<IConfiguration>(config);
services.AddLogging(b => b.AddConsole().SetMinimumLevel(LogLevel.Information));
services.AddDbContext<ApplicationDbContext>(o =>
    o.UseNpgsql(config.GetConnectionString("DefaultConnection")));
services.AddScoped<IRecommendationNormalizationService, RecommendationNormalizationService>();
services.AddScoped<IRecommendationScoringEngine, RecommendationScoringEngine>();
services.AddHttpClient<IRecommendationSemanticService, OpenAiRecommendationSemanticService>();
services.AddScoped<ICompanyRequestTeamRecommendationService, CompanyRequestTeamRecommendationService>();

await using var sp = services.BuildServiceProvider();
await using var scope = sp.CreateAsyncScope();
var svc = scope.ServiceProvider.GetRequiredService<ICompanyRequestTeamRecommendationService>();

const int companyProfileId = 12;
const int requestId = 28;

Console.WriteLine($"Regenerating team recommendations for request {requestId}...");

var result = await svc.RegenerateAsync(
    companyProfileId,
    requestId,
    new GenerateCompanyRequestTeamRecommendationsDto
    {
        ForceRegenerate = true,
        TeamCount = 3,
        CandidatePoolPerRole = 20,
    });

Console.WriteLine($"RunId={result.Run.RunId} Teams={result.Teams.Count}");
foreach (var team in result.Teams)
{
    var ids = team.Members.Select(m => m.StudentProfileId).ToList();
    var unique = ids.Distinct().Count();
    Console.WriteLine(
        $"Team #{team.TeamRank}: total={team.TotalScore}% coverage={team.RoleCoverageScore}% chem={team.CompatibilityScore}% members={team.Members.Count} unique={unique}");
    foreach (var m in team.Members)
        Console.WriteLine($"  {m.RoleName} -> {m.StudentName} (fit {m.RoleScore}%, sem {(int)Math.Round(m.SemanticSimilarity * 100)}%)");

    if (unique != team.Members.Count)
        throw new Exception("Duplicate student in same team");
}

await using var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
var runCount = await db.CompanyRequestTeamRecommendationRuns.CountAsync(r => r.CompanyRequestId == requestId);
var teamCount = await db.CompanyRequestTeamRecommendations.CountAsync(t => t.CompanyRequestId == requestId);
var memberCount = await db.CompanyRequestTeamRecommendationMembers
    .CountAsync(m => m.TeamRecommendation.CompanyRequestId == requestId);

Console.WriteLine($"Persisted: runs={runCount} teams={teamCount} members={memberCount}");
Console.WriteLine("OK");
