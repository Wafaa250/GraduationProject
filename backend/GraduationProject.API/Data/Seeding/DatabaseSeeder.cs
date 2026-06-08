using System.Diagnostics;
using GraduationProject.API.Data.Seeding.Phases;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace GraduationProject.API.Data.Seeding
{
    public sealed class DatabaseSeeder : IDataSeeder
    {
        private readonly ApplicationDbContext _db;
        private readonly ILogger<DatabaseSeeder> _logger;

        public DatabaseSeeder(ApplicationDbContext db, ILogger<DatabaseSeeder> logger)
        {
            _db = db;
            _logger = logger;
        }

        public async Task<SeedResult> SeedAsync(CancellationToken cancellationToken = default)
        {
            if (await SeedHelpers.IsAlreadySeededAsync(_db))
            {
                _logger.LogWarning("Database already seeded (marker user {Email} exists). Skipping.", SeedContext.SeedMarkerEmail);
                return SeedResult.Skipped();
            }

            var sw = Stopwatch.StartNew();
            await using var tx = await _db.Database.BeginTransactionAsync(cancellationToken);

            try
            {
                var ctx = new SeedContext();
                _logger.LogInformation("Starting SkillSwap database seed...");

                await SkillsSeedPhase.RunAsync(_db, ctx);
                _logger.LogInformation("Skills seeded ({Count})", ctx.Counts.GetValueOrDefault("skills"));

                await UsersSeedPhase.RunAsync(_db, ctx);
                _logger.LogInformation("Users seeded ({Count})", ctx.Counts.GetValueOrDefault("users"));

                await AcademicSeedPhase.RunAsync(_db, ctx);
                _logger.LogInformation("Academic data seeded");

                await CompanySeedPhase.RunAsync(_db, ctx);
                _logger.LogInformation("Company domain seeded");

                await OrganizationSeedPhase.RunAsync(_db, ctx);
                _logger.LogInformation("Organization domain seeded");

                await SocialSeedPhase.RunAsync(_db, ctx);
                _logger.LogInformation("Social and communication data seeded");

                await tx.CommitAsync(cancellationToken);
                sw.Stop();

                _logger.LogInformation("Database seed completed in {Elapsed}", sw.Elapsed);
                return SeedResult.Completed(sw.Elapsed, ctx.Counts);
            }
            catch (Exception ex)
            {
                await tx.RollbackAsync(cancellationToken);
                _logger.LogError(ex, "Database seed failed");
                return SeedResult.Failed(ex.Message);
            }
        }
    }
}
