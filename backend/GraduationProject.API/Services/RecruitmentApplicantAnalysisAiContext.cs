using System.Collections.Generic;

namespace GraduationProject.API.Services
{
    /// <summary>Pre-built compact payload + metadata for ranking and post-validation.</summary>
    public class RecruitmentApplicantAnalysisAiContext
    {
        public int TopK { get; set; }

        /// <summary>Serialized JSON sent to the model (token-efficient).</summary>
        public string CompactPayloadJson { get; set; } = string.Empty;

        /// <summary>applicationId -> (studentProfileId, studentUserId)</summary>
        public Dictionary<int, (int StudentProfileId, int StudentUserId)> ApplicationIndex { get; set; } = new();

        /// <summary>studentProfileId -> applicationId (one application per student per position)</summary>
        public Dictionary<int, int> StudentProfileToApplication { get; set; } = new();

        public Dictionary<int, StudentApplicantDisplayInfo> StudentDisplayByProfileId { get; set; } = new();
    }

    public class StudentApplicantDisplayInfo
    {
        public string Name { get; set; } = string.Empty;
        public string? Faculty { get; set; }
        public string? Major { get; set; }
    }
}
