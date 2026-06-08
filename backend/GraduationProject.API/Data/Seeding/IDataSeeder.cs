namespace GraduationProject.API.Data.Seeding
{
    public interface IDataSeeder
    {
        Task<SeedResult> SeedAsync(CancellationToken cancellationToken = default);
    }
}
