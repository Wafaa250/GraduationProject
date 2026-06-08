namespace GraduationProject.API.Data.Seeding
{
    public interface IDataSeederExpansion
    {
        Task<SeedResult> ExpandAsync(CancellationToken cancellationToken = default);
    }
}
