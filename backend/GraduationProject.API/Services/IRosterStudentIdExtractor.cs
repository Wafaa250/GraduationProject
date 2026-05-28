namespace GraduationProject.API.Services
{
    public class RosterExtractResult
    {
        /// <summary>Distinct university student IDs found in the file, in discovery order.</summary>
        public List<string> StudentIds { get; set; } = new();

        /// <summary>Total candidate tokens considered before deduplication.</summary>
        public int CandidateCount { get; set; }
    }

    public interface IRosterStudentIdExtractor
    {
        /// <summary>Extracts university student IDs from a roster file (CSV, Excel, Word, PDF).</summary>
        Task<RosterExtractResult> ExtractAsync(
            Stream stream,
            string fileName,
            CancellationToken cancellationToken = default);
    }
}
