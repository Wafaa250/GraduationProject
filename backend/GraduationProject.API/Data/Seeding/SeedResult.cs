namespace GraduationProject.API.Data.Seeding
{
    public sealed class SeedResult
    {
        public bool AlreadySeeded { get; init; }
        public bool Success { get; init; }
        public string? Error { get; init; }
        public TimeSpan Duration { get; init; }
        public IReadOnlyDictionary<string, int> Counts { get; init; } = new Dictionary<string, int>();

        public static SeedResult Skipped() => new() { AlreadySeeded = true, Success = true };

        public static SeedResult Failed(string error) => new() { Success = false, Error = error };

        public static SeedResult Completed(TimeSpan duration, Dictionary<string, int> counts) =>
            new() { Success = true, Duration = duration, Counts = counts };
    }
}
