"""Direct service test without HTTP auth."""

import asyncio
import os
import sys

sys.path.insert(0, r"C:\Users\HP\Desktop\GraduationProject\backend\GraduationProject.API\bin\lifecycle-check")

# Use in-process test via dotnet test would be better - use subprocess dotnet script

import subprocess
import textwrap

csproj = r"C:\Users\HP\Desktop\GraduationProject\backend\GraduationProject.API\GraduationProject.API.csproj"

program = textwrap.dedent(
    '''
    using GraduationProject.API.Data;
    using GraduationProject.API.DTOs;
    using GraduationProject.API.Services;
    using GraduationProject.API.Services.Recommendations;
    using Microsoft.EntityFrameworkCore;
    using Microsoft.Extensions.Configuration;
    using Microsoft.Extensions.DependencyInjection;
    using Microsoft.Extensions.Logging;

    var config = new ConfigurationBuilder()
        .SetBasePath(@"C:\\Users\\HP\\Desktop\\GraduationProject\\backend\\GraduationProject.API")
        .AddJsonFile("appsettings.json")
        .Build();

    var services = new ServiceCollection();
    services.AddLogging(b => b.AddConsole().SetMinimumLevel(LogLevel.Information));
    services.AddDbContext<ApplicationDbContext>(o =>
        o.UseNpgsql(config.GetConnectionString("DefaultConnection")));
    services.AddScoped<IRecommendationNormalizationService, RecommendationNormalizationService>();
    services.AddScoped<IRecommendationScoringEngine, RecommendationScoringEngine>();
    services.AddHttpClient<IRecommendationSemanticService, OpenAiRecommendationSemanticService>();
    services.AddScoped<ICompanyRequestTeamRecommendationService, CompanyRequestTeamRecommendationService>();

    var sp = services.BuildServiceProvider();
    using var scope = sp.CreateScope();
    var svc = scope.ServiceProvider.GetRequiredService<ICompanyRequestTeamRecommendationService>();

    const int companyProfileId = 12;
    const int requestId = 28;

    var result = await svc.RegenerateAsync(companyProfileId, requestId,
        new GenerateCompanyRequestTeamRecommendationsDto { ForceRegenerate = true, TeamCount = 3 });

    Console.WriteLine("RunId=" + result.Run.RunId + " Teams=" + result.Teams.Count);
    foreach (var team in result.Teams)
    {
        Console.WriteLine($"Team #{team.TeamRank} score={team.TotalScore} coverage={team.RoleCoverageScore} chem={team.CompatibilityScore}");
        var ids = team.Members.Select(m => m.StudentProfileId).ToList();
        Console.WriteLine("  members=" + team.Members.Count + " uniqueStudents=" + ids.Distinct().Count());
        foreach (var m in team.Members)
            Console.WriteLine($"  {m.RoleName} -> {m.StudentName} ({m.RoleScore}%)");
    }
    '''
)

# Simpler: use psql to verify after manual curl - or write minimal Program.cs

print("Use dotnet run test harness - skipping")
