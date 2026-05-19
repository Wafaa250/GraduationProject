using System.Collections.Generic;

namespace GraduationProject.API.DTOs
{
    /// <summary>Result of OpenAI recruitment ranking (parsing + validation).</summary>
    public sealed class RecruitmentApplicantAnalysisOutcome
    {
        public bool Success { get; init; }

        public List<RecruitmentApplicantAnalysisResultDto>? Results { get; init; }

        /// <summary>User-facing error when <see cref="Success"/> is false.</summary>
        public string? ErrorMessage { get; init; }

        /// <summary>Technical detail for server logs (not always safe for clients).</summary>
        public string? Diagnostic { get; init; }
    }
}
