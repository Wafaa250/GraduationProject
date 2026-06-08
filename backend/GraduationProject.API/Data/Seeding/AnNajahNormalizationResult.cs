namespace GraduationProject.API.Data.Seeding
{
    public sealed class AnNajahNormalizationResult
    {
        public bool Success { get; set; }
        public string? Error { get; init; }
        public TimeSpan Duration { get; set; }
        public Dictionary<string, int> TableUpdates { get; } = new(StringComparer.OrdinalIgnoreCase);
        public Dictionary<string, int> RecordCounts { get; } = new(StringComparer.OrdinalIgnoreCase);
        public int StudentEmailsUpdated { get; set; }
        public int DoctorEmailsUpdated { get; set; }
        public int UniversityReferencesRemoved { get; set; }
        public List<string> AssociationNamesReplaced { get; } = new();
        public List<string> FilesModified { get; } = new();
    }
}
