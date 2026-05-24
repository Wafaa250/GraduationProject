using System.Collections.Generic;
using System.Threading.Tasks;

namespace GraduationProject.API.Services
{
    public interface IAiStudentRecommendationService
    {
        Task<List<AiRankedStudentResult>?> RankStudentsAsync(
            AiProjectInput project,
            IReadOnlyList<AiStudentInput> students);

        Task<List<AiRankedDoctorResult>?> RankSupervisorsAsync(
            AiProjectInput project,
            IReadOnlyList<AiDoctorInput> doctors);

        Task<List<AiRankedStudentResult>?> RankStudentsForCompanyTalentAsync(
            AiCompanyTalentInput need,
            IReadOnlyList<AiStudentInput> students);
    }

    public class AiCompanyTalentInput
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public List<string> RequiredSkills { get; set; } = new();
        public string? PreferredMajor { get; set; }
        public string? EngagementType { get; set; }
        public string? Duration { get; set; }
    }

    public class AiProjectInput
    {
        public string Title { get; set; } = string.Empty;

        /// <summary>
        /// Previously "Description". Maps to the project's Abstract column.
        /// Kept for backwards compatibility — always populate from project.Abstract.
        /// </summary>
        public string Abstract { get; set; } = string.Empty;

        public List<string> RequiredSkills { get; set; } = new();

        /// <summary>Teammate roles the project owner is looking for.</summary>
        public List<string> PreferredRoles { get; set; } = new();
    }

    public class AiStudentInput
    {
        public int StudentId { get; set; }
        public string Name { get; set; } = string.Empty;
        public List<string> Skills { get; set; } = new();
        public string Major { get; set; } = string.Empty;
        public string Bio { get; set; } = string.Empty;
    }

    public class AiRankedStudentResult
    {
        public int StudentId { get; set; }
        public int MatchScore { get; set; }
        public string Reason { get; set; } = string.Empty;
        public List<string> Highlights { get; set; } = new();
    }

    public class AiDoctorInput
    {
        public int DoctorId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Specialization { get; set; } = string.Empty;
        public string Bio { get; set; } = string.Empty;
    }

    public class AiRankedDoctorResult
    {
        public int DoctorId { get; set; }
        public int MatchScore { get; set; }
        public string Reason { get; set; } = string.Empty;
    }
}