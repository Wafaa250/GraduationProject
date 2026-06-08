using System.Diagnostics;
using GraduationProject.API.Data.Seeding.Phases;
using Microsoft.Extensions.Logging;

namespace GraduationProject.API.Data.Seeding
{
    public sealed class DatabaseSeederExpansion : IDataSeederExpansion
    {
        private readonly ApplicationDbContext _db;
        private readonly ILogger<DatabaseSeederExpansion> _logger;

        public DatabaseSeederExpansion(ApplicationDbContext db, ILogger<DatabaseSeederExpansion> logger)
        {
            _db = db;
            _logger = logger;
        }

        public async Task<SeedResult> ExpandAsync(CancellationToken cancellationToken = default)
        {
            if (!await SeedHelpers.IsAlreadySeededAsync(_db))
            {
                return SeedResult.Failed(
                    "Base seed not found. Run SkillSwapSeedRunner first before expanding.");
            }

            if (await SeedHelpers.IsExpansionAlreadyRunAsync(_db))
            {
                _logger.LogWarning("Expansion already applied (marker {Email} exists). Skipping.",
                    ExpansionContext.ExpansionMarkerEmail);
                return SeedResult.Skipped();
            }

            var sw = Stopwatch.StartNew();
            await using var tx = await _db.Database.BeginTransactionAsync(cancellationToken);

            try
            {
                var ctx = await ExpansionContext.LoadAsync(_db);
                _logger.LogInformation(
                    "Starting expansion on existing data (students={Students}, doctors={Doctors}, companies={Companies})",
                    ctx.Students.Count, ctx.Doctors.Count, ctx.Companies.Count);

                await ExpansionUsersPhase.RunAsync(_db, ctx);
                await ExpansionAcademicPhase.RunAsync(_db, ctx);
                await ExpansionCompanyPhase.RunAsync(_db, ctx);
                await ExpansionOrganizationPhase.RunAsync(_db, ctx);
                await ExpansionSocialPhase.RunAsync(_db, ctx);

                await tx.CommitAsync(cancellationToken);
                sw.Stop();

                _logger.LogInformation("Database expansion completed in {Elapsed}", sw.Elapsed);
                return SeedResult.Completed(sw.Elapsed, ctx.Counts);
            }
            catch (Exception ex)
            {
                await tx.RollbackAsync(cancellationToken);
                _logger.LogError(ex, "Database expansion failed");
                return SeedResult.Failed(ex.Message);
            }
        }
    }
}
