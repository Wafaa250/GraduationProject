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
    }

    public class AiProjectInput
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public List<string> RequiredSkills { get; set; } = new();
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
