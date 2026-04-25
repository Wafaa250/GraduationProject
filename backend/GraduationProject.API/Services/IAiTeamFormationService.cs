// Services/IAiTeamFormationService.cs
using System.Collections.Generic;
using System.Threading.Tasks;

namespace GraduationProject.API.Services
{
    // ── Input models ──────────────────────────────────────────────────────────

    public class AiTeamStudent
    {
        public int         StudentId { get; set; }
        public string      Name      { get; set; } = string.Empty;
        public List<string> Skills   { get; set; } = new();
        public string      Major     { get; set; } = string.Empty;
        public string      Bio       { get; set; } = string.Empty;
    }

    public class AiTeamFormationRequest
    {
        public string          ProjectTitle       { get; set; } = string.Empty;
        public string?         ProjectDescription { get; set; }
        public int             TeamSize           { get; set; } = 2;
        public List<AiTeamStudent> Students       { get; set; } = new();
    }

    // ── Output models ─────────────────────────────────────────────────────────

    public class AiFormedTeam
    {
        /// <summary>1-based index e.g. 1, 2, 3 …</summary>
        public int              TeamIndex  { get; set; }
        public List<int>        StudentIds { get; set; } = new();
        public string           Reason     { get; set; } = string.Empty;
    }

    // ── Contract ──────────────────────────────────────────────────────────────

    public interface IAiTeamFormationService
    {
        /// <summary>
        /// Asks the AI to divide <paramref name="request"/>.Students into balanced,
        /// complementary teams of size <paramref name="request"/>.TeamSize.
        ///
        /// Returns null on complete AI failure — caller must fall back to simple grouping.
        /// </summary>
        Task<List<AiFormedTeam>?> FormTeamsAsync(AiTeamFormationRequest request);
    }
}
